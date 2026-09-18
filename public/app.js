if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}

if ('caches' in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => caches.delete(key));
  });
}
const SUBJECT_GROUPS = {
  '1st Year MBBS':['Anatomy','Physiology','Biochemistry'],
  '2nd Year MBBS':['Pathology','Pharmacology','Microbiology','Forensic Medicine & Toxicology'],
  'Clinical / Final MBBS':['General Medicine','General Surgery','Ophthalmology','ENT','Pediatrics','Orthopedics','Dermatology','Psychiatry','Obstetrics','Gynaecology'],
  'Other':['Other']
};
const SUBJECTS = Object.values(SUBJECT_GROUPS).flat();
const TEXTBOOK_REFERENCES = {
  'Anatomy':['B.D. Chaurasia’s Human Anatomy'],
  'Physiology':['Guyton and Hall Textbook of Medical Physiology'],
  'Biochemistry':['D.M. Vasudevan Textbook of Biochemistry for Medical Students','Lippincott Illustrated Reviews: Biochemistry'],
  'Pathology':['Ramadas Nayak’s Textbook of Pathology','Robbins & Cotran Pathologic Basis of Disease'],
  'Pharmacology':['K.D. Tripathi Essentials of Medical Pharmacology'],
  'Microbiology':['Apurba Sastry Essentials of Medical Microbiology'],
  'Forensic Medicine & Toxicology':['Reddy’s The Essentials of Forensic Medicine and Toxicology'],
  'General Medicine':['Davidson’s Principles and Practice of Medicine'],
  'General Surgery':['Bailey & Love’s Short Practice of Surgery','S. Das A Manual on Clinical Surgery'],
  'Ophthalmology':['A.K. Khurana Comprehensive Ophthalmology'],
  'ENT':['Dhingra Diseases of Ear, Nose and Throat'],
  'Pediatrics':['Ghai Essential Pediatrics'],
  'Orthopedics':['Maheshwari & Mhaskar Essential Orthopaedics'],
  'Dermatology':['IADVL Textbook of Dermatology'],
  'Psychiatry':['Shorter Oxford Textbook / standard undergraduate psychiatry reference'],
  'Obstetrics':['Dutta’s Textbook of Obstetrics'],
  'Gynaecology':['Dutta’s Textbook of Gynaecology'],
  'Other':[]
};

const seedLectures = [
  {
    id:'l1', subject:'Ophthalmology', title:'Ocular Motility & Cover Test', date:'2026-09-10', duration:52,
    status:'learned', progress:100,
    summary:'Extraocular movements, versions/ductions, ocular alignment, cover–uncover test and alternate cover test.',
    professor:['Always distinguish tropia from phoria before interpreting the cover test.','Observe the uncovered eye during cover–uncover testing.','Check ocular motility in the nine diagnostic positions of gaze.'],
    mustKnow:['Tropia = manifest deviation; phoria = latent deviation.','Cover–uncover test primarily detects manifest squint.','Alternate cover test dissociates fusion and can reveal total deviation.'],
    fullNotes:[
      {h:'Ocular motility',p:'Ocular motility describes coordinated eye movement produced by the six extraocular muscles. Ductions are monocular movements, versions are conjugate binocular movements, and vergences are disconjugate movements.'},
      {h:'Clinical examination',p:'Assess primary position, ocular alignment, and movements in the cardinal/diagnostic positions of gaze. Look for limitation, overaction, diplopia, nystagmus and abnormal head posture.'},
      {h:'Cover test',p:'In the cover–uncover test one eye is covered while the examiner watches the opposite eye for a refixation movement. A movement of the uncovered eye indicates a manifest deviation (tropia). The alternate cover test breaks fusion by moving the cover repeatedly between eyes and is useful for detecting latent deviation and estimating the total deviation.'}
    ],
    questions:[
      {q:'What is the difference between a tropia and a phoria?',a:'A tropia is a manifest ocular deviation present with both eyes viewing; a phoria is latent and appears when binocular fusion is disrupted.'},
      {q:'What does a refixation movement of the uncovered eye indicate in the cover–uncover test?',a:'A manifest deviation (tropia) of that eye.'},
      {q:'Why is the alternate cover test more dissociating?',a:'Because each eye is alternately occluded, preventing binocular fusion and revealing the full latent plus manifest deviation.'}
    ]
  },
  {
    id:'l2', subject:'Medicine', title:'Iron Deficiency Anaemia — Approach', date:'2026-09-10', duration:46,
    status:'revise', progress:62,
    summary:'Clinical approach to microcytic anaemia, iron studies, peripheral smear and causes of iron deficiency.',
    professor:['Do not label iron deficiency only from microcytosis — correlate with ferritin and the clinical setting.','Always look for the cause of iron loss, especially gastrointestinal blood loss where relevant.'],
    mustKnow:['Ferritin generally reflects iron stores but can rise with inflammation.','Peripheral smear typically shows microcytic hypochromic cells with anisopoikilocytosis.','Treat the cause in addition to replacing iron.'],
    fullNotes:[
      {h:'Approach',p:'Start with history, examination and CBC indices. Microcytosis suggests iron deficiency, thalassaemia and other differential diagnoses; iron studies help separate them.'},
      {h:'Iron studies',p:'Iron deficiency classically shows depleted iron stores with low ferritin, low serum iron, increased iron-binding capacity and reduced transferrin saturation, interpreted in the clinical context.'},
      {h:'Finding the cause',p:'Dietary deficiency, increased requirement, malabsorption and chronic blood loss are major mechanisms. Identifying ongoing blood loss is important before considering treatment complete.'}
    ],
    questions:[
      {q:'Which laboratory marker best reflects iron stores in uncomplicated iron deficiency?',a:'Serum ferritin.'},
      {q:'What broad mechanisms cause iron deficiency?',a:'Reduced intake, increased requirement, impaired absorption and chronic blood loss.'},
      {q:'Why can ferritin be misleading during inflammation?',a:'Ferritin is an acute-phase reactant and can be normal or elevated despite reduced available iron stores.'}
    ]
  },
  {
    id:'l3', subject:'Surgery', title:'Inguinal Hernia — Clinical Basics', date:'2026-09-10', duration:58,
    status:'weak', progress:35,
    summary:'Inguinal canal anatomy, direct vs indirect hernia, examination and complications.',
    professor:['Relation to inferior epigastric vessels is the key anatomical distinction between direct and indirect inguinal hernia.','Always examine the opposite groin and scrotum.'],
    mustKnow:['Indirect hernia lies lateral to inferior epigastric vessels.','Direct hernia protrudes medial to inferior epigastric vessels through Hesselbach triangle.','Irreducibility, obstruction and strangulation are important complications.'],
    fullNotes:[
      {h:'Anatomical distinction',p:'An indirect inguinal hernia enters through the deep inguinal ring and lies lateral to inferior epigastric vessels. A direct inguinal hernia protrudes through the posterior wall in Hesselbach triangle and lies medial to the vessels.'},
      {h:'Clinical examination',p:'Examine standing and supine where appropriate. Inspect for site and extent, then assess cough impulse, reducibility and relevant local anatomy. Complete the examination by assessing the opposite side and scrotum.'},
      {h:'Complications',p:'A hernia may become irreducible, obstructed or strangulated. Strangulation compromises blood supply and requires urgent surgical evaluation.'}
    ],
    questions:[
      {q:'How do direct and indirect inguinal hernias relate to the inferior epigastric vessels?',a:'Direct hernia is medial; indirect hernia is lateral.'},
      {q:'What is strangulation?',a:'Compromise of the blood supply to herniated contents, risking ischemia and necrosis.'},
      {q:'What areas should be examined in addition to the obvious groin swelling?',a:'The opposite groin and the scrotum, along with a complete relevant abdominal/groin examination.'}
    ]
  },
  {
    id:'l4', subject:'Ophthalmology', title:'Introduction to Squint', date:'2026-09-09', duration:41, status:'learned', progress:100,
    summary:'Basic terminology, manifest/latent deviations, binocular vision and initial examination.', professor:['Start by describing whether the deviation is manifest or latent.'], mustKnow:['Squint/strabismus is ocular misalignment.'], fullNotes:[{h:'Overview',p:'Squint (strabismus) is misalignment of the visual axes. It can be manifest or latent, constant or intermittent, and classified by direction and pattern.'}], questions:[{q:'What is squint?',a:'Misalignment of the visual axes.'}]
  },
  {
    id:'l5', subject:'Pathology', title:'Peripheral Blood Smear — RBC Morphology', date:'2026-09-08', duration:64, status:'revise', progress:73,
    summary:'RBC size, colour, shape, inclusions, rouleaux and clinically useful morphology.', professor:['Describe a smear systematically rather than jumping directly to a diagnosis.'], mustKnow:['Anisocytosis = variation in size; poikilocytosis = variation in shape.'], fullNotes:[{h:'Systematic description',p:'Assess red cell size, colour, shape, inclusions and distribution before integrating the pattern with clinical information.'}], questions:[{q:'Define anisocytosis.',a:'Variation in red blood cell size.'}]
  }
];

