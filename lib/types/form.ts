export type FieldType = 
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'currency'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'time'
  | 'datetime'
  | 'file'
  | 'video'
  | 'signature'
  | 'rating'
  | 'toggle'
  | 'slider'
  | 'hidden'
  | 'html'
  | 'headline'
  | 'image'
  | 'pagebreak'
  | 'matrix'
  | 'section'
  | 'repeater'
  | 'fieldgroup'
  | 'address'
  | 'button-select'

export interface FieldValidation {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
  custom?: string
}

export interface FieldVisibility {
  when?: LogicCondition
}

export interface LogicCondition {
  field: string
  op: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'not_contains' | 'empty' | 'not_empty'
  value?: any
  and?: LogicCondition[]
  or?: LogicCondition[]
}

export interface GridConfig {
  col?: number
  row?: number
  colSpan?: number
  rowSpan?: number
}

export type FieldWidth = 'full' | 'half' | 'third' | 'quarter' | 'two-thirds' | 'three-quarters'

export interface BaseField {
  id: string
  type: FieldType
  key: string
  label?: string
  placeholder?: string
  helpText?: string
  required?: boolean
  validation?: FieldValidation
  visibility?: FieldVisibility
  conditions?: LogicRule[]
  calculation?: string
  grid?: GridConfig
  width?: FieldWidth
  default?: any
  hasDefault?: boolean
  meta?: Record<string, any>
  hidden?: boolean
  disabled?: boolean
  className?: string
}

export interface TextField extends BaseField {
  type: 'text' | 'email' | 'phone'
  inputType?: string
  mask?: string
}

export interface TextAreaField extends BaseField {
  type: 'textarea'
  rows?: number
  maxRows?: number
}

export interface NumberField extends BaseField {
  type: 'number' | 'currency'
  precision?: number
  prefix?: string
  suffix?: string
  thousandsSeparator?: boolean
}

export interface SelectField extends BaseField {
  type: 'select' | 'multiselect' | 'radio'
  options: Array<{ label: string; value: string | number }>
  allowCustom?: boolean
}

export interface CheckboxField extends BaseField {
  type: 'checkbox' | 'toggle'
  text?: string
}

export interface DateField extends BaseField {
  type: 'date' | 'time' | 'datetime'
  format?: string
  minDate?: string
  maxDate?: string
}

export interface FileField extends BaseField {
  type: 'file'
  accept?: string
  maxSize?: number
  multiple?: boolean
}

export interface VideoField extends BaseField {
  type: 'video'
  maxDuration?: number // Maximum recording duration in seconds
  maxSize?: number // Maximum file size in MB
  compressionQuality?: 'low' | 'medium' | 'high'
  preferredCamera?: 'user' | 'environment' | 'any' // front/back/any camera
  resolution?: 'auto' | '480p' | '720p' | '1080p'
  showPreview?: boolean
  allowUpload?: boolean // Allow file upload as alternative to recording
  allowNativeCamera?: boolean // Allow using native camera app on mobile
  includeAudio?: boolean // Include audio in recording
}

export interface SignatureField extends BaseField {
  type: 'signature'
  signatureWidth?: number
  height?: number
  backgroundColor?: string
  penColor?: string
}

export interface RatingField extends BaseField {
  type: 'rating'
  maxRating?: number
  icon?: 'star' | 'heart' | 'thumbs'
}

export interface SliderField extends BaseField {
  type: 'slider'
  min?: number
  max?: number
  step?: number
  marks?: boolean
  markLabels?: Record<number, string>
}

export interface HtmlField extends BaseField {
  type: 'html'
  content: string
}

export interface HeadlineField extends BaseField {
  type: 'headline'
  text: string
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  alignment?: 'left' | 'center' | 'right'
}

export interface ImageField extends BaseField {
  type: 'image'
  imageUrl?: string
  altText?: string
  imageWidth?: number | 'auto' | 'full'
  imageHeight?: number | 'auto'
  alignment?: 'left' | 'center' | 'right'
  caption?: string
  link?: string
  openInNewTab?: boolean
}

export interface ButtonSelectOption {
  label: string
  value: string
  description?: string
  icon?: string // Icon name or emoji
  targetPage?: number // Optional page to navigate to
  color?: string // Button color
}

export interface ButtonSelectField extends BaseField {
  type: 'button-select'
  options: ButtonSelectOption[]
  layout?: 'vertical' | 'grid' // vertical stack or grid layout
  columns?: 1 | 2 | 3 | 4 // number of columns for grid layout
  buttonSize?: 'small' | 'medium' | 'large' | 'xl'
  allowMultiple?: boolean // Allow multiple selections
  navigateOnSelect?: boolean // Navigate to page immediately on selection
  showDescription?: boolean
  showIcon?: boolean
}

export interface PageNavigationRule {
  id: string
  condition: LogicCondition
  targetPage: number // Page number to navigate to
  label?: string // Optional label for debugging
}

export interface PageBreakField extends BaseField {
  type: 'pagebreak'
  pageTitle?: string
  pageDescription?: string
  nextButtonText?: string
  prevButtonText?: string
  showProgressBar?: boolean
  hideNextButton?: boolean // Hide the next button (useful for button-select navigation)
  hidePrevButton?: boolean // Hide the previous button
  navigationRules?: PageNavigationRule[] // Conditional navigation
  defaultNextPage?: number // If no rules match, go to this page (default: next sequential)
}

