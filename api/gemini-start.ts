const Netlify = { env: { get(name: string) { return process.env[name]; } } };

const NOTES_SCHEMA = {
  type: 'object',
  properties: {
    transcript: { type: 'string' },
    summary: { type: 'string' },
    revisionNotes: { type: 'string' },
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
    },
    textbookReference: { type: 'string' }
  },
  required: [
    'transcript',
    'summary',
    'revisionNotes',
    'lectureOnlyNotes',
    'fullNotes',
    'professor',
    'mustKnow',
    'questions',
    'viva',
    'mcqs',
    'confusingAreas',
    'topicsToReadMore',
    'textbookReference'
  ]
};

const SUBJECT_TEXTBOOKS = {
  'Anatomy':'B.D. Chaurasia’s Human Anatomy',
  'Physiology':'Guyton and Hall Textbook of Medical Physiology',
  'Biochemistry':'D.M. Vasudevan Textbook of Biochemistry for Medical Students; Lippincott Illustrated Reviews: Biochemistry',
  'Pathology':'Ramadas Nayak’s Textbook of Pathology; Robbins & Cotran Pathologic Basis of Disease',
  'Pharmacology':'K.D. Tripathi Essentials of Medical Pharmacology',
  'Microbiology':'Apurba Sastry Essentials of Medical Microbiology',
  'Forensic Medicine & Toxicology':'Reddy’s The Essentials of Forensic Medicine and Toxicology',
  'General Medicine':'Davidson’s Principles and Practice of Medicine',
  'General Surgery':'Bailey & Love’s Short Practice of Surgery; S. Das A Manual on Clinical Surgery',
  'Ophthalmology':'A.K. Khurana Comprehensive Ophthalmology',
  'ENT':'Dhingra Diseases of Ear, Nose and Throat',
  'Pediatrics':'Ghai Essential Pediatrics',
  'Orthopedics':'Maheshwari & Mhaskar Essential Orthopaedics',
  'Dermatology':'IADVL Textbook of Dermatology',
  'Psychiatry':'standard undergraduate psychiatry reference',
  'Obstetrics':'Dutta’s Textbook of Obstetrics',
  'Gynaecology':'Dutta’s Textbook of Gynaecology'
};