const revisionOffsets = [0,1,7,30];
let state = loadState();
let currentView = 'today';
let uploadFile = null;
let activeQuiz = {lectureId:null,index:0,revealed:false};
let recorderStream = null;
let recorderAudioContext = null;
let recorderSource = null;
let recorderProcessor = null;
let recorderMute = null;
let recorderMp3Encoder = null;
let recorderChunks = [];
let recorderState = 'idle';
let recordingTimerId = null;
let recordingSeconds = 0;
let recordedAudioUrl = null;

function loadState(){
  const saved = localStorage.getItem('lectureflow-state-v2');
  if(saved){ try { return JSON.parse(saved); } catch(e){} }
  const s = {lectures:[], streak:0, processedTotal:0, settings:{aiProvider:'Gemini via Vercel Functions', driveFolder:'MBBS/Lecture Recordings', notesFolder:'MBBS/Lecture Notes'}};
  localStorage.setItem('lectureflow-state-v2', JSON.stringify(s));
  return s;
}
function saveState(){localStorage.setItem('lectureflow-state-v2',JSON.stringify(state));}
function fmtDate(dateStr){return new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',year:'numeric'}).format(new Date(dateStr+'T12:00:00'));}
function dateParts(dateStr){const d=new Date(dateStr+'T12:00:00');return {day:d.getDate(),mon:d.toLocaleString('en',{month:'short'}).toUpperCase()};}
function getToday(){
  const d=new Date();
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function todayEyebrow(){return new Intl.DateTimeFormat('en-IN',{weekday:'long',day:'numeric',month:'long'}).format(new Date()).toUpperCase();}
function el(id){return document.getElementById(id)}
function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));}
function subjectClass(subject){const colors={Medicine:'blue',Surgery:'warn',Ophthalmology:'green',Pathology:'red'};return colors[subject]||'blue';}
function statusLabel(s){return s==='learned'?'Learned':s==='weak'?'Weak':'Needs revision'}
function toast(msg){const t=el('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2100)}

function setHeader(view){
  const config={today:[todayEyebrow(),'Today’s classes'],upload:['LECTURE INBOX','Upload a lecture'],library:['YOUR SEMESTER','Lecture library'],revision:['SPACED REPETITION','Due for revision'],dashboard:['YOUR PROGRESS','Study dashboard'],settings:['LECTUREFLOW','Settings & integrations']};
  el('pageEyebrow').textContent=config[view][0]; el('pageTitle').textContent=config[view][1];
}
function navigate(view){
  currentView=view; document.querySelectorAll('.view').forEach(v=>v.classList.remove('active')); el('view-'+view).classList.add('active');
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view)); setHeader(view); render(view); window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.view)));

function lectureCard(l){
  return `<article class="lecture-card" data-open="${l.id}">
    <div class="lecture-top"><span class="subject-chip">${escapeHtml(l.subject)}</span><span class="status-pill ${l.status==='weak'?'weak':l.status==='revise'?'revise':''}">${statusLabel(l.status)}</span></div>
    <h3>${escapeHtml(l.title)}</h3><p>${escapeHtml(l.summary)}</p>
    <div class="progress"><span style="width:${l.progress}%"></span></div>
    <div class="lecture-actions"><span class="duration">${l.duration} min lecture</span><button class="small-link" data-open="${l.id}">Open notes →</button></div>
  </article>`;
}

