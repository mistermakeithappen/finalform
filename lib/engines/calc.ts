import { Parser } from 'expr-eval'
import { Calculation } from '@/lib/types/form'

export class CalcEngine {
  private calculations: Calculation[]
  private parser: Parser

  constructor(calculations: Calculation[]) {
    this.calculations = calculations
    this.parser = new Parser()
    
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

  evaluate(values: Record<string, any>): Record<string, any> {
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