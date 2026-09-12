const Netlify = { env: { get(name: string) { return process.env[name]; } } };

export async function GET(req: Request) {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = Netlify.env.get('LECTUREFLOW_GEMINI_API_KEY');

  if (!apiKey) {
    return Response.json(
      { error: 'Gemini API key is not configured.' },
      { status: 503 }
    );
  }

  const url = new URL(req.url);
  const name = url.searchParams.get('name') || '';

  if (!/^files\/[a-z0-9-]+$/i.test(name)) {
    return Response.json(
      { error: 'Invalid file name.' },
      { status: 400 }
    );
  }

  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${name}`,
    {
      headers: {
        'x-goog-api-key': apiKey
      }
    }
  );

  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    console.error('Gemini file status failed:', {
      status: upstream.status,
      data
    });

    return Response.json(
      {
        error: data?.error?.message || 'Could not check the uploaded audio.'
      },
      { status: 502 }
    );
  }

  return Response.json({
    state: data.state || 'ACTIVE',
    mimeType: data.mimeType || null,
    uri: data.uri || null
  });
}
