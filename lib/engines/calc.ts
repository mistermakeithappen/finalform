import { Parser } from 'expr-eval'
import { Calculation, AICalculation } from '@/lib/types/form'

export class CalcEngine {
  private calculations: Calculation[]
  private aiCalculations: AICalculation[]
  private parser: Parser
  private aiCache: Map<string, any>

  constructor(calculations: Calculation[], aiCalculations: AICalculation[] = []) {
    this.calculations = calculations
    this.aiCalculations = aiCalculations
    this.parser = new Parser()
    this.aiCache = new Map()
    
    // Add custom functions
    this.parser.functions.sum = this.sum
    this.parser.functions.avg = this.avg
    this.parser.functions.min = Math.min
    this.parser.functions.max = Math.max
    this.parser.functions.round = Math.round
    this.parser.functions.floor = Math.floor
    this.parser.functions.ceil = Math.ceil
    this.parser.functions.abs = Math.abs
    this.parser.functions.len = (arr: any[]) => arr?.length || 0
  }

  async evaluate(values: Record<string, any>): Promise<Record<string, any>> {
    const results: Record<string, any> = {}
    
    // First, handle traditional calculations
    const sortedCalcs = this.sortByDependency(this.calculations)
    
    sortedCalcs.forEach(calc => {
      try {
        // Prepare variables for the formula
        const variables = this.prepareVariables(values, results)
        
        // Parse and evaluate the formula
        const expr = this.parser.parse(calc.formula)
        const result = expr.evaluate(variables)
        
        // Apply outputs
        calc.outputs.forEach(output => {
          let formattedResult = result
          
          // Format the result based on output format
          if (output.format === 'currency') {
            formattedResult = this.formatCurrency(result)
          } else if (output.format === 'percentage') {
            formattedResult = `${(result * 100).toFixed(2)}%`
          } else if (output.format === 'number') {
            formattedResult = Number(result)
          }
          
          results[output.target] = formattedResult
        })
      } catch (error) {
        console.error(`Calculation error in ${calc.name}:`, error)
        calc.outputs.forEach(output => {
          results[output.target] = 0
        })
      }
    })
    
    // Then handle AI calculations
    await this.evaluateAICalculations(values, results)
    
    return results
  }

  // Synchronous version for backward compatibility
  evaluateSync(values: Record<string, any>): Record<string, any> {
    const results: Record<string, any> = {}
    
    // Sort calculations by dependency order
    const sortedCalcs = this.sortByDependency(this.calculations)
    
    sortedCalcs.forEach(calc => {
      try {
        // Prepare variables for the formula
        const variables = this.prepareVariables(values, results)
        
        // Parse and evaluate the formula
        const expr = this.parser.parse(calc.formula)
        const result = expr.evaluate(variables)
        
        // Apply outputs
        calc.outputs.forEach(output => {
          let formattedResult = result
          
          // Format the result based on output format
          if (output.format === 'currency') {
            formattedResult = this.formatCurrency(result)
          } else if (output.format === 'percentage') {
            formattedResult = `${(result * 100).toFixed(2)}%`
          } else if (output.format === 'number') {
            formattedResult = Number(result)
          }
          
          results[output.target] = formattedResult
        })
      } catch (error) {
        console.error(`Calculation error in ${calc.name}:`, error)
        calc.outputs.forEach(output => {
          results[output.target] = 0
        })
      }
    })
    
    return results
  }

  private async evaluateAICalculations(values: Record<string, any>, results: Record<string, any>) {
    for (const aiCalc of this.aiCalculations) {
      try {
        // Handle field group scoped calculations
        if (aiCalc.scope === 'fieldgroup' && aiCalc.fieldGroupKey) {
          await this.evaluateFieldGroupAICalculation(aiCalc, values, results)
          continue
        }

        // Handle global calculations
        // Check cache first
        const cacheKey = this.getAICacheKey(aiCalc, values)
        if (aiCalc.cacheResults && this.aiCache.has(cacheKey)) {
          const cachedResult = this.aiCache.get(cacheKey)
          results[aiCalc.id] = cachedResult
          continue
        }

        // Prepare field values for the AI calculation
        const fieldValues: Record<string, any> = {}
        aiCalc.fieldReferences.forEach(fieldKey => {
          fieldValues[fieldKey] = values[fieldKey] || results[fieldKey]
        })

        // Call AI calculation API
        const response = await fetch('/api/calculate-ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fieldValues,
            instructions: `${aiCalc.prompt}\n${aiCalc.instructions || ''}`,
            outputFormat: aiCalc.outputFormat,
            examples: aiCalc.examples,
            unitConversion: aiCalc.unitConversion,
            fallbackValue: aiCalc.fallbackValue
          })
        })

