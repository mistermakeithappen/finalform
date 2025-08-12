'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface FormulaSyntaxHighlighterProps {
  formula: string
  validFieldKeys: string[]
  validFunctions: string[]
  className?: string
}

interface Token {
  type: 'field' | 'function' | 'number' | 'operator' | 'parenthesis' | 'unknown' | 'space'
  value: string
  valid: boolean
  start: number
  end: number
}

export function FormulaSyntaxHighlighter({
  formula,
  validFieldKeys,
  validFunctions,
  className
}: FormulaSyntaxHighlighterProps) {
  const tokenize = (text: string): Token[] => {
    const tokens: Token[] = []
    let current = 0
    
    while (current < text.length) {
      let matched = false
      
      // Skip whitespace
      if (/\s/.test(text[current])) {
        let start = current
        while (current < text.length && /\s/.test(text[current])) {
          current++
        }
        tokens.push({
          type: 'space',
          value: text.slice(start, current),
          valid: true,
          start,
          end: current
        })
        matched = true
        continue
      }
      
      // Check for operators
      if (['+', '-', '*', '/', '%'].includes(text[current])) {
        tokens.push({
          type: 'operator',
          value: text[current],
          valid: true,
          start: current,
          end: current + 1
        })
        current++
        matched = true
        continue
      }
      
      // Check for parentheses
      if (['(', ')'].includes(text[current])) {
        tokens.push({
          type: 'parenthesis',
          value: text[current],
          valid: true,
          start: current,
          end: current + 1
        })
        current++
        matched = true
        continue
      }
      
      // Check for numbers (including decimals)
      if (/[0-9]/.test(text[current]) || (text[current] === '.' && current + 1 < text.length && /[0-9]/.test(text[current + 1]))) {
        let start = current
        let hasDecimal = false
        
        while (current < text.length && (/[0-9]/.test(text[current]) || (text[current] === '.' && !hasDecimal))) {
          if (text[current] === '.') hasDecimal = true
          current++
        }
        
        tokens.push({
          type: 'number',
          value: text.slice(start, current),
          valid: true,
          start,
          end: current
        })
        matched = true
        continue
      }
      
      // Check for field names or functions (alphanumeric with underscores)
      if (/[a-zA-Z_]/.test(text[current])) {
        let start = current
        while (current < text.length && /[a-zA-Z0-9_]/.test(text[current])) {
          current++
        }
        
        const word = text.slice(start, current)
        
        // Check if it's a function (followed by parenthesis)
        const isFunction = current < text.length && text[current] === '('
        
        if (isFunction) {
          const isValidFunction = validFunctions.includes(word.toUpperCase())
          tokens.push({
            type: 'function',
            value: word,
            valid: isValidFunction,
            start,
            end: current
          })
        } else {
          // It's a field reference
          const isValidField = validFieldKeys.includes(word)
          tokens.push({
            type: 'field',
            value: word,
            valid: isValidField,
            start,
            end: current
          })
        }
        matched = true
        continue
      }
      
      // Unknown character
      if (!matched) {
        tokens.push({
          type: 'unknown',
          value: text[current],
          valid: false,
          start: current,
          end: current + 1
        })
        current++
      }
    }
    
    return tokens
  }
  
  const tokens = tokenize(formula)
  
  const getTokenColor = (token: Token): string => {
    if (!token.valid) return 'text-red-500 font-semibold'
    
    switch (token.type) {
      case 'field':
        return 'text-green-600 font-semibold'
      case 'function':
        return 'text-blue-600 font-semibold'
      case 'number':
        return 'text-green-600'
      case 'operator':
        return 'text-orange-600 font-semibold'
      case 'parenthesis':
        return 'text-purple-600 font-semibold'
      case 'space':
        return ''
      default:
        return 'text-gray-600'
    }
  }
  
  return (
    <div className={cn("font-mono text-sm", className)}>
      {tokens.map((token, index) => (
        <span
          key={index}
          className={cn(
            getTokenColor(token),
            !token.valid && "underline decoration-wavy decoration-red-500"
          )}
          title={!token.valid ? `Invalid ${token.type}: "${token.value}"` : undefined}
        >
          {token.value}
        </span>
      ))}
      {tokens.length === 0 && (
        <span className="text-muted-foreground">Enter formula...</span>
      )}
    </div>
  )
}