function renderToday(){
  const today=state.lectures.filter(l=>l.date===getToday()); const done=today.filter(l=>l.status==='learned').length;
  el('view-today').innerHTML=`
    <div class="hero"><div class="hero-grid"><div><h2>${today.length ? `${today.length} lectures from today` : 'Stay caught up every day'}</h2><p>${today.length ? `Your lecture material is organized and ready. ${done}/${today.length} are marked learned — finish the rest before tomorrow.` : 'Upload your class recording and LectureFlow will turn it into structured study material.'}</p></div><button class="hero-btn" data-goto="upload">+ Add lecture</button></div></div>
    <div class="section"><div class="section-head"><div><h2>Today’s lectures</h2><p>Read what was taught, then test yourself.</p></div><button class="text-btn" data-goto="library">View library</button></div><div class="cards-grid">${today.map(lectureCard).join('')}</div></div>
    <div class="section"><div class="quick-grid"><div class="recall-card"><div class="quick-label">DAILY RECALL</div><h3>Mix today’s questions</h3><p>Active recall across all ${today.length} lectures, without seeing the answer first.</p><button class="dark-btn" id="dailyRecallBtn">Start daily recall</button></div><div class="night-card"><div class="quick-label">5-MIN NIGHT REVISION</div><h3>${today.reduce((a,l)=>a+l.mustKnow.length,0)} must-know points</h3><p>Only the highest-yield facts from everything you learned today.</p><button class="dark-btn" id="nightRevisionBtn">Review now</button></div></div></div>
    <div class="section"><div class="section-head"><div><h2>Today at a glance</h2></div></div><div class="stats-row"><div class="stat-card"><div class="stat-value">${today.length}</div><div class="stat-label">Lectures processed</div></div><div class="stat-card"><div class="stat-value">${Math.round(today.reduce((a,l)=>a+l.duration,0)/60*10)/10}h</div><div class="stat-label">Lecture time</div></div><div class="stat-card"><div class="stat-value">${done}/${today.length}</div><div class="stat-label">Marked learned</div></div><div class="stat-card"><div class="stat-value">${state.streak}</div><div class="stat-label">Day streak</div><div class="stat-trend">Keep it alive today</div></div></div></div>`;
  wireCommon(); el('dailyRecallBtn')?.addEventListener('click',startDailyRecall); el('nightRevisionBtn')?.addEventListener('click',showNightRevision);
}

