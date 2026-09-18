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
    lectureOnlyNotes: {
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
    'lectureOnlyNotes',
    'professor',
    'mustKnow',
    'questions',
    'viva',
    'mcqs',
    'confusingAreas',
    'topicsToReadMore'
  ]
};

const TEXTBOOK_GUIDANCE: Record<string, string> = {
  'Anatomy': 'B.D. Chaurasia’s Human Anatomy',
  'Physiology': 'Guyton and Hall Textbook of Medical Physiology',
  'Biochemistry': 'D.M. Vasudevan Textbook of Biochemistry for Medical Students; Lippincott Illustrated Reviews: Biochemistry',
  'Pathology': 'Ramadas Nayak’s Textbook of Pathology; Robbins & Cotran Pathologic Basis of Disease',
  'Pharmacology': 'K.D. Tripathi Essentials of Medical Pharmacology',
  'Microbiology': 'Apurba Sastry Essentials of Medical Microbiology',
  'Forensic Medicine & Toxicology': 'Reddy’s The Essentials of Forensic Medicine and Toxicology',
  'General Medicine': 'Davidson’s Principles and Practice of Medicine',
  'General Surgery': 'Bailey & Love’s Short Practice of Surgery; S. Das A Manual on Clinical Surgery',
  'Ophthalmology': 'A.K. Khurana Comprehensive Ophthalmology',
  'ENT': 'Dhingra Diseases of Ear, Nose and Throat',
  'Pediatrics': 'Ghai Essential Pediatrics',
  'Orthopedics': 'Maheshwari & Mhaskar Essential Orthopaedics',
  'Dermatology': 'IADVL Textbook of Dermatology',
  'Psychiatry': 'standard undergraduate psychiatry reference',
  'Obstetrics': 'Dutta’s Textbook of Obstetrics',
  'Gynaecology': 'Dutta’s Textbook of Gynaecology'
};

const STUDY_PROMPT = `You are LectureFlow, an expert MBBS lecture study assistant.

Listen to the entire medical college lecture recording and transform it into accurate, detailed MBBS study material. The student's goal is to study the same day's lectures and stay fully caught up.

The standard MBBS textbook framework for this subject is: ${TEXTBOOK_GUIDANCE['__SUBJECT__'] || 'the standard undergraduate curriculum'}. Use this framework to decide what essential textbook context belongs in Main Notes, but never pretend a textbook fact was spoken by the lecturer.

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
- Main Notes may add essential MBBS textbook context that connects or explains the lecture, but it must be clearly integrated as textbook/contextual clarification rather than falsely attributed to the lecturer.
- Do not fabricate page numbers, quotations, citations, editions, or claims that you personally consulted a textbook.
- Keep the lecture as the organizing spine of Main Notes; do not turn Main Notes into a generic textbook chapter.
- Prefer coherent explanatory paragraphs for mechanisms, pathogenesis, clinical reasoning and relationships. Use bullets/tables only when they improve recall or comparison.
- Preserve important definitions, classifications, mechanisms/pathogenesis, clinical features, investigations, treatment, complications, differentials and examples when they are taught or are essential to understand the lecture.

OUTPUT:
1. transcript: a cleaned, readable transcript preserving the lecture's substance.
2. summary: a concise overview of everything covered.
3. revisionNotes: a 5-10 minute high-yield revision sheet.
4. fullNotes: detailed, coherent lecture-order MBBS notes with meaningful headings only when the topic genuinely changes. The lecture is the foundation; add only essential textbook/contextual links needed for a complete undergraduate understanding. Explain mechanisms/pathogenesis and clinical reasoning properly when relevant. Do not make the notes artificially fragmented.
5. lectureOnlyNotes: a strict, source-faithful record of ONLY what the lecturer actually said or clearly taught. Do not add textbook facts, outside knowledge, inferred details, corrections, or missing links. Preserve the lecturer's sequence. Clean filler and repetition, but keep all medically relevant teaching. If a statement is genuinely unclear, write [Unclear in recording]. This section is the source of truth for what was taught in the lecture.
6. professor: ONLY points the lecturer explicitly stressed, repeated, highlighted, warned about, or framed as important/exam/viva material. Do not infer emphasis merely because a fact is medically important.
7. mustKnow: the highest-yield facts from this lecture.
8. questions: exactly 10 short-answer active-recall questions with answers.
9. viva: exactly 5 viva-style questions with concise model answers.
10. mcqs: exactly 5 single-best-answer MCQs, each with 4 options, the correct answer, and a short explanation.
11. confusingAreas: concepts from THIS lecture that are easy to confuse, with concise clarification. Keep the distinction faithful to the lecture and standard MBBS context.
12. topicsToReadMore: specific topics that were mentioned, assumed, or clearly left incomplete and would benefit from later textbook reading. Do not invent a long reading list.`;

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
    `Lecture date: ${lectureDate}\n` +
    `Primary MBBS textbook framework: ${TEXTBOOK_GUIDANCE[subject] || 'standard undergraduate MBBS curriculum'}\n\n` +
    STUDY_PROMPT.replace('\\${TEXTBOOK_GUIDANCE[\'__SUBJECT__\'] || \'the standard undergraduate curriculum\'}', TEXTBOOK_GUIDANCE[subject] || 'the standard undergraduate curriculum');

  const endpoint =
    'https://generativelanguage.googleapis.com/v1beta/interactions';

  const models = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite'
  ];

  const requestPayload = {
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
  };

  let lastMessage = 'Gemini is temporarily unavailable.';
  const attemptedModels: string[] = [];

  for (let index = 0; index < models.length; index++) {
    const model = models[index];
    attemptedModels.push(model);

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        ...requestPayload
      })
    });

    const data = await upstream.json().catch(() => ({}));

    if (upstream.ok && data.id) {
      return Response.json({
        interactionId: data.id,
        status: data.status || 'in_progress',
        model
      });
    }

    lastMessage =
      data?.error?.message ||
      data?.errors?.[0]?.message ||
      `Gemini returned HTTP ${upstream.status}.`;

    const retryable =
      upstream.status === 429 ||
      upstream.status === 500 ||
      upstream.status === 502 ||
      upstream.status === 503 ||
      upstream.status === 504 ||
      /high demand|overload|unavailable|resource exhausted|try again|capacity/i.test(lastMessage);

    console.error('Gemini model attempt failed:', {
      model,
      status: upstream.status,
      message: lastMessage,
      retryable
    });

    if (!retryable) {
      return Response.json(
        {
          error: lastMessage,
          attemptedModels
        },
        { status: 502 }
      );
    }

    if (index < models.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500 * (index + 1)));
    }
  }

  return Response.json(
    {
      error:
        'Gemini is busy across all available Flash models. Your audio is already uploaded—please tap Try again in a minute.',
      detail: lastMessage,
      attemptedModels
    },
    { status: 503 }
  );
}
