const Netlify = { env: { get(name: string) { return process.env[name]; } } };

const NOTES_SCHEMA = {
  type: 'object',
  properties: {
    transcript: { type: 'string' },
    summary: { type: 'string' },
    revisionNotes: { type: 'string' },
    lectureNotes: {
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
    'lectureNotes',
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

const STUDY_PROMPT = `You are LectureFlow, an expert MBBS lecture study assistant and medical note editor.

Your job is NOT to summarize the audio chronologically. First understand the entire lecture, identify its teaching structure, then turn it into a coherent, exam-useful MBBS study note.

CORE PRINCIPLE:
Create two layers without mixing them:
A) WHAT WAS TAUGHT — faithful to the lecture.
B) MBBS STUDY STRUCTURE — organize and lightly clarify the taught material so it becomes easier to learn and revise.

Never fabricate something the professor said. Never make a textbook fact look like lecture content.

NOTE QUALITY RULES:
- Do not produce a shallow summary or transcript disguised as notes.
- Preserve medically important facts, explanations, examples, reasoning, comparisons, mechanisms, and clinical correlations actually taught.
- Reorganize material when needed for clarity. Do not blindly follow the order in which the professor spoke.
- Remove filler, greetings, classroom management, unrelated conversation, and meaningless repetition.
- Keep meaningful repetition or emphasis and capture it under Professor Emphasized.
- Prefer clear MBBS-style headings and subheadings.
- Use concise paragraphs for explanations and bullets for lists, classifications, features, investigations, treatment steps, complications, criteria, and other naturally list-like material.
- Do not turn every sentence into a bullet.
- Use tables conceptually when comparing entities, but represent the information as readable text because the output schema uses headings and paragraphs.
- Preserve important numbers, cut-offs, drug names, doses, durations, anatomical relations, staging/classification details, and named signs only when they are actually present in the lecture or clearly supported by the lecture context.
- If audio is unclear, write [Unclear in recording] rather than guessing.
- Expand abbreviations only when the meaning is clear.
- If the lecturer corrects themselves, use the corrected version.
- Correct obvious transcription errors using medical context, but do not invent missing content.

TEXTBOOK / MBBS FRAMEWORK:
- The subject and lecture title should guide the expected undergraduate structure.
- Organize notes according to standard MBBS learning logic: definition/background → classification → anatomy/physiology or pathogenesis → clinical features → diagnosis/investigations → management → complications/prognosis, ONLY when relevant to the topic.
- Do NOT add large blocks of textbook information that were not taught.
- If a tiny clarification is essential to understand something the lecturer taught, include it only when highly reliable and phrase it as a clarification, not as something the professor said.
- Put material that the lecturer mentioned but did not teach in depth into topicsToReadMore.
- The final notes should feel like high-quality class notes that are structured for MBBS exams, not like a generic internet article.

LECTURE NOTES:
- This is a separate, first-class section containing ONLY what was actually taught in the lecture.
- Do not add textbook facts, background knowledge, or inferred details that were not taught.
- Preserve the professor's explanations, examples, clinical reasoning, terminology, sequence of concepts, and meaningful emphasis.
- Reorganize for readability, but do not expand beyond the lecture.
- Remove greetings, filler, classroom management, unrelated discussion, and meaningless repetition.
- If a statement is unclear in the audio, write [Unclear in recording] rather than guessing.
- Make these notes detailed enough that a student can review exactly what happened in class without replaying the recording.
- This section must never present textbook supplementation as if the professor taught it.

FULL NOTES:
- Build a coherent set of detailed study notes from the entire lecture.
- Start with the central topic and progress through its important subtopics.
- Combine repeated explanations instead of repeating them.
- Preserve the professor's useful clinical reasoning.
- Include examples and clinical correlations when taught.
- Give extra space to concepts that are central to the lecture.
- Do not pad the notes merely to make them longer.
- Aim for completeness AND readability.

SUMMARY:
- Explain what the lecture covered in a compact overview.
- Mention the major concepts, not generic statements such as "the lecture discussed the topic."

REVISION NOTES:
- Make this genuinely useful for a 5–10 minute revision session.
- Prioritize definitions, classifications, mechanisms, hallmark findings, investigations, treatment principles, complications, and high-yield distinctions actually covered.
- Avoid repeating the full notes.

PROFESSOR:
- Include only things explicitly emphasized, repeated for importance, called important, linked to exams/viva, or strongly stressed through teaching.
- Do not manufacture exam predictions.

MUST KNOW:
- Select the highest-yield takeaways from THIS lecture.
- Keep them specific and medically useful.

QUESTIONS:
- Exactly 10 active-recall questions with answers.
- Questions should test understanding and retrieval, not trivial wording.
- Cover different parts of the lecture.

VIVA:
- Exactly 5 viva-style questions with concise, clinically accurate model answers.
- Prefer questions a medical student could realistically be asked after this lecture.

MCQS:
- Exactly 5 single-best-answer MCQs.
- Exactly 4 options each.
- Test important concepts from the lecture.
- Do not use trick questions or obscure facts not taught.
- Give the correct answer and a short explanation.

CONFUSING AREAS:
- Identify distinctions or concepts from this lecture that students are likely to mix up.
- Clarify the difference briefly and accurately.

TOPICS TO READ MORE:
- Only include topics that were mentioned, hinted at, or clearly left incomplete.
- Do not use this field as an excuse to dump unrelated textbook material.

OUTPUT:
1. transcript: cleaned readable transcript preserving the lecture's substance.
2. summary: coherent overview of the lecture.
3. revisionNotes: high-yield 5–10 minute revision sheet.
4. lectureNotes: faithful, detailed notes containing only what was taught in the lecture.
5. fullNotes: polished, detailed MBBS study notes using the textbook/MBBS framework while keeping lecture content and supplementation distinct.
6. professor: explicitly emphasized or exam/viva-signposted points.
7. mustKnow: highest-yield facts from this lecture.
8. questions: exactly 10 active-recall questions with answers.
9. viva: exactly 5 viva questions with concise model answers.
10. mcqs: exactly 5 four-option single-best-answer MCQs with explanations.
11. confusingAreas: likely confusions and brief clarifications.
11. topicsToReadMore: genuinely incomplete or deferred topics from the lecture.`;

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
  const transcript = String(body?.transcript || '');
  const mimeType = String(body?.mimeType || 'audio/mpeg');
  const subject = String(body?.subject || 'Medicine').slice(0, 80);
  const title = String(body?.title || 'Untitled lecture').slice(0, 180);
  const lectureDate = String(body?.date || '').slice(0, 20);

  if (!fileUri && !transcript) {
    return Response.json(
      { error: 'Missing Gemini file URI or lecture transcript.' },
      { status: 400 }
    );
  }
  if (transcript.length > 2500000) {
    return Response.json(
      { error: 'Lecture transcript is too large for final processing.' },
      { status: 413 }
    );
  }

  const prompt =
    `Subject: ${subject}\n` +
    `Lecture title: ${title}\n` +
    `Lecture date: ${lectureDate}\n\n` +
    STUDY_PROMPT +
    (transcript ? `\n\nSOURCE TRANSCRIPT FROM AUTOMATICALLY PROCESSED AUDIO SEGMENTS:\n${transcript}\n\nTreat the source transcript as the complete lecture source. Reconstruct the lecture coherently, preserve all medically meaningful teaching, and reconcile any duplicated or cut-off wording at segment boundaries without inventing content.` : '');

  const endpoint =
    'https://generativelanguage.googleapis.com/v1beta/interactions';

  const models = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite'
  ];

  const requestPayload = {
    input: transcript
      ? [{ type: 'text', text: prompt }]
      : [
          { type: 'text', text: prompt },
          { type: 'audio', uri: fileUri, mime_type: mimeType }
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
