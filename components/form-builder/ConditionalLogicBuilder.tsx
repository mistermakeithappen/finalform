'use client'

import React, { useState } from 'react'
import { FormField, LogicCondition, LogicRule, LogicAction } from '@/lib/types/form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Plus, 
  Trash2, 
  Copy, 
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Edit3,
  Check,
  X,
  Zap,
  Info
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface ConditionalLogicBuilderProps {
  fields: FormField[]
  currentField: FormField
  rules: LogicRule[]
  onChange: (rules: LogicRule[]) => void
}

interface RuleTemplate {
  name: string
  description: string
  icon: React.ReactNode
  rule: Partial<LogicRule>
}

const ruleTemplates: RuleTemplate[] = [
  {
    name: 'Show when checked',
    description: 'Show this field when a checkbox is checked',
    icon: <Eye className="h-4 w-4" />,
    rule: {
      when: {
        field: '',
        op: '=',
        value: true
      },
      actions: [{ type: 'show', target: '' }]
    }
  },
  {
    name: 'Hide when empty',
    description: 'Hide this field when another field is empty',
    icon: <EyeOff className="h-4 w-4" />,
    rule: {
      when: {
        field: '',
        op: 'empty'
      },
      actions: [{ type: 'hide', target: '' }]
    }
  },
  {
    name: 'Require when selected',
    description: 'Make this field required when an option is selected',
    icon: <Check className="h-4 w-4" />,
    rule: {
      when: {
        field: '',
        op: '=',
        value: ''
      },
      actions: [{ type: 'require', target: '' }]
    }
  },
  {
    name: 'Enable conditionally',
    description: 'Enable this field based on another field\'s value',
    icon: <Unlock className="h-4 w-4" />,
    rule: {
      when: {
        field: '',
        op: '!=',
        value: ''
      },
      actions: [{ type: 'enable', target: '' }]
    }
  }
]

const operatorLabels: Record<string, string> = {
  '=': 'equals',
  '!=': 'does not equal',
  '>': 'is greater than',
  '<': 'is less than',
  '>=': 'is greater than or equal to',
  '<=': 'is less than or equal to',
  'contains': 'contains',
  'not_contains': 'does not contain',
  'empty': 'is empty',
  'not_empty': 'is not empty'
}

const actionLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  'show': { label: 'Show', icon: <Eye className="h-3 w-3" />, color: 'text-green-600' },
  'hide': { label: 'Hide', icon: <EyeOff className="h-3 w-3" />, color: 'text-orange-600' },
  'enable': { label: 'Enable', icon: <Unlock className="h-3 w-3" />, color: 'text-blue-600' },
  'disable': { label: 'Disable', icon: <Lock className="h-3 w-3" />, color: 'text-red-600' },
  'require': { label: 'Make Required', icon: <Check className="h-3 w-3" />, color: 'text-purple-600' },
  'unrequire': { label: 'Make Optional', icon: <X className="h-3 w-3" />, color: 'text-gray-600' },
  'setValue': { label: 'Set Value', icon: <Edit3 className="h-3 w-3" />, color: 'text-indigo-600' }
}

