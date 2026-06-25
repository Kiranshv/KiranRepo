# ContentForge

ContentForge is a Vercel-hostable Next.js 14 dashboard for AI-assisted content operations. Groq handles topic and content generation, Supabase stores rows and logs, Supabase Storage stores generated images, and Vercel Cron triggers only the text-generation pipeline.

## Stack

- Next.js 14 App Router
- React + TypeScript strict mode
- Tailwind CSS
- groq-sdk for topic and content generation
- @supabase/supabase-js for Postgres and Storage
- @google/genai for Gemini image generation
- Hugging Face inference API for optional image generation
- react-markdown for article rendering
- exceljs for optional export only

## Local development

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and fill in the keys.

3. Run the Supabase schema in [supabase/schema.sql](supabase/schema.sql).

4. Start the app:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Environment variables

Use the variables listed in [.env.example](.env.example). Important notes:

- `SUPABASE_SERVICE_ROLE_KEY` is server-side only.
- `IMAGE_PROVIDER` sets the default image provider globally.
- The dashboard can override image provider per request.
- Gemini may still fail if billing or quota is not enabled. The app handles that failure gracefully.

## Supabase setup

1. Create a Supabase project.
2. Run [supabase/schema.sql](supabase/schema.sql) in the SQL editor.
3. Create a Storage bucket named `content-images`.
4. Make the bucket public, or adjust the URL strategy if you prefer signed URLs.

## Pipeline behavior

- `POST /api/run` triggers topic and content generation only.
- The pipeline writes one topic plus LinkedIn, Medium, Instagram, YouTube, and Dev.to content into Supabase.
- The pipeline stops at `ReadyForImages`.
- Image generation is manual from the dashboard.
- Publishing is manual from the dashboard.

## Image providers

- Gemini and Hugging Face are both supported.
- The default provider comes from `IMAGE_PROVIDER`.
- The dashboard lets the user override the provider per image generation request.
- If you use Gemini, prefer `GEMINI_IMAGE_MODEL=gemini-2.5-flash-image` unless you have explicitly validated a newer image-preview model for your key.
- Gemini often needs billing or quota enablement.
- Hugging Face free usage is better suited to occasional image generation.

## Vercel deployment

1. Push the repository to GitHub.
2. Import the `social_ai_agent` project into Vercel.
3. Set all environment variables in Vercel.
4. Deploy.

## Cron behavior

- [vercel.json](vercel.json) schedules `POST /api/run` at `0 4 * * *`.
- Vercel cron runs in UTC unless your project-level configuration says otherwise.
- The cron job generates content only. It does not generate images.

## Publishing caveats

- LinkedIn publishing requires app and token setup. The current structure publishes text cleanly and leaves room for richer media support later.
- Dev.to publishing uses an API key and defaults to draft-friendly behavior.

## Useful routes

- `GET /api/status`
- `GET /api/today`
- `GET /api/calendar`
- `POST /api/run`
- `POST /api/images/generate`
- `POST /api/publish/linkedin`
- `POST /api/publish/devto`
- `GET /api/export`
