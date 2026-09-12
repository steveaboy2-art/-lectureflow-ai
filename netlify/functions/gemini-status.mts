declare const Netlify: { env: { get(name: string): string | undefined } };

function extractOutput(interaction: any) {
  const texts: string[] = [];

  for (const step of interaction?.steps || []) {
    if (step?.type !== 'model_output') continue;

    for (const part of step?.content || []) {
      if (part?.type === 'text' && typeof part.text === 'string') {
        texts.push(part.text);
      }
    }
  }

  return texts.join('\n').trim();
}

function getErrorMessage(data: any) {
  return (
    data?.error?.message ||
    data?.errors?.[0]?.message ||
    null
  );
}

export default async (req: Request) => {
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
  const interactionId = url.searchParams.get('id') || '';

  if (!/^[A-Za-z0-9_-]{3,300}$/.test(interactionId)) {
    return Response.json(
      { error: 'Invalid interaction ID.' },
      { status: 400 }
    );
  }

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/interactions/${encodeURIComponent(interactionId)}`;

  const upstream = await fetch(endpoint, {
    headers: {
      'x-goog-api-key': apiKey
    }
  });

  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    console.error('Gemini status request failed:', {
      status: upstream.status,
      data
    });

    return Response.json(
      {
        error:
          getErrorMessage(data) ||
          'Could not check Gemini processing.',
        detail: data
      },
      { status: 502 }
    );
  }

  if (data.status === 'completed' || data.status === 'incomplete') {
    const raw = extractOutput(data);

    try {
      return Response.json({
        status: data.status,
        result: JSON.parse(raw),
        usage: {
          inputTokens:
            data?.usage?.total_input_tokens ?? null,
          outputTokens:
            data?.usage?.total_output_tokens ?? null,
          totalTokens:
            data?.usage?.total_tokens ?? null
        }
      });
    } catch {
      console.error('Gemini returned unreadable JSON:', raw.slice(0, 1000));

      return Response.json(
        {
          status: 'failed',
          error: 'Gemini finished but returned unreadable study notes.',
          raw: raw.slice(0, 1000)
        },
        { status: 502 }
      );
    }
  }

  if (
    ['failed', 'cancelled', 'budget_exceeded'].includes(data.status)
  ) {
    return Response.json({
      status: data.status,
      error:
        getErrorMessage(data) ||
        `Processing ended with status: ${data.status}`
    });
  }

  return Response.json({
    status: data.status || 'in_progress'
  });
};

export const config = {
  path: '/api/gemini-status',
  rateLimit: {
    windowLimit: 180,
    windowSize: 60,
    aggregateBy: 'ip'
  }
};