function renderUpload(){
  const date=getToday();
  el('view-upload').innerHTML=`<div class="upload-wrap"><div class="upload-card">
    <div class="record-card" id="recordCard">
      <div class="record-head"><div class="record-dot" id="recordDot"></div><div><h3>Record this lecture here</h3><p>Use your device microphone—LectureFlow saves a real MP3.</p></div><strong class="record-time" id="recordTimer">00:00</strong></div>
      <div class="record-actions">
        <button class="primary-btn record-btn" id="startRecordingBtn">● Start recording</button>
        <button class="outline-btn record-btn" id="pauseRecordingBtn" disabled>Pause</button>
        <button class="dark-btn record-btn" id="stopRecordingBtn" disabled>Stop & use recording</button>
      </div>
      <div class="record-status" id="recordingStatus">Saved as MP3. Keep this page open and your screen awake while recording.</div>
    </div>
    <div class="upload-divider"><span>OR UPLOAD A RECORDING</span></div>
    <div class="dropzone" id="dropzone"><div class="upload-symbol">♫</div><h3>Drop your lecture recording here</h3><p>MP3, M4A, WAV, AAC, OGG or WebM · tap to browse on iPhone/iPad</p><input id="audioFile" type="file" accept="audio/*,.m4a,.mp3,.wav,.aac,.ogg,.webm" /></div>
    <div class="file-selected" id="fileSelected"><div class="file-badge">♪</div><div><strong id="fileName"></strong><small id="fileMeta"></small></div></div>
    <audio id="recordingPreview" class="recording-preview" controls hidden></audio>
    <div class="form-grid"><div class="field"><label>SUBJECT</label><select id="subjectInput">${Object.entries(SUBJECT_GROUPS).map(([group,items])=>`<optgroup label="${escapeHtml(group)}">${items.map(s=>`<option>${escapeHtml(s)}</option>`).join('')}</optgroup>`).join('')}</select></div><div class="field"><label>DATE</label><input id="dateInput" type="date" value="${date}" /></div><div class="field wide"><label>LECTURE TITLE</label><input id="titleInput" placeholder="e.g. Ocular motility and cover test" /></div></div>
    <button class="primary-btn" id="processBtn" disabled>Process lecture with Gemini</button><div id="processingArea"></div>
  </div><div class="section"><div class="panel"><h3>What LectureFlow creates</h3><div class="bar-list"><div class="bar-line"><span>Full notes</span><div class="bar-track"><span style="width:100%"></span></div><b>✓</b></div><div class="bar-line"><span>Revision sheet</span><div class="bar-track"><span style="width:100%"></span></div><b>✓</b></div><div class="bar-line"><span>Recall + viva</span><div class="bar-track"><span style="width:100%"></span></div><b>✓</b></div><div class="bar-line"><span>5 MCQs</span><div class="bar-track"><span style="width:100%"></span></div><b>✓</b></div><div class="bar-line"><span>Transcript</span><div class="bar-track"><span style="width:100%"></span></div><b>✓</b></div></div><p class="gateway-note">Powered by Gemini through secure Vercel Functions. Your audio goes to Gemini for processing; LectureFlow stores the generated study notes locally on this device.</p></div></div></div>`;
  const dz=el('dropzone'), inp=el('audioFile');
  dz.addEventListener('click',()=>inp.click()); inp.addEventListener('change',()=>selectFile(inp.files[0]));
  ['dragenter','dragover'].forEach(e=>dz.addEventListener(e,x=>{x.preventDefault();dz.classList.add('drag')})); ['dragleave','drop'].forEach(e=>dz.addEventListener(e,x=>{x.preventDefault();dz.classList.remove('drag')})); dz.addEventListener('drop',e=>selectFile(e.dataTransfer.files[0]));
  el('titleInput').addEventListener('input',updateProcessButton); el('processBtn').addEventListener('click',processLectureReal);
  el('startRecordingBtn').addEventListener('click',startWebsiteRecording);
  el('pauseRecordingBtn').addEventListener('click',pauseResumeWebsiteRecording);
  el('stopRecordingBtn').addEventListener('click',stopWebsiteRecording);
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;
  if(!navigator.mediaDevices?.getUserMedia || !AudioContextClass || !window.lamejs?.Mp3Encoder){
    el('startRecordingBtn').disabled=true;
    el('recordingStatus').textContent='The MP3 recorder could not load. Refresh once, or upload an MP3 below.';
  }
}
function setRecorderButtons(mode){
  const start=el('startRecordingBtn'), pause=el('pauseRecordingBtn'), stop=el('stopRecordingBtn'), dot=el('recordDot');
  if(!start||!pause||!stop)return;
  const active=mode==='recording'||mode==='paused';
  start.disabled=active;
  pause.disabled=!active;
  stop.disabled=!active;
  pause.textContent=mode==='paused'?'Resume':'Pause';
  dot.classList.toggle('live',mode==='recording');
  dot.classList.toggle('paused',mode==='paused');
}
function updateRecordingTimer(){
  const timer=el('recordTimer');if(!timer)return;
  const mins=String(Math.floor(recordingSeconds/60)).padStart(2,'0');
  const secs=String(recordingSeconds%60).padStart(2,'0');
  timer.textContent=`${mins}:${secs}`;
}
function floatTo16BitPcm(input){
  const output=new Int16Array(input.length);
  for(let i=0;i<input.length;i++){
    const sample=Math.max(-1,Math.min(1,input[i]));
    output[i]=sample<0?sample*0x8000:sample*0x7fff;
  }
  return output;
}
async function releaseRecorderResources(){
  try{recorderProcessor?.disconnect()}catch{}
  try{recorderSource?.disconnect()}catch{}
  try{recorderMute?.disconnect()}catch{}
  recorderProcessor=null;recorderSource=null;recorderMute=null;
  recorderStream?.getTracks().forEach(track=>track.stop());
  recorderStream=null;
  if(recorderAudioContext && recorderAudioContext.state!=='closed'){
    try{await recorderAudioContext.close()}catch{}
  }
  recorderAudioContext=null;
}
async function startWebsiteRecording(){
  try{
    const AudioContextClass=window.AudioContext||window.webkitAudioContext;
    if(!AudioContextClass || !window.lamejs?.Mp3Encoder)throw new Error('MP3 encoder unavailable');
    recorderStream=await navigator.mediaDevices.getUserMedia({
      audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1}
    });
    recorderAudioContext=new AudioContextClass();
    await recorderAudioContext.resume();
    recorderSource=recorderAudioContext.createMediaStreamSource(recorderStream);
    recorderProcessor=recorderAudioContext.createScriptProcessor(4096,1,1);
    recorderMute=recorderAudioContext.createGain();
    recorderMute.gain.value=0;
    recorderMp3Encoder=new window.lamejs.Mp3Encoder(1,Math.round(recorderAudioContext.sampleRate),64);
    recorderChunks=[];
    recorderState='recording';
    recorderProcessor.onaudioprocess=event=>{
      if(recorderState!=='recording')return;
      const pcm=floatTo16BitPcm(event.inputBuffer.getChannelData(0));
      const encoded=recorderMp3Encoder.encodeBuffer(pcm);
      if(encoded.length)recorderChunks.push(new Uint8Array(encoded));
    };
    recorderSource.connect(recorderProcessor);
    recorderProcessor.connect(recorderMute);
    recorderMute.connect(recorderAudioContext.destination);
    recordingSeconds=0;updateRecordingTimer();
    recordingTimerId=setInterval(()=>{if(recorderState==='recording'){recordingSeconds++;updateRecordingTimer()}},1000);
    setRecorderButtons('recording');
    el('recordingStatus').textContent='Recording MP3 now… keep this page open and your screen awake.';
  }catch(err){
    recorderState='idle';await releaseRecorderResources();setRecorderButtons('idle');
    const denied=err?.name==='NotAllowedError'||err?.name==='PermissionDeniedError';
    el('recordingStatus').textContent=denied?'Microphone access was blocked. Allow microphone access for this site and try again.':'Could not start the MP3 recorder. Refresh once, or upload an MP3 below.';
  }
}
function pauseResumeWebsiteRecording(){
  if(recorderState==='recording'){
    recorderState='paused';setRecorderButtons('paused');el('recordingStatus').textContent='Recording paused.';
  }else if(recorderState==='paused'){
    recorderState='recording';setRecorderButtons('recording');el('recordingStatus').textContent='Recording MP3 resumed…';
  }
}
async function stopWebsiteRecording(){
  if(!['recording','paused'].includes(recorderState))return;
  recorderState='stopping';
  clearInterval(recordingTimerId);recordingTimerId=null;
  el('recordingStatus').textContent='Finishing your MP3…';
  const finalBytes=recorderMp3Encoder?.flush();
  if(finalBytes?.length)recorderChunks.push(new Uint8Array(finalBytes));
  await releaseRecorderResources();
  finishWebsiteRecording();
}
function finishWebsiteRecording(){
  const blob=new Blob(recorderChunks,{type:'audio/mpeg'});
  recorderChunks=[];recorderMp3Encoder=null;recorderState='idle';setRecorderButtons('idle');
  if(!blob.size){
    el('recordingStatus').textContent='Nothing was recorded. Please try again.';
    return;
  }
  const stamp=new Date().toISOString().slice(0,16).replace('T','-').replace(':','');
  const file=new File([blob],`lecture-recording-${stamp}.mp3`,{type:'audio/mpeg',lastModified:Date.now()});
  selectFile(file);
  el('recordingStatus').textContent='MP3 ready. Add a title below, then process it with Gemini.';
}
function normalizedAudioMime(file){
  const name=String(file?.name||'').toLowerCase();
  const type=String(file?.type||'').toLowerCase();
  if(name.endsWith('.m4a')||type==='audio/x-m4a'||type==='audio/mp4')return 'audio/m4a';
  if(name.endsWith('.mp3')||type==='audio/mp3'||type==='audio/mpeg')return 'audio/mpeg';
  if(name.endsWith('.wav')||type==='audio/x-wav'||type==='audio/wav')return 'audio/wav';
  if(name.endsWith('.aac')||type==='audio/aac')return 'audio/aac';
  if(name.endsWith('.ogg')||type==='audio/ogg')return 'audio/ogg';
  if(name.endsWith('.webm')||type==='audio/webm')return 'audio/webm';
  return type.startsWith('audio/')?type:'audio/mpeg';
}
function selectFile(file){
  if(!file)return;
  if(!String(file.type||'').startsWith('audio/') && !/\.(m4a|mp3|wav|aac|ogg|webm)$/i.test(file.name||'')){toast('Please select an audio recording');return}
  uploadFile=file;el('fileSelected').classList.add('show');el('fileName').textContent=file.name;el('fileMeta').textContent=`${(file.size/1024/1024).toFixed(1)} MB · ready to upload`;
  const preview=el('recordingPreview');
  if(preview){
    if(recordedAudioUrl)URL.revokeObjectURL(recordedAudioUrl);
    recordedAudioUrl=URL.createObjectURL(file);preview.src=recordedAudioUrl;preview.hidden=false;
  }
  updateProcessButton()
}
function updateProcessButton(){el('processBtn').disabled=!(uploadFile && el('titleInput').value.trim())}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function apiError(data,fallback){return data?.error || data?.detail?.error?.message || fallback}
function renderProcessingSteps(){
  const steps=['Uploading audio','Preparing recording','Creating lecture notes','Building revision sheet','Generating recall + MCQs'];
  el('processingArea').innerHTML=`<div class="processing">${steps.map((s,i)=>`<div class="process-step ${i===0?'active':''}" id="ps${i}"><div class="step-icon">${i+1}</div><div><strong>${s}</strong><small>${i===0?'Starting…':'Waiting'}</small></div></div>`).join('')}<div class="process-message" id="processMessage">Keep this page open while LectureFlow processes the recording.</div></div>`;
}
function markStep(index,status,label){
  const row=el('ps'+index);if(!row)return;
  row.classList.remove('active','done','error');row.classList.add(status);
  const icon=row.querySelector('.step-icon'), small=row.querySelector('small');
  if(status==='done')icon.textContent='✓'; else if(status==='error')icon.textContent='!'; else icon.textContent=index+1;
  if(label)small.textContent=label;
}
function setActiveStep(index,label='Working…'){
  for(let i=0;i<5;i++){const row=el('ps'+i);if(!row)continue;if(i===index){row.classList.add('active');row.classList.remove('error')}else if(!row.classList.contains('done'))row.classList.remove('active')}
  const row=el('ps'+index);if(row)row.querySelector('small').textContent=label;
}
async function getAudioDurationMinutes(file){
  return new Promise(resolve=>{
    const audio=document.createElement('audio'), url=URL.createObjectURL(file);let settled=false;
    const finish=v=>{if(settled)return;settled=true;URL.revokeObjectURL(url);resolve(v)};
    audio.preload='metadata';audio.onloadedmetadata=()=>finish(Number.isFinite(audio.duration)?Math.max(1,Math.round(audio.duration/60)):0);audio.onerror=()=>finish(0);audio.src=url;setTimeout(()=>finish(0),3500);
  });
}
async function uploadDirectToGemini(file,uploadUrl){
  // Stay well below Vercel's 4.5 MB function request limit.
  // The server also returns Gemini's authoritative offset so a transient
  // mismatch can be recovered without restarting a long lecture upload.
  const chunkSize=3*1024*1024;
  let offset=0;
  let retries=0;

  while(offset<file.size){
    const end=Math.min(offset+chunkSize,file.size);
    const chunk=file.slice(offset,end);
    const finalChunk=end===file.size;

    let response=null;
    let lastNetworkError=null;
    for(let attempt=0;attempt<4;attempt++){
      try{
        response=await fetch('/api/gemini-upload-init',{
          method:'POST',
          headers:{
            'Content-Type':'application/octet-stream',
            'x-lectureflow-upload-url':uploadUrl,
            'x-lectureflow-upload-offset':String(offset),
            'x-lectureflow-upload-final':finalChunk?'1':'0'
          },
          body:chunk
        });
        break;
      }catch(err){
        lastNetworkError=err;
        await sleep(400*(attempt+1));
      }
    }
    if(!response)throw new Error('Network error while uploading audio: '+(lastNetworkError?.message||'request failed'));

    const text=await response.text();
    let data={};
    try{data=JSON.parse(text);}catch{}

    if(!response.ok){
      const serverOffset=Number(data?.serverOffset);

      // If Gemini and the browser disagree about the current position,
      // resume from Gemini's position rather than throwing away the upload.
      if(Number.isFinite(serverOffset) && serverOffset>=0 && serverOffset<=file.size && retries<5){
        offset=serverOffset;
        retries++;
        await sleep(250*retries);
        continue;
      }

      throw new Error(data?.error||text||'Audio upload failed');
    }

    retries=0;

    if(finalChunk)return data;

    const serverNextOffset=Number(data?.nextOffset);
    if(!Number.isFinite(serverNextOffset) || serverNextOffset<=offset || serverNextOffset>file.size){
      throw new Error('Gemini returned an invalid upload offset.');
    }
    offset=serverNextOffset;
  }

  throw new Error('Audio upload did not finish.');
}
async function waitForGeminiFile(fileName){
  if(!fileName)return;
  for(let i=0;i<40;i++){
    const r=await fetch(`/api/gemini-file-status?name=${encodeURIComponent(fileName)}`);const d=await r.json();
    if(!r.ok)throw new Error(apiError(d,'Could not prepare the audio file'));
    if(d.state==='ACTIVE')return;
    if(d.state==='FAILED')throw new Error('Gemini could not process this recording.');
    await sleep(2000);
  }
  throw new Error('The recording is taking too long to prepare. Try again in a moment.');
}
async function pollInteraction(id){
  const started=Date.now();
  while(Date.now()-started < 15*60*1000){
    const r=await fetch(`/api/gemini-status?id=${encodeURIComponent(id)}`);const d=await r.json();
    if(!r.ok)throw new Error(apiError(d,'Could not check lecture processing'));
    if(d.status==='completed' || d.status==='incomplete')return d.result;
    if(['failed','cancelled','budget_exceeded'].includes(d.status))throw new Error(d.error||`Gemini ended with status ${d.status}`);
    const secs=Math.round((Date.now()-started)/1000);el('processMessage').textContent=`Gemini is processing the lecture—automatically switching models if demand is high… ${secs}s`;
    await sleep(3000);
  }
  throw new Error('Processing exceeded 15 minutes. Please try the lecture again.');
}
function normalizeGeneratedLecture(result,meta){
  const arr=x=>Array.isArray(x)?x:[];
  return {
    id:'l'+Date.now(), subject:meta.subject, title:meta.title, date:meta.date, duration:meta.duration||0,
    status:'revise', progress:0, sourceFileName:meta.sourceFileName,
    summary:String(result?.summary||'Lecture processed successfully.'),
    revisionNotes:String(result?.revisionNotes||result?.summary||''),
    professor:arr(result?.professor), mustKnow:arr(result?.mustKnow), fullNotes:arr(result?.fullNotes),
    questions:arr(result?.questions), viva:arr(result?.viva), mcqs:arr(result?.mcqs),
    confusingAreas:arr(result?.confusingAreas), topicsToReadMore:arr(result?.topicsToReadMore),
    transcript:String(result?.transcript||'')
  };
}
async function processLectureReal(){
  if(!uploadFile)return;
  const file=uploadFile, btn=el('processBtn');btn.disabled=true;renderProcessingSteps();
  const title=el('titleInput').value.trim(), subject=el('subjectInput').value, date=el('dateInput').value||getToday();
  try{
    const health=await fetch('/api/gemini-health').then(r=>r.json()).catch(()=>({ok:false}));
    if(!health.ok)throw new Error('Gemini is not active on this Vercel project yet. Make sure LECTUREFLOW_GEMINI_API_KEY is configured.');
    const duration=await getAudioDurationMinutes(file);

    setActiveStep(0,'Creating secure upload…');
    const initRes=await fetch('/api/gemini-upload-init',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fileName:file.name,mimeType:normalizedAudioMime(file),size:file.size})});
    const init=await initRes.json();if(!initRes.ok)throw new Error(apiError(init,'Could not start audio upload'));
    const uploaded=await uploadDirectToGemini(file,init.uploadUrl);
    const fileInfo=uploaded?.file||uploaded;
    if(!fileInfo?.uri)throw new Error('Gemini uploaded the audio but did not return a file reference.');
    markStep(0,'done','Uploaded');

    setActiveStep(1,'Preparing audio…');
    if(fileInfo.name)await waitForGeminiFile(fileInfo.name);
    markStep(1,'done','Ready');

    setActiveStep(2,'Gemini is listening…');
    const startRes=await fetch('/api/gemini-start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fileUri:fileInfo.uri,mimeType:fileInfo.mimeType||normalizedAudioMime(file),subject,title,date})});
    const started=await startRes.json();if(!startRes.ok||!started.interactionId)throw new Error(apiError(started,'Could not start lecture processing'));
    const result=await pollInteraction(started.interactionId);
    markStep(2,'done','Notes complete');markStep(3,'done','Revision ready');markStep(4,'done','Questions ready');
    el('processMessage').textContent='Done — opening your lecture notes.';

    const lecture=normalizeGeneratedLecture(result,{subject,title,date,duration,sourceFileName:file.name});
    state.lectures.unshift(lecture);state.processedTotal=(state.processedTotal||0)+1;saveState();uploadFile=null;
    toast('Lecture processed successfully');setTimeout(()=>openLecture(lecture.id),450);
  }catch(err){
    console.error(err);const active=[0,1,2,3,4].find(i=>el('ps'+i)?.classList.contains('active'));if(active!==undefined)markStep(active,'error','Stopped');
    el('processMessage').innerHTML=`<strong>Couldn’t process this lecture.</strong><br>${escapeHtml(err?.message||'Unknown error')}<br><button class="outline-btn retry-btn" id="retryProcess">Try again</button>`;
    el('retryProcess')?.addEventListener('click',processLectureReal);btn.disabled=false;
  }
}

