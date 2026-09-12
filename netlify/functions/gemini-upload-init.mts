declare const Netlify: { env: { get(name: string): string | undefined } };

const ALLOWED_AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/m4a',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'audio/aac',
  'audio/flac',
  'audio/aiff',
  'audio/opus'
]);

function cleanName(name: string) {
  return String(name || 'lecture-audio')
    .replace(/[\r\n\t]/g, ' ')
    .slice(0, 140);
}

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = Netlify.env.get('LECTUREFLOW_GEMINI_API_KEY');

  if (!apiKey) {
    return Response.json(
      { error: 'Gemini API key is not configured.' },
      { status: 503 }
    );
  }

  let body: any;

  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: 'Invalid request.' },
      { status: 400 }
    );
  }

  const size = Number(body?.size || 0);
  const fileName = cleanName(body?.fileName);

  let mimeType = String(
    body?.mimeType || 'audio/mpeg'
  ).toLowerCase();

  // Normalize Apple / browser MIME types
  if (
    mimeType === 'audio/x-m4a' ||
    mimeType === 'audio/mp4' ||
    fileName.toLowerCase().endsWith('.m4a')
  ) {
    mimeType = 'audio/m4a';
  }

  if (mimeType === 'audio/x-wav') {
    mimeType = 'audio/wav';
  }

  if (!Number.isFinite(size) || size <= 0) {
    return Response.json(
      { error: 'Missing audio file size.' },
      { status: 400 }
    );
  }

  if (size > 1024 * 1024 * 1024) {
    return Response.json(
      { error: 'Audio file is too large.' },
      { status: 413 }
    );
  }

  if (!ALLOWED_AUDIO_TYPES.has(mimeType)) {
    return Response.json(
      { error: `Unsupported audio type: ${mimeType}` },
      { status: 415 }
    );
  }

  const endpoint =
    'https://generativelanguage.googleapis.com/upload/v1beta/files';

  const upstream = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(size),
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      file: {
        display_name: fileName
      }
    })
  });

  if (!upstream.ok) {
    const detail = (await upstream.text()).slice(0, 1500);

    console.error('Gemini upload init failed:', {
      status: upstream.status,
      detail
    });

    return Response.json(
      {
        error:
          `Gemini upload failed — HTTP ${upstream.status}: ${detail}`
      },
      { status: 502 }
    );
  }

  const uploadUrl =
    upstream.headers.get('x-goog-upload-url');

  if (!uploadUrl) {
    return Response.json(
      {
        error:
          'Gemini accepted the request but did not return an upload URL.'
      },
      { status: 502 }
    );
  }

  return Response.json({
    uploadUrl,
    mimeType
  });
};

export const config = {
  path: '/api/gemini-upload-init',
  rateLimit: {
    windowLimit: 20,
    windowSize: 60,
    aggregateBy: 'ip'
  }
};
