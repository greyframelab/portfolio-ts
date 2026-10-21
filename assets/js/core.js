/* Shared chrome: smooth scroll, cursor, nav, menu, text utils, page transitions, preloader */
(function(){
  'use strict';
  const html = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const hasGsap = !!window.gsap;
  if(hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  const $ = (s,c=document)=>c.querySelector(s);
  const $$ = (s,c=document)=>[...c.querySelectorAll(s)];

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if(!reduced && window.Lenis && hasGsap){
    lenis = new Lenis({duration:1.15, easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)), smoothWheel:true});
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t=>lenis.raf(t*1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = (target)=>{
    if(lenis) lenis.scrollTo(target,{duration:1.4,offset:0});
    else { const el = typeof target==='string'? document.querySelector(target) : target; (el===0||target==='#top')? window.scrollTo({top:0,behavior:'smooth'}) : el && el.scrollIntoView({behavior:'smooth'}); }
  };
  const lock = (on)=>{ if(lenis){ on? lenis.stop() : lenis.start(); } document.body.classList.toggle('is-locked',on); };

  /* ---------- text utils ---------- */
  function splitChars(el){
    const out=[];
    const walk=(node)=>{
      [...node.childNodes].forEach(n=>{
        if(n.nodeType===3){
          // chars are grouped per word so lines never break mid-word
          const frag=document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(w=>{
            if(!w) return;
            if(/^\s+$/.test(w)){frag.appendChild(document.createTextNode(' '));return;}
            const wrap=document.createElement('span'); wrap.className='cword';
            [...w].forEach(ch=>{ const s=document.createElement('span'); s.className='char'; s.textContent=ch; wrap.appendChild(s); out.push(s); });
            frag.appendChild(wrap);
          });
          node.replaceChild(frag,n);
        } else if(n.nodeType===1){ walk(n); }
      });
    };
    walk(el); return out;
  }
  function splitWords(el){
    const out=[];
    const walk=(node)=>{
      [...node.childNodes].forEach(n=>{
        if(n.nodeType===3){
          const frag=document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(w=>{
            if(!w) return;
            if(/^\s+$/.test(w)){frag.appendChild(document.createTextNode(' '));return;}
            const s=document.createElement('span'); s.className='word'; s.textContent=w; frag.appendChild(s); out.push(s);
          });
          node.replaceChild(frag,n);
        } else if(n.nodeType===1 && n.tagName!=='BR'){ walk(n); }
      });
    };
    walk(el); return out;
  }
  // wraps each visual line (split by <br>) in a mask
  function splitLines(el){
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map(p=>`<span class="line-mask"><span class="line-in">${p}</span></span>`).join('');
    return $$('.line-in',el);
  }

  const GLYPHS='!<>-_\\/[]{}—=+*^?#01';
  function scramble(el){
    if(el._scr) return; el._scr=true;
    const final = el.dataset.text || (el.dataset.text = el.textContent);
    let frame=0; const len=final.length;
    const tick=()=>{
      let out='';
      for(let i=0;i<len;i++){
        if(final[i]===' ' || i < frame/2) out+=final[i];
        else out+=GLYPHS[(Math.random()*GLYPHS.length)|0];
      }
      el.textContent=out; frame++;
      if(frame/2<=len) requestAnimationFrame(tick); else { el.textContent=final; el._scr=false; }
    };
    tick();
  }
  $$('[data-scramble]').forEach(el=>el.addEventListener('mouseenter',()=>scramble(el)));

  /* ---------- cursor ---------- */
  const cursor = $('.cursor');
  if(cursor && fine && hasGsap && !reduced){
    html.classList.add('has-cursor');
    const dot=$('.cursor__dot',cursor), ring=$('.cursor__ring',cursor), label=$('.cursor__label',cursor);
    const dx=gsap.quickTo(dot,'x',{duration:.08}), dy=gsap.quickTo(dot,'y',{duration:.08});
    const rx=gsap.quickTo(ring,'x',{duration:.45,ease:'power3'}), ry=gsap.quickTo(ring,'y',{duration:.45,ease:'power3'});
    window.addEventListener('pointermove',e=>{cursor.classList.add('is-ready');dx(e.clientX);dy(e.clientY);rx(e.clientX);ry(e.clientY);},{passive:true});
    document.addEventListener('mouseover',e=>{
      const v=e.target.closest('[data-cursor]');
      const l=e.target.closest('a,button,[data-cursor-link]');
      cursor.classList.toggle('is-hover',!!v);
      cursor.classList.toggle('is-link',!v && !!l);
      cursor.classList.toggle('is-ink',!!e.target.closest('[data-cursor-ink]'));
      if(v) label.textContent=v.dataset.cursor;
    });
    document.documentElement.addEventListener('mouseleave',()=>cursor.classList.remove('is-ready'));
  } else if(cursor){ cursor.remove(); }

  /* ---------- magnetic ---------- */
  if(fine && hasGsap && !reduced){
    $$('[data-magnetic]').forEach(el=>{
      const xTo=gsap.quickTo(el,'x',{duration:.6,ease:'elastic.out(1,.4)'}), yTo=gsap.quickTo(el,'y',{duration:.6,ease:'elastic.out(1,.4)'});
      el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();xTo((e.clientX-r.left-r.width/2)*.18);yTo((e.clientY-r.top-r.height/2)*.35);});
      el.addEventListener('pointerleave',()=>{xTo(0);yTo(0);});
    });
  }

  /* ---------- nav ---------- */
  const nav=$('.nav'), prog=$('.nav__progress i');
  let lastY=0;
  const onScroll=()=>{
    const y=window.scrollY, max=document.documentElement.scrollHeight-innerHeight;
    if(prog) prog.style.transform=`scaleX(${max>0?y/max:0})`;
    if(nav){
      nav.classList.toggle('is-solid',y>40);
      if(!document.body.classList.contains('is-locked')) nav.classList.toggle('is-hidden', y>lastY && y>innerHeight*.6);
    }
    lastY=y;
  };
  if(lenis) lenis.on('scroll',onScroll); else window.addEventListener('scroll',onScroll,{passive:true});

  // anchor links
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href^="#"]'); if(!a) return;
    const id=a.getAttribute('href'); if(id.length<2) return;
    const t=document.querySelector(id); if(!t) return;
    e.preventDefault(); closeMenu(); scrollTo(id==='#top'?0:t);
  });

  /* ---------- menu ---------- */
  const menu=$('.menu'), openBtn=$('[data-menu-open]');
  let menuOpen=false;
  function openMenu(){
    if(!menu||menuOpen) return; menuOpen=true; lock(true);
    menu.setAttribute('aria-hidden','false'); openBtn&&openBtn.setAttribute('aria-expanded','true');
    if(hasGsap){
      gsap.set(menu,{visibility:'visible'});
      gsap.fromTo(menu,{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0% 0)',duration:.8,ease:'expo.inOut'});
      gsap.fromTo($$('.menu__list a',menu),{yPercent:110},{yPercent:0,duration:.9,stagger:.06,ease:'expo.out',delay:.35});
    } else { menu.style.visibility='visible'; menu.style.clipPath='none'; }
  }
  function closeMenu(){
    if(!menu||!menuOpen) return; menuOpen=false; lock(false);
    menu.setAttribute('aria-hidden','true'); openBtn&&openBtn.setAttribute('aria-expanded','false');
    if(hasGsap) gsap.to(menu,{clipPath:'inset(100% 0 0% 0)',duration:.7,ease:'expo.inOut',onComplete:()=>gsap.set(menu,{visibility:'hidden'})});
    else menu.style.visibility='hidden';
  }
  openBtn&&openBtn.addEventListener('click',openMenu);
  $$('[data-menu-close]').forEach(b=>b.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeMenu(); });

  /* ---------- clock + year ---------- */
  const clocks=$$('[data-clock]');
  const tickClock=()=>{
    let s='';
    try{ s=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(new Date()); }catch(e){ s=new Date().toTimeString().slice(0,5); }
    clocks.forEach(c=>c.textContent=s);
  };
  tickClock(); setInterval(tickClock,15000);
  $$('[data-year]').forEach(y=>y.textContent=new Date().getFullYear());

  /* ---------- page transitions ---------- */
  const wipe=$('.wipe');
  function leaveTo(url,label){
    if(!hasGsap||reduced||!wipe){ location.href=url; return; }
    lock(true);
    const a=$('.wipe__panel--a',wipe), b=$('.wipe__panel--b',wipe), l=$('.wipe__label',wipe);
    l.textContent=label||'';
    gsap.timeline({onComplete:()=>{location.href=url;}})
      .set([a,b],{transformOrigin:'50% 100%'})
      .to(a,{scaleY:1,duration:.55,ease:'expo.in'})
      .to(b,{scaleY:1,duration:.55,ease:'expo.inOut'},'-=.2')
      .fromTo(l,{opacity:0,yPercent:40},{opacity:1,yPercent:0,duration:.4,ease:'expo.out'},'-=.15');
  }
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[data-transition]');
    if(!a||e.metaKey||e.ctrlKey||e.shiftKey||e.button===1) return;
    e.preventDefault(); leaveTo(a.getAttribute('href'),a.dataset.transition);
  });
  // bfcache: undo a leave animation when coming back
  window.addEventListener('pageshow',e=>{ if(e.persisted && wipe && hasGsap){ gsap.set($$('.wipe__panel',wipe),{scaleY:0}); gsap.set($('.wipe__label',wipe),{opacity:0}); lock(false);} });

  function enterWipe(){
    return new Promise(res=>{
      if(!wipe||!hasGsap){ html.classList.remove('enter-wipe'); res(); return; }
      const b=$('.wipe__panel--b',wipe);
      gsap.set(b,{scaleY:1,transformOrigin:'50% 0%'});
      html.classList.remove('enter-wipe');
      gsap.to(b,{scaleY:0,duration:reduced?.01:.9,ease:'expo.inOut',delay:.05,onComplete:res});
      setTimeout(res, reduced? 0 : 380); // start intro while wipe is still opening
    });
  }

  /* ---------- preloader ---------- */
  function preload(urls){
    const loader=$('.loader');
    const skip = html.classList.contains('no-loader') || !loader || !hasGsap;
    if(skip){ if(loader) loader.remove(); return enterWipe(); }
    lock(true);
    return new Promise(resolve=>{
      const countEl=$('[data-count]',loader), files=$('[data-load-files]',loader), bar=$('.loader__bar i',loader);
      const mark=$('.loader__mark img',loader), rect=$('.loader__mark rect',loader);
      let done=0; const total=urls.length||1;
      const state={p:0}; let target=0;
      urls.forEach(u=>{ const im=new Image(); im.onload=im.onerror=()=>{done++; target=done/total; files.textContent=String(done).padStart(2,'0');}; im.src=u; });
      if(!urls.length) target=1;
      gsap.to(rect,{strokeDashoffset:0,duration:1.6,ease:'expo.inOut'});
      gsap.to(mark,{clipPath:'inset(0% 0 0 0)',duration:1.2,ease:'expo.inOut',delay:.4});
      const minTime = reduced? 0 : 1900, t0=performance.now();
      const step=()=>{
        const tcap = Math.min(1,(performance.now()-t0)/minTime);
        const goal = Math.min(target, tcap);
        state.p += (goal-state.p)*.08;
        if(goal>=1 && state.p>.995) state.p=1;
        countEl.textContent=String(Math.round(state.p*100)).padStart(3,'0');
        bar.style.transform=`scaleX(${state.p})`;
        if(state.p<1) requestAnimationFrame(step); else exit();
      };
      setTimeout(()=>{ target=Math.max(target,1); }, 6000); // never hang on a slow asset
      requestAnimationFrame(step);
      function exit(){
        try{ sessionStorage.setItem('ts-seen','1'); }catch(e){}
        const tl=gsap.timeline({onComplete:()=>{ loader.remove(); lock(false); }});
        tl.to(countEl,{yPercent:-105,duration:.7,ease:'expo.in'})
          .to([$('.loader__top',loader),$('.loader__bottom .mono',loader),$('.loader__mark',loader)],{opacity:0,duration:.4},'<')
          .to(loader,{clipPath:'inset(0 0 100% 0)',duration:1.05,ease:'expo.inOut'},'-=.1')
          .add(()=>resolve(),'-=.6');
      }
    });
  }

  window.Core={ $, $$, gsap:window.gsap, lenis, reduced, fine, splitChars, splitWords, splitLines, scramble, scrollTo, preload, enterWipe, leaveTo, lock };
})();
