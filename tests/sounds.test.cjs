const {JSDOM}=require('jsdom'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../sounds.js'),'utf8');
const counts={contexts:0,notes:0,suspended:0};
class AudioContext{
 constructor(){counts.contexts++;this.state='running';this.currentTime=0;this.destination={}}
 createGain(){return {gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}
 createOscillator(){return {frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){counts.notes++},stop(){}}}
 async resume(){this.state='running'}async suspend(){this.state='suspended';counts.suspended++}
}
const dom=new JSDOM('<main><button id="normal">Play</button><div id="options"><button id="answer">Answer</button></div></main>',{url:'https://example.com',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window;w.AudioContext=AudioContext;w.eval(source);assert.equal(counts.contexts,0,'no audio created on page load');
w.document.getElementById('normal').click();assert.equal(counts.notes,1,'soft tap');w.document.getElementById('answer').click();assert.equal(counts.notes,1,'answer click does not double up with chime');
w.FlashSounds.correct();assert.equal(counts.notes,4,'three-note correct chime');
w.document.getElementById('soundToggle').click();assert.equal(w.localStorage.getItem('flash-sound'),'off');assert.equal(w.document.getElementById('soundToggle').getAttribute('aria-pressed'),'false');w.FlashSounds.correct();assert.equal(counts.notes,4,'mute stops sound');assert.equal(counts.contexts,1,'one shared context');
const other=new JSDOM('<main></main>',{url:'https://example.com',runScripts:'outside-only'});other.window.eval(source);assert.doesNotThrow(()=>other.window.FlashSounds.correct(),'unsupported audio cannot break quiz');other.window.close();dom.window.close();console.log('PASS: gesture-only audio creation, tap and correct notes, no doubled answer click, persisted mute, shared context, unsupported-browser fallback');
