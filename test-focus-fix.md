# Focus Scope Error Fix

## Issue
Maximum update depth exceeded error caused by infinite loop in React component, specifically related to Radix UI's focus-scope management.

## Root Causes Identified
1. **DropdownMenu modal prop**: The `modal={false}` prop on DropdownMenu was causing focus conflicts
2. **useEffect dependency loop**: The `previousSelectedId` state was both a dependency and being updated within the same effect
3. **Redundant dependencies**: The schema object was included twice in dependencies array

## Fixes Applied

### 1. Removed modal={false} from DropdownMenu
```diff
- <DropdownMenu modal={false}>
+ <DropdownMenu>
```

### 2. Fixed useEffect dependency arrays
```diff
// Field selection change effect
- }, [selectedField, previousSelectedId, schema, triggerSave, enableAutosave, formId])
+ }, [selectedField?.id, enableAutosave, formId, triggerSave, schema]) // Removed previousSelectedId to avoid loop

// Fields modification effect  
- }, [schema.fields, enableAutosave, formId, triggerSave, schema])
+ }, [schema.fields, enableAutosave, formId, triggerSave])
```

## Testing
1. Navigate to http://localhost:3001/builder/new
2. Try adding fields to the form
3. Switch between fields
4. Use the dropdown menu
5. Verify no infinite loop errors occur

## Result
The infinite update loop has been resolved by:
- Preventing focus trap conflicts between multiple Radix UI components
- Breaking the circular dependency in useEffect hooks
- Ensuring proper cleanup of state updates