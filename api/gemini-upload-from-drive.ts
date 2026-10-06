const Netlify = { env: { get(name: string) { return process.env[name]; } } };

const CHUNK_SIZE = 8 * 1024 * 1024;
const DRIVE_FILE_URL = (id: string) =>
  'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(id) + '?alt=media';

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

async function startGeminiUpload(apiKey: string, fileName: string, mimeType: string, size: number) {
  const r = await fetch('https://generativelanguage.googleapis.com/upload/v1beta/files', {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(size),
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ file: { display_name: String(fileName || 'lecture-audio').slice(0, 140) } })
  });
  if (!r.ok) {
    const detail = (await r.text()).slice(0, 1500);
    throw new Error(`Gemini upload init failed — HTTP ${r.status}: ${detail}`);
  }
  const uploadUrl = r.headers.get('x-goog-upload-url');
  if (!uploadUrl) throw new Error('Gemini did not return an upload URL.');
  return uploadUrl;
}

async function uploadToGemini(uploadUrl: string, bytes: ArrayBuffer, size: number) {
  let offset = 0;
  const data = new Uint8Array(bytes);
  while (offset < size) {
    const end = Math.min(offset + CHUNK_SIZE, size);
    const chunk = data.slice(offset, end);
    const finalChunk = end === size;
    const r = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Offset': String(offset),
        'X-Goog-Upload-Command': finalChunk ? 'upload, finalize' : 'upload',
        'Content-Length': String(chunk.byteLength)
      },
      body: chunk
    });
    const text = await r.text();
    if (!r.ok) throw new Error(`Gemini audio upload failed — HTTP ${r.status}: ${text.slice(0, 1200)}`);
    if (finalChunk) {
      try { return JSON.parse(text); }
      catch { throw new Error('Gemini finished the upload but returned an unreadable response.'); }
    }
    const next = Number(r.headers.get('x-goog-upload-offset') || '');
    if (!Number.isFinite(next) || next <= offset) {
      throw new Error('Gemini returned an invalid upload offset.');
    }
    offset = next;
  }
  throw new Error('Audio upload did not finish.');
}

export async function POST(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const apiKey = Netlify.env.get('LECTUREFLOW_GEMINI_API_KEY');
  if (!apiKey) return jsonError('Gemini API key is not configured.', 503);

  let body: any;
  try { body = await req.json(); } catch { return jsonError('Invalid request.'); }

  const accessToken = String(body?.accessToken || '');
  const fileId = String(body?.fileId || '');
  const fileName = String(body?.fileName || 'lecture-audio');
  const mimeType = String(body?.mimeType || 'audio/mpeg').toLowerCase();
  const size = Number(body?.size || 0);

  if (!accessToken || !fileId) return jsonError('Google Drive connection is required.');
  if (!Number.isFinite(size) || size <= 0 || size > 1024 * 1024 * 1024) return jsonError('Invalid audio file size.');

  let driveResponse: Response | null = null;
  try {
    driveResponse = await fetch(DRIVE_FILE_URL(fileId), {
      headers: { Authorization: 'Bearer ' + accessToken }
    });
    if (!driveResponse.ok) {
      const detail = (await driveResponse.text()).slice(0, 1000);
      throw new Error(`Could not download the temporary audio from Google Drive — HTTP ${driveResponse.status}: ${detail}`);
    }

    const bytes = await driveResponse.arrayBuffer();
    if (bytes.byteLength !== size) {
      throw new Error(`Temporary audio size mismatch (${bytes.byteLength} bytes received, ${size} expected).`);
    }

    const uploadUrl = await startGeminiUpload(apiKey, fileName, mimeType, size);
    const uploaded = await uploadToGemini(uploadUrl, bytes, size);
    const fileInfo = uploaded?.file || uploaded;

    if (!fileInfo?.uri) throw new Error('Gemini uploaded the audio but did not return a file reference.');

    return Response.json({ file: fileInfo });
  } catch (err: any) {
    console.error('Drive-to-Gemini upload failed:', err?.message || err);
    return jsonError(err?.message || 'Could not upload the lecture audio.', 502);
  } finally {
    // Remove the temporary Drive copy after Gemini has received it (or after a failure).
    try {
      await fetch('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(fileId), {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + accessToken }
      });
    } catch {}
  }
}