export interface MatrixColumn {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'currency' | 'checkbox'
  width?: number
  options?: Array<{ label: string; value: string | number }>
  precision?: number
  readonly?: boolean
  required?: boolean
  default?: any
}

export interface MatrixField extends BaseField {
  type: 'matrix'
  columns: MatrixColumn[]
  allowAddRow?: boolean
  allowDeleteRow?: boolean
  minRows?: number
  maxRows?: number
  rowDefault?: Record<string, any>
  rowCalc?: string
  footer?: {
    showTotals?: boolean
    sum?: string[]
    average?: string[]
    custom?: Record<string, string>
  }
}

export interface SectionField extends BaseField {
  type: 'section'
  title?: string
  description?: string
  collapsible?: boolean
  collapsed?: boolean
  fields: FormField[]
}

export interface RepeaterField extends BaseField {
  type: 'repeater'
  fields: FormField[]
  minItems?: number
  maxItems?: number
  itemLabel?: string | ((index: number) => string)
}

export interface AddressField extends BaseField {
  type: 'address'
  components?: {
    street1?: boolean
    street2?: boolean
    city?: boolean
    state?: boolean
    zip?: boolean
    country?: boolean
  }
  defaultCountry?: string
}

export interface FieldGroupField extends BaseField {
  type: 'fieldgroup'
  title?: string
  description?: string
  fields: FormField[]
  repeatable?: boolean
  minInstances?: number
  maxInstances?: number
  addButtonText?: string
  removeButtonText?: string
  collapsible?: boolean
  collapsed?: boolean
  groupKey?: string // Used for webhook data grouping
}

export type FormField = 
  | TextField
  | TextAreaField
  | NumberField
  | SelectField
  | CheckboxField
  | DateField
  | FileField
  | VideoField
  | SignatureField
  | RatingField
  | SliderField
  | HtmlField
  | HeadlineField
  | ImageField
  | PageBreakField
  | MatrixField
  | SectionField
  | RepeaterField
  | FieldGroupField
  | AddressField
  | ButtonSelectField

export interface LogicRule {
  id: string
  name?: string
  when: LogicCondition
  actions: LogicAction[]
}

export interface LogicAction {
  type: 'show' | 'hide' | 'enable' | 'disable' | 'setValue' | 'require' | 'unrequire'
  target: string
  value?: any
}

export interface Calculation {
  id: string
  name: string
  formula: string
  outputs: Array<{
    target: string
    format?: 'number' | 'currency' | 'percentage' | 'text'
  }>
}

export interface FormTheme {
  primaryColor?: string
  accentColor?: string
  backgroundColor?: string
  textColor?: string
  borderColor?: string
  borderRadius?: string
  fontFamily?: string
  fontSize?: string
  spacing?: string
  inputStyle?: 'outlined' | 'filled' | 'underlined'
  buttonStyle?: 'solid' | 'outline' | 'ghost'
  logo?: string
}

export interface FormPrefill {
  utm?: Record<string, string>
  query?: Record<string, string>
  custom?: Record<string, any>
}

export interface FormSchema {
  id: string
  version: number
  name: string
  description?: string
  fields: FormField[]
  logic?: LogicRule[]
  calculations?: Calculation[]
  theme?: FormTheme
  prefill?: FormPrefill
  settings?: {
    // Display Settings
    showFormTitle?: boolean
    showFormDescription?: boolean
    formTitleAlignment?: 'left' | 'center' | 'right'
    formDescriptionAlignment?: 'left' | 'center' | 'right'
    showProgressBar?: boolean
    showRequiredIndicator?: boolean
    requiredIndicatorText?: string
    
    // Branding & Appearance
    showLogo?: boolean
    logoUrl?: string
    logoPosition?: 'top-left' | 'top-center' | 'top-right'
    customCSS?: string
    containerWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
    containerPadding?: 'none' | 'sm' | 'md' | 'lg'
    
    // Submit Settings
    submitText?: string
    submitAction?: 'message' | 'redirect' | 'callback'
    submitMessage?: string
    submitRedirect?: string
    submitButtonAlignment?: 'left' | 'center' | 'right' | 'justify'
    
    // Form Behavior
    allowSave?: boolean
    allowPrint?: boolean
    requireAuth?: boolean
    captcha?: boolean
    recordingEnabled?: boolean
    meetingRecordingField?: string
    autoSaveInterval?: number
    showValidationSummary?: boolean
    scrollToError?: boolean
    
    // Thank You Page
    showThankYouPage?: boolean
    thankYouTitle?: string
    thankYouMessage?: string
    thankYouButtonText?: string
    thankYouButtonAction?: 'close' | 'redirect' | 'reset'
    thankYouRedirectUrl?: string
  }
}

export interface FormState {
  values: Record<string, any>
  errors: Record<string, string>
  touched: Record<string, boolean>
  visible: Record<string, boolean>
  disabled: Record<string, boolean>
  required: Record<string, boolean>
  isDirty: boolean
  isSubmitting: boolean
  isValid: boolean
}

export interface FormSubmission {
  formId: string
  formVersion: number
  answers: Record<string, any>
  utm?: Record<string, string>
  client?: {
    ip?: string
    ua?: string
    referrer?: string
  }
  user?: {
    id: string
    email?: string
    name?: string
    avatar?: string
    metadata?: Record<string, any>
  }
  submittedAt: string
}