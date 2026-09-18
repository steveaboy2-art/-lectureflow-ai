# LectureFlow MBBS

A mobile-first web/PWA MVP for turning daily medical lectures into structured study material.

## What works now

- Responsive web-first/iPhone/iPad interface
- Today dashboard
- Audio file selection/upload flow
- Processing-state UI
- Lecture library with subject filters
- Full notes / revision / professor-emphasis tabs
- Active recall with hidden answers
- Knowledge states: Learned / Needs revision / Weak
- Same-day / next-day / 7-day / 30-day revision concept
- Global lecture search
- Study dashboard
- Local persistence via `localStorage`
- PWA shell (can be added to Home Screen)
- Supabase schema starter
- Server-side Gemini integration example

## Important

The included browser MVP intentionally uses **mock processing** after an audio upload. This makes the whole interface usable without exposing an AI key. To process real recordings, wire the upload button to a server endpoint that calls `server/gemini-proxy-example.mjs`.

Google's Gemini Files API supports media uploads including audio; large media should go through the Files API. Keep all Gemini credentials server-side.

## Run locally

The app is dependency-free. From this folder:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Suggested production architecture

1. **Frontend:** this app, hosted on Vercel/Netlify/Cloudflare Pages.
2. **Auth + DB + audio storage:** Supabase.
3. **AI processing:** serverless route / Node server calling Gemini.
4. **Automation (optional):** n8n/Make watches a Google Drive lecture-recordings folder and calls your processing endpoint.
5. **Google Docs export (optional):** Google Drive/Docs API after the note JSON is generated.

## Supabase

Create a Supabase project, open SQL editor, and run `supabase-schema.sql`.

The schema turns on Row Level Security and includes starter ownership policies. Before production, review policies and storage-bucket rules for your deployment.

## Gemini integration

`server/gemini-proxy-example.mjs` illustrates the intended separation:

- browser uploads recording to your backend/storage
- backend receives a private file path or signed URL
- backend uploads media to Gemini
- backend asks for structured JSON
- backend stores transcript, notes, emphasis, revision items and quiz questions in Supabase
- frontend only receives study data

The Gemini model name is an environment variable so you can change models without touching UI code.

## Next upgrade

Replace localStorage calls in `app.js` with a repository module using `@supabase/supabase-js`, then replace `processLectureDemo()` with a POST to your server endpoint.

