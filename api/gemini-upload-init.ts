const Netlify = { env: { get(name: string) { return process.env[name]; } } };

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

const MAX_CHUNK_SIZE = 2 * 1024 * 1024;

function cleanName(name: string) {
  return String(name || 'lecture-audio')
    .replace(/[\r\n\t]/g, ' ')
    .slice(0, 140);
}

function isValidGeminiUploadUrl(value: string) {
  try {
    const url = new URL(value);

    return (
      url.protocol === 'https:' &&
      url.hostname === 'generativelanguage.googleapis.com' &&
      url.pathname.startsWith('/upload/')
    );
  } catch {
    return false;
  }
}

async function relayUploadChunk(
  req: Request,
  uploadUrl: string
) {
  if (!isValidGeminiUploadUrl(uploadUrl)) {
    return Response.json(
      { error: 'Invalid Gemini upload URL.' },
      { status: 400 }
    );
  }

  const offset = Number(
    req.headers.get('x-lectureflow-upload-offset') || '0'
  );

  const finalChunk =
    req.headers.get('x-lectureflow-upload-final') === '1';

  if (!Number.isFinite(offset) || offset < 0) {
    return Response.json(
      { error: 'Invalid upload offset.' },
      { status: 400 }
    );
  }

  const bytes = await req.arrayBuffer();

  if (!bytes.byteLength) {
    return Response.json(
      { error: 'Empty audio chunk.' },
      { status: 400 }
    );
  }

  if (bytes.byteLength > MAX_CHUNK_SIZE) {
    return Response.json(
      { error: 'Audio chunk is too large.' },
      { status: 413 }
    );
  }

  const upstream = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Offset': String(offset),
      'X-Goog-Upload-Command':
        finalChunk
          ? 'upload, finalize'
          : 'upload'
    },
    body: bytes
  });

  const text = await upstream.text();

  if (!upstream.ok) {
    console.error('Gemini chunk upload failed:', {
      status: upstream.status,
      detail: text.slice(0, 1500)
    });

    return Response.json(
      {
        error:
          `Gemini audio upload failed — HTTP ${upstream.status}: ${text.slice(0, 1000)}`
      },
      { status: 502 }
    );
  }

  if (finalChunk) {
    try {
      return Response.json(JSON.parse(text));
    } catch {
      return Response.json(
        {
          error:
            'Gemini finished the upload but returned an unreadable response.'
        },
        { status: 502 }
      );
    }
  }

  return Response.json({
    ok: true,
    nextOffset: offset + bytes.byteLength
  });
}

export async function POST(req: Request) {
  if (req.method !== 'POST') {
    return new Response(
      'Method not allowed',
      { status: 405 }
    );
  }

  /*
   * MODE 1:
   * Relay an audio chunk from LectureFlow → Gemini.
   *
   * This avoids Safari directly calling Google's
   * resumable upload URL.
   */
  const relayUrl =
    req.headers.get('x-lectureflow-upload-url');

  if (relayUrl) {
    return relayUploadChunk(
      req,
      relayUrl
    );
  }

  /*
   * MODE 2:
   * Start a new Gemini resumable upload.
   */

  const apiKey =
    Netlify.env.get(
      'LECTUREFLOW_GEMINI_API_KEY'
    );

  if (!apiKey) {
    return Response.json(
      {
        error:
          'Gemini API key is not configured.'
      },
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

  const size =
    Number(body?.size || 0);

  const fileName =
    cleanName(body?.fileName);

  let mimeType =
    String(
      body?.mimeType ||
      'audio/mpeg'
    ).toLowerCase();

  // Normalize Apple / Safari MIME types
  if (
    mimeType === 'audio/x-m4a' ||
    mimeType === 'audio/mp4' ||
    fileName
      .toLowerCase()
      .endsWith('.m4a')
  ) {
    mimeType = 'audio/m4a';
  }

  if (
    mimeType === 'audio/x-wav'
  ) {
    mimeType = 'audio/wav';
  }

  if (
    !Number.isFinite(size) ||
    size <= 0
  ) {
    return Response.json(
      {
        error:
          'Missing audio file size.'
      },
      { status: 400 }
    );
  }

  if (
    size >
    1024 * 1024 * 1024
  ) {
    return Response.json(
      {
        error:
          'Audio file is too large.'
      },
      { status: 413 }
    );
  }

  if (
    !ALLOWED_AUDIO_TYPES.has(
      mimeType
    )
  ) {
    return Response.json(
      {
        error:
          `Unsupported audio type: ${mimeType}`
      },
      { status: 415 }
    );
  }

  const endpoint =
    'https://generativelanguage.googleapis.com/upload/v1beta/files';

  const upstream =
    await fetch(
      endpoint,
      {
        method: 'POST',
        headers: {
          'x-goog-api-key':
            apiKey,

          'X-Goog-Upload-Protocol':
            'resumable',

          'X-Goog-Upload-Command':
            'start',

          'X-Goog-Upload-Header-Content-Length':
            String(size),

          'X-Goog-Upload-Header-Content-Type':
            mimeType,

          'Content-Type':
            'application/json'
        },

        body: JSON.stringify({
          file: {
            display_name:
              fileName
          }
        })
      }
    );

  if (!upstream.ok) {
    const detail =
      (
        await upstream.text()
      ).slice(0, 1500);

    console.error(
      'Gemini upload init failed:',
      {
        status:
          upstream.status,
        detail
      }
    );

    return Response.json(
      {
        error:
          `Gemini upload failed — HTTP ${upstream.status}: ${detail}`
      },
      { status: 502 }
    );
  }

  const uploadUrl =
    upstream.headers.get(
      'x-goog-upload-url'
    );

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
    mimeType,
    chunkSize:
      MAX_CHUNK_SIZE
  });
}
