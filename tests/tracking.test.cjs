// Run with NODE_PATH pointing to a jsdom installation: node tests/tracking.test.cjs
const {JSDOM,VirtualConsole}=require('jsdom'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),tracker=fs.readFileSync(path.join(root,'tracking.js'),'utf8');
async function fixture(language,{saved={},rows=[],online=false,ambiguous=false}={}){
 const file=language==='zh'?'index.html':'german/index.html';let html=fs.readFileSync(path.join(root,file),'utf8').replace(/<script src="[^\"]*tracking.js[^\"]*"[^>]*><\/script>/,'<script'+(language==='de'?' data-player="HUGZY"':'')+'>'+tracker+'</script>');
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));let posts=0;
 const dom=new JSDOM(html,{url:'https://hugzymalone.github.io/mandarin/'+(language==='de'?'german/':''),runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  w.scrollTo=()=>{};w.matchMedia=()=>({matches:true});w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
  for(const [k,v] of Object.entries(saved))w.localStorage.setItem(k,v);
  w.fetch=async(url,opts={})=>{
   if(!online)throw Error('offline');
   if(opts.method==='POST'){posts++;rows.push({...JSON.parse(opts.body),id:posts});if(ambiguous){ambiguous=false;throw Error('response lost')}return {ok:true,status:201,json:async()=>{throw Error('empty body')}}}
   const u=new URL(url),filter=u.searchParams.get('lesson');return {ok:true,status:200,json:async()=>filter?.startsWith('eq.')?rows.filter(r=>r.lesson===filter.slice(3)):filter?.startsWith('like.')?rows.filter(r=>r.lesson.startsWith(filter.slice(5).replace('*',''))):rows.slice()};
  }}});
 const w=dom.window;return {w,e:s=>w.eval(s),click:id=>w.document.getElementById(id).click(),errors,rows,posts:()=>posts,online:()=>{online=true},saved:()=>Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)])),close:()=>w.close()};
}
(async()=>{
 for(const lang of ['zh','de']){
  const f=await fixture(lang);const {w,e,click}=f;
  e(`openLesson(${JSON.stringify(lang==='zh'?'Dialogue 9':'Start here')});startGame()`);
  if(lang==='zh'){assert.equal(e('G'),null,'player required before quiz');assert(w.document.querySelector('dialog').open);w.document.querySelector('[data-player="AZZA"]').click()}assert.equal(e('G.player'),lang==='zh'?'AZZA':'HUGZY');assert(w.document.getElementById('learningPlayer').disabled);
  e('answer(G.answer)');await new Promise(r=>setTimeout(r,5));click('quit');
  e('startPractice();P.flipped=true;pGrade(false);P.flipped=true;pGrade(true)');await new Promise(r=>setTimeout(r,5));
  let saved=f.saved(),events=Object.entries(saved).filter(([k])=>k.startsWith('learning-outbox-v2:')).map(([,v])=>JSON.parse(v));assert.equal(events.length,3);assert(events.every(r=>r.lesson.length<=60&&r.name===(lang==='zh'?'AZZA':'HUGZY')&&r.total===200));assert.equal(events.filter(r=>r.correct===0).length,1);assert(w.document.getElementById('learningSync').textContent.includes('waiting'));
  assert.equal(f.errors.length,0);f.close();
  // Reload after quitting offline, then lose a POST response. Retry must not duplicate it.
  const g=await fixture(lang,{saved,online:true,ambiguous:true});await new Promise(r=>setTimeout(r,10));await g.w.Learning.flush();await g.w.Learning.flush();assert.equal(g.posts(),3);assert.equal(g.rows.length,3);assert(!Object.keys(g.saved()).some(k=>k.startsWith('learning-outbox-v2:')));assert(g.w.document.getElementById('learningSync').textContent.includes('synced'));assert.equal(g.errors.length,0);
  if(lang==='zh'){
   g.e('scores='+JSON.stringify(g.rows.map(r=>({...r,created_at:'2026-09-18T00:00:00Z'})))+';scores.push(scores[0]);buildChallenge()');assert(g.e('challenge.tracked'));assert(g.e('challenge.pool.length')>0);
  }
  g.close();
 }
 const scores=[['Start here',9,12],['Feelings and descriptions',9,12],['Greetings',10,13],['Numbers',16,16]].map(([lesson,correct,total],i)=>({id:i+1,name:'HUGZY',lesson:'de:beginner-v1:'+lesson,correct,total,score:correct*100,created_at:'2026-09-20T00:00:00Z'}));
 const p=await fixture('de',{rows:scores,online:true});await new Promise(r=>setTimeout(r,10));
 assert(p.w.document.getElementById('reviewSummary').textContent.includes('9/12'));assert(p.w.document.getElementById('reviewStrengths').textContent.includes('1 lessons'));assert.equal(p.e('reviewPool.length'),10);
 const key=p.e('Learning.hash(DE[0][1][0][0]+"|"+DE[0][1][0][2])');
 p.e('wordEvents='+JSON.stringify([{lesson:`ev2:de:qz:${key}:0000000000000000:000000000001`,correct:0,created_at:'2026-09-21'}])+';updateReview()');assert.equal(p.e('reviewPool.length'),1);
 p.e('wordEvents='+JSON.stringify([3,2,1].map(i=>({lesson:`ev2:de:qz:${key}:0000000000000000:00000000000${i+1}`,correct:1,created_at:'2026-09-22'})).concat([{lesson:`ev2:de:qz:${key}:0000000000000000:000000000001`,correct:0,created_at:'2026-09-21'}]))+';updateReview()');assert.equal(p.e('reviewPool.length'),10);
 assert.equal(p.errors.length,0);p.close();
 console.log('PASS both languages: player gate, fixed identity, quiz and practice recording, unfinished test retention, offline reload, ambiguous POST recovery, no duplicate retry, event schema, daily challenge integration');
})().catch(e=>{console.error(e);process.exitCode=1});