export function ConditionalLogicBuilder({
  fields,
  currentField,
  rules,
  onChange
}: ConditionalLogicBuilderProps) {
  const [activeTab, setActiveTab] = useState<'builder' | 'templates'>('builder')
  const [editingRule, setEditingRule] = useState<number | null>(null)

  // Get available fields (excluding current field) - including nested fields in fieldgroups
  const getAllAvailableFields = (fieldList: FormField[], parentLabel?: string): FormField[] => {
    const result: FormField[] = []
    
    fieldList.forEach(field => {
      // Handle fieldgroups - add their nested fields, not the group itself
      if (field.type === 'fieldgroup' && field.fields) {
        const groupLabel = field.title || field.label || 'Group'
        result.push(...getAllAvailableFields(field.fields, groupLabel))
      } 
      // Handle sections - add their nested fields, not the section itself
      else if (field.type === 'section' && field.fields) {
        const sectionLabel = field.title || field.label || 'Section'
        result.push(...getAllAvailableFields(field.fields, sectionLabel))
      } 
      // Add regular fields with valid keys
      else if (field.key && field.key !== '' && field.key !== currentField.key) {
        // Add parent label to field label if it exists
        const fieldWithParent = {
          ...field,
          label: parentLabel ? `${parentLabel} > ${field.label || field.key}` : (field.label || field.key)
        }
        result.push(fieldWithParent)
      }
    })
    
    return result
  }
  
  const availableFields = getAllAvailableFields(fields)
  console.log('Available fields for conditional logic:', availableFields)

  const addRule = (template?: Partial<LogicRule>) => {
    const newRule: LogicRule = template ? {
      id: template.id || `rule_${Date.now()}`,
      name: template.name || '',
      when: template.when || {
        field: availableFields[0]?.key || '',
        op: '=',
        value: ''
      },
      actions: template.actions || [{
        type: 'show',
        target: currentField.key
      }]
    } : {
      id: `rule_${Date.now()}`,
      name: '',
      when: {
        field: availableFields[0]?.key || '',
        op: '=',
        value: ''
      },
      actions: [{
        type: 'show',
        target: currentField.key
      }]
    }
    
    // Set target to current field for template rules
    if (template?.actions) {
      newRule.actions = template.actions.map(a => ({ ...a, target: currentField.key }))
    }
    
    onChange([...rules, newRule])
    setEditingRule(rules.length)
  }

  const updateRule = (index: number, rule: LogicRule) => {
    const updatedRules = [...rules]
    updatedRules[index] = rule
    onChange(updatedRules)
  }

  const deleteRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index))
    if (editingRule === index) {
      setEditingRule(null)
    }
  }

  const duplicateRule = (index: number) => {
    const ruleToDuplicate = rules[index]
    onChange([...rules, { ...ruleToDuplicate }])
  }

  const addCondition = (ruleIndex: number, logic: 'and' | 'or') => {
    const rule = rules[ruleIndex]
    const newCondition: LogicCondition = {
      field: availableFields[0]?.key || '',
      op: '=',
      value: ''
    }

    if (logic === 'and') {
      const updatedRule = {
        ...rule,
        when: {
          ...rule.when,
          and: [...(rule.when.and || []), newCondition]
        }
      }
      updateRule(ruleIndex, updatedRule)
    } else {
      const updatedRule = {
        ...rule,
        when: {
          ...rule.when,
          or: [...(rule.when.or || []), newCondition]
        }
      }
      updateRule(ruleIndex, updatedRule)
    }
  }

  const addAction = (ruleIndex: number) => {
    const rule = rules[ruleIndex]
    const newAction: LogicAction = {
      type: 'show',
      target: currentField.key
    }
    updateRule(ruleIndex, {
      ...rule,
      actions: [...rule.actions, newAction]
    })
  }

  const getFieldLabel = (fieldKey: string) => {
    const field = fields.find(f => f.key === fieldKey)
    return field?.label || fieldKey
  }

  const renderCondition = (condition: LogicCondition, isFirst = true) => {
    const field = fields.find(f => f.key === condition.field)
    const needsValue = condition.op !== 'empty' && condition.op !== 'not_empty'
    
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {!isFirst && <span className="text-sm font-medium text-muted-foreground">IF</span>}
        
        <Badge variant="secondary" className="gap-1">
          {getFieldLabel(condition.field)}
        </Badge>
        
        <span className="text-sm text-muted-foreground">
          {operatorLabels[condition.op]}
        </span>
        
        {needsValue && (
          <Badge variant="outline">
            {typeof condition.value === 'boolean' 
              ? (condition.value ? 'Yes' : 'No')
              : condition.value || '(empty)'}
          </Badge>
        )}
      </div>
    )
  }

  const renderRuleSummary = (rule: LogicRule) => {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Badge className="mt-0.5" variant="secondary">IF</Badge>
          <div className="flex-1 space-y-1">
            {renderCondition(rule.when)}
            
            {rule.when.and?.map((cond, i) => (
              <div key={i} className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">AND</Badge>
                {renderCondition(cond, false)}
              </div>
            ))}
            
            {rule.when.or?.map((cond, i) => (
              <div key={i} className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">OR</Badge>
                {renderCondition(cond, false)}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <Badge className="mt-0.5" variant="secondary">THEN</Badge>
          <div className="flex-1 space-y-1">
            {rule.actions.map((action, i) => {
              const actionInfo = actionLabels[action.type]
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className={`flex items-center gap-1 text-sm ${actionInfo.color}`}>
                    {actionInfo.icon}
                    {actionInfo.label}
                  </span>
                  {action.target && action.target !== currentField.key && (
                    <>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="secondary" className="text-xs">
                        {getFieldLabel(action.target)}
                      </Badge>
                    </>
                  )}
                  {action.type === 'setValue' && action.value && (
                    <>
                      <span className="text-sm text-muted-foreground">to</span>
                      <Badge variant="outline" className="text-xs">
                        {action.value}
                      </Badge>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderRuleEditor = (rule: LogicRule, index: number) => {
    // Get the field being referenced in the condition
    const referencedField = availableFields.find(f => f.key === rule.when.field)
    console.log('Referenced field:', rule.when.field, referencedField)
    
    const hasOptions = referencedField && (
      referencedField.type === 'select' || 
      referencedField.type === 'radio' ||
      referencedField.type === 'multiselect' ||
      referencedField.type === 'button-select'
    )
    const isToggleOrCheckbox = referencedField && (
      referencedField.type === 'checkbox' ||
      referencedField.type === 'toggle'
    )
    const fieldOptions = hasOptions && 'options' in referencedField ? (referencedField.options || []) : []
    
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Main Condition */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">If this condition is true:</Label>
            <div className="grid grid-cols-3 gap-2">
              <Select
                value={rule.when.field}
                onValueChange={(value) => {
                  // Clear the value when changing fields
                  updateRule(index, {
                    ...rule,
                    when: { ...rule.when, field: value, value: '' }
                  })
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {availableFields.map(field => (
                    <SelectItem key={field.key} value={field.key}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={rule.when.op}
                onValueChange={(value) => updateRule(index, {
                  ...rule,
                  when: { ...rule.when, op: value as any }
                })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="=">equals</SelectItem>
                  <SelectItem value="!=">does not equal</SelectItem>
                  {!hasOptions && (
                    <>
                      <SelectItem value=">">greater than</SelectItem>
                      <SelectItem value="<">less than</SelectItem>
                      <SelectItem value=">=">greater or equal</SelectItem>
                      <SelectItem value="<=">less or equal</SelectItem>
                      <SelectItem value="contains">contains</SelectItem>
                      <SelectItem value="not_contains">doesn't contain</SelectItem>
                    </>
                  )}
                  <SelectItem value="empty">is empty</SelectItem>
                  <SelectItem value="not_empty">is not empty</SelectItem>
                </SelectContent>
              </Select>
              
              {rule.when.op !== 'empty' && rule.when.op !== 'not_empty' && (
                (hasOptions || isToggleOrCheckbox) ? (
                  <Select
                    value={rule.when.value || ''}
                    onValueChange={(value) => updateRule(index, {
                      ...rule,
                      when: { ...rule.when, value }
                    })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select value" />
                    </SelectTrigger>
                    <SelectContent>
                      {isToggleOrCheckbox ? (
                        <>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </>
                      ) : (
                        fieldOptions.map((option: any) => {
                          const optionLabel = typeof option === 'string' ? option : option.label
                          // Use the label as the value for comparison (what users see is what they get)
                          if (!optionLabel || optionLabel === '') return null
                          return (
                            <SelectItem key={optionLabel} value={optionLabel}>
                              {optionLabel}
                            </SelectItem>
                          )
                        }).filter(Boolean)
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={rule.when.value || ''}
                    onChange={(e) => updateRule(index, {
                      ...rule,
                      when: { ...rule.when, value: e.target.value }
                    })}
                    placeholder="Enter value"
                    className="h-9"
                  />
                )
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => addCondition(index, 'and')}
                className="h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                AND
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addCondition(index, 'or')}
                className="h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                OR
              </Button>
            </div>
          </div>

          {/* Additional Conditions */}
          {rule.when.and?.map((condition, condIndex) => {
            const andReferencedField = availableFields.find(f => f.key === condition.field)
            const andHasOptions = andReferencedField && (
              andReferencedField.type === 'select' || 
              andReferencedField.type === 'radio' ||
              andReferencedField.type === 'multiselect' ||
              andReferencedField.type === 'button-select'
            )
            const andIsToggleOrCheckbox = andReferencedField && (
              andReferencedField.type === 'checkbox' ||
              andReferencedField.type === 'toggle'
            )
            const andFieldOptions = andHasOptions && 'options' in andReferencedField ? (andReferencedField.options || []) : []
            
            return (
              <div key={condIndex} className="pl-8 border-l-2 border-muted space-y-2">
                <Label className="text-xs text-muted-foreground">AND</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Select
                    value={condition.field}
                    onValueChange={(value) => {
                      const updatedAnd = [...(rule.when.and || [])]
                      updatedAnd[condIndex] = { ...condition, field: value, value: '' }
                      updateRule(index, {
                        ...rule,
                        when: { ...rule.when, and: updatedAnd }
                      })
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map(field => (
                        <SelectItem key={field.key} value={field.key}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={condition.op}
                    onValueChange={(value) => {
                      const updatedAnd = [...(rule.when.and || [])]
                      updatedAnd[condIndex] = { ...condition, op: value as any }
                      updateRule(index, {
                        ...rule,
                        when: { ...rule.when, and: updatedAnd }
                      })
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="=">equals</SelectItem>
                      <SelectItem value="!=">does not equal</SelectItem>
                      {!andHasOptions && (
                        <>
                          <SelectItem value=">">greater than</SelectItem>
                          <SelectItem value="<">less than</SelectItem>
                          <SelectItem value=">=">greater or equal</SelectItem>
                          <SelectItem value="<=">less or equal</SelectItem>
                          <SelectItem value="contains">contains</SelectItem>
                          <SelectItem value="not_contains">doesn't contain</SelectItem>
                        </>
                      )}
                      <SelectItem value="empty">is empty</SelectItem>
                      <SelectItem value="not_empty">is not empty</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {condition.op !== 'empty' && condition.op !== 'not_empty' && (
                    (andHasOptions || andIsToggleOrCheckbox) ? (
                      <Select
                        value={condition.value || ''}
                        onValueChange={(value) => {
                          const updatedAnd = [...(rule.when.and || [])]
                          updatedAnd[condIndex] = { ...condition, value }
                          updateRule(index, {
                            ...rule,
                            when: { ...rule.when, and: updatedAnd }
                          })
                        }}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          {andIsToggleOrCheckbox ? (
                            <>
                              <SelectItem value="true">Yes</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </>
                          ) : (
                            andFieldOptions.map((option: any) => {
                              const optionValue = typeof option === 'string' ? option : option.value
                              const optionLabel = typeof option === 'string' ? option : option.label
                              // Skip options with empty values
                              if (!optionValue || optionValue === '') return null
                              return (
                                <SelectItem key={optionValue} value={optionValue}>
                                  {optionLabel || optionValue}
                                </SelectItem>
                              )
                            }).filter(Boolean)
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={condition.value || ''}
                        onChange={(e) => {
                          const updatedAnd = [...(rule.when.and || [])]
                          updatedAnd[condIndex] = { ...condition, value: e.target.value }
                          updateRule(index, {
                            ...rule,
                            when: { ...rule.when, and: updatedAnd }
                          })
                        }}
                        placeholder="Enter value"
                        className="h-9"
                      />
                    )
                  )}
                </div>
              </div>
            )
          })}

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium">What should happen:</Label>
              <p className="text-xs text-muted-foreground">
                Choose what changes to make to this field when the condition above is met
              </p>
            </div>
            {rule.actions.map((action, actionIndex) => {
              const actionInfo = actionLabels[action.type]
              return (
              <div key={actionIndex} className="p-3 border rounded-lg bg-muted/30">
                <div className="flex items-start gap-2">
                  <div className={`mt-1 ${actionInfo.color}`}>
                    {actionInfo.icon}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                <Select
                  value={action.type}
                  onValueChange={(value) => {
                    const updatedActions = [...rule.actions]
                    updatedActions[actionIndex] = { ...action, type: value as any }
                    updateRule(index, { ...rule, actions: updatedActions })
                  }}
                >
                  <SelectTrigger className="h-9 flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="show">
                      <div className="flex items-center gap-2">
                        <Eye className="h-3 w-3 text-green-600" />
                        <div>
                          <div className="font-medium">Show this field</div>
                          <div className="text-xs text-muted-foreground">Make the field visible</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="hide">
                      <div className="flex items-center gap-2">
                        <EyeOff className="h-3 w-3 text-orange-600" />
                        <div>
                          <div className="font-medium">Hide this field</div>
                          <div className="text-xs text-muted-foreground">Make the field invisible</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="enable">
                      <div className="flex items-center gap-2">
                        <Unlock className="h-3 w-3 text-blue-600" />
                        <div>
                          <div className="font-medium">Enable this field</div>
                          <div className="text-xs text-muted-foreground">Allow user input</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="disable">
                      <div className="flex items-center gap-2">
                        <Lock className="h-3 w-3 text-red-600" />
                        <div>
                          <div className="font-medium">Disable this field</div>
                          <div className="text-xs text-muted-foreground">Prevent user input</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="require">
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-purple-600" />
                        <div>
                          <div className="font-medium">Make required</div>
                          <div className="text-xs text-muted-foreground">User must fill this field</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="unrequire">
                      <div className="flex items-center gap-2">
                        <X className="h-3 w-3 text-gray-600" />
                        <div>
                          <div className="font-medium">Make optional</div>
                          <div className="text-xs text-muted-foreground">User can skip this field</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="setValue">
                      <div className="flex items-center gap-2">
                        <Edit3 className="h-3 w-3 text-indigo-600" />
                        <div>
                          <div className="font-medium">Set a value</div>
                          <div className="text-xs text-muted-foreground">Auto-fill with specific text</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {action.type === 'setValue' && (
                  <Input
                    value={action.value || ''}
                    onChange={(e) => {
                      const updatedActions = [...rule.actions]
                      updatedActions[actionIndex] = { ...action, value: e.target.value }
                      updateRule(index, { ...rule, actions: updatedActions })
                    }}
                    placeholder="Value to set"
                    className="h-9 flex-1"
                  />
                )}
                
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    const updatedActions = rule.actions.filter((_, i) => i !== actionIndex)
                    updateRule(index, { ...rule, actions: updatedActions })
                  }}
                  className="h-9 w-9"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                    </div>
                  </div>
                </div>
              </div>
              )
            })}
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => addAction(index)}
              className="h-8"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Action
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="builder">Rule Builder</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-4">
          {rules.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  No conditional logic rules yet
                </p>
                <Button onClick={() => addRule()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Rule
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {rules.map((rule, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-sm">Rule {index + 1}</CardTitle>
                          {editingRule !== index && (
                            <div className="mt-2">
                              {renderRuleSummary(rule)}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingRule(editingRule === index ? null : index)}
                            className="h-8 w-8"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => duplicateRule(index)}
                            className="h-8 w-8"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteRule(index)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {editingRule === index && renderRuleEditor(rule, index)}
                  </Card>
                ))}
                
                <Button
                  onClick={() => addRule()}
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Rule
                </Button>
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-3">
            {ruleTemplates.map((template, index) => (
              <Card 
                key={index}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  addRule(template.rule)
                  setActiveTab('builder')
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}