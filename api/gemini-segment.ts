const Netlify = { env: { get(name: string) { return process.env[name]; } } };

const SEGMENT_PROMPT = `You are transcribing one short segment of a university lecture audio recording.
Transcribe the spoken words faithfully and accurately as clean natural prose or structured lecture paragraphs.
Fix obvious automatic speech recognition errors, punctuation, and technical terminology, and remove meaningless filler noise while keeping the speaker's actual wording and clinical/technical meaning intact.
Preserve all definitions, mechanisms, lists, examples, numbers, clinical pearls, drug names, anatomy, and caveats mentioned in the audio.
If the audio segment is silent or contains only noise, return an empty string for transcript.
If the audio is partially unclear, transcribe only what is clearly audible and mark unclear parts as [unclear] phonetically. Do not invent missing words.
Output only valid JSON matching the schema with a concise transcript and detected language.`;

const SEGMENT_SCHEMA = {
  type: 'object',
  properties: {
    transcript: { type: 'string' },
    detectedLanguage: { type: 'string' }
  },
  required: ['transcript', 'detectedLanguage']
};

const ALLOWED_AUDIO_TYPES = new Set([
  'audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/wav', 'audio/webm',
  'audio/ogg', 'audio/aac', 'audio/flac', 'audio/aiff', 'audio/opus'
]);

const DEFAULT_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-3-flash-preview'];

function getModelList() {
  const configured = (Netlify.env.get('LECTUREFLOW_GEMINI_MODELS') || '').split(',').map((s) => s.trim()).filter(Boolean);
  return configured.length ? configured : DEFAULT_MODELS;
}

function bytesToBase64(bytes: Uint8Array) {
  const chunks: string[] = [];
  const sliceSize = 0x8000;
  for (let i = 0; i < bytes.length; i += sliceSize) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + sliceSize)));
  }
  return btoa(chunks.join(''));
}

function normalizeMimeType(raw: string) {
  const base = String(raw || 'audio/mpeg').split(';')[0].trim().toLowerCase();
  if (base === 'audio/mp3') return 'audio/mpeg';
  if (base === 'audio/x-m4a' || base === 'audio/mp4') return 'audio/m4a';
  if (base === 'audio/x-wav') return 'audio/wav';
  return base || 'audio/mpeg';
}

export async function POST(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const apiKey = Netlify.env.get('LECTUREFLOW_GEMINI_API_KEY');
  if (!apiKey) return Response.json({ error: 'Gemini API key is not configured.' }, { status: 503 });

  const contentType = (req.headers.get('content-type') || '').toLowerCase();
  const url = new URL(req.url);
  let audioBase64 = '';
  let mimeType = 'audio/mpeg';
  let segment = 1;
  let totalSegments = 1;
  let subject = 'Medicine';
  let title = 'Untitled lecture';
  let lectureDate = '';
    let attempt = 0;
  
  if (contentType.startsWith('audio/') || contentType.startsWith('application/octet-stream')) {
    const rawBytes = new Uint8Array(await req.arrayBuffer());
    if (!rawBytes.byteLength) return Response.json({ error: 'Missing segment audio.' }, { status: 400 });
    if (rawBytes.byteLength > 3_500_000) return Response.json({ error: 'Segment audio is too large.' }, { status: 413 });
    audioBase64 = bytesToBase64(rawBytes);
    mimeType = normalizeMimeType(contentType.startsWith('audio/') ? contentType : (url.searchParams.get('mimeType') || 'audio/mpeg'));
    segment = Math.max(1, Number(url.searchParams.get('segment') || 1));
    totalSegments = Math.max(segment, Number(url.searchParams.get('totalSegments') || segment));
    subject = String(url.searchParams.get('subject') || 'Medicine').slice(0, 80);
    title = String(url.searchParams.get('title') || 'Untitled lecture').slice(0, 180);
    lectureDate = String(url.searchParams.get('date') || '').slice(0, 20); attempt = Math.max(0, Number(url.searchParams.get('attempt') || 0));
  } else {
    let body: any;
    try { body = await req.json(); } catch { return Response.json({ error: 'Invalid request body.' }, { status: 400 }); }
    audioBase64 = String(body?.audioBase64 || '').replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
    mimeType = normalizeMimeType(body?.mimeType || 'audio/mpeg');
    segment = Math.max(1, Number(body?.segment || 1));
    totalSegments = Math.max(segment, Number(body?.totalSegments || segment));
    subject = String(body?.subject || 'Medicine').slice(0, 80);
    title = String(body?.title || 'Untitled lecture').slice(0, 180);
    lectureDate = String(body?.date || '').slice(0, 20); attempt = Math.max(0, Number(body?.attempt || 0));
  }

  if (!audioBase64) return Response.json({ error: 'Missing segment audio.' }, { status: 400 });
  if (!ALLOWED_AUDIO_TYPES.has(mimeType)) return Response.json({ error: `Unsupported audio type: ${mimeType}` }, { status: 415 });
  if (audioBase64.length > 5_200_000) return Response.json({ error: 'Segment audio is too large.' }, { status: 413 });

  const prompt = `Subject: ${subject}\nTitle: ${title}\nDate: ${lectureDate || 'Unspecified'}\nSegment: ${segment} of ${totalSegments}\n\n${SEGMENT_PROMPT}`;
  const baseModels = getModelList(); const offset = attempt % baseModels.length; const rotated = [...baseModels.slice(offset), ...baseModels.slice(0, offset)]; const models = rotated.slice(0, 2);
  let lastMessage = 'Gemini is temporarily unavailable.';
  const attemptedModels: string[] = [];

  for (let index = 0; index < models.length; index++) {
    const model = models[index];
    attemptedModels.push(model);
    try   {    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST', headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(20000), body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: audioBase64 } }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: SEGMENT_SCHEMA } }) }); const data = await upstream.json().catch(() => null); if (upstream.ok && data) { const rawText = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || '').join('') || ''; let parsed: any = null; try { parsed = JSON.parse(rawText); } catch {} const transcript = String(parsed?.transcript || (parsed ? '' : rawText)).trim(); const detectedLanguage = String(parsed?.detectedLanguage || 'unknown').trim() || 'unknown'; if (parsed && typeof parsed.transcript === 'string') { console.log('gemini-segment completed:', { segment, totalSegments, model, attempt, chars: parsed.transcript.trim().length }); return Response.json({ transcript: parsed.transcript.trim(), detectedLanguage, model, segment, totalSegments }); } if (transcript) { console.log('gemini-segment completed:', { segment, totalSegments, model, attempt, chars: transcript.length }); return Response.json({ transcript, detectedLanguage, model, segment, totalSegments }); } lastMessage = 'Gemini returned empty transcript.'; console.error('gemini-segment model failed:', { segment, model, status: upstream.status, message: lastMessage }); } else { lastMessage = data?.error?.message || `Gemini returned HTTP ${upstream.status}.`; console.error('gemini-segment model failed:', { segment, model, status: upstream.status, message: lastMessage }); const retryable = upstream.status === 429 || upstream.status >= 500 || /high demand|overload|unavailable|resource exhausted|try again|capacity/i.test(lastMessage); if (!retryable) return Response.json({ error: lastMessage, attemptedModels }, { status: 502 }); } } catch (err: any) { lastMessage = err?.message || 'Gemini request timed out.'; console.error('gemini-segment model failed:', { segment, model, status: 0, message: lastMessage }); }
      
  if (index < models.length - 1) await new Promise(resolve => setTimeout(resolve, 500 * (index + 1)));
  }

  return Response.json({ error: lastMessage, attemptedModels }, { status: 503 });
}