        if (response.ok) {
          const data = await response.json()
          const result = data.result
          
          // Cache the result if enabled
          if (aiCalc.cacheResults) {
            this.aiCache.set(cacheKey, result)
          }
          
          results[aiCalc.id] = result
        } else {
          // Use fallback value if available
          results[aiCalc.id] = aiCalc.fallbackValue !== undefined ? aiCalc.fallbackValue : null
        }
      } catch (error) {
        console.error(`AI calculation error in ${aiCalc.name}:`, error)
        results[aiCalc.id] = aiCalc.fallbackValue !== undefined ? aiCalc.fallbackValue : null
      }
    }
  }

  private async evaluateFieldGroupAICalculation(
    aiCalc: AICalculation, 
    values: Record<string, any>, 
    results: Record<string, any>
  ) {
    const fieldGroupKey = aiCalc.fieldGroupKey!
    const fieldGroupValue = values[fieldGroupKey]
    
    // If field group doesn't exist or isn't an array, skip
    if (!fieldGroupValue || !Array.isArray(fieldGroupValue)) {
      return
    }

    // Process each instance of the field group
    const updatedInstances = await Promise.all(
      fieldGroupValue.map(async (instance, index) => {
        // Create a unique cache key for this instance
        const instanceCacheKey = `${aiCalc.id}_${fieldGroupKey}_${index}_${JSON.stringify(instance)}`
        
        if (aiCalc.cacheResults && this.aiCache.has(instanceCacheKey)) {
          const cachedResult = this.aiCache.get(instanceCacheKey)
          // Find the target field in the AI calculation and update it
          const targetField = this.getTargetFieldFromAICalc(aiCalc)
          if (targetField) {
            return { ...instance, [targetField]: cachedResult }
          }
          return instance
        }

        // Prepare field values from this specific instance
        const instanceFieldValues: Record<string, any> = {}
        aiCalc.fieldReferences.forEach(fieldKey => {
          // Use the value from this specific instance
          instanceFieldValues[fieldKey] = instance[fieldKey]
        })

        try {
          // Call AI calculation API with instance-specific values
          const response = await fetch('/api/calculate-ai', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fieldValues: instanceFieldValues,
              instructions: `${aiCalc.prompt}\n${aiCalc.instructions || ''}`,
              outputFormat: aiCalc.outputFormat,
              examples: aiCalc.examples,
              unitConversion: aiCalc.unitConversion,
              fallbackValue: aiCalc.fallbackValue
            })
          })

          if (response.ok) {
            const data = await response.json()
            const result = data.result
            
            // Cache the result if enabled
            if (aiCalc.cacheResults) {
              this.aiCache.set(instanceCacheKey, result)
            }
            
            // Update the target field in this instance
            const targetField = this.getTargetFieldFromAICalc(aiCalc)
            if (targetField) {
              return { ...instance, [targetField]: result }
            }
          }
        } catch (error) {
          console.error(`AI calculation error for instance ${index} in ${aiCalc.name}:`, error)
        }

        return instance
      })
    )

    // Update the field group value with calculated results
    results[fieldGroupKey] = updatedInstances
  }

  private getTargetFieldFromAICalc(aiCalc: AICalculation): string | null {
    // Use explicitly defined target field if available
    if (aiCalc.targetField) {
      return aiCalc.targetField
    }
    // Otherwise, assume the last field reference is the target field
    if (aiCalc.fieldReferences.length > 0) {
      return aiCalc.fieldReferences[aiCalc.fieldReferences.length - 1]
    }
    return null
  }

  private getAICacheKey(aiCalc: AICalculation, values: Record<string, any>): string {
    const relevantValues = aiCalc.fieldReferences.map(key => values[key])
    return `${aiCalc.id}_${JSON.stringify(relevantValues)}`
  }

  private prepareVariables(values: Record<string, any>, calcResults: Record<string, any>) {
    const variables: Record<string, any> = {}
    
    // Add form values
    Object.entries(values).forEach(([key, value]) => {
      // Handle matrix fields specially
      if (Array.isArray(value)) {
        variables[key] = value
        
        // Extract columns for matrix calculations
        if (value.length > 0 && typeof value[0] === 'object') {
          const columns = Object.keys(value[0])
          columns.forEach(col => {
            variables[`${key}_${col}`] = value.map((row: any) => row[col])
          })
        }
      } else {
        variables[key] = this.parseNumericValue(value)
      }
    })
    
    // Add previous calculation results
    Object.entries(calcResults).forEach(([key, value]) => {
      variables[key] = value
    })
    
    return variables
  }

  private parseNumericValue(value: any): number {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      // Remove currency symbols and parse
      const cleaned = value.replace(/[^0-9.-]/g, '')
      const parsed = parseFloat(cleaned)
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  }

  private sum(arr: any[]): number {
    if (!Array.isArray(arr)) return 0
    return arr.reduce((acc, val) => acc + this.parseNumericValue(val), 0)
  }

  private avg(arr: any[]): number {
    if (!Array.isArray(arr) || arr.length === 0) return 0
    return this.sum(arr) / arr.length
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  private sortByDependency(calculations: Calculation[]): Calculation[] {
    // Simple topological sort for calculation dependencies
    const sorted: Calculation[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()
    
    const visit = (calc: Calculation) => {
      if (visited.has(calc.id)) return
      if (visiting.has(calc.id)) {
        console.warn(`Circular dependency detected in calculation ${calc.name}`)
        return
      }
      
      visiting.add(calc.id)
      
      // Find dependencies (other calculations that output to fields used in this formula)
      const deps = calculations.filter(other => {
        if (other.id === calc.id) return false
        return other.outputs.some(output => 
          calc.formula.includes(output.target)
        )
      })
      
      deps.forEach(visit)
      
      visiting.delete(calc.id)
      visited.add(calc.id)
      sorted.push(calc)
    }
    
    calculations.forEach(visit)
    
    return sorted
  }
}