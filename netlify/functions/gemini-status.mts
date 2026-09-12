declare const Netlify: { env: { get(name: string): string | undefined } };

function extractOutput(interaction: any) {
  const texts: string[] = [];
  for (const step of interaction?.steps || []) {
    if (step?.type !== 'model_output') continue;
    for (const part of step?.content || []) {
      if (part?.type === 'text' && typeof part.text === 'string') texts.push(part.text);
    }
  }
  return texts.join('\n').trim();
}

export default async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 });

  const apiKey = Netlify.env.get('GEMINI_API_KEY');
  const baseUrl = Netlify.env.get('GOOGLE_GEMINI_BASE_URL');
  if (!apiKey || !baseUrl) return Response.json({ error: 'Netlify AI Gateway is unavailable.' }, { status: 503 });

  const url = new URL(req.url);
  const interactionId = url.searchParams.get('id') || '';
  if (!/^v1_[A-Za-z0-9_-]+$/.test(interactionId)) return Response.json({ error: 'Invalid interaction ID.' }, { status: 400 });

  const endpoint = `${baseUrl.replace(/\/$/, '')}/v1beta/interactions/${encodeURIComponent(interactionId)}`;
  const upstream = await fetch(endpoint, { headers: { 'x-goog-api-key': apiKey } });
  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) return Response.json({ error: data?.error?.message || 'Could not check Gemini processing.', detail: data }, { status: 502 });

  if (data.status === 'completed' || data.status === 'incomplete') {
    const raw = extractOutput(data);
    try {
      return Response.json({ status: data.status, result: JSON.parse(raw), usage: {
        inputTokens: data.total_input_tokens || null,
        outputTokens: data.total_output_tokens || null,
        totalTokens: data.total_tokens || null
      }});
    } catch {
      return Response.json({ status: 'failed', error: 'Gemini finished but returned unreadable study notes.', raw: raw.slice(0, 1000) }, { status: 502 });
    }
  }

  if (['failed', 'cancelled', 'budget_exceeded'].includes(data.status)) {
    return Response.json({ status: data.status, error: data?.error?.message || `Processing ended with status: ${data.status}` });
  }

  return Response.json({ status: data.status || 'in_progress' });
};

export const config = {
  path: '/api/gemini-status',
  rateLimit: { windowLimit: 180, windowSize: 60, aggregateBy: 'ip' }
};
