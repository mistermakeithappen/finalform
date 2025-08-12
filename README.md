# Final Form - The Last Form Builder You'll Ever Need

A production-ready, enterprise-grade drag-and-drop form builder that handles any and every situation or business need. Built with Next.js, TypeScript, and Supabase.

## Features

### Core Functionality
- ✅ **Drag-and-Drop Form Builder** - Intuitive visual form creation
- ✅ **Matrix/Line-Item Fields** - Perfect for quotes with materials, labor, and costs
- ✅ **Smart Calculations** - Automatic totals, tax calculations, and custom formulas
- ✅ **Conditional Logic** - Show/hide fields based on user responses
- ✅ **UTM Parameter Capture** - Track marketing campaign effectiveness
- ✅ **Webhook Integration** - Send submissions to any endpoint
- ✅ **Multi-tenant Architecture** - Secure organization-based data isolation

### Industry-Specific Features
- **Construction**: Line-item matrices for materials and labor, measurement fields, cost calculations
- **Healthcare**: HIPAA-compliant data handling, patient intake forms, consent management
- **Education**: Student applications, course registrations, feedback surveys
- **E-commerce**: Product orders, customer feedback, return requests
- **Real Estate**: Property inquiries, showing schedules, application forms
- **Any Industry**: Fully customizable to meet any business requirement

### Coming Soon
- 🚧 Voice-to-text transcription (OpenAI Whisper)
- 🚧 PDF export of submissions
- 🚧 Custom domain support
- 🚧 Embeddable forms

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **Drag & Drop**: @dnd-kit
- **Calculations**: expr-eval
- **Deployment**: Vercel

## Setup Instructions

### 1. Prerequisites
- Node.js 18+ and npm
- Supabase account
- Vercel account (for deployment)

### 2. Environment Setup

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: OpenAI for transcription
OPENAI_API_KEY=your_openai_key

# Optional: Vercel for custom domains
VERCEL_API_TOKEN=your_vercel_token
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_row_level_security.sql`

3. Enable Supabase Auth with email/password

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
/app                    # Next.js app router pages
  /api                  # API routes
  /builder              # Form builder pages
  /form                 # Public form viewing
/components
  /form-builder         # Builder components (drag-drop, palette, etc)
  /form-renderer        # Runtime form rendering
    /fields            # Individual field components
  /ui                   # Reusable UI components
/lib
  /engines             # Logic and calculation engines
  /stores              # Zustand stores
  /supabase            # Supabase client configuration
  /types               # TypeScript type definitions
/supabase
  /migrations          # Database schema migrations
```

## Key Components

### FormBuilder
The main builder interface with drag-and-drop functionality, field palette, and property panel.

### FormRenderer
Renders forms at runtime with validation, logic, calculations, and submission handling.

### Matrix Field
Specialized component for line-item entry with automatic calculations, perfect for quotes and estimates.

### Logic Engine
Evaluates conditional rules to show/hide fields, set values, and control requirements.

### Calculation Engine
Processes formulas with support for aggregations (sum, avg), math operations, and field references.

## Usage

### Creating a Form
1. Navigate to `/builder/new`
2. Drag fields from the palette to the canvas
3. Configure field properties in the right panel
4. Set up logic rules and calculations
5. Preview and test your form
6. Publish when ready

### Embedding Forms
Forms can be embedded on any website:
```html
<script src="https://yourapp.com/embed.js" data-form="form-id"></script>
```

### Webhook Integration
Configure webhooks to receive submissions:
- Payload includes all form data, UTM parameters, and metadata
- HMAC-SHA256 signature for security
- Automatic retries with exponential backoff

## Database Schema

The application uses a comprehensive schema with:
- Organizations for multi-tenancy
- Forms with versioning support
- Submissions with denormalized data for queries
- Webhooks with delivery tracking
- Audio recordings and transcriptions
- Custom domains configuration

## Security

- Row Level Security (RLS) on all tables
- JWT-based authentication
- API key encryption for integrations
- CSRF protection on submissions
- XSS prevention with sanitization

## Performance

- Virtualized rendering for large matrices (100+ rows)
- Debounced validation and autosave
- Lazy loading of heavy components
- GIN indexes for JSONB queries
- Optimized bundle splitting

## Deployment

### Vercel Deployment

```bash
npm run build
vercel --prod
```

Set environment variables in Vercel dashboard.

### Supabase Edge Functions

Deploy webhook handler and PDF generator:
```bash
supabase functions deploy webhook-dispatch
supabase functions deploy pdf-render
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT