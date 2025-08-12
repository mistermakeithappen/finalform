- We want to make sure we don't frivelously create extra databases when we could be utilizing existing databases for the function we're trying to build. only create new tables if needed.
I want you to build without asking permission according to this plan.
Final Form – Software Requirements Specification (SRS) & Technical Design

Goal: A production-ready, enterprise-grade drag‑and‑drop form builder that handles any and every situation or business need. Back end on Supabase (Postgres + Auth + Storage + Edge Functions), front end on Next.js deployed to Vercel. Must support rich question types (including matrix/line‑items with add row), UTM capture & autofill, standard contact fields, conditional logic, calculations, webhooks-on-submit, and modular extensibility.

⸻

1) Product Scope & Use Cases

Primary Use Cases
	•	Form creation: Non-technical users build forms via drag‑and‑drop. They can add standard contact fields and construction‑specific components (materials, measurements, labor, quantities, costs).
	•	Conditional workflows: Show/hide fields or sections by logic (e.g., “If project type = roofing, show shingle matrix”).
	•	Line‑item matrix: Add rows dynamically for products/services with columns like SKU, description, unit, length/width/height, quantity, unit cost, extended cost. Totals auto‑calculate.
	•	Prefill via UTM: On load, read UTM params (utm_source, etc.) + any custom query params and map to fields.
	•	Submit via webhook: On submission, POST normalized JSON to one or more destinations + store in Supabase.
	•	Embedding: Forms can be embedded on client sites (script tag / iframe) with responsive layout and theme controls.
	•	Audit/versioning: Editing a live form creates a new version; submissions retain version metadata.

Non‑Goals (for v1)
	•	Full visual report builder (export CSV/JSON is sufficient v1).
	•	Native mobile apps (PWA is acceptable).

⸻

2) Architecture Overview
	•	Front end: Next.js 14+ App Router, TypeScript, Tailwind, shadcn/ui for primitives. Client + server components. Deployed on Vercel.
	•	Back end: Supabase Postgres for data, Row Level Security, Auth (email magic link + OAuth optional), Storage (images/files), Edge Functions (webhook relay, PDF export, calculations), Realtime for builder multi‑user collaboration (v2).
	•	API layer: Next.js Route Handlers for signed calls; Supabase Edge Functions for public/secured endpoints (webhook relay, export).
	•	State: Client state via Zustand or Redux Toolkit. Form runtime uses a declarative JSON schema.
	•	Schema format: JSON Schema–inspired with custom keywords for UI & logic.

Diagram (high level):

[Client (Form Builder + Runtime)] ⇄ [Next.js API Routes] ⇄ [Supabase (DB, Auth, Storage, Edge)] ⇄ [External Webhooks]


⸻

3) Data Model (Postgres)

3.1 Tables
	•	organizations: multitenancy root.
	•	projects: optional grouping (e.g., “Roofing Division”).
	•	forms: form metadata (name, slug, status, theme, owner, current_version_id).
	•	form_versions: immutable JSON schema snapshots per publish.
	•	fields: (optional) catalog of reusable field presets.
	•	submissions: persisted submission envelopes (one row per submit).
	•	submission_items: denormalized key/values for querying (GIN on JSONB also).
	•	webhooks: per form endpoint configs with secrets & retry policy.
	•	audit_logs: changes & publish events.
	•	file_objects: references to Supabase Storage uploads (e.g., jobsite photos).
	•	org_integrations: per‑org API keys/settings (includes BYO OpenAI key).
	•	domains: per‑org custom domains + verification status for published forms.
	•	recordings: audio session metadata for field‑level and meeting‑level recordings.
	•	transcriptions: results and status of Whisper jobs mapped to fields/submissions.
	•	pdf_exports: metadata for generated PDFs per submission with storage path + signed URL cache.

3.2 Suggested SQL (abridged)

create table org_integrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  provider text not null check (provider in ('openai')),
  -- store cipher text; decrypt server-side only (KMS/env secret)
  api_key_cipher text not null,
  created_at timestamptz default now(),
  unique(org_id, provider)
);

create table domains (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  hostname text not null,             -- e.g., forms.acme.com
  status text not null default 'pending' check (status in ('pending','verifying','active','failed')),
  verification_token text not null,   -- for DNS TXT
  created_at timestamptz default now(),
  unique(org_id, hostname)
);

create table recordings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  form_id uuid references forms(id) on delete cascade,
  form_version_id uuid references form_versions(id),
  submission_id uuid references submissions(id),
  field_key text,                 -- nullable: whole-meeting recording
  kind text check (kind in ('field','meeting')) not null,
  storage_path text not null,     -- Supabase Storage path
  duration_seconds int,
  mime_type text,
  created_at timestamptz default now()
);

create table transcriptions (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid references recordings(id) on delete cascade,
  status text not null check (status in ('queued','processing','succeeded','failed')),
  provider text not null default 'openai-whisper-1',
  language text,                  -- ISO code when known
  text longtext,                  -- transcription result (can be large)
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

alter table submissions add column pdf_export_id uuid references pdf_exports(id);

create table pdf_exports (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  storage_path text not null,
  signed_url text,                 -- cached signed URL (short TTL)
  signed_url_expires_at timestamptz,
  created_at timestamptz default now()
);

create index on transcriptions(status);
create index on recordings(form_id, field_key);

3.3 Storage Buckets
	•	audio: audio/{org_id}/{form_id}/{submission_id}/{recording_id}.webm (or wav/m4a per browser capability).
	•	pdfs: pdfs/{org_id}/{form_id}/{submission_id}.pdf.

3.4 RLS (Row Level Security)
	•	Enable RLS on all tenant tables. Policy: user must belong to organizations via org_users join table.
	•	Public form rendering uses an anonymous role with read access to form_versions for status='published' only.
	•	Submissions + recordings insertable by anonymous role only for published forms.
	•	org_integrations readable/writable only by org admins; api_key_cipher never exposed to clients.

-- Only org members can see forms
create policy org_read on forms for select using (
  auth.jwt() ->> 'org_id' = org_id::text
);
-- Anonymous can read published form versions
create policy public_forms on form_versions for select using (
  exists (select 1 from forms f where f.id = form_id and f.status = 'published')
);
-- Anonymous can insert submissions and related recordings
create policy anon_submit on submissions for insert with check (
  exists (select 1 from forms f where f.id = form_id and f.status = 'published')
);

4.2 Field Node (common)

{
  "id": "f_firstName",
  "type": "text",
  "label": "First Name",
  "key": "firstName",             
  "placeholder": "John",
  "required": true,
  "validation": {"minLength": 1, "maxLength": 100},
  "grid": {"col": 6},
  "helpText": "",
  "visibility": {"when": null},
  "default": "",
  "meta": {"category":"contact"}
}

4.3 Matrix (Line‑Item) Field

{
  "id": "f_matrix_products",
  "type": "matrix",
  "key": "lineItems",
  "label": "Materials & Labor",
  "columns": [
    {"key":"sku", "label":"SKU", "type":"text", "width": 2},
    {"key":"desc", "label":"Description", "type":"text", "width": 4},
    {"key":"unit", "label":"Unit", "type":"select", "options":["EA","LF","SF","CY"], "width":1},
    {"key":"length", "label":"Length (ft)", "type":"number", "precision":2, "width":1},
    {"key":"width", "label":"Width (ft)", "type":"number", "precision":2, "width":1},
    {"key":"qty", "label":"Qty", "type":"number", "precision":2, "width":1},
    {"key":"unitCost", "label":"Unit Cost", "type":"currency", "width":2},
    {"key":"ext", "label":"Ext.", "type":"currency", "width":2, "readonly":true}
  ],
  "allowAddRow": true,
  "rowDefault": {"qty":1},
  "rowCalc": "ext = (qty ?? 0) * (unitCost ?? 0)",
  "footer": {"showTotals": true, "sum": ["ext"]}
}

4.4 Logic Rule

{
  "when": {"field":"projectType", "op":"=", "value":"Roofing"},
  "actions": [
    {"type":"show", "target":"f_matrix_products"}
  ]
}

4.5 Calculation (Global)

{
  "name":"grandTotal",
  "formula":"sum(lineItems[].ext) * (1 + (taxRate/100))",
  "outputs":[{"target":"f_total","format":"currency"}]
}


⸻

5) Front‑End Application (Next.js)

5.1 Packages & Stack
	•	TypeScript, Tailwind, shadcn/ui, React Hook Form + Zod for validation, DnD kit for drag‑and‑drop, Zustand store, lucide-react icons.
	•	Form runtime renders from schema; builder manipulates schema graph.
	•	Audio/Recording: use MediaRecorder API for browser capture; fallback notice for unsupported browsers.

5.2 Modules
	•	Builder: palette (field types), canvas (grid), properties panel, logic editor, calculation editor, preview, versioning & publish.
	•	Runtime: fast rendering, debounced validation, autosave (optional), file upload, UTM prefill, analytics events.
	•	Embed SDK: lightweight script to mount a form in any page, postMessage bridge for height and events.
	•	Admin: org settings, users, webhooks, themes, API keys (OpenAI BYO), custom domains.

5.3 Key Components
	•	FormRenderer(schema): maps nodes → inputs; supports matrix, section, group, repeater.
	•	LogicEngine: evaluates rules on state changes.
	•	CalcEngine: safe expression evaluator (e.g., expr-eval) sandboxed.
	•	WebhookClient: signs payloads and retries.
	•	Recorder: inline mic control for text/textarea fields to capture short dictations; Meeting Recorder floating widget for long recordings that persist across pages until stopped.

5.4 UTM/Prefill Handling
	•	On mount, read location.search → parse UTMs + custom params.
	•	Map via schema.prefill.utm and schema.prefill.query into initial form state.
	•	Store raw UTM in hidden submission envelope.

5.5 Whisper Transcription UX
	•	Each text/textarea shows a mic button. Press → record until stop; upload chunk or final file to Storage; kick off server transcription; when complete, replace/append text into that input.
	•	Meeting Recorder (global) continues recording while the user completes the form; upon stop, transcription is attached to a designated long‑text field (configurable default like meetingNotes).
	•	If no OpenAI key on the org, mic buttons show a tooltip “Add OpenAI key to enable transcription” and link to Settings → Integrations.

5.6 Accessibility & i18n
	•	WCAG 2.1 AA: labels, aria‑describedby, focus states, keyboard DnD.
	•	RTL support; translation messages file.
	•	WCAG 2.1 AA: labels, aria‑describedby, focus states, keyboard DnD.
	•	RTL support; translation messages file.

⸻

6) Back End (Supabase)

6.1 Auth & Multitenancy
	•	org_users table links users ↔ org with role: owner, admin, editor, viewer.
	•	RLS policies restrict by JWT org_id claim.

6.2 Edge Functions
	•	/submit: receives signed runtime payload (optional), validates against schema, writes to submissions, enqueues webhook jobs, enqueues PDF render.
	•	/webhook-dispatch: worker that pulls jobs, POSTs with HMAC signature: X-Form-Signature: sha256=....
	•	/export: CSV/JSON export with field key headers; supports matrix flattening.
	•	/transcribe: accepts recording_id, fetches file from Storage, decrypts org OpenAI key server-side, calls OpenAI Whisper (audio.transcriptions.create), writes transcriptions row, updates linked field/submission.
	•	/pdf-render: renders submission into a branded PDF (headless chrome or a server renderer), stores in pdfs bucket, caches signed URL in pdf_exports.

6.3 Storage
	•	Bucket audio/{...} with size limits & MIME checks; pdfs/{...} for exports.

6.4 Secrets & BYO OpenAI Key
	•	Org admins save their OpenAI API key in Settings. Back end encrypts before storing (api_key_cipher). Keys are retrieved server-side only inside Edge Functions and never exposed to the client.
	•	If no key is present, /transcribe responds 400 with actionable error. Front end surfaces a settings link.

6.5 RLS Examples (pseudo)

-- Anonymous can insert recordings related to a published form
create policy anon_record on recordings for insert with check (
  exists (select 1 from forms f where f.id = form_id and f.status = 'published')
);


⸻

7) Submission Payload & Webhooks

7.1 Envelope (example)

{
  "formId": "a3b1…",
  "formVersion": 3,
  "submittedAt": "2025-08-11T02:34:12Z",
  "client": {"ip":"203.0.113.4","ua":"Mozilla/5.0"},
  "utm": {"source":"google","campaign":"roofing-summer","medium":"cpc"},
  "answers": {
    "firstName":"John",
    "lastName":"Doe",
    "email":"john@example.com",
    "projectType":"Roofing",
    "lineItems":[
      {"sku":"SH-30","desc":"Shingles","unit":"SF","qty":25,"unitCost":120,"ext":3000}
    ],
    "meetingNotes": "(transcribed text)",
    "total": 3210
  },
  "artifacts": {
    "pdfUrl": "https://…signed…/submission.pdf",
    "recordings": [
      {"fieldKey":"meetingNotes","url":"https://…/audio/…webm","transcriptionId":"…"}
    ]
  }
}

