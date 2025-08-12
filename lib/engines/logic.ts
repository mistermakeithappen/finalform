import { LogicRule, LogicCondition, LogicAction } from '@/lib/types/form'

export class LogicEngine {
  private rules: LogicRule[]
  private allFieldKeys: Set<string>
  private hiddenFields: Set<string>

  constructor(rules: LogicRule[], fieldKeys?: string[], hiddenFields?: string[]) {
    this.rules = rules
    this.allFieldKeys = new Set(fieldKeys || [])
    this.hiddenFields = new Set(hiddenFields || [])
    
    // Also extract field keys from rule targets
    this.rules.forEach(rule => {
      rule.actions.forEach(action => {
        if (action.target) {
          this.allFieldKeys.add(action.target)
        }
      })
    })
  }

  evaluate(values: Record<string, any>) {
    const results = {
      visible: {} as Record<string, boolean>,
      disabled: {} as Record<string, boolean>,
      required: {} as Record<string, boolean>,
      values: {} as Record<string, any>
    }

    // Start with all fields visible and enabled
    // Include both value keys and all known field keys
    const allKeys = new Set([...Object.keys(values), ...this.allFieldKeys])
    allKeys.forEach(key => {
      // Start with fields visible unless they are marked as hidden
      results.visible[key] = !this.hiddenFields.has(key)
      results.disabled[key] = false
      results.required[key] = false
    })
    
    // Fields that are targets of 'show' actions should start hidden
    // This overrides the default visibility
    this.rules.forEach(rule => {
      rule.actions.forEach(action => {
        if (action.type === 'show' && action.target) {
          results.visible[action.target] = false
        }
      })
    })

    // Apply each rule
    this.rules.forEach((rule, index) => {
      const conditionMet = this.evaluateCondition(rule.when, values)
      
      if (conditionMet) {
        rule.actions.forEach(action => {
          this.applyAction(action, results)
        })
      }
    })
    return results
  }

  private evaluateCondition(condition: LogicCondition, values: Record<string, any>): boolean {
    // Handle AND conditions
    if (condition.and && condition.and.length > 0) {
      return condition.and.every(c => this.evaluateCondition(c, values))
    }

    // Handle OR conditions
    if (condition.or && condition.or.length > 0) {
      return condition.or.some(c => this.evaluateCondition(c, values))
    }

    // Evaluate single condition
    const fieldValue = values[condition.field]
    
    // Handle string/boolean comparison for equals and not equals
    const compareValues = (val1: any, val2: any): boolean => {
      // Special handling for Yes/No with boolean values
      if (typeof val1 === 'boolean') {
        if (val2 === 'Yes' || val2 === 'yes') return val1 === true
        if (val2 === 'No' || val2 === 'no') return val1 === false
        if (val2 === 'true' || val2 === true) return val1 === true
        if (val2 === 'false' || val2 === false) return val1 === false
      }
      
      // Handle the reverse case
      if (typeof val2 === 'boolean') {
        if (val1 === 'Yes' || val1 === 'yes') return val2 === true
        if (val1 === 'No' || val1 === 'no') return val2 === false
        if (val1 === 'true' || val1 === true) return val2 === true
        if (val1 === 'false' || val1 === false) return val2 === false
      }
      
      // Convert both to strings for comparison to handle other cases
      if (val1 === undefined || val1 === null) val1 = ''
      if (val2 === undefined || val2 === null) val2 = ''
      return String(val1).toLowerCase() === String(val2).toLowerCase()
    }
    
    switch (condition.op) {
      case '=':
        return compareValues(fieldValue, condition.value)
      
      case '!=':
        return !compareValues(fieldValue, condition.value)
      
      case '>':
        return Number(fieldValue) > Number(condition.value)
      
      case '<':
        return Number(fieldValue) < Number(condition.value)
      
      case '>=':
        return Number(fieldValue) >= Number(condition.value)
      
      case '<=':
        return Number(fieldValue) <= Number(condition.value)
      
      case 'contains':
        return String(fieldValue).includes(String(condition.value))
      
      case 'not_contains':
        return !String(fieldValue).includes(String(condition.value))
      
      case 'empty':
        return !fieldValue || fieldValue === '' || 
               (Array.isArray(fieldValue) && fieldValue.length === 0)
      
      case 'not_empty':
        return !!fieldValue && fieldValue !== '' && 
               (!Array.isArray(fieldValue) || fieldValue.length > 0)
      
      default:
        return false
    }
  }

  private applyAction(action: LogicAction, results: any) {
    switch (action.type) {
      case 'show':
        results.visible[action.target] = true
        break
      
      case 'hide':
        results.visible[action.target] = false
        break
      
      case 'enable':
        results.disabled[action.target] = false
        break
      
      case 'disable':
        results.disabled[action.target] = true
        break
      
      case 'setValue':
        results.values[action.target] = action.value
        break
      
      case 'require':
        results.required[action.target] = true
        break
      
      case 'unrequire':
        results.required[action.target] = false
        break
    }
  }
}