function renderLibrary(){
  const subjects=['All',...new Set(state.lectures.map(l=>l.subject))];
  el('view-library').innerHTML=`<div class="filter-row" id="subjectFilters">${subjects.map((s,i)=>`<button class="filter-chip ${i===0?'active':''}" data-subject="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('')}</div><div class="library-list" id="libraryList">${libraryRows(state.lectures)}</div>`;
  document.querySelectorAll('[data-subject]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-subject]').forEach(x=>x.classList.remove('active'));b.classList.add('active');const s=b.dataset.subject;el('libraryList').innerHTML=libraryRows(s==='All'?state.lectures:state.lectures.filter(l=>l.subject===s));wireOpen();})); wireOpen();
}
function libraryRows(list){return list.sort((a,b)=>b.date.localeCompare(a.date)).map(l=>{const d=dateParts(l.date);return `<article class="library-row" data-open="${l.id}"><div class="date-box"><strong>${d.day}</strong><small>${d.mon}</small></div><div><h3>${escapeHtml(l.title)}</h3><p>${escapeHtml(l.subject)} · ${l.duration} min · ${statusLabel(l.status)}</p></div><div class="row-chevron">›</div></article>`}).join('')||`<div class="empty">No lectures in this subject yet.</div>`}

function revisionDue(l){
  const base=new Date(l.date+'T12:00:00'), today=new Date(getToday()+'T12:00:00'); const days=Math.round((today-base)/86400000); let due='Today', urgency='';
  if(days>=30) {due='30-day review';urgency='overdue'} else if(days>=7){due='7-day review'} else if(days>=1){due='Next-day review'} else {due='Same-day review'}
  return {due,urgency};
}
function renderRevision(){
  const items=state.lectures.filter(l=>l.status!=='learned' || l.date!==getToday());
  el('view-revision').innerHTML=`<div class="section" style="margin-top:0"><div class="section-head"><div><h2>${items.length} reviews waiting</h2><p>Same day → next day → 7 days → 30 days</p></div></div><div class="revision-list">${items.map(l=>{const r=revisionDue(l);return `<article class="revision-row"><div><div class="revision-meta"><span class="subject-chip">${escapeHtml(l.subject)}</span><span class="urgency ${r.urgency}">${r.due}</span></div><h3>${escapeHtml(l.title)}</h3><p>${fmtDate(l.date)} · ${statusLabel(l.status)}</p></div><button class="outline-btn" data-quiz="${l.id}">Revise</button></article>`}).join('')}</div></div>`;
  document.querySelectorAll('[data-quiz]').forEach(b=>b.addEventListener('click',()=>startQuiz(b.dataset.quiz)));
}

