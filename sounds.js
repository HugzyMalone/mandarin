/* Small, locally synthesised UI sounds. No audio downloads or paid services. */
(()=>{
  let enabled=true,context=null,master=null,lastTap=-Infinity;
  try{enabled=localStorage.getItem('flash-sound')!=='off'}catch{}
  const toggle=document.createElement('button');toggle.type='button';toggle.id='soundToggle';toggle.className='btn';
  toggle.style.cssText='font-size:13px;min-height:44px;padding:0 12px';
  const update=()=>{toggle.textContent=enabled?'Sound: on':'Sound: off';toggle.setAttribute('aria-label','Sound effects');toggle.setAttribute('aria-pressed',String(enabled))};
  update();
  const player=document.getElementById('learningPlayer');
  if(player)player.parentElement.append(toggle);else document.querySelector('main').prepend(toggle);
  function unlock(){
    if(!enabled)return null;
    try{
      if(!context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return null;context=new Audio();master=context.createGain();master.gain.value=.22;master.connect(context.destination)}
      if(context.state!=='running')context.resume().catch(()=>{});
      return context;
    }catch{return null}
  }
  function note(ctx,freq,start,duration,volume,type='sine',end=freq){
    const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type=type;
    oscillator.frequency.setValueAtTime(freq,start);oscillator.frequency.exponentialRampToValueAtTime(end,start+duration);
    gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.006);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    oscillator.connect(gain);gain.connect(master);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()};oscillator.start(start);oscillator.stop(start+duration+.015);
  }
  function play(kind){
    const ctx=unlock();if(!ctx)return;
    const schedule=()=>{
      if(!enabled||document.hidden||ctx.state!=='running')return;
      try{
        const t=ctx.currentTime+.005;
        if(kind==='correct'){
          // A warm ascending pluck with a quiet, sparkling upper note.
          note(ctx,659.25,t,.18,.42,'triangle');
          note(ctx,987.77,t+.065,.25,.38);
          note(ctx,1318.51,t+.09,.20,.09);
        }else{
          if(performance.now()-lastTap<55)return;lastTap=performance.now();
          note(ctx,520,t,.055,.25,'sine',310);
        }
      }catch{/* Sound must never interrupt studying. */}
    };
    if(ctx.state==='running')schedule();else ctx.resume().then(schedule).catch(()=>{});
  }
  toggle.addEventListener('click',()=>{
    enabled=!enabled;try{localStorage.setItem('flash-sound',enabled?'on':'off')}catch{}
    update();if(enabled)play('tap');else if(context)context.suspend().catch(()=>{});
  });
  // Unlock during a real gesture on iPhone, before the quiz processes its click.
  document.addEventListener('pointerdown',unlock,{capture:true,passive:true});
  document.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')unlock()},{capture:true});
  document.addEventListener('click',e=>{
    const target=e.target.closest('button,[role="button"]');
    if(!target||target.disabled||target===toggle||target.closest('#options')||target.id==='pGot'||target.id==='pAgain')return;
    play('tap');
  },true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&context)context.suspend().catch(()=>{})});
  window.addEventListener('storage',e=>{if(e.key==='flash-sound'){enabled=e.newValue!=='off';update();if(!enabled&&context)context.suspend().catch(()=>{})}});
  window.FlashSounds={correct:()=>play('correct'),tap:()=>play('tap')};
})();