7.2 Webhook Delivery
	•	Method: POST JSON
	•	Headers: Content-Type: application/json, X-Form-Id, X-Form-Version, X-Form-Signature: sha256=HMAC(body, secret)
	•	Retry: exponential backoff (30s, 2m, 10m, 1h, 6h), DLQ after max.
	•	Signing: consumers must verify timestamp ±5 minutes & signature.
	•	PDF Link: artifacts.pdfUrl included; regenerated signed URL if expired on retry.
	•	Recording Links: include Storage signed URLs (short TTL) or pre-signed download tokens.
	•	Signing: consumers must verify timestamp ±5 minutes & signature.
	•	PDF Link: artifacts.pdfUrl included; regenerated signed URL if expired on retry.
	•	Recording Links: include Storage signed URLs (short TTL) or pre-signed download tokens.
	•	Signing: consumers must verify timestamp ±5 minutes & signature.

⸻

8) Builder UX Requirements
	•	Palette of field types: text, textarea, email, phone, address (with components), number, currency, select, multiselect, radio, checkbox, date/time, file upload, signature pad, rating, toggle, slider, hidden, HTML block, matrix/line‑item, section, repeater.
	•	Audio toggle per field: in field inspector, enable/disable inline recording; choose append vs replace behavior for transcription.
	•	Meeting Recorder target: select which field stores the full meeting transcript.
	•	Drag‑place into grid; resize by columns; reorder by DnD.
	•	Inspector tabs: General, Validation, Logic, Prefill, Calc, Appearance, Advanced, Recording (sample rate, max duration), Integrations (requires OpenAI key).
	•	Logic editor: if/then builder with AND/OR groups.
	•	Calculation editor: formula builder with field picker and functions (sum, avg, min, max, len, round, etc.).
	•	Preview & test: switch device sizes; test UTMs; generate test submission; test voice transcription with mock mode.
	•	Versioning: Save draft, Publish → creates new form_versions row.
	•	Theme: brand color, accent, fonts, spacing, input styles, logo.

9) Runtime & Validation
	•	Zod schemas generated from JSON definition.
	•	Client‑side + server‑side validation on submit.
	•	Large matrices use virtualized rows. Add row action animates and focuses first cell.
	•	Calculations run deterministically; cycles detected at build time.

⸻

10) Embedding & SDK
	•	Script tag: <script src="https://cdn.example.com/embed.js" data-form="{formId}"></script>
	•	Auto‑height with postMessage to parent.
	•	prefill via URL params; add data-utm=true to capture UTMs.
	•	Events: onReady, onChange, onSubmit, onHeight, onTranscriptionStart/Complete.
	•	Public Access: Published forms are publicly accessible via org domain or platform default domain.

10.1 Custom Domains
	•	Org can add a domain (e.g., forms.acme.com). System presents DNS instructions:
	•	Create CNAME forms.acme.com → cname.vercel-dns.com (or A/AAAA records as required by Vercel).
	•	Create TXT _vercel=… (verification token from domains.verification_token).
	•	Backend calls Vercel Domains API to add + verify. Status tracked in domains.status.
	•	Routing: Next.js middleware resolves org by host header.

11) Security, Compliance, Reliability
	•	CSRF protection on submit route; CORS allowlist per form.
	•	XSS prevention: sanitize HTML blocks; escape outputs; strict Content Security Policy.
	•	File scanning (optional queue) for uploads.
	•	PII handling: encrypt at rest (Postgres + KMS), field‑level masks.
	•	Audit trail for schema edits and webhook deliveries.
	•	Rate limiting per IP on submissions; bot detection (hCaptcha optional).
	•	GDPR/CCPA: data export & delete per submission.

⸻

12) Observability & Analytics
	•	Structured logs in Edge Functions.
	•	Metrics: views, starts, completion rate, field drop‑off, transcription success rate/duration, audio rejection counts.
	•	Error tracking (Sentry). Performance budgets (First Input Delay < 100ms on runtime).

13) Deployment & Environments
	•	Envs: Dev, Staging, Prod. Separate Supabase projects.
	•	Vercel preview deployments per PR. Protected prod env vars.
	•	Supabase migrations with dbmate or supabase db push on CI.

⸻

14) API Endpoints (Next.js / Edge Functions)
	•	GET /api/forms/:slug → published schema + version.
	•	POST /api/forms/:id/submit → server validates & upserts submission; returns receipt.
	•	POST /functions/v1/webhook-dispatch → internal.
	•	GET /api/forms/:id/submissions?limit=… (auth required).

Request/Response (submit)

POST /api/forms/123/submit
Content-Type: application/json