function renderDashboard(){
  const total=state.lectures.length, learned=state.lectures.filter(l=>l.status==='learned').length, minutes=state.lectures.reduce((a,l)=>a+l.duration,0); const subjects=[...new Set(state.lectures.map(l=>l.subject))];
  const counts=subjects.map(s=>({s,n:state.lectures.filter(l=>l.subject===s).length})).sort((a,b)=>b.n-a.n).slice(0,5);const max=Math.max(...counts.map(x=>x.n),1); const pct=total?Math.round(learned/total*100):0;
  el('view-dashboard').innerHTML=`<div class="stats-row"><div class="stat-card"><div class="stat-value">${total}</div><div class="stat-label">Lectures in library</div></div><div class="stat-card"><div class="stat-value">${Math.round(minutes/60)}h</div><div class="stat-label">Recorded learning</div></div><div class="stat-card"><div class="stat-value">${learned}</div><div class="stat-label">Marked learned</div></div><div class="stat-card"><div class="stat-value">${state.streak}</div><div class="stat-label">Day streak</div></div></div>
  <div class="section dashboard-grid"><div class="panel"><h3>Lectures by subject</h3><div class="bar-list">${counts.map(x=>`<div class="bar-line"><span>${escapeHtml(x.s)}</span><div class="bar-track"><span style="width:${x.n/max*100}%"></span></div><b>${x.n}</b></div>`).join('')}</div></div><div class="panel"><h3>Knowledge status</h3><div class="ring-wrap"><div class="ring" style="background:conic-gradient(var(--accent) 0 ${pct}%, #ecf0f3 ${pct}%)"><strong>${pct}%</strong></div><div class="legend"><div><b>${learned}</b> learned</div><div><b>${state.lectures.filter(l=>l.status==='revise').length}</b> need revision</div><div><b>${state.lectures.filter(l=>l.status==='weak').length}</b> weak</div></div></div></div></div>`;
}

