declare const Netlify: { env: { get(name: string): string | undefined } };

export default async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  const apiKey = Netlify.env.get('GEMINI_API_KEY');
  const baseUrl = Netlify.env.get('GOOGLE_GEMINI_BASE_URL');
  return Response.json({
    ok: Boolean(apiKey && baseUrl),
    provider: 'Gemini via Netlify AI Gateway',
    model: 'gemini-3.8-flash'
  });
};

export const config = {
  path: '/api/gemini-health',
  rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: 'ip' }
};
