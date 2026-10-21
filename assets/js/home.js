/* Home page: hero, marquee, project list, about, resume, contact */
(function(){
  'use strict';
  const C=window.Core, {$, $$, gsap, reduced, fine}=C;
  const P=(window.PROJECTS||[]).filter(p=>!p.hidden);   // hidden projects stay in data.js but never render
  const ST=window.ScrollTrigger;

  /* ---------- tags used by the capability grid ---------- */
  const TAGS={
    game:['drive-syndicate','hyperdrive-hud','asphalt-special-events','asphalt-hyperdrive','asphalt-sonic','speedstorm-game-ui','speedstorm-factions','speedstorm-ui-explorations','kavinsky-special-event','asphalt-game-ui','asphalt-loading-screens','space-miner'],
    feature:['drive-syndicate','asphalt-sonic','speedstorm-factions','kavinsky-special-event'],
    brand:['kavinsky-special-event','asphalt-special-events','asphalt-sonic','asphalt-hyperdrive','asphalt-activation-event','speedstorm-streaming-overlays','asphalt-corporate-presentation','streammask-overlays','speedstorm-esports','logos-symbols','asphalt-3d-car-integration'],
    web:['vw-t-cross','vw-tiguan','vw-golf-r','space-miner']
  };
  const statP=document.querySelector('[data-stat-projects]'); if(statP){ statP.dataset.countup=P.length; statP.textContent=String(P.length).padStart(2,'0'); }
  $$('[data-cap-count]').forEach(el=>{ el.dataset.countup=(TAGS[el.dataset.capCount]||[]).filter(s=>P.some(p=>p.slug===s)).length; el.dataset.pad='2'; });

  /* ---------- render project list ---------- */
  const list=$('[data-plist]');
  const pad=n=>String(n).padStart(2,'0');
  const arrow='<svg class="prow__arrow" viewBox="0 0 28 28" aria-hidden="true"><path d="M6 22 22 6M10 6h12v12" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  list.innerHTML=P.map((p,i)=>`
    <li class="prow" data-cat="${p.cat}" data-i="${i}">
      <a href="project.html?p=${p.slug}" data-transition="${p.title}" data-cursor-ink>
        <span class="prow__fill"></span>
        <span class="prow__thumb"><img src="assets/img/${p.slug}/thumb.webp" alt="" loading="lazy" width="720" height="450"></span>
        <span class="prow__idx mono" data-idx>${pad(i+1)}</span>
        <span class="prow__title display">${p.title.replace(/(\S*-\S*)/g,'<span class="cword">$1</span>')}${p.sub?` <em>${p.sub}</em>`:''}</span>
        <span class="prow__meta mono">${p.game}</span>
        <span class="prow__meta prow__meta--svc mono">${p.services.split(',')[0]}</span>
        ${arrow}
      </a>
    </li>`).join('');
  const cnt=$('[data-work-count]'); if(cnt) cnt.textContent=`(${pad(P.length)})`;

  // filter counts
  $$('[data-filter]').forEach(b=>{
    const f=b.dataset.filter, n=f==='all'?P.length:P.filter(p=>p.cat===f).length;
    $('sup',b).textContent=pad(n);
  });

  /* ---------- floating preview + section bg (desktop) ---------- */
  const preview=$('[data-preview]'), pInner=preview&&$('.preview__inner',preview), pLabel=$('[data-preview-label]');
  const bg=$('[data-work-bg]');
  if(preview && fine){
    pInner.innerHTML=P.map(p=>`<img src="assets/img/${p.slug}/thumb.webp" alt="" loading="lazy">`).join('');
    bg.innerHTML=P.map(p=>`<img src="assets/img/${p.slug}/thumb.webp" alt="" loading="lazy">`).join('');
    const imgs=$$('img',pInner), bgs=$$('img',bg);
    let cur=-1, shown=false, z=1;
    const xTo=gsap.quickTo(preview,'x',{duration:.7,ease:'power3'}), yTo=gsap.quickTo(preview,'y',{duration:.7,ease:'power3'});
    const rTo=gsap.quickTo(preview,'rotation',{duration:.9,ease:'power3'});
    // The preview lives in the right part of the row (over the meta columns), never over the title,
    // follows the hovered row vertically and only drifts slightly with the cursor.
    let rowEl=null, mx=innerWidth/2, my=innerHeight/2, lastY=0;
    const target=()=>{
      if(!rowEl) return null;
      const w=preview.offsetWidth, h=preview.offsetHeight, a=rowEl.querySelector('a');
      const r=a.getBoundingClientRect();
      const meta=rowEl.querySelector('.prow__meta'), arrowW=40, gap=20;
      const titleEnd=(meta? meta.getBoundingClientRect().left : r.left+r.width*.55) - gap;
      let x=r.right-arrowW-gap-w;
      x=Math.max(x, Math.min(titleEnd, innerWidth-w-8));
      x+=(mx/innerWidth-.5)*24;
      const rc=r.top+r.height/2;
      let y=rc-h/2+(my-rc)*.25;
      y=gsap.utils.clamp(70, innerHeight-h-12, y);
      return {x,y};
    };
    const place=(instant)=>{ const t=target(); if(!t) return; if(instant){ gsap.set(preview,{x:t.x,y:t.y}); xTo(t.x,t.x); yTo(t.y,t.y); } else { xTo(t.x); yTo(t.y); } };
    window.addEventListener('pointermove',e=>{
      mx=e.clientX; my=e.clientY; place();
      const vy=e.clientY-lastY; lastY=e.clientY; rTo(gsap.utils.clamp(-6,6,vy*.35));
    },{passive:true});
    if(C.lenis) C.lenis.on('scroll',()=>place()); else window.addEventListener('scroll',()=>place(),{passive:true});
    // every thumb starts parked below the frame; GSAP owns the transform (no CSS transform to fight with)
    gsap.set(imgs,{yPercent:100});
    const park=im=>{ gsap.killTweensOf(im); gsap.set(im,{yPercent:100,scale:1}); };
    const show=i=>{
      if(i===cur) return;
      const prev=cur; cur=i;
      const dir = prev>-1 && i<prev ? -1 : 1;           // moving up the list -> slide from above
      imgs.forEach((im,k)=>{ if(k!==i && k!==prev) park(im); });
      bgs.forEach((b,k)=>b.classList.toggle('is-on',k===i));
      if(prev>-1){ gsap.killTweensOf(imgs[prev]); gsap.to(imgs[prev],{yPercent:-100*dir,duration:.7,ease:'expo.out'}); }
      z+=1; imgs[i].style.zIndex=z;
      gsap.killTweensOf(imgs[i]);
      gsap.fromTo(imgs[i],{yPercent:100*dir,scale:1.3},{yPercent:0,scale:1,duration:.8,ease:'expo.out'});
      pLabel.textContent=`${list.children[i].querySelector('[data-idx]').textContent} / ${P[i].game}`;
    };
    list.addEventListener('pointerover',e=>{
      const row=e.target.closest('.prow'); if(!row) return;
      const first=!shown; rowEl=row;
      if(first){ shown=true; place(true); gsap.to(preview,{opacity:1,clipPath:'inset(0% 0% 0% 0%)',duration:.7,ease:'expo.out'}); }
      else place();
      show(+row.dataset.i);
    });
    list.addEventListener('pointerleave',()=>{
      shown=false; cur=-1; rowEl=null;
      gsap.to(preview,{clipPath:'inset(50% 50% 50% 50%)',opacity:0,duration:.5,ease:'expo.inOut',onComplete:()=>{ if(cur<0) imgs.forEach(park); }});
      bgs.forEach(b=>b.classList.remove('is-on'));
    });
  } else if(preview){ preview.remove(); }

  /* ---------- filters ---------- */
  const filters=$$('[data-filter]'); let listBusy=false;
  filters.forEach(btn=>btn.addEventListener('click',()=>{
    if(btn.classList.contains('is-active')) return;
    filters.forEach(b=>b.classList.toggle('is-active',b===btn));
    const f=btn.dataset.filter, rows=$$('.prow',list);
    listBusy=true;
    const apply=()=>{
      let n=0;
      rows.forEach(r=>{ const on=f==='all'||r.dataset.cat===f; r.classList.toggle('is-out',!on); if(on) $('[data-idx]',r).textContent=pad(++n); });
      ST&&ST.refresh();
      gsap.fromTo($$('.prow:not(.is-out) a',list),{yPercent:100},{yPercent:0,duration:.8,stagger:.04,ease:'expo.out',overwrite:true,onComplete:()=>{listBusy=false;}});
    };
    if(reduced) return apply();
    gsap.to($$('.prow:not(.is-out) a',list),{yPercent:-100,duration:.35,stagger:.015,ease:'expo.in',onComplete:apply});
  }));

  /* ---------- HUD coordinates ---------- */
  const cx=$('[data-cx]'), cy=$('[data-cy]');
  if(cx) window.addEventListener('pointermove',e=>{cx.textContent=String(Math.round(e.clientX)).padStart(4,'0');cy.textContent=String(Math.round(e.clientY)).padStart(4,'0');},{passive:true});

  /* ---------- glass ---------- */
  const glassEl=$('[data-glass]');
  const glass=glassEl&&window.Glass&&!/noglass/.test(location.search)? Glass.mount(glassEl) : null;

  /* ---------- split targets ---------- */
  const heroChars=$$('.hero__title [data-split-chars]').map(el=>C.splitChars(el));
  const contactChars=$$('.contact__big [data-split-chars]').map(el=>C.splitChars(el)).flat();
  $$('[data-split-lines]').forEach(el=>{ el._lines=C.splitLines(el); });
  const fill=$('[data-fill]'); const fillWords=fill? C.splitWords(fill) : [];

  /* ---------- count up ---------- */
  function countUp(el,delay=0){
    const end=+el.dataset.countup, p=+(el.dataset.pad||0), from=end>1000? end-13 : 0, o={v:from};
    gsap.to(o,{v:end,duration:1.6,delay,ease:'expo.out',onUpdate:()=>{el.textContent=String(Math.round(o.v)).padStart(p,'0');}});
  }

  /* ---------- rotator ---------- */
  function startRotator(){
    const r=$('[data-rotator]'); if(!r||reduced) return;
    const words=$$('span',r); let i=0;
    gsap.set(words,{yPercent:110,visibility:'visible'}); gsap.set(words[0],{yPercent:0});
    setInterval(()=>{
      const a=words[i]; i=(i+1)%words.length; const b=words[i];
      gsap.to(a,{yPercent:-110,duration:.8,ease:'expo.inOut'});
      gsap.fromTo(b,{yPercent:110},{yPercent:0,duration:.8,ease:'expo.inOut'});
    },2300);
  }

  /* ---------- marquees (scroll-velocity driven) ---------- */
  function marquees(){
    $$('[data-marquee]').forEach(m=>{
      const track=$('.marquee__track',m), item=$('.marquee__item',track);
      for(let k=0;k<3;k++) track.appendChild(item.cloneNode(true));
      const dir=+(m.dataset.dir||1);
      const tween= dir>0
        ? gsap.fromTo(track,{xPercent:0},{xPercent:-25,duration:22,ease:'none',repeat:-1})
        : gsap.fromTo(track,{xPercent:-25},{xPercent:0,duration:30,ease:'none',repeat:-1});
      let boost=1;
      const onV=v=>{ boost=1+Math.min(Math.abs(v)*.15,6); };
      if(C.lenis) C.lenis.on('scroll',e=>onV(e.velocity));
      gsap.ticker.add(()=>{ boost+= (1-boost)*.06; tween.timeScale(boost); });
      if(reduced) tween.pause();
    });
  }

  /* ---------- intro (after preloader / wipe) ---------- */
  function intro(){
    const tl=gsap.timeline({defaults:{ease:'expo.out'}});
    tl.from(heroChars.flat(),{yPercent:110,rotate:6,duration:1.4,stagger:.04})
      .add(()=>glass&&glass.play(),'<')
      .from('[data-hero-pill],[data-hero-hud]',{y:20,opacity:0,duration:1},'<.3')
      .from('[data-hero-claim] .line-mask > span',{yPercent:110,duration:1.1,stagger:.1},'<.2')
      .from('[data-hero-copy] > *',{y:30,opacity:0,duration:1,stagger:.1},'<.15')
      .from('.stats .stat',{y:40,opacity:0,duration:1,stagger:.08},'<.1')
      .from('.nav',{yPercent:-100,duration:1,clearProps:'transform'},'<');
    tl.add(()=>{ $$('[data-stats] [data-countup]').forEach((el,i)=>countUp(el,i*.08)); startRotator(); },'<');
  }

  /* ---------- scroll choreography ---------- */
  function scrollFx(){
    if(!ST) return;
    // glass drifts and spins with scroll
    if(glassEl){
      gsap.to(glassEl,{yPercent:28,scale:.82,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true,onUpdate:s=>glass&&glass.setScroll(s.progress)}});
      gsap.to('.hero__title',{yPercent:-18,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    }
    // line reveals
    $$('[data-split-lines]').forEach(el=>{
      gsap.from(el._lines,{yPercent:110,duration:1.2,stagger:.08,ease:'expo.out',scrollTrigger:{trigger:el,start:'top 85%'}});
    });
    // project rows
    ST.batch('.prow a',{start:'top 92%',once:true,onEnter:b=>{ if(!listBusy) gsap.fromTo(b,{yPercent:100},{yPercent:0,duration:1,stagger:.05,ease:'expo.out'}); }});
    // fill paragraph
    if(fillWords.length){
      gsap.to(fillWords,{color:'#f2f2ee',stagger:.1,ease:'none',scrollTrigger:{trigger:fill,start:'top 80%',end:'bottom 50%',scrub:true}});
    }
    // variable font morph on the big UI
    const big=$('[data-bigui]');
    if(big){
      gsap.fromTo(big,{fontVariationSettings:'"wdth" 62, "wght" 200'},{fontVariationSettings:'"wdth" 125, "wght" 900',ease:'none',scrollTrigger:{trigger:big,start:'top 95%',end:'bottom 35%',scrub:true}});
    }
    // meters
    $$('[data-meters] .meter').forEach((m,mi)=>{
      const bar=$('.meter__bar',m); bar.innerHTML='<i></i>'.repeat(20);
      const segs=$$('i',bar), val=+m.dataset.value, on=Math.round(val/5), num=$('[data-meter-num]',m);
      ST.create({trigger:m,start:'top 88%',once:true,onEnter:()=>{
        segs.slice(0,on).forEach((s,i)=>setTimeout(()=>s.classList.add('on'),mi*120+i*45));
        const o={v:0}; gsap.to(o,{v:val,duration:1.2,delay:mi*.12,ease:'power2.out',onUpdate:()=>num.textContent=Math.round(o.v)});
      }});
    });
    // capability grid
    ST.create({trigger:'[data-caps]',start:'top 85%',once:true,onEnter:()=>{
      gsap.from('.cap',{y:60,opacity:0,duration:1,stagger:.08,ease:'expo.out'});
      $$('[data-cap-count]').forEach((el,i)=>countUp(el,i*.1));
    }});
    // resume rows
    ST.batch('[data-reveal]',{start:'top 90%',once:true,onEnter:b=>gsap.from(b,{y:40,opacity:0,duration:1,stagger:.08,ease:'expo.out'})});
    // contact
    gsap.from(contactChars,{yPercent:110,rotate:8,duration:1.3,stagger:.035,ease:'expo.out',scrollTrigger:{trigger:'.contact__big',start:'top 80%'}});
    gsap.fromTo('.contact__big',{fontVariationSettings:'"wdth" 70, "wght" 300'},{fontVariationSettings:'"wdth" 125, "wght" 900',ease:'none',scrollTrigger:{trigger:'.contact',start:'top bottom',end:'center center',scrub:true}});
    // scroll spy
    $$('[data-section]').forEach(sec=>{
      const id=sec.dataset.section;
      ST.create({trigger:sec,start:'top 50%',end:'bottom 50%',onToggle:s=>{ if(s.isActive) $$('[data-spy]').forEach(a=>a.classList.toggle('is-active',a.dataset.spy===id)); else if(id==='work'&&s.direction<0) $$('[data-spy]').forEach(a=>a.classList.remove('is-active')); }});
    });
  }

  /* ---------- boot ---------- */
  const critical=['assets/brand/brand.png', ...P.slice(0,10).map(p=>`assets/img/${p.slug}/thumb.webp`)];
  marquees();
  if(reduced){
    C.preload(critical).then(()=>{ glass&&glass.play(); scrollFx(); });
    return;
  }
  scrollFx();
  gsap.set('.hero__title, .hero__lede, .stats, .hero__top',{visibility:'visible'});
  // hide hero bits until intro runs
  gsap.set(heroChars.flat(),{yPercent:110});
  C.preload(critical).then(()=>{
    gsap.set(heroChars.flat(),{clearProps:'transform'});
    intro();
    if(location.hash){ const t=document.querySelector(location.hash); if(t) setTimeout(()=>C.scrollTo(t),300); }
  });
})();
