'use client'

import React, { useState } from 'react'
import { PageNavigationRule, FormField, LogicCondition } from '@/lib/types/form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageNavigationBuilderProps {
  fields: FormField[]
  rules: PageNavigationRule[]
  onChange: (rules: PageNavigationRule[]) => void
  totalPages: number
}

export function PageNavigationBuilder({
  fields,
  rules,
  onChange,
  totalPages
}: PageNavigationBuilderProps) {
  const [expandedRule, setExpandedRule] = useState<string | null>(null)

  // Get all available fields from all pages (not just earlier pages)
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
      // Add regular fields with valid keys (excluding non-interactive fields)
      else if (field.key && field.key !== '' && 
               field.type !== 'pagebreak' && 
               field.type !== 'headline' && 
               field.type !== 'html' &&
               field.type !== 'section') {
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

  const addRule = () => {
    const newRule: PageNavigationRule = {
      id: `rule_${Date.now()}`,
      condition: {
        field: '',
        op: '=',
        value: ''
      },
      targetPage: 2,
      label: `Rule ${rules.length + 1}`
    }
    onChange([...rules, newRule])
    setExpandedRule(newRule.id)
  }

  const removeRule = (ruleId: string) => {
    onChange(rules.filter(r => r.id !== ruleId))
  }

  const updateRule = (ruleId: string, updates: Partial<PageNavigationRule>) => {
    onChange(rules.map(r => r.id === ruleId ? { ...r, ...updates } : r))
  }

  const updateCondition = (ruleId: string, condition: LogicCondition) => {
    onChange(rules.map(r => r.id === ruleId ? { ...r, condition } : r))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Page Navigation Rules</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Define conditions to navigate to specific pages
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={addRule}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              No navigation rules defined. Form will proceed to the next page by default.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, index) => (
            <Card 
              key={rule.id}
              className={cn(
                "transition-all",
                expandedRule === rule.id && "ring-2 ring-primary/20"
              )}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Rule Header */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
                      className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                    >
                      <span>Rule {index + 1}</span>
                      {rule.label && (
                        <span className="text-muted-foreground">({rule.label})</span>
                      )}
                    </button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => removeRule(rule.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>

                  {/* Rule Content */}
                  {expandedRule === rule.id && (
                    <>
                      {/* Condition */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">If Field</Label>
                          <Select
                            value={rule.condition.field}
                            onValueChange={(value) => {
                              // Clear the value when changing fields
                              updateCondition(rule.id, { ...rule.condition, field: value, value: '' })
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableFields.map(field => (
                                <SelectItem key={field.key} value={field.key}>
                                  {field.label || field.key}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Operator</Label>
                          <Select
                            value={rule.condition.op}
                            onValueChange={(value: any) => 
                              updateCondition(rule.id, { ...rule.condition, op: value })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="=">Equals</SelectItem>
                              <SelectItem value="!=">Not Equals</SelectItem>
                              {(() => {
                                const referencedField = availableFields.find(f => f.key === rule.condition.field)
                                const hasOptions = referencedField && (
                                  referencedField.type === 'select' || 
                                  referencedField.type === 'radio' || 
                                  referencedField.type === 'checkbox' ||
                                  referencedField.type === 'toggle'
                                )
                                return !hasOptions ? (
                                  <>
                                    <SelectItem value=">">Greater Than</SelectItem>
                                    <SelectItem value="<">Less Than</SelectItem>
                                    <SelectItem value=">=">Greater or Equal</SelectItem>
                                    <SelectItem value="<=">Less or Equal</SelectItem>
                                    <SelectItem value="contains">Contains</SelectItem>
                                    <SelectItem value="not_contains">Doesn't Contain</SelectItem>
                                  </>
                                ) : null
                              })()}
                              <SelectItem value="empty">Is Empty</SelectItem>
                              <SelectItem value="not_empty">Is Not Empty</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {rule.condition.op !== 'empty' && rule.condition.op !== 'not_empty' && (
                          <div className="space-y-1">
                            <Label className="text-xs">Value</Label>
                            {(() => {
                              // Get the field being referenced in the condition
                              const referencedField = availableFields.find(f => f.key === rule.condition.field)
                              const hasOptions = referencedField && (
                                referencedField.type === 'select' || 
                                referencedField.type === 'radio'
                              )
                              const isToggleOrCheckbox = referencedField && (
                                referencedField.type === 'checkbox' ||
                                referencedField.type === 'toggle'
                              )
                              const fieldOptions = hasOptions && 'options' in referencedField ? (referencedField.options || []) : []
                              
                              return (hasOptions || isToggleOrCheckbox) ? (
                                <Select
                                  value={rule.condition.value || ''}
                                  onValueChange={(value) => 
                                    updateCondition(rule.id, { ...rule.condition, value })
                                  }
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Select value" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {isToggleOrCheckbox ? (
                                      <>
                                        <SelectItem value="true">Yes</SelectItem>
                                        <SelectItem value="false">No</SelectItem>
                                      </>
                                    ) : (
                                      fieldOptions.map((option: any) => {
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
                                  className="h-8 text-xs"
                                  value={rule.condition.value || ''}
                                  onChange={(e) => 
                                    updateCondition(rule.id, { ...rule.condition, value: e.target.value })
                                  }
                                  placeholder="Enter value"
                                />
                              )
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Navigation Target */}
                      <div className="flex items-center gap-2 pt-2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-xs">Then go to</Label>
                        <Select
                          value={rule.targetPage.toString()}
                          onValueChange={(value) => 
                            updateRule(rule.id, { targetPage: parseInt(value) })
                          }
                        >
                          <SelectTrigger className="h-8 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                              <SelectItem key={page} value={page.toString()}>
                                Page {page}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Optional Label */}
                      <div className="space-y-1">
                        <Label className="text-xs">Rule Label (Optional)</Label>
                        <Input
                          className="h-8 text-xs"
                          value={rule.label || ''}
                          onChange={(e) => updateRule(rule.id, { label: e.target.value })}
                          placeholder="e.g., 'Go to pricing if commercial'"
                        />
                      </div>
                    </>
                  )}

                  {/* Rule Summary when collapsed */}
                  {expandedRule !== rule.id && (
                    <div className="text-xs text-muted-foreground">
                      If <span className="font-medium">{rule.condition.field || '(not set)'}</span>
                      {' '}{rule.condition.op}{' '}
                      {rule.condition.op !== 'empty' && rule.condition.op !== 'not_empty' && (
                        <span className="font-medium">"{rule.condition.value}"</span>
                      )}
                      {' → Page '}{rule.targetPage}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {rules.length > 0 && (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded p-3">
          <strong>Note:</strong> Rules are evaluated in order. The first matching rule will determine navigation. 
          If no rules match, the form will proceed to the next sequential page.
        </div>
      )}
    </div>
  )
}