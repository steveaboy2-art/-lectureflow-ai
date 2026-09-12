const Netlify = { env: { get(name: string) { return process.env[name]; } } };

export async function GET(req: Request) {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = Netlify.env.get('LECTUREFLOW_GEMINI_API_KEY');

  return Response.json({
    ok: Boolean(apiKey),
    provider: 'Gemini API direct',
    model: 'gemini-3.8-flash',
    fallbacks: ['gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite']
  });
}