{
  "version": 3,
  "utm": {"source":"google","medium":"cpc"},
  "answers": {"firstName":"John", "lineItems":[{"sku":"X","qty":2,"unitCost":10,"ext":20}]}
}

{"status":"ok","submissionId":"…","receivedAt":"…"}


⸻

15) Performance Considerations
	•	Lazy‑load heavy components (matrix, file, signature, recorder) via dynamic import.
	•	Virtualized table for matrix (e.g., react-virtuoso) for >200 rows.
	•	Debounced autosave; minimal re‑renders via field‑level controllers.
	•	Use Postgres JSONB + GIN for flexible querying; denormalize hot fields into submission_items for analytics.
	•	Audio processing happens server-side; client uploads are chunked to reduce memory pressure.
	•	Background queues for transcription and PDF renders; user sees status and can submit without waiting.

16) Testing Strategy
	•	Unit: logic engine, calc engine, validators, schema transforms.
	•	Integration: submit path, RLS, webhook signing & retries (with mocked endpoints).
	•	E2E: Cypress for builder + runtime + embed flows.
	•	Load: k6 test 200 RPS sustained form submissions.

⸻

17) Developer Setup (Step‑by‑Step)
	1.	pnpm create next-app@latest (TypeScript, App Router).
	2.	Install deps: @supabase/supabase-js zod react-hook-form @dnd-kit/core zustand lucide-react date-fns tailwindcss recordrtc (optional for better cross-browser capture).
	3.	Init Tailwind + shadcn/ui; configure theme tokens.
	4.	Configure Supabase project & .env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, service role for Edge Functions.
	5.	Apply SQL schema & RLS; seed demo form.
	6.	Implement FormRenderer (start with core types + matrix).
	7.	Implement LogicEngine + CalcEngine (pure functions + tests).
	8.	Build Builder UI (palette → canvas → inspector → preview → publish).
	9.	Runtime route /api/forms/:id/submit with Zod validation; store to DB; enqueue webhook job; enqueue PDF render.
	10.	Edge Function webhook-dispatch with retries + HMAC.
	11.	Edge Function transcribe → integrate OpenAI Whisper using org key.
	12.	Edge Function pdf-render → generate and store PDF, return signed URL.
	13.	Embed SDK + example site page.
	14.	Custom domain flow + host-based routing.
	15.	Deploy to Vercel; set envs; run migrations in CI.

18) Construction‑Specific Field Presets (Starter Library)
	•	Project Type (select): Roofing, Siding, Windows, Concrete, Landscaping, Electrical, Plumbing, Remodel.
	•	Location Measurements: length/width/height, area calculator, pitch selector.
	•	Material Picker: shingles, underlayment, nails, flashing, gutters, concrete mix, rebar, wire gauge, pipe size.
	•	Labor Lines: trade role, hours, rate, overtime.
	•	Site Photos: multi‑file with camera capture.
	•	Permits/Inspections: yes/no + dates.
	•	Client Signature: signature pad + date.

⸻

19) Roadmap (v1 → v2)
	•	v1: Core builder + runtime, matrix with totals, UTM prefill, webhooks, exports, embed, themes, auth & RLS.
	•	v1.1: Calculated PDFs (quote), conditional email notices, hCaptcha.
	•	v2: Realtime collaborative builder, role‑based approvals, payment fields (Stripe), partial saves, multi‑page forms.

⸻

20) Acceptance Criteria (v1)
	•	Create a form with contact fields + matrix; publish; embed; submit with >100 matrix rows smoothly.
	•	UTM params utm_source, utm_campaign, utm_medium captured & mapped to fields.
	•	Recording: Field-level mic creates a recording, Whisper transcription fills the field; Meeting Recorder produces a transcription into the designated field.
	•	BYO OpenAI: If org key is missing, UI prompts to add key; transcription endpoints reject with actionable error; with key present, transcription succeeds.
	•	Webhooks deliver within 60s with HMAC signature and retry on failures and include artifacts.pdfUrl.
	•	RLS prevents cross‑org data access; anonymous can only read published forms and submit.
	•	Custom domain can be added and verified; published form is reachable at org domain.
	•	A11y checks pass (axe). CLS < 0.05, TTI < 3s on mid‑tier mobile.

21) Open Questions
	•	Payment fields in v1 or v2? (If v1, add PCI‑compliant Stripe Elements.)
	•	Need WYSIWYG for PDF templating in v1? (Otherwise provide JSON→PDF function.)
	•	Do we support multi‑language forms at launch?

⸻