function renderSettings(){
  el('view-settings').innerHTML=`<div class="settings-list"><div class="settings-card"><h3>AI processing</h3><p>LectureFlow uses Gemini through secure Vercel Functions. No Gemini API key is stored in your browser.</p><div class="integration-row"><div class="integration-name"><div class="integration-icon">G</div><div><strong>Gemini Flash · automatic fallback</strong><small>3.8 → 3.7 → 3.5 when demand is high</small></div></div><button class="connection-pill" id="geminiInfo">Checking…</button></div><div class="integration-row"><div class="integration-name"><div class="integration-icon">V</div><div><strong>Vercel Functions</strong><small>Secure server-side Gemini access</small></div></div><span class="connection-pill connected">Connected</span></div></div>
  <div class="settings-card"><h3>Storage right now</h3><p>Your generated lecture notes are saved in this browser using local storage. Audio is uploaded to Gemini for processing and is not kept by LectureFlow itself.</p><div class="integration-row"><div class="integration-name"><div class="integration-icon">◫</div><div><strong>On-device lecture library</strong><small>Fast MVP · works without an account</small></div></div><span class="connection-pill connected">Active</span></div></div>
  <div class="settings-card"><h3>Google Drive automation</h3><p>Next-stage workflow: recordings added to a Drive folder can be imported automatically and the generated notes can be written back to your subject folders.</p><div class="field"><label>RECORDING FOLDER</label><input value="${escapeHtml(state.settings.driveFolder)}" /></div><div class="field" style="margin-top:12px"><label>GENERATED NOTES FOLDER</label><input value="${escapeHtml(state.settings.notesFolder)}" /></div><button class="primary-btn" id="drivePlaceholder">Drive automation coming next</button></div>
  <div class="settings-card"><h3>Privacy note</h3><p>Only upload recordings you are allowed to record and process. LectureFlow sends the selected recording to Gemini to create your study material.</p></div></div>`;
  el('drivePlaceholder').addEventListener('click',()=>toast('First we are making audio → notes rock solid'));
  fetch('/api/gemini-health').then(r=>r.json()).then(d=>{const b=el('geminiInfo');if(!b)return;b.textContent=d.ok?'Live':'Unavailable';b.classList.toggle('connected',!!d.ok);b.classList.toggle('error-pill',!d.ok)}).catch(()=>{const b=el('geminiInfo');if(b){b.textContent='Unavailable';b.classList.add('error-pill')}});
}

function render(view){({today:renderToday,upload:renderUpload,library:renderLibrary,revision:renderRevision,dashboard:renderDashboard,settings:renderSettings}[view]||renderToday)()}
function wireCommon(){document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.goto)));wireOpen()}
function wireOpen(){document.querySelectorAll('[data-open]').forEach(x=>x.addEventListener('click',e=>{if(e.currentTarget.dataset.open)openLecture(e.currentTarget.dataset.open)}))}

