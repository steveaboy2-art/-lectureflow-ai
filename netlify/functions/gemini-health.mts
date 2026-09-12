declare const Netlify: { env: { get(name: string): string | undefined } };

export default async (req: Request) => {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = Netlify.env.get('LECTUREFLOW_GEMINI_API_KEY');

  return Response.json({
    ok: Boolean(apiKey),
    provider: 'Gemini API direct',
    model: 'gemini-3.8-flash'
  });
};

export const config = {
  path: '/api/gemini-health',
  rateLimit: {
    windowLimit: 60,
    windowSize: 60,
    aggregateBy: 'ip'
  }
};