Appendix A – Example Matrix Calculation Flow
	1.	User edits a cell → field state updates.
	2.	CalcEngine reevaluates rowCalc for that row.
	3.	Column ext updates; footer sum(ext) recomputes.
	4.	Global grandTotal recalculates.

Appendix B – Example HMAC Verification (Node)

import crypto from 'crypto';
const ok = crypto.timingSafeEqual(
  Buffer.from(sigHeader.split('=')[1], 'hex'),
  crypto.createHmac('sha256', secret).update(body).digest()
);


⸻

Addendum A – Audio Transcription (OpenAI Whisper, BYO Key)

A.1 Goals
	•	Enable voice input for any text/textarea field via a mic button.
	•	Provide a Meeting Recorder that can capture a long recording across the whole form session until stopped.
	•	Use OpenAI Whisper for transcription when an org‑scoped BYO API key is present; show actionable prompts when absent.

A.2 Data Model Additions
	•	Tables: org_integrations, recordings, transcriptions (see SQL below), and pdf_exports for PDF links.
	•	Storage: Buckets audio/ and pdfs/.

create table if not exists org_integrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  provider text not null check (provider in ('openai')),
  api_key_cipher text not null,
  created_at timestamptz default now(),
  unique(org_id, provider)
);

create table if not exists recordings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  form_id uuid references forms(id) on delete cascade,
  form_version_id uuid references form_versions(id),
  submission_id uuid references submissions(id),
  field_key text,
  kind text check (kind in ('field','meeting')) not null,
  storage_path text not null,
  duration_seconds int,
  mime_type text,
  created_at timestamptz default now()
);

create table if not exists transcriptions (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid references recordings(id) on delete cascade,
  status text not null check (status in ('queued','processing','succeeded','failed')),
  provider text not null default 'openai-whisper-1',
  language text,
  text longtext,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists pdf_exports (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  storage_path text not null,
  signed_url text,
  signed_url_expires_at timestamptz,
  created_at timestamptz default now()
);

A.3 Front‑End UX
	•	Inline mic on text/textarea fields (toggle in field inspector). States: idle → recording → uploading → transcribing → done.
	•	Meeting Recorder floating control (start/stop, timer). On stop, attaches transcript to a configured long‑text field (default meetingNotes).
	•	If no OpenAI key: mic shows tooltip and a link to Settings → Integrations to add the key.

A.4 Edge Functions
	•	POST /transcribe: input recording_id. Pulls audio from Storage, decrypts org OpenAI key server‑side, calls Whisper, writes transcriptions.text, and updates bound field/submission.
	•	POST /pdf-render: render submission JSON → PDF (org theme), write to pdfs/, cache a signed URL.

A.5 Webhook Payload
	•	Include artifacts.pdfUrl and an array of { fieldKey, url, transcriptionId } for recordings with short‑TTL signed URLs.

A.6 Security & Limits
	•	Limit max recording duration (configurable, e.g., 2 hours) and file size.
	•	Never expose the OpenAI key to the client; decrypt only inside Edge Functions.

⸻

Addendum B – Custom Domains (Vercel)

B.1 Goals
	•	Published forms should be accessible on org‑owned domains (e.g., forms.acme.com) and the default platform domain.

B.2 Flow
	1.	Org adds a domain in Settings; backend generates a verification_token (DNS TXT).
	2.	User adds CNAME to Vercel + TXT with token per instructions.
	3.	Backend uses Vercel Domains API to verify. domains.status transitions to active.
	4.	Next.js middleware routes by host header to resolve org + form slug.

B.3 DNS Instructions (UI)
	•	CNAME forms.acme.com → cname.vercel-dns.com
	•	TXT _vercel=…token…

⸻

Addendum C – Builder/Runtime Enhancements
	•	Field Inspector gains Recording tab (enable mic, append vs replace, max duration).
	•	Admin Settings → Integrations page for BYO OpenAI key with status test.
	•	Embed SDK emits onTranscriptionStart/Complete events.

⸻

Acceptance Criteria – Additions
	•	Mic on a text field records, transcribes with Whisper, and fills the value when an org OpenAI key exists.
	•	Meeting Recorder persists across the session and writes its transcript to the configured field on stop.
	•	If key absent, UI offers a direct link to add it; transcription endpoints reject with helpful errors.
	•	Webhook payload includes a valid pdfUrl and recording references with short‑lived signed URLs.
	•	Custom domain can be verified and serves the published form.
- when doing conditional logic always base it off of labels not hidden values
- push to github: https://github.com/mistermakeithappen/finalform.git