const SUBJECT_STUDY_STYLE = {
'Anatomy':'Build from applied anatomy and relations to clinical relevance; cover boundaries, attachments, relations, blood supply, nerve supply, lymphatics and applied anatomy when relevant.',
'Physiology':'Explain normal mechanisms as a connected cause-and-effect story; emphasize regulation, graphs, relationships, normal values and clinical correlation.',
'Biochemistry':'Connect pathways to substrates, enzymes, regulation, energetics and clinical significance; emphasize rate-limiting steps and important clinical correlations.',
'Pathology':'Use definition → etiology → pathogenesis → morphology → clinical features → investigations → complications/prognosis when appropriate. Give pathogenesis enough depth for exam writing.',
'Pharmacology':'Organize by class and prototype, then mechanism → effects → uses → adverse effects → contraindications/precautions → interactions; emphasize important comparisons and rational combinations.',
'Microbiology':'Use organism → morphology/classification → virulence/pathogenesis → disease → specimen/diagnosis → treatment/prevention; preserve laboratory principles.',
'Forensic Medicine & Toxicology':'Use medico-legal definitions, findings, interpretation and management where applicable; for poisons cover source, mechanism, clinical features, diagnosis and specific management.',
'General Medicine':'Use definition/etiology → pathophysiology → clinical presentation → examination → investigations → diagnosis/differentials → management → complications and follow-up.',
'General Surgery':'Use definition/etiology → pathology → clinical presentation → examination → investigations → diagnosis → treatment/operative options → complications, with relevant anatomy.',
'Ophthalmology':'Build from anatomy/physiology when needed, then definition, classification, etiopathogenesis, symptoms/signs, examination, investigations, diagnosis, management and complications; distinguish similar ocular conditions.',
'ENT':'Organize by site and clinical presentation; cover anatomy, etiology/pathogenesis, symptoms, signs, examination, investigations, diagnosis, treatment and complications.',
'Pediatrics':'Consider age-specific presentation, growth/development, pediatric examination, investigations, management and complications; include prevention when relevant.',
'Orthopedics':'Use mechanism/etiology → anatomy/pathology → clinical features/examination → imaging → classification → management → complications.',
'Dermatology':'Describe morphology, distribution and evolution first, then etiology/pathogenesis, diagnosis, differentials and treatment.',
'Psychiatry':'Use definition/classification → etiological factors → psychopathology → clinical features → assessment/diagnosis → management → prognosis.',
'Obstetrics':'Use pregnancy-specific reasoning: definition → risk factors/etiology → pathophysiology → maternal/fetal features → assessment/investigations → management by gestational context → complications.',
'Gynaecology':'Use definition → etiology/pathogenesis → symptoms/signs → examination → investigations → diagnosis/differentials → medical/surgical management → complications.',
'Other':'Use the standard undergraduate MBBS structure most appropriate to the topic.'
};
const STUDY_PROMPT = `You are LectureFlow, an expert MBBS lecture study assistant.

The student's goal is to study what was taught in class every day using coherent, standard MBBS-level notes. Listen to the ENTIRE lecture before composing the final material.

CORE NOTE PHILOSOPHY:
- The MAIN NOTES must read like a well-written, continuous MBBS study note, not a collection of disconnected bullet points.
- Preserve the lecturer's teaching sequence and emphasis, but reorganize only when needed to make the explanation flow naturally.
- Use substantial explanatory paragraphs for concepts, mechanisms and clinical reasoning. Use bullets/tables only when they genuinely improve readability (classifications, lists, differentials, criteria, drug groups, etc.).
- Avoid excessive interruptions, tiny fragments, and repetitive headings. Prefer a small number of meaningful headings with connected paragraphs underneath.
- The main notes should be detailed enough for serious MBBS study, while remaining focused on the lecture.
- Integrate definitions, anatomy, physiology, pathogenesis/mechanisms, clinical features, investigations, diagnosis, management, complications and clinical correlations whenever relevant to the topic and taught or needed for a coherent explanation.
- Do not turn the main notes into a transcript.

TEXTBOOK ALIGNMENT:
- The primary standard MBBS reference for this subject is: SUBJECT_TEXTBOOK.
- Use that textbook framework to organize terminology, classifications and the expected undergraduate depth.
- Follow the subject-specific study framework supplied with the request; do not use the same generic template for every subject.
- If reliable textbook-level knowledge is available, add essential missing background needed to make the lecture understandable, but clearly mark it as “Textbook clarification” when it was not taught.
- Never claim that a specific textbook or page was consulted unless it actually was.
- Never invent page numbers, quotations, chapter numbers or citations.
- Do not let textbook material overwhelm or replace the lecturer's content.
- If the lecture conflicts with standard textbook knowledge, preserve what the lecturer taught in the lecture notes but flag the discrepancy as “Check with standard textbook” rather than silently presenting the conflict as settled fact.
- Keep the content appropriate to the Indian undergraduate MBBS curriculum.

LECTURE FIDELITY:
- Remove filler words, classroom chatter, administrative talk and irrelevant repetition.
- Repetition that signals emphasis should be captured under Professor Emphasized.
- Never invent a fact and pretend the lecturer said it.
- If audio is genuinely unclear, write [Unclear in recording].
- If the lecturer corrects themselves, use the corrected statement.
- Expand abbreviations only when meaning is clear from context.

OUTPUT:
1. transcript: cleaned, readable transcript preserving the lecture's substance.
2. summary: concise overview of everything covered.
3. revisionNotes: a 5-10 minute high-yield revision sheet.
4. lectureOnlyNotes: a separate, strictly lecture-derived section. This is NOT the textbook-enhanced notes. Include only facts, explanations, examples, classifications, clinical points and emphasis that were actually stated or clearly taught in the recording. Clean up speech and remove filler, but do not add outside knowledge, textbook facts, inferred details or corrections. Preserve the lecturer’s sequence as much as practical. If the lecture is unclear, write [Unclear in recording] rather than guessing. Use a small number of meaningful headings and connected paragraphs. This section is the source-of-truth for “what was said/taught in the lecture.”
5. fullNotes: detailed, coherent MBBS study notes. Make this the longest and most readable section. Use meaningful headings and connected paragraphs; avoid unnecessary bulleting. Include essential textbook clarification only when useful, labelled clearly.
6. professor: points explicitly stressed, repeated, called important, or framed as likely exam/viva points.
7. mustKnow: highest-yield facts from this lecture.
8. questions: exactly 10 short-answer active-recall questions with answers.
9. viva: exactly 5 viva-style questions with concise model answers.
10. mcqs: exactly 5 single-best-answer MCQs, each with 4 options, the correct answer, and a short explanation.
11. confusingAreas: concepts from THIS lecture that are easy to confuse, clarified briefly.
12. topicsToReadMore: items suitable for later textbook reading.
13. textbookReference: the standard reference used for the subject, exactly as supplied above.`;

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
    `Standard MBBS reference: ${SUBJECT_TEXTBOOKS[subject] || 'standard undergraduate MBBS reference'}\n` +
    `Subject-specific study framework: ${SUBJECT_STUDY_STYLE[subject] || SUBJECT_STUDY_STYLE.Other}\n\n` +
    STUDY_PROMPT.replace('SUBJECT_TEXTBOOK', SUBJECT_TEXTBOOKS[subject] || 'standard undergraduate MBBS reference');

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
