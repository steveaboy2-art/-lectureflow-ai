(() => {
  const CLIENT_ID_URL = '/api/google-config';
  const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
  let tokenClient = null;
  let accessToken = null;
  // Google OAuth client IDs are public browser identifiers; keeping this local avoids a fragile config fetch on iPad Safari.\n  let clientId = '14663212067-eb2lvc5qorg89vdgeod530ssaoaa2d1f.apps.googleusercontent.com';
  let saving = false;

  const esc = (s='') => String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));

  function loadState() {
    try { return JSON.parse(localStorage.getItem('lectureflow-state-v2') || '{}'); } catch { return {}; }
  }

  function notify(msg) {
    const t = document.getElementById('toast');
    if (t) { t.textContent = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2500); }
  }

  function renderDriveCard() {
    const view = document.getElementById('googleDriveMount') || document.getElementById('view-settings');
    if (!view) return;
    const existing = view.querySelector('#googleDriveCard');
    if (existing) {
      const btn = existing.querySelector('#connectDriveBtn');
      if (btn && !btn.dataset.driveBound) { btn.dataset.driveBound='1'; btn.addEventListener('click', connectDrive); }
      updateDriveUI();
      return;
    }
    const card = document.createElement('div');
    card.className = 'settings-card';
    card.id = 'googleDriveCard';
    card.innerHTML = '<h3>Google Drive cloud backup</h3>' +
      '<p>Connect your Google account and LectureFlow will save each completed lecture as a Google Doc in your Drive. Access is limited to files created or used by LectureFlow.</p>' +
      '<div class="integration-row"><div class="integration-name"><div class="integration-icon">G</div><div><strong id="driveStatus">Google Drive</strong><small id="driveStatusText">Not connected</small></div></div><button class="primary-btn" id="connectDriveBtn" style="width:auto;margin:0">Connect Google Drive</button></div>';
    view.appendChild(card);
    card.querySelector('#connectDriveBtn').addEventListener('click', connectDrive);
    updateDriveUI();
  }

  function updateDriveUI() {
    const btn=document.getElementById('connectDriveBtn'), status=document.getElementById('driveStatus'), text=document.getElementById('driveStatusText');
    if (!btn) return;
    if (accessToken) { btn.textContent='Connected'; btn.classList.add('connected'); status.textContent='Google Drive connected'; text.textContent='New lecture notes will be backed up automatically'; }
    else { btn.textContent='Connect Google Drive'; btn.classList.remove('connected'); status.textContent='Google Drive'; text.textContent=clientId?'Not connected':'Needs Google client ID setup'; }
  }

  async function loadGoogleScript() {
    if (window.google?.accounts?.oauth2) return;
    await new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://accounts.google.com/gsi/client';
      s.async=true; s.onload=resolve; s.onerror=reject; document.head.appendChild(s);
    });
  }

  async function connectDrive() {
    const btn=document.getElementById('connectDriveBtn');
    const statusText=document.getElementById('driveStatusText');
    try {
      if (btn) { btn.textContent='Opening Google…'; btn.disabled=true; }
      if (statusText) statusText.textContent='Opening Google permission screen…';

      if (!clientId) throw new Error('Google Drive configuration is still loading. Please tap Connect Google Drive again.');
      if (!window.google?.accounts?.oauth2) {
        if (statusText) statusText.textContent='Google sign-in is still loading…';
        notify('Google sign-in is still loading — tap Connect Google Drive again in a moment.');
        return;
      }
      if (!tokenClient) {
        tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: DRIVE_SCOPE,
          callback: (response) => {
            if (response.error) {
              if (statusText) statusText.textContent='Google connection was cancelled.';
              notify('Google Drive connection was cancelled.');
              return;
            }
            accessToken=response.access_token;
            localStorage.setItem('lectureflow-drive-connected','1');
            updateDriveUI();
            notify('Google Drive connected ✓');
          },
          error_callback: (err) => {
            const reason = err?.type === 'popup_failed_to_open' ? 'Safari blocked the Google popup.' :
              err?.type === 'popup_closed' ? 'Google sign-in window was closed.' :
              'Google sign-in could not open.';
            if (statusText) statusText.textContent=reason;
            notify(reason);
          }
        });
      }
      tokenClient.requestAccessToken({prompt: accessToken ? '' : 'consent'});
    } catch (e) {
      if (statusText) statusText.textContent=e.message || 'Could not connect Google Drive';
      notify(e.message || 'Could not connect Google Drive');
    } finally {
      if (btn && !accessToken) { btn.textContent='Connect Google Drive'; btn.disabled=false; }
    }
  }

  window.lectureFlowConnectDrive = connectDrive;

  async function driveFetch(url, options={}) {
    if (!accessToken) throw new Error('Google Drive is not connected.');
    const res=await fetch(url,{...options,headers:{...(options.headers||{}),Authorization:'Bearer '+accessToken}});
    if (!res.ok) {
      const text=await res.text();
      if (res.status===401) { accessToken=null; updateDriveUI(); }
      throw new Error('Google Drive returned HTTP '+res.status+': '+text.slice(0,300));
    }
    return res;
  }

  async function findOrCreateFolder(name, parentId=null) {
    const safeName=name.replace(/'/g,"\\'");
    let q="name='"+safeName+"' and mimeType='application/vnd.google-apps.folder' and trashed=false";
    if (parentId) q += " and '"+parentId+"' in parents";
    const params=new URLSearchParams({q,spaces:'drive',fields:'files(id,name)',pageSize:'10'});
    const found=await driveFetch('https://www.googleapis.com/drive/v3/files?'+params);
    const data=await found.json();
    if (data.files?.[0]) return data.files[0].id;
    const meta={name,mimeType:'application/vnd.google-apps.folder'};
    if (parentId) meta.parents=[parentId];
    const created=await driveFetch('https://www.googleapis.com/drive/v3/files?fields=id,name',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(meta)});
    return (await created.json()).id;
  }

  function lectureDocHtml(l) {
    const section=(title,items)=>items?.length ? '<h2>'+esc(title)+'</h2>'+items.map(x=>'<p>'+esc(typeof x==='string'?x:(x.p||x.a||''))+'</p>').join('') : '';
    const notes=(l.fullNotes||[]).map(n=>'<h2>'+esc(n.h)+'</h2><p>'+esc(n.p)+'</p>').join('');
    const taught=(l.lectureOnlyNotes||[]).map(n=>'<h2>'+esc(n.h)+'</h2><p>'+esc(n.p)+'</p>').join('');
    const recall=(l.questions||[]).map((x,i)=>'<p><b>'+ (i+1)+'. '+esc(x.q)+'</b><br>'+esc(x.a)+'</p>').join('');
    return '<!doctype html><html><head><meta charset="utf-8"></head><body><h1>'+esc(l.title)+'</h1><p><b>Subject:</b> '+esc(l.subject)+'<br><b>Date:</b> '+esc(l.date)+'</p><h2>Full Notes</h2>'+notes+'<h2>What Was Taught</h2>'+taught+section('Revision',l.revisionNotes?[l.revisionNotes]:[])+section('Must Know',l.mustKnow)+section('Professor Emphasized',l.professor)+'<h2>Active Recall</h2>'+recall+(l.transcript?'<h2>Transcript</h2><p>'+esc(l.transcript).replace(/\n/g,'<br>')+'</p>':'')+'</body></html>';
  }

  async function saveLecture(l) {
    if (!accessToken || saving || !l || l.id==='daily-temp') return;
    saving=true;
    try {
      const root=await findOrCreateFolder('LectureFlow');
      const notes=await findOrCreateFolder('Notes',root);
      const subject=await findOrCreateFolder(l.subject,notes);
      const metadata={name:l.title+' — LectureFlow Notes',mimeType:'application/vnd.google-apps.document',parents:[subject]};
      const body=lectureDocHtml(l);
      const boundary='lectureflow-'+Date.now();
      const multipart='--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(metadata)+'\r\n--'+boundary+'\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n'+body+'\r\n--'+boundary+'--';
      await driveFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body:multipart});
      notify('Saved to Google Drive ✓');
    } catch(e) {
      console.error('Drive backup failed',e);
      notify('Drive backup failed — you can retry from Settings.');
    } finally { saving=false; }
  }

  async function init() {
    // Render and bind the button immediately. On iPad Safari, waiting for an
    // external script before binding can leave the visible button inert.
    renderDriveCard();
    if (localStorage.getItem('lectureflow-drive-connected')==='1') updateDriveUI();

    // Do not block the Drive button on a config API request. The client ID is already
    // embedded above and is safe to expose in a browser application.
    const scriptPromise = loadGoogleScript()
      .catch(() => { notify('Google sign-in could not load.'); });

    await scriptPromise;
    updateDriveUI();

    const originalSetItem=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
      const result=originalSetItem.call(this,key,value);
      if (key==='lectureflow-state-v2') {
        try {
          const parsed=JSON.parse(value);
          const latest=parsed.lectures?.[0];
          if (latest && latest.id && latest.id!=='daily-temp' && accessToken) setTimeout(()=>saveLecture(latest),400);
        } catch {}
      }
      return result;
    };

    const observer=new MutationObserver(renderDriveCard);
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();