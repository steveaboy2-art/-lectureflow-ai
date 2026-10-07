const Netlify = { env: { get(name: string) { return process.env[name]; } } };

const SEGMENT_SCHEMA = { type:'object', properties:{ transcript:{type:'string'} }, required:['transcript'] };
const SEGMENT_PROMPT = `You are transcribing one sequential segment of an MBBS lecture for LectureFlow.
Return ONLY a cleaned, faithful transcript in the JSON field transcript.
- Preserve medically meaningful explanations, terminology, examples, reasoning, numbers, drug names, classifications and clinical points.
- Remove greetings, filler, classroom management and meaningless repetition.
- Do not summarize, add textbook facts, or infer missing content.
- Correct obvious medical transcription errors when the intended term is clear.
- If speech is genuinely unclear, write [Unclear in recording].
- This segment may begin or end in the middle of a sentence because the original lecture was split automatically. Do not invent missing words.
- Keep the transcript in the same language used by the lecturer unless the lecturer clearly switches language.`;

export async function POST(req: Request) {
  if(req.method!=='POST')return new Response('Method not allowed',{status:405});
  const apiKey=Netlify.env.get('LECTUREFLOW_GEMINI_API_KEY');
  if(!apiKey)return Response.json({error:'Gemini API key is not configured.'},{status:503});
  const url=new URL(req.url);
  let body:any={};
  let audioBase64='';
  let mimeType='audio/mp3';
  try{
    if((req.headers.get('content-type')||'').toLowerCase().includes('audio/')){
      const bytes=new Uint8Array(await req.arrayBuffer());
      if(!bytes.length)return Response.json({error:'Audio segment is missing.'},{status:400});
      if(bytes.length>1800000)return Response.json({error:'Audio segment is too large.'},{status:413});
      let binary='';const sliceSize=0x8000;
      for(let i=0;i<bytes.length;i+=sliceSize)binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+sliceSize,bytes.length)));
      audioBase64=Buffer.from(bytes).toString('base64');
      mimeType='audio/mp3';
      body={segment:url.searchParams.get('segment'),totalSegments:url.searchParams.get('totalSegments'),subject:url.searchParams.get('subject'),title:url.searchParams.get('title'),date:url.searchParams.get('date')};
    }else{
      body=await req.json();
      audioBase64=String(body?.audioBase64||'');
      mimeType='audio/mp3';
    }
  }catch{return Response.json({error:'Invalid audio request.'},{status:400})}
  const segment=Math.max(1,Number(body?.segment||1)),totalSegments=Math.max(segment,Number(body?.totalSegments||segment)),subject=String(body?.subject||'Medicine').slice(0,80),title=String(body?.title||'Untitled lecture').slice(0,180),lectureDate=String(body?.date||'').slice(0,20);
  if(!audioBase64||audioBase64.length>2500000)return Response.json({error:'Audio segment is missing or too large.'},{status:413});
  const prompt=`Subject: ${subject}\nLecture title: ${title}\nLecture date: ${lectureDate}\nSegment: ${segment} of ${totalSegments}\n\n${SEGMENT_PROMPT}`;
  const models=['gemini-3.8-flash','gemini-3.7-flash','gemini-3.6-flash','gemini-3.5-flash'];let lastMessage='Gemini is temporarily unavailable.';const attemptedModels:string[]=[];
  for(let index=0;index<models.length;index++){
    const model=models[index];attemptedModels.push(model);const upstream=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{method:'POST',headers:{'x-goog-api-key':apiKey,'Content-Type':'application/json'},body:JSON.stringify({model,input:[{type:'text',text:prompt},{type:'audio',data:audioBase64,mime_type:mimeType}],response_format:{type:'text',mime_type:'application/json',schema:SEGMENT_SCHEMA}})});const data=await upstream.json().catch(()=>({}));
    if(upstream.ok&&data.id)return Response.json({interactionId:data.id,status:data.status||'in_progress',model});
    lastMessage=data?.error?.message||data?.errors?.[0]?.message||data?.message||`Gemini returned HTTP ${upstream.status}.`;const retryable=upstream.status===429||upstream.status>=500||/high demand|overload|unavailable|resource exhausted|try again|capacity/i.test(lastMessage);if(!retryable)return Response.json({error:lastMessage,attemptedModels},{status:502});if(index<models.length-1)await new Promise(resolve=>setTimeout(resolve,500*(index+1)));
  }
  return Response.json({error:'Gemini is busy across all available Flash models.',detail:lastMessage,attemptedModels},{status:503});
}
