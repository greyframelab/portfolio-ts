/* Iridescent glass blob — raymarched SDF in a fragment shader (no deps).
   window.Glass.mount(el) -> { setScroll(v), destroy() } */
(function(){
  const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
  const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uScroll; uniform float uIntro;
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float sdTorus(vec3 p,vec2 t){vec2 q=vec2(length(p.xz)-t.x,p.y);return length(q)-t.y;}
float map(vec3 p){
  float t=uTime;
  p.xy-=uMouse*.18;
  p.xz*=rot(t*.21+uMouse.x*.9+uScroll*1.6);
  p.yz*=rot(t*.17-uMouse.y*.7+uScroll*.8);
  float s=mix(.0,1.,uIntro);
  float d1=length(p-vec3(sin(t*.7)*.32,cos(t*.53)*.22,0.))-.56*s;
  float d2=length(p-vec3(cos(t*.61)*.48,sin(t*.83)*.34,sin(t*.43)*.3))-.40*s;
  vec3 q=p; q.xy*=rot(.9+sin(t*.3)*.4); q.yz*=rot(t*.25);
  float d3=sdTorus(q,vec2(.72*s,.17*s));
  float d=smin(smin(d1,d2,.38),d3,.32);
  d+=.035*sin(p.x*6.+t*1.1)*sin(p.y*5.+t*1.3)*sin(p.z*4.+t*.7);
  return d;
}
vec3 nrm(vec3 p){vec2 e=vec2(.0015,0.);return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  vec3 ro=vec3(0.,0.,3.1), rd=normalize(vec3(uv,-1.55));
  float t=0., minD=1e3, tMin=0.; bool hit=false;
  for(int i=0;i<64;i++){
    vec3 p=ro+rd*t; float d=map(p);
    if(d<minD){minD=d;tMin=t;}
    if(d<.0008){hit=true;break;}
    t+=d*.85; if(t>6.)break;
  }
  // analytic anti-aliasing: a ray that passes closer than one pixel footprint gets partial coverage
  float pxw=2./(uRes.y*1.55);
  float cov=1., glow=0.;
  if(!hit){
    cov=1.-smoothstep(0.,pxw*tMin*1.6,minD);
    glow=exp(-minD*14.)*.09;
    if(cov<=.001){ gl_FragColor=vec4(vec3(.83,1.,.23),glow); return; }
    t=tMin;
  }
  vec3 p=ro+rd*t, n=nrm(p), r=reflect(rd,n);
  float fres=pow(1.-max(dot(-rd,n),0.),2.0);
  float tt=uTime*.06;
  vec3 iri=.5+.5*cos(6.2831*(vec3(0.,.33,.67)+r.y*.55+r.x*.3+fres*1.4+tt));
  iri*=vec3(1.,.74,1.05);                                   // push hues toward magenta / orange / cyan
  vec3 col=vec3(.01)+iri*(.09+1.2*pow(fres,1.25));        // dark glossy core, iridescent rim
  float strip=smoothstep(.16,.0,abs(r.y-.38))*smoothstep(-.3,.5,r.x);   // studio strip light (chrome)
  float strip2=smoothstep(.10,.0,abs(r.x+.55))*smoothstep(-.5,.3,r.y);
  col+=(strip*.85+strip2*.45)*mix(vec3(1.),iri,.45);
  col*=.55+.45*smoothstep(-.5,.7,dot(n,normalize(vec3(-.3,.8,.5))));
  col+=pow(max(dot(r,normalize(vec3(.5,.8,.6))),0.),60.)*1.6;
  col+=pow(max(dot(r,normalize(vec3(-.7,-.2,.5))),0.),24.)*vec3(.83,1.,.23)*.45;
  col+=vec3(.83,1.,.23)*pow(fres,5.)*.25;
  col=pow(col,vec3(.92));
  float al=max(cov,glow);
  gl_FragColor=vec4(mix(vec3(.83,1.,.23),col,cov/al),al);
}`;

  function mount(wrap){
    const canvas = wrap.querySelector('canvas');
    let gl = null;
    try{ gl = canvas.getContext('webgl',{premultipliedAlpha:false,alpha:true,antialias:false}); }catch(e){}
    if(!gl){ wrap.classList.add('fallback'); canvas.remove(); return {setScroll(){},destroy(){}}; }

    const sh=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.warn(gl.getShaderInfoLog(s));}return s;};
    const prog=gl.createProgram();
    gl.attachShader(prog,sh(gl.VERTEX_SHADER,VERT));
    gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,FRAG));
    gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){ wrap.classList.add('fallback'); canvas.remove(); return {setScroll(){},destroy(){}}; }
    gl.useProgram(prog);
    const buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(prog,'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    const U={}; ['uRes','uTime','uMouse','uScroll','uIntro'].forEach(k=>U[k]=gl.getUniformLocation(prog,k));
    gl.disable(gl.BLEND);

    // render below native resolution (raymarching is fill-rate bound) and adapt to the GPU
    const MAX_PX=900000;
    let quality = Math.min(window.devicePixelRatio||1, 1.5) * (window.innerWidth < 760 ? .7 : 1);
    function resize(){
      const r=wrap.getBoundingClientRect();
      let q=quality; const px=r.width*r.height*q*q; if(px>MAX_PX) q*=Math.sqrt(MAX_PX/px);
      canvas.width=Math.max(2,Math.round(r.width*q));
      canvas.height=Math.max(2,Math.round(r.height*q));
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.uniform2f(U.uRes,canvas.width,canvas.height);
    }
    resize(); window.addEventListener('resize',resize);

    const mouse={x:0,y:0,tx:0,ty:0}; let scroll=0, intro=0, introT=0, visible=true, raf=0;
    const onMove=e=>{mouse.tx=(e.clientX/innerWidth)*2-1; mouse.ty=-((e.clientY/innerHeight)*2-1);};
    window.addEventListener('pointermove',onMove,{passive:true});
    const io=new IntersectionObserver(([en])=>{visible=en.isIntersecting; if(visible&&!raf) loop();});
    io.observe(wrap);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start=performance.now();
    let last=performance.now(), acc=0, frames=0, killed=false;
    function loop(){
      if(!visible||killed){raf=0;return;}
      raf=requestAnimationFrame(loop);
      const tnow=performance.now(), dt=tnow-last; last=tnow;
      // adaptive quality: if the GPU can't hold ~45fps, drop resolution; give up on very slow GPUs
      if(dt<500){ acc+=dt; frames++; }
      if(frames===20 && !window.GLASS_NO_ADAPT){
        const avg=acc/frames; acc=0; frames=0;
        if(avg>22){
          if(quality>.28){ quality*=.72; resize(); }
          else { killed=true; wrap.classList.add('fallback'); canvas.remove(); return; }
        }
      }
      const now=(tnow-start)/1000;
      mouse.x+=(mouse.tx-mouse.x)*.05; mouse.y+=(mouse.ty-mouse.y)*.05;
      if(introT){ intro=Math.min(1,(performance.now()-introT)/1600); }
      const e=1-Math.pow(1-intro,4);
      gl.uniform1f(U.uTime, reduced? 4.0 : now);
      gl.uniform2f(U.uMouse,mouse.x,mouse.y);
      gl.uniform1f(U.uScroll,scroll);
      gl.uniform1f(U.uIntro,e);
      gl.drawArrays(gl.TRIANGLES,0,3);
    }
    loop();
    return {
      play(){ introT=performance.now(); },
      setScroll(v){ scroll=v; },
      destroy(){ cancelAnimationFrame(raf); io.disconnect(); }
    };
  }
  window.Glass={mount};
})();
