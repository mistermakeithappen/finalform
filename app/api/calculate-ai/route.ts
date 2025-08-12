import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function parseFraction(value: string): number | null {
  const fractionMap: Record<string, number> = {
    '1/8': 0.125,
    '1/4': 0.25,
    '3/8': 0.375,
    '1/2': 0.5,
    '5/8': 0.625,
    '3/4': 0.75,
    '7/8': 0.875,
    '1/3': 0.333333,
    '2/3': 0.666667,
    '1/16': 0.0625,
    '3/16': 0.1875,
    '5/16': 0.3125,
    '7/16': 0.4375,
    '9/16': 0.5625,
    '11/16': 0.6875,
    '13/16': 0.8125,
    '15/16': 0.9375
  }

  // Check for mixed numbers like "2 1/2" or "2-1/2"
  const mixedMatch = value.match(/(\d+)[\s-]?(\d+\/\d+)/)
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1])
    const fraction = fractionMap[mixedMatch[2]] || eval(mixedMatch[2])
    return whole + fraction
  }

  // Check for simple fractions
  if (fractionMap[value]) {
    return fractionMap[value]
  }

  // Try to evaluate as a fraction
  if (value.includes('/')) {
    try {
      return eval(value)
    } catch {
      return null
    }
  }

  return null
}

function buildPrompt(
  fieldValues: Record<string, any>,
  instructions: string,
  outputFormat?: string,
  examples?: Array<{ inputs: Record<string, any>; expectedOutput: any }>
): string {
  let prompt = 'You are a calculator assistant that performs precise calculations based on form field values.\n\n'
  
  prompt += 'Current field values:\n'
  for (const [key, value] of Object.entries(fieldValues)) {
    prompt += `- ${key}: ${JSON.stringify(value)}\n`
  }
  
  prompt += '\nInstructions:\n'
  prompt += instructions + '\n'
  
  if (examples && examples.length > 0) {
    prompt += '\nExamples:\n'
    examples.forEach((example, i) => {
      prompt += `Example ${i + 1}:\n`
      prompt += `Inputs: ${JSON.stringify(example.inputs)}\n`
      prompt += `Expected Output: ${JSON.stringify(example.expectedOutput)}\n`
    })
  }
  
  prompt += '\nOutput requirements:\n'
  switch (outputFormat) {
    case 'number':
      prompt += 'Return only a numeric value (integer or decimal). No units or text.'
      break
    case 'currency':
      prompt += 'Return a numeric value representing currency (e.g., 123.45 for $123.45).'
      break
    case 'percentage':
      prompt += 'Return a numeric value between 0 and 100 representing a percentage.'
      break
    case 'fraction':
      prompt += 'Return a fraction in the format "numerator/denominator" or a mixed number like "2 1/2".'
      break
    case 'measurement':
      prompt += 'Return a measurement with units (e.g., "12.5 inches", "3.2 feet", "2.5 meters").'
      break
    default:
      prompt += 'Return the calculated result in the most appropriate format.'
  }
  
  prompt += '\n\nProvide only the final calculated result, no explanations.'
  
  return prompt
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Get user's org and check for OpenAI integration
    const { data: orgUser } = await supabase
      .from('org_users')
      .select('org_id')
      .eq('user_id', user.id)
      .single()
    
    if (!orgUser) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }
    
    const { data: integration } = await supabase
      .from('org_integrations')
      .select('api_key_cipher')
      .eq('org_id', orgUser.org_id)
      .eq('provider', 'openai')
      .single()
    
    if (!integration) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key not configured',
          fallbackValue: null,
          requiresSetup: true 
        },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const {
      fieldValues,
      instructions,
      outputFormat,
      examples,
      unitConversion,
      fallbackValue
    } = body
    
    // Process field values to handle fractions and special formats
    const processedValues: Record<string, any> = {}
    for (const [key, value] of Object.entries(fieldValues)) {
      if (typeof value === 'string') {
        // Check if it's a fraction
        const fractionValue = parseFraction(value)
        if (fractionValue !== null) {
          processedValues[key] = {
            original: value,
            numeric: fractionValue,
            type: 'fraction'
          }
        } else {
          processedValues[key] = value
        }
      } else {
        processedValues[key] = value
      }
    }
    
    // Build the prompt
    const prompt = buildPrompt(processedValues, instructions, outputFormat, examples)
    
    // Call OpenAI API
    const openaiApiKey = integration.api_key_cipher
    
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a precise calculator that handles measurements, fractions, and various units. Always provide accurate calculations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 100
      })
    })
    
    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      console.error('OpenAI API error:', error)
      
      // Return fallback value if available
      if (fallbackValue !== undefined) {
        return NextResponse.json({
          result: fallbackValue,
          isFallback: true,
          error: 'AI calculation failed, using fallback value'
        })
      }
      
      return NextResponse.json(
        { error: 'AI calculation failed' },
        { status: 500 }
      )
    }
    
    const response = await openaiResponse.json()
    const result = response.choices[0]?.message?.content?.trim()
    
    // Process the result based on output format
    let processedResult = result
    if (outputFormat === 'number' || outputFormat === 'currency') {
      // Extract numeric value
      const numMatch = result.match(/[\d.]+/)
      if (numMatch) {
        processedResult = parseFloat(numMatch[0])
      }
    } else if (outputFormat === 'percentage') {
      const numMatch = result.match(/[\d.]+/)
      if (numMatch) {
        processedResult = parseFloat(numMatch[0])
      }
    }
    
    return NextResponse.json({
      result: processedResult,
      raw: result,
      processedValues,
      isFallback: false
    })
    
  } catch (error) {
    console.error('AI calculation error:', error)
    
    // Try to extract fallback value from request
    try {
      const body = await request.json().catch(() => ({}))
      if (body.fallbackValue !== undefined) {
        return NextResponse.json({
          result: body.fallbackValue,
          isFallback: true,
          error: 'Error occurred, using fallback value'
        })
      }
    } catch {}
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}