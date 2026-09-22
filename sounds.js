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
  function unlock(preview=false){
    if(!enabled&&!preview)return null;
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
  const recipes={
    tap:{
      soft:{name:'Soft click',notes:[[520,0,.055,.25,'sine',310]]},
      pop:{name:'Bubble pop',notes:[[280,0,.12,.45,'sine',780]]},
      wood:{name:'Wooden tap',notes:[[340,0,.085,.32,'triangle',150],[780,0,.035,.08,'sine']]},
      arcade:{name:'Arcade blip',notes:[[740,0,.065,.15,'square',980]]}
    },
    correct:{
      chime:{name:'Warm chime',notes:[[659.25,0,.18,.42,'triangle'],[987.77,.065,.25,.38],[1318.51,.09,.20,.09]]},
      coin:{name:'Game coin',notes:[[988,0,.09,.17,'square'],[1319,.085,.30,.15,'square']]},
      marimba:{name:'Marimba',notes:[[523.25,0,.22,.5],[659.25,.1,.24,.45],[783.99,.2,.3,.4]]},
      sparkle:{name:'Sparkle',notes:[[880,0,.22,.3],[1174.66,.07,.24,.27],[1479.98,.14,.26,.22],[1760,.21,.32,.15]]}
    }
  };
  const selected={tap:'soft',correct:'chime'};
  for(const kind of Object.keys(selected)){try{const saved=localStorage.getItem('flash-sound-'+kind);if(recipes[kind][saved])selected[kind]=saved}catch{}}
  let previewSequence=0;
  function play(kind,choice=selected[kind],preview=false){
    const ctx=unlock(preview);if(!ctx){if(preview)message.textContent='Audio is unavailable in this browser. Try opening the app in Safari.';return}
    const sequence=++previewSequence;
    const schedule=()=>{
      if((!enabled&&!preview)||document.hidden||ctx.state!=='running'||sequence!==previewSequence)return;
      try{
        if(kind==='tap'&&!preview){if(performance.now()-lastTap<55)return;lastTap=performance.now()}
        const t=ctx.currentTime+.005;
        for(const [freq,delay,duration,volume,type='sine',end=freq] of recipes[kind][choice].notes)note(ctx,freq,t+delay,duration,volume,type,end);
        if(preview)message.textContent='Playing: '+recipes[kind][choice].name;
      }catch{if(preview)message.textContent='Could not play audio. Try tapping Preview again.'}
    };
    if(ctx.state==='running')schedule();else ctx.resume().then(schedule).catch(()=>{if(preview)message.textContent='Tap Preview again to enable audio.'});
  }
  const opener=document.createElement('button');opener.type='button';opener.id='chooseSounds';opener.className='btn';opener.textContent='Choose sounds';opener.style.cssText=toggle.style.cssText;toggle.after(opener);
  const picker=document.createElement('dialog');picker.id='soundPicker';picker.setAttribute('aria-labelledby','soundPickerTitle');
  picker.style.cssText='background:var(--paper,var(--bg,#fff));color:inherit;border:1px solid;border-radius:16px;padding:20px;width:420px;max-width:calc(100vw - 24px);max-height:85dvh;overflow:auto';
  picker.innerHTML='<h2 id="soundPickerTitle">Choose your sounds</h2><p style="font-size:14px">Preview any sound, then select your favourite. Choices save automatically for both languages on this device.</p>'+
    Object.entries(recipes).map(([kind,options])=>'<fieldset style="border:0;padding:0;margin:20px 0"><legend style="font-weight:bold;margin-bottom:8px">'+(kind==='tap'?'Button presses':'Correct answers')+'</legend>'+Object.entries(options).map(([id,option])=>`<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid #8884;padding:4px 0"><label style="display:flex;align-items:center;gap:10px;min-height:44px;cursor:pointer"><input type="radio" name="sound-${kind}" value="${id}" ${selected[kind]===id?'checked':''} style="width:18px;height:18px;margin:0">${option.name}</label><button type="button" class="btn" data-preview-kind="${kind}" data-preview-id="${id}" aria-label="Preview ${option.name}" style="min-height:44px;padding:0 12px;font-size:13px">▶ Preview</button></div>`).join('')+'</fieldset>').join('')+
    '<p style="font-size:13px">Previews play even when game sounds are off.</p><p id="soundPreviewStatus" role="status" style="font-size:13px;min-height:20px"></p><button type="button" class="btn" id="closeSounds" style="width:100%">Done</button>';
  document.body.append(picker);const message=document.getElementById('soundPreviewStatus');
  opener.addEventListener('click',()=>{message.textContent='';picker.showModal()});
  document.getElementById('closeSounds').addEventListener('click',()=>picker.close());
  picker.addEventListener('click',e=>{const b=e.target.closest('[data-preview-kind]');if(b)play(b.dataset.previewKind,b.dataset.previewId,true)});
  picker.addEventListener('change',e=>{const input=e.target;if(input.type!=='radio')return;const kind=input.name.replace('sound-','');if(!recipes[kind]?.[input.value])return;selected[kind]=input.value;try{localStorage.setItem('flash-sound-'+kind,input.value);message.textContent='Selected '+recipes[kind][input.value].name}catch{message.textContent='Selected for this visit. Your browser could not save the preference.'}});
  // Avoid opening a settings dialog while a scored question's timer is running.
  const game=document.getElementById('game');if(game){const sync=()=>{opener.disabled=!game.hidden};new MutationObserver(sync).observe(game,{attributes:true,attributeFilter:['hidden']});sync()}
  toggle.addEventListener('click',()=>{
    enabled=!enabled;try{localStorage.setItem('flash-sound',enabled?'on':'off')}catch{}
    update();if(enabled)play('tap');else if(context)context.suspend().catch(()=>{});
  });
  // Unlock during a real gesture on iPhone, before the quiz processes its click.
  document.addEventListener('pointerdown',()=>unlock(),{capture:true,passive:true});
  document.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')unlock()},{capture:true});
  document.addEventListener('click',e=>{
    const target=e.target.closest('button,[role="button"]');
    if(!target||target.disabled||target===toggle||target===opener||target.closest('#soundPicker')||target.closest('#options')||target.id==='pGot'||target.id==='pAgain')return;
    play('tap');
  },true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&context)context.suspend().catch(()=>{})});
  window.addEventListener('storage',e=>{for(const kind of Object.keys(selected)){if(e.key==='flash-sound-'+kind&&recipes[kind][e.newValue]){selected[kind]=e.newValue;picker.querySelector(`input[name="sound-${kind}"][value="${e.newValue}"]`).checked=true}}if(e.key==='flash-sound'){enabled=e.newValue!=='off';update();if(!enabled&&context)context.suspend().catch(()=>{})}});
  window.FlashSounds={correct:()=>play('correct'),tap:()=>play('tap')};
})();
