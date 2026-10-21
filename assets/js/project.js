/* Project detail page (data-driven: project.html?p=<slug>) */
(function(){
  'use strict';
  const C=window.Core, {$, $$, gsap, reduced}=C;
  const P=(window.PROJECTS||[]).filter(p=>!p.hidden);   // hidden projects stay in data.js but never render
  const ST=window.ScrollTrigger;
  const pad=n=>String(n).padStart(2,'0');

  const slug=new URLSearchParams(location.search).get('p');
  let i=P.findIndex(p=>p.slug===slug); if(i<0) i=0;
  const p=P[i], next=P[(i+1)%P.length], prev=P[(i-1+P.length)%P.length];
  const base=`assets/img/${p.slug}/`;

  document.title=`${p.title}${p.sub?' — '+p.sub:''} · ${p.game} — Toni Santafé`;

  /* ---------- fill content ---------- */
  $('[data-p-crumb]').textContent=`${p.game}`;
  $('[data-p-index]').textContent=`${pad(i+1)} / ${pad(P.length)}`;
  const title=$('[data-p-title]');
  title.innerHTML=`<span class="row">${p.title}<span class="acid">.</span></span>`;
  const sub=$('[data-p-sub]'); if(p.sub) sub.textContent=p.sub; else sub.remove();
  $('[data-p-meta]').innerHTML=[
    ['Client',p.client],['Project',p.game],['Services',p.services],['Index',`${pad(i+1)} of ${pad(P.length)}`]
  ].map(([k,v])=>`<div><span class="mono dim">${k}</span><p class="v">${v}</p></div>`).join('');
  const cover=$('[data-p-cover-img]'); cover.src=base+'cover.webp'; cover.alt=`${p.title} — ${p.game}`;
  $('[data-p-text]').innerHTML=p.text.map(t=>`<p class="fillp">${t}</p>`).join('');

  const gal=$('[data-p-gallery]');
  const total=p.slices.length;
  const sections=p.sections||[];
  // optional anatomy / spec grid (Labra-style cells) between the overview and the images
  if(p.specs&&p.specs.length){
    const sp=document.createElement('section'); sp.className='p-specs';
    sp.innerHTML=`<div class="section-index mono"><span class="tag">Anatomy</span><span class="dim">${pad(p.specs.length)} parts</span></div>
      <div class="p-specs__grid">${p.specs.map(([k,t,d])=>`<div class="p-spec" data-spec><span class="p-spec__k display">${k}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}</div>`;
    gal.parentNode.insertBefore(sp,gal);
  }
  gal.innerHTML=p.slices.map((sheet,si)=>{
    const sec=sections.findIndex(x=>x.at===si);
    const head= sec<0? '' : `<header class="p-section" data-psec>
        <span class="mono acid">${pad(sec+1)} / ${pad(sections.length)}</span>
        <h2 class="display">${sections[sec].title}</h2>
        ${sections[sec].text?`<p>${sections[sec].text}</p>`:''}
      </header>`;
    const label=(p.sheetLabels&&p.sheetLabels[si])||`Sheet ${pad(si+1)}`;
    return `${head}
    <div class="p-sheet" data-sheet>
      <div class="p-sheet__label mono dim"><span>${p.title} — ${label}</span><span>${pad(si+1)} / ${pad(total)}</span></div>
      <span class="cross tl"></span><span class="cross tr"></span><span class="cross bl"></span><span class="cross br"></span>
      ${sheet.map(([f,w,h],k)=>`<img src="${base}${f}" width="${w}" height="${h}" alt="${k===0?`${p.title} — ${label}`:''}" ${si===0&&k<2?'':'loading="lazy"'} decoding="async">`).join('')}
    </div>`;}).join('');

  const nx=$('[data-p-next]');
  nx.href=`project.html?p=${next.slug}`; nx.dataset.transition=next.title;
  $('[data-p-next-img]').src=`assets/img/${next.slug}/cover.webp`;
  $('[data-p-next-title]').innerHTML=`${next.title}<span class="acid">.</span>`;
  $('[data-p-next-meta]').textContent=`${next.game} · ${next.services}`;
  $('[data-p-next-idx]').textContent=`${pad((i+1)%P.length+1)} / ${pad(P.length)}`;

  // images fade in as they decode (each slice keeps its reserved height, so no layout shift)
  $$('.p-sheet img').forEach(img=>{
    const on=()=>img.classList.add('is-in');
    if(img.complete && img.naturalWidth) on(); else img.addEventListener('load',on,{once:true});
  });

  // keyboard: ← → between projects
  document.addEventListener('keydown',e=>{
    if(e.target.closest('input,textarea')) return;
    if(e.key==='ArrowRight') C.leaveTo(`project.html?p=${next.slug}`,next.title);
    if(e.key==='ArrowLeft') C.leaveTo(`project.html?p=${prev.slug}`,prev.title);
  });

  /* ---------- motion ---------- */
  const chars=C.splitChars($('.row',title));
  const words=$$('.fillp').flatMap(el=>C.splitWords(el));
  if(!reduced){
    gsap.set(chars,{yPercent:110});
    gsap.set('.p-meta > div, .p-hero__crumbs, [data-p-sub]',{opacity:0,y:24});
  }

  C.enterWipe().then(()=>{
    if(reduced){ words.forEach(w=>w.style.color='inherit'); return; }
    gsap.timeline({defaults:{ease:'expo.out'}})
      .to(chars,{yPercent:0,duration:1.3,stagger:.03})
      .to('.p-hero__crumbs, [data-p-sub]',{opacity:1,y:0,duration:1},'<.2')
      .to('.p-meta > div',{opacity:1,y:0,duration:1,stagger:.07},'<.1')
      .to('.p-cover',{clipPath:'inset(0% 0% 0% 0%)',duration:1.6,ease:'expo.inOut'},'<-.1')
      .to('.p-cover img',{scale:1,duration:1.8,ease:'expo.out'},'<.3');
    scrollFx();
  });

  function scrollFx(){
    if(!ST) return;
    gsap.fromTo('.p-cover img',{yPercent:0},{yPercent:-16,ease:'none',scrollTrigger:{trigger:'.p-cover',start:'top top',end:'bottom top',scrub:true}});
    gsap.to('.p-title',{yPercent:30,opacity:.2,ease:'none',scrollTrigger:{trigger:'.p-hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.to(words,{color:'#f2f2ee',stagger:.1,ease:'none',scrollTrigger:{trigger:'.p-intro',start:'top 75%',end:'bottom 55%',scrub:true}});
    $$('[data-psec]').forEach(h=>gsap.from(h.children,{y:40,opacity:0,duration:1,stagger:.08,ease:'expo.out',scrollTrigger:{trigger:h,start:'top 85%'}}));
    if($('.p-specs')) gsap.from('[data-spec]',{y:50,opacity:0,duration:1,stagger:.08,ease:'expo.out',scrollTrigger:{trigger:'.p-specs',start:'top 80%'}});
    $$('[data-sheet]').forEach(s=>{
      gsap.from(s,{y:120,opacity:0,duration:1.2,ease:'expo.out',scrollTrigger:{trigger:s,start:'top 92%'}});
      gsap.from($$('.cross',s),{scale:0,rotate:90,duration:.8,stagger:.06,ease:'back.out(3)',scrollTrigger:{trigger:s,start:'top 80%'}});
    });
    // progress rail
    const rail=$('.p-rail'), fillBar=$('.p-rail__track i'), num=$('[data-rail-num]');
    ST.create({trigger:gal,start:'top 80%',end:'bottom bottom',
      onToggle:s=>rail.classList.toggle('is-on',s.isActive),
      onUpdate:s=>{ fillBar.style.transform=`scaleY(${s.progress})`; num.textContent=String(Math.round(s.progress*100)).padStart(3,'0'); }});
    // next project
    gsap.fromTo('.p-next__bar i',{scaleX:0},{scaleX:1,ease:'none',scrollTrigger:{trigger:'.p-next',start:'top 80%',end:'bottom bottom',scrub:true}});
    gsap.from('.p-next__title',{yPercent:40,opacity:0,duration:1.2,ease:'expo.out',scrollTrigger:{trigger:'.p-next',start:'top 70%'}});
    gsap.fromTo('.p-next__title',{fontVariationSettings:'"wdth" 70, "wght" 300'},{fontVariationSettings:'"wdth" 125, "wght" 900',ease:'none',scrollTrigger:{trigger:'.p-next',start:'top bottom',end:'bottom bottom',scrub:true}});
    // re-measure once lazy images settle
    window.addEventListener('load',()=>ST.refresh());
  }
})();
