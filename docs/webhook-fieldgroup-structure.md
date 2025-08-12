# Webhook Data Structure for Field Groups

## Overview
When a form containing field groups is submitted, the webhook payload includes multiple data formats to accommodate different integration needs while clearly maintaining the grouped structure of the data.

## Webhook Payload Structure

The webhook payload includes the following data formats:

```json
{
  "formId": "form_123",
  "submissionId": "sub_456",
  "submittedAt": "2024-01-15T10:30:00Z",
  "utm": { /* UTM parameters */ },
  "user": { /* User data if authenticated */ },
  "data": {
    "raw": { /* Original flat structure */ },
    "structured": { /* Grouped structure with metadata */ },
    "flattened": { /* Dot-notation flattened structure */ },
    "metadata": { /* Form and submission metadata */ }
  },
  "answers": { /* Legacy support - same as raw */ }
}
```

## Field Group Data Formats

### 1. Raw Format (data.raw)
The original submission data as collected by the form:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "emergency_contacts": [
    {
      "contact_name": "Jane Doe",
      "contact_phone": "555-0101",
      "relationship": "spouse"
    },
    {
      "contact_name": "Bob Smith",
      "contact_phone": "555-0102",
      "relationship": "friend"
    }
  ]
}
```

### 2. Structured Format (data.structured)
Enhanced structure that clearly identifies field groups with metadata:

#### Non-Repeatable Field Group
```json
{
  "billing_address": {
    "_type": "fieldgroup_single",
    "_title": "Billing Address",
    "_description": "Your billing information",
    "data": {
      "street": {
        "value": "123 Main St",
        "label": "Street Address",
        "type": "text",
        "_metadata": {
          "fieldType": "text",
          "fieldLabel": "Street Address",
          "isRequired": true,
          "hasValue": true
        }
      },
      "city": {
        "value": "New York",
        "label": "City",
        "type": "text"
      },
      "state": {
        "value": "NY",
        "label": "State",
        "type": "select",
        "displayValue": "New York"
      },
      "zip": {
        "value": "10001",
        "label": "ZIP Code",
        "type": "text"
      }
    }
  }
}
```

#### Repeatable Field Group
```json
{
  "emergency_contacts": {
    "_type": "fieldgroup_repeatable",
    "_title": "Emergency Contacts",
    "_description": "Add your emergency contacts",
    "_count": 2,
    "instances": [
      {
        "_index": 1,
        "_instanceId": "emergency_contacts_1",
        "contact_name": {
          "value": "Jane Doe",
          "label": "Contact Name",
          "type": "text"
        },
        "contact_phone": {
          "value": "555-0101",
          "label": "Phone Number",
          "type": "phone"
        },
        "relationship": {
          "value": "spouse",
          "label": "Relationship",
          "type": "select",
          "displayValue": "Spouse"
        }
      },
      {
        "_index": 2,
        "_instanceId": "emergency_contacts_2",
        "contact_name": {
          "value": "Bob Smith",
          "label": "Contact Name",
          "type": "text"
        },
        "contact_phone": {
          "value": "555-0102",
          "label": "Phone Number",
          "type": "phone"
        },
        "relationship": {
          "value": "friend",
          "label": "Relationship",
          "type": "select",
          "displayValue": "Friend"
        }
      }
    ]
  }
}
```

### 3. Flattened Format (data.flattened)
Dot-notation format ideal for CSV exports or simple database structures:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "billing_address.street": "123 Main St",
  "billing_address.city": "New York",
  "billing_address.state": "NY",
  "billing_address.zip": "10001",
  "emergency_contacts[1].contact_name": "Jane Doe",
  "emergency_contacts[1].contact_phone": "555-0101",
  "emergency_contacts[1].relationship": "spouse",
  "emergency_contacts[2].contact_name": "Bob Smith",
  "emergency_contacts[2].contact_phone": "555-0102",
  "emergency_contacts[2].relationship": "friend"
}
```

## Metadata Structure

The metadata object provides context about the form and field groups:

```json
{
  "metadata": {
    "hasFieldGroups": true,
    "fieldGroupKeys": ["billing_address", "emergency_contacts"],
    "timestamp": "2024-01-15T10:30:00Z",
    "formId": "form_123",
    "formName": "Customer Registration",
    "formVersion": 2
  }
}
```

## Integration Examples

### 1. Zapier/Make.com Integration
Use the flattened format for easy field mapping:
```javascript
const customerData = {
  name: webhook.data.flattened["name"],
  email: webhook.data.flattened["email"],
  street: webhook.data.flattened["billing_address.street"],
  city: webhook.data.flattened["billing_address.city"]
}
```

### 2. Database Storage
Use the structured format to maintain relationships:
```javascript
// Store main submission
const submission = await db.submissions.create({
  formId: webhook.formId,
  submissionId: webhook.submissionId,
  data: webhook.data.raw
})

// Store field group instances separately if needed
for (const contact of webhook.data.structured.emergency_contacts.instances) {
  await db.emergency_contacts.create({
    submissionId: webhook.submissionId,
    name: contact.contact_name.value,
    phone: contact.contact_phone.value,
    relationship: contact.relationship.value
  })
}
```

### 3. Email Notifications
Use the structured format for rich formatting:
```javascript
const emailBody = `
New Registration from ${webhook.data.structured.name}

Billing Address:
${webhook.data.structured.billing_address.data.street.value}
${webhook.data.structured.billing_address.data.city.value}, 
${webhook.data.structured.billing_address.data.state.displayValue} 
${webhook.data.structured.billing_address.data.zip.value}

Emergency Contacts (${webhook.data.structured.emergency_contacts._count}):
${webhook.data.structured.emergency_contacts.instances.map(c => 
  `- ${c.contact_name.value} (${c.relationship.displayValue}): ${c.contact_phone.value}`
).join('\n')}
`
```

## Webhook Signature Verification

All webhooks include an HMAC signature for security:

```javascript
const crypto = require('crypto')

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex')
  
  return `sha256=${expectedSignature}` === signature
}

// In your webhook handler
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-form-signature']
  const isValid = verifyWebhookSignature(req.body, signature, process.env.WEBHOOK_SECRET)
  
  if (!isValid) {
    return res.status(401).send('Invalid signature')
  }
  
  // Process the webhook...
})
```

## Best Practices

1. **Use the appropriate format for your use case:**
   - `structured`: When you need full context and metadata
   - `flattened`: For simple integrations and CSV exports
   - `raw`: For backward compatibility or custom processing

2. **Check for field groups:**
   - Use `metadata.hasFieldGroups` to determine if special handling is needed
   - `metadata.fieldGroupKeys` lists all field group keys in the form

3. **Handle repeatable groups dynamically:**
   - Don't assume a fixed number of instances
   - Use the `_count` property to iterate through instances

4. **Preserve data types:**
   - The structured format includes type information for proper casting
   - Use `displayValue` for select/radio fields when available

5. **Version awareness:**
   - Check `metadata.formVersion` to handle schema changes
   - Store the version with your data for future migrations