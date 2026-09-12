declare const Netlify: { env: { get(name: string): string | undefined } };

export default async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  const apiKey = Netlify.env.get('GEMINI_API_KEY');
  const baseUrl = Netlify.env.get('GOOGLE_GEMINI_BASE_URL');
  if (!apiKey || !baseUrl) return Response.json({ error: 'Netlify AI Gateway is unavailable.' }, { status: 503 });

  const url = new URL(req.url);
  const name = url.searchParams.get('name') || '';
  if (!/^files\/[a-z0-9-]+$/i.test(name)) return Response.json({ error: 'Invalid file name.' }, { status: 400 });

  const upstream = await fetch(`${baseUrl.replace(/\/$/, '')}/v1beta/${name}`, { headers: { 'x-goog-api-key': apiKey } });
  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) return Response.json({ error: data?.error?.message || 'Could not check the uploaded audio.' }, { status: 502 });
  return Response.json({ state: data.state || 'ACTIVE', mimeType: data.mimeType || null, uri: data.uri || null });
};

export const config = {
  path: '/api/gemini-file-status',
  rateLimit: { windowLimit: 180, windowSize: 60, aggregateBy: 'ip' }
};