function openLecture(id, initialTab='full'){
  const l=state.lectures.find(x=>x.id===id); if(!l)return; const dlg=el('lectureDialog');
  const qCount=(l.questions||[]).length+(l.viva||[]).length;
  el('lectureDialogContent').innerHTML=`<div class="dialog-head"><div><div class="subject-chip" style="display:inline-block">${escapeHtml(l.subject)}</div><h2>${escapeHtml(l.title)}</h2><div style="font-size:11px;color:var(--muted)">${fmtDate(l.date)}${l.duration?` · ${l.duration} min`:''}</div></div><button class="close-btn" id="closeLecture">×</button></div><div class="tabs">${[['full','Full Notes'],['revision','Revision'],['professor','Professor Emphasized'],['recall',`Recall (${qCount})`],['mcq',`MCQs (${(l.mcqs||[]).length})`],['transcript','Transcript']].map(([k,n])=>`<button class="tab-btn ${k===initialTab?'active':''}" data-tab="${k}">${n}</button>`).join('')}</div><div class="tab-content" id="lectureTabContent"></div>`;
  el('closeLecture').addEventListener('click',()=>dlg.close());document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-tab]').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderLectureTab(l,b.dataset.tab)}));renderLectureTab(l,initialTab);dlg.showModal();
}
function renderLectureTab(l,tab){
  const c=el('lectureTabContent'), fullNotes=l.fullNotes||[], mustKnow=l.mustKnow||[], professor=l.professor||[], questions=l.questions||[], viva=l.viva||[], mcqs=l.mcqs||[], confusing=l.confusingAreas||[], readMore=l.topicsToReadMore||[];
  if(tab==='full') c.innerHTML=`<div class="note-intro"><strong>Textbook framework:</strong> ${escapeHtml((TEXTBOOK_REFERENCES[l.subject]||[]).join(' · ')||'Standard MBBS curriculum')}</div>`+(fullNotes.length?fullNotes.map(n=>`<div class="note-section"><h3>${escapeHtml(n.h)}</h3><p>${escapeHtml(n.p)}</p></div>`).join(''):`<div class="empty">No detailed notes available.</div>`)+`${confusing.length?`<div class="note-section"><h3>Confusing areas clarified</h3><ul>${confusing.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div>`:''}${readMore.length?`<div class="note-section"><h3>Topics to read more about</h3><ul>${readMore.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div>`:''}${knowledgeButtons(l)}`;
  if(tab==='revision') c.innerHTML=`<div class="note-section"><h3>5–10 minute revision sheet</h3><p class="revision-text">${escapeHtml(l.revisionNotes||l.summary||'')}</p><h4>Must know</h4><ul>${mustKnow.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div>${knowledgeButtons(l)}`;
  if(tab==='professor') c.innerHTML=`<div class="note-section"><h3>Professor emphasized</h3>${professor.length?`<div class="emphasis-box"><ul>${professor.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div>`:`<p>No clear emphasis points were detected in the recording.</p>`}</div>${knowledgeButtons(l)}`;
  if(tab==='recall') c.innerHTML=`<div class="note-section"><h3>Active recall</h3><p>${questions.length} short-answer questions generated from this lecture.</p>${questions.length?`<button class="primary-btn" style="max-width:240px" id="startLectureQuiz">Start active recall</button>`:''}</div>${viva.length?`<div class="note-section"><h3>Viva questions</h3><div class="qa-list">${viva.map((x,i)=>`<details><summary>${i+1}. ${escapeHtml(x.q)}</summary><p>${escapeHtml(x.a)}</p></details>`).join('')}</div></div>`:''}`;
  if(tab==='recall' && questions.length) el('startLectureQuiz').addEventListener('click',()=>startQuiz(l.id));
  if(tab==='mcq') c.innerHTML=mcqs.length?`<div class="note-section"><h3>Single-best-answer MCQs</h3><div class="mcq-list">${mcqs.map((m,i)=>`<details class="mcq-card"><summary>${i+1}. ${escapeHtml(m.q)}</summary><ol type="A">${(m.options||[]).map(o=>`<li>${escapeHtml(o)}</li>`).join('')}</ol><div class="answer-box"><strong>Answer:</strong> ${escapeHtml(m.answer)}<br><strong>Why:</strong> ${escapeHtml(m.explanation)}</div></details>`).join('')}</div></div>`:`<div class="empty">No MCQs were generated for this lecture.</div>`;
  if(tab==='transcript') c.innerHTML=`<div class="note-section"><h3>Cleaned lecture transcript</h3>${l.transcript?`<div class="transcript-text">${escapeHtml(l.transcript).replace(/\n/g,'<br>')}</div>`:`<p style="color:var(--muted)">No transcript was stored for this lecture.</p>`}</div>`;
  c.querySelectorAll('[data-state]').forEach(b=>b.addEventListener('click',()=>{l.status=b.dataset.state;l.progress=l.status==='learned'?100:l.status==='revise'?60:30;saveState();c.querySelectorAll('[data-state]').forEach(x=>x.classList.toggle('active',x.dataset.state===l.status));toast(`Marked ${statusLabel(l.status).toLowerCase()}`)}));
}

function knowledgeButtons(l){return `<div class="knowledge-state"><button class="state-btn learned ${l.status==='learned'?'active':''}" data-state="learned">✓ Learned</button><button class="state-btn revise ${l.status==='revise'?'active':''}" data-state="revise">↻ Needs revision</button><button class="state-btn weak ${l.status==='weak'?'active':''}" data-state="weak">! Weak</button></div>`}

function startQuiz(id){
  const l=state.lectures.find(x=>x.id===id);if(!l || !(l.questions||[]).length){toast('No recall questions available yet');return}
  activeQuiz={lectureId:id,index:0,revealed:false};const dlg=el('lectureDialog');if(dlg.open)dlg.close();renderQuizDialog();dlg.showModal()
}
function renderQuizDialog(){const l=state.lectures.find(x=>x.id===activeQuiz.lectureId), q=(l.questions||[])[activeQuiz.index];if(!l||!q)return;el('lectureDialogContent').innerHTML=`<div class="dialog-head"><div><div class="subject-chip" style="display:inline-block">ACTIVE RECALL</div><h2>${escapeHtml(l.title)}</h2></div><button class="close-btn" id="closeLecture">×</button></div><div class="quiz-wrap"><div class="quiz-count">QUESTION ${activeQuiz.index+1} OF ${l.questions.length}</div><div class="quiz-question">${escapeHtml(q.q)}</div>${activeQuiz.revealed?`<div class="answer-box"><strong>Answer</strong><br>${escapeHtml(q.a)}</div>`:''}<div class="quiz-actions">${!activeQuiz.revealed?`<button class="primary-btn" id="showAnswer" style="margin:0">Show answer</button>`:`<button class="outline-btn" id="againBtn">Again</button><button class="primary-btn" id="nextQuestion" style="margin:0">${activeQuiz.index===l.questions.length-1?'Finish':'Next'}</button>`}</div></div>`;el('closeLecture').addEventListener('click',()=>el('lectureDialog').close());el('showAnswer')?.addEventListener('click',()=>{activeQuiz.revealed=true;renderQuizDialog()});el('againBtn')?.addEventListener('click',()=>{activeQuiz.revealed=false;renderQuizDialog()});el('nextQuestion')?.addEventListener('click',()=>{if(activeQuiz.index===l.questions.length-1){if(l.id!=='daily-temp'){l.status='learned';l.progress=100;saveState()}el('lectureDialog').close();toast('Revision complete');render(currentView)}else{activeQuiz.index++;activeQuiz.revealed=false;renderQuizDialog()}})}
function startDailyRecall(){const today=state.lectures.filter(l=>l.date===getToday());const questions=today.flatMap(l=>(l.questions||[]).map(q=>({...q,q:`[${l.subject}] ${q.q}`})));if(!questions.length){toast('Upload and process a lecture first');return}const combined={id:'daily-temp',subject:'Today',title:'Daily Recall',date:getToday(),duration:0,status:'revise',progress:0,summary:'',professor:[],mustKnow:[],fullNotes:[],questions};state.lectures.push(combined);startQuiz(combined.id);const observer=setInterval(()=>{if(!el('lectureDialog').open){state.lectures=state.lectures.filter(l=>l.id!=='daily-temp');clearInterval(observer)}},500)}

function showNightRevision(){const today=state.lectures.filter(l=>l.date===getToday());const dlg=el('lectureDialog');el('lectureDialogContent').innerHTML=`<div class="dialog-head"><div><div class="subject-chip" style="display:inline-block">5-MIN NIGHT REVISION</div><h2>Today’s must-know points</h2></div><button class="close-btn" id="closeLecture">×</button></div><div class="tab-content">${today.length?today.map(l=>`<div class="note-section"><h3>${escapeHtml(l.subject)} · ${escapeHtml(l.title)}</h3><ul>${(l.mustKnow||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div>`).join(''):`<div class="empty">No lectures processed today yet.</div>`}</div>`;el('closeLecture').addEventListener('click',()=>dlg.close());dlg.showModal()}

el('searchBtn').addEventListener('click',()=>{el('searchDialog').showModal();el('globalSearch').focus();renderSearch('')});el('globalSearch').addEventListener('input',e=>renderSearch(e.target.value));
function renderSearch(q){q=q.trim().toLowerCase();const results=!q?state.lectures.slice(0,5):state.lectures.filter(l=>[l.title,l.subject,l.summary,l.revisionNotes,l.transcript,...(l.mustKnow||[]),...(l.professor||[]),...(l.fullNotes||[]).map(x=>x.p)].join(' ').toLowerCase().includes(q));el('searchResults').innerHTML=results.map(l=>{const d=dateParts(l.date);return `<article class="library-row" data-search-open="${l.id}"><div class="date-box"><strong>${d.day}</strong><small>${d.mon}</small></div><div><h3>${escapeHtml(l.title)}</h3><p>${escapeHtml(l.subject)} · ${escapeHtml(l.summary)}</p></div><div class="row-chevron">›</div></article>`}).join('')||`<div class="empty">No matching lecture notes yet.</div>`;document.querySelectorAll('[data-search-open]').forEach(x=>x.addEventListener('click',()=>{el('searchDialog').close();openLecture(x.dataset.searchOpen)}))}

el('sideStreak').textContent=`${state.streak} day streak`;
setHeader('today');
renderToday();