/* Shared answer recording. See TRACKING.md for the append-only event format. */
(()=>{
  const URL='https://cfljidsexwvhalvvlbxi.supabase.co/rest/v1/scores';
  const KEY='sb_publishable_kxC0kvIBXsHCeXVf6yosbg_b-nAEO6N';
  const PREFIX='learning-outbox-v2:';
  const memory=new Map();let busy=false,pending=null,storageFailed=false;
  const read=k=>{try{return localStorage.getItem(k)}catch{return null}};
  const fixedPlayer=document.currentScript?.dataset.player||null;
  let player=fixedPlayer||(['HUGZY','AZZA'].includes(read('learning-player'))?read('learning-player'):null);
  const hash=value=>{let a=2166136261,b=5381;for(const c of value){a=Math.imul(a^c.codePointAt(0),16777619);b=Math.imul(b,33)^c.codePointAt(0)}return (a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0')};
  const bar=document.createElement('div');bar.style.cssText='max-width:680px;margin:0 auto 20px;display:flex;gap:12px;align-items:center;flex-wrap:wrap';
  bar.innerHTML='<button type="button" class="btn" id="learningPlayer">Choose player</button><span id="learningSync" role="status" style="font-size:13px"></span>';
  document.body.insertBefore(bar,document.querySelector('main'));
  const dialog=document.createElement('dialog');dialog.style.cssText='background:var(--paper,var(--bg,#fff));color:inherit;border:1px solid;padding:24px;max-width:90vw';
  dialog.innerHTML='<h2>Who is learning?</h2><p>Answers and practice progress save automatically under your name.</p><div style="display:flex;gap:12px"><button class="btn" type="button" data-player="HUGZY">Hugzy</button><button class="btn" type="button" data-player="AZZA">Azza</button></div><button type="button" id="cancelPlayer" style="margin-top:16px">Cancel</button>';
  document.body.append(dialog);
  function entries(){
    try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith(PREFIX)&&!memory.has(k)){try{memory.set(k,JSON.parse(localStorage.getItem(k)))}catch{}}}}catch{storageFailed=true}
    return [...memory.entries()];
  }
  function status(message){
    document.getElementById('learningPlayer').textContent=fixedPlayer?`Learning as ${player}`:player?`Learning as ${player} · change`:'Choose player';
    if(fixedPlayer)document.getElementById('learningPlayer').disabled=true;
    const n=entries().length;
    document.getElementById('learningSync').textContent=message||(storageFailed?'Phone storage unavailable — keep this page open to sync.':n?`${n} answer${n===1?'':'s'} waiting to sync`:'All answers synced');
  }
  function choose(callback){pending=callback||null;if(!dialog.open)dialog.showModal()}
  dialog.querySelectorAll('[data-player]').forEach(b=>b.addEventListener('click',()=>{
    player=b.dataset.player;try{localStorage.setItem('learning-player',player)}catch{storageFailed=true}
    dialog.close();const next=pending;pending=null;status();if(next)next();
  }));
  document.getElementById('cancelPlayer').onclick=()=>{pending=null;dialog.close()};
  dialog.addEventListener('cancel',()=>{pending=null});
  document.getElementById('learningPlayer').onclick=()=>choose();
  async function request(suffix,options={}){
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
    try{const r=await fetch(URL+suffix,{...options,signal:controller.signal,headers:{apikey:KEY,'Content-Type':'application/json',...options.headers}});if(!r.ok)throw Error('sync failed');return options.method==='POST'||r.status===204?null:await r.json()}finally{clearTimeout(timeout)}
  }
  async function drain(){
    for(const [k,row] of entries()){
      // An interrupted response may already have committed. Recover before retrying.
      const found=await request('?select=id&lesson=eq.'+encodeURIComponent(row.lesson)+'&limit=1');
      if(!found.length)await request('',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(row)});
      try{localStorage.removeItem(k)}catch{storageFailed=true}
      memory.delete(k);
    }
  }
  async function flush(){
    if(busy||!entries().length)return status();busy=true;status('Saving answers…');
    try{if(navigator.locks)await navigator.locks.request('learning-sync-v2',drain);else await drain();status()}
    catch{status()}finally{busy=false}
  }
  function record({name,language,mode,direction,word,answer,correct,elapsed}){
    if(!['HUGZY','AZZA'].includes(name))throw Error('Choose a player first');
    const id=Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>n.toString(16).padStart(2,'0')).join('');
    const lesson=`ev2:${language}:${mode}${direction==='en'?'e':'z'}:${hash(word[0]+'|'+word[2])}:${answer===null?'0000000000000000':hash(answer)}:${id}`;
    const row={lesson,name,score:Math.min(40000,Math.max(0,Math.round(elapsed/1000))),correct:correct?1:0,total:200,created_at:new Date().toISOString()};
    const k=PREFIX+id;memory.set(k,row);
    try{localStorage.setItem(k,JSON.stringify(row))}catch{storageFailed=true}
    status();void flush();
  }
  window.Learning={player:()=>player,choose,record,flush,hash,active:on=>{document.getElementById('learningPlayer').disabled=on||!!fixedPlayer}};
  window.addEventListener('online',flush);
  window.addEventListener('storage',e=>{if(e.key?.startsWith(PREFIX)){if(e.newValue===null)memory.delete(e.key);void flush()}});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void flush()});
  setInterval(flush,15000);status();void flush();
})();
