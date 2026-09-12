const Netlify = { env: { get(name: string) { return process.env[name]; } } };

const NOTES_SCHEMA = {
  type: 'object',
  properties: {
    transcript: { type: 'string' },
    summary: { type: 'string' },
    revisionNotes: { type: 'string' },
    fullNotes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          h: { type: 'string' },
          p: { type: 'string' }
        },
        required: ['h', 'p']
      }
    },
    professor: { type: 'array', items: { type: 'string' } },
    mustKnow: { type: 'array', items: { type: 'string' } },
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          q: { type: 'string' },
          a: { type: 'string' }
        },
        required: ['q', 'a']
      }
    },
    viva: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          q: { type: 'string' },
          a: { type: 'string' }
        },
        required: ['q', 'a']
      }
    },
    mcqs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          q: { type: 'string' },
          options: {
            type: 'array',
            items: { type: 'string' }
          },
          answer: { type: 'string' },
          explanation: { type: 'string' }
        },
        required: ['q', 'options', 'answer', 'explanation']
      }
    },
    confusingAreas: {
      type: 'array',
      items: { type: 'string' }
    },
    topicsToReadMore: {
      type: 'array',
      items: { type: 'string' }
    }
  },
  required: [
    'transcript',
    'summary',
    'revisionNotes',
    'fullNotes',
    'professor',
    'mustKnow',
    'questions',
    'viva',
    'mcqs',
    'confusingAreas',
    'topicsToReadMore'
  ]
};

const STUDY_PROMPT = `You are LectureFlow, an expert MBBS lecture study assistant.

Listen to the entire medical college lecture recording and transform ONLY what is actually taught into accurate, detailed study material. The student's goal is to study the same day's lectures and stay fully caught up.

IMPORTANT RULES:
- Do not produce a shallow summary. Preserve all medically relevant content and teaching points.
- Follow the lecturer's logical order in the detailed notes.
- Remove filler words, classroom chatter, administrative talk, and irrelevant repetition.
- Repetition that signals emphasis should be captured under Professor Emphasized.
- Never invent a fact and pretend the lecturer said it.
- If the audio is genuinely unclear, write [Unclear in recording].
- Expand abbreviations only when the meaning is clear from context.
- Keep medical terminology accurate, but make explanations readable for an MBBS student.
- If the lecturer corrects themselves, use the corrected statement.
- Do not add textbook material that was not taught except for a very brief clarification needed to make the lecturer's point understandable; label that clarification as such.

OUTPUT:
1. transcript: a cleaned, readable transcript preserving the lecture's substance.
2. summary: a concise overview of everything covered.
3. revisionNotes: a 5-10 minute high-yield revision sheet.
4. fullNotes: detailed lecture-order notes with clear headings. Include definitions, classifications, mechanisms/pathogenesis, clinical features, investigations, treatment, complications and clinical examples whenever the lecturer discusses them.
5. professor: points explicitly stressed, repeated, called important, or framed as likely exam/viva points.
6. mustKnow: the highest-yield facts from this lecture.
7. questions: exactly 10 short-answer active-recall questions with answers.
8. viva: exactly 5 viva-style questions with concise model answers.
9. mcqs: exactly 5 single-best-answer MCQs, each with 4 options, the correct answer, and a short explanation.
10. confusingAreas: concepts from THIS lecture that are easy to confuse, clarified briefly.
11. topicsToReadMore: items the lecturer mentioned but did not fully explain, suitable for later textbook reading.`;

export async function POST(req: Request) {
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

  const fileUri = String(body?.fileUri || '');
  const mimeType = String(body?.mimeType || 'audio/mpeg');
  const subject = String(body?.subject || 'Medicine').slice(0, 80);
  const title = String(body?.title || 'Untitled lecture').slice(0, 180);
  const lectureDate = String(body?.date || '').slice(0, 20);

  if (!fileUri.startsWith('https://') && !fileUri.startsWith('http://')) {
    return Response.json(
      { error: 'Missing Gemini file URI.' },
      { status: 400 }
    );
  }

  const prompt =
    `Subject: ${subject}\n` +
    `Lecture title: ${title}\n` +
    `Lecture date: ${lectureDate}\n\n` +
    STUDY_PROMPT;

  const endpoint =
    'https://generativelanguage.googleapis.com/v1beta/interactions';

  const upstream = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gemini-3.8-flash',
      input: [
        {
          type: 'text',
          text: prompt
        },
        {
          type: 'audio',
          uri: fileUri,
          mime_type: mimeType
        }
      ],
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: NOTES_SCHEMA
      }
    })
  });

  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    console.error('Gemini interaction start failed:', {
      status: upstream.status,
      data
    });

    return Response.json(
      {
        error:
          data?.error?.message ||
          'Gemini could not start processing.',
        detail: data
      },
      { status: 502 }
    );
  }

  return Response.json({
    interactionId: data.id,
    status: data.status || 'in_progress'
  });
}
