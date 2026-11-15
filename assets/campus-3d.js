'use strict';
/* Physical footprints traced from Okayama University's campus engineering plan (M-02).
   x/y: drawing coordinates; floor heights and facade details are illustrative, not surveyed. */
window.Campus3D = (() => {
 const source='https://www.okayama-u.ac.jp/up_load_files/shisetu-pdf/setumei07-9.pdf#page=29';
 const models=[
  {id:'3号館',floors:3,color:'#f1eee1',roof:'#b5c4ba',poly:[[837,758],[920,758],[920,766],[1098,766],[1098,810],[837,810]],height:42,label:[972,784],note:'北側の普通教室棟。3階建てで、西端の張り出しと東側の接続位置を配置図から再現。'},
  {id:'2号館',floors:2,color:'#dedbcf',roof:'#c0bbab',poly:[[815,894],[913,894],[913,938],[1090,938],[1090,1028],[875,1028],[875,1066],[815,1066],[815,1009],[827,1009],[827,969],[815,969]],height:28,label:[969,980],closed:true,note:'中央の特別教室棟。西側の張り出しを含む輪郭を構内配置図からトレース。現在はⅡ期改修工事中。'},
  {id:'1号館',floors:3,color:'#f5f0e1',roof:'#b8c7c1',poly:[[834,1088],[1026,1088],[1026,1124],[834,1124]],height:42,label:[930,1106],note:'南側の3階建て校舎。工事概要書の建築面積約430㎡と、配置図の細長い輪郭を参照。'},
  {id:'体育館',floors:2,color:'#d3d6cf',roof:'#697b77',poly:[[1060,1027],[1259,1027],[1259,1151],[1163,1151],[1163,1140],[1060,1140]],height:43,label:[1160,1083],note:'南東側の体育館。プールの西隣に位置し、南側の段差を含む輪郭を配置図から再現。'},
  {id:'仮設校舎',floors:2,color:'#f3ead1',roof:'#b7b5a2',poly:[[1130,777],[1175,777],[1175,918],[1130,918]],height:25,label:[1152,850],note:'3号館の東側にある2階建て仮設校舎。位置と縦長の形は仮設校舎工事の配置図を参照。'}
 ];
 const ground=[[790,738],[1580,738],[1580,1168],[790,1168]];
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 function project(p,yaw,elev){const x=p[0]-1185,y=p[1]-953,z=p[2]||0,c=Math.cos(yaw),s=Math.sin(yaw),rx=x*c-y*s,d=x*s+y*c;return [rx,d*Math.sin(elev)-z*Math.cos(elev),d*Math.cos(elev)+z*Math.sin(elev)];}
 function extent(yaw,elev){const ps=[...ground.map(p=>[...p,0]),...models.flatMap(m=>m.poly.map(p=>[...p,m.height]))].map(p=>project(p,yaw,elev));const xs=ps.map(p=>p[0]),ys=ps.map(p=>p[1]);return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];}
 function mount(host,options={}){
  let yaw=-.38,elev=.85,zoom=1,pan=[0,0],selected='',filterFloor='all',width=800,height=560,frame=0,disposed=false;
  const pointers=new Map();let gesture=null;
  host.innerHTML='<svg class="campus-scene" tabindex="0" role="group" aria-label="学校の3Dマップ。指1本で回転、2本指で拡大・縮小と移動。建物をタップして教室一覧を開きます。"></svg>';
  const svg=host.firstElementChild;
  function screen(p){const b=svg.getBoundingClientRect();return [p[0]-b.left,p[1]-b.top];}
  function viewMetrics(){const box=extent(yaw,elev),fit=Math.min((width-64)/(box[2]-box[0]),(height-80)/(box[3]-box[1]));return {box,fit:Math.max(.01,fit),cx:(box[0]+box[2])/2,cy:(box[1]+box[3])/2};}
  function limitPan(){if(zoom<=1.0001){zoom=1;pan=[0,0];return;}const {box,fit}=viewMetrics(),scale=fit*zoom,bw=(box[2]-box[0])*scale,bh=(box[3]-box[1])*scale;const mx=Math.max(0,(bw-width)/2+width*.25),my=Math.max(0,(bh-height)/2+height*.25);pan=[clamp(pan[0],-mx,mx),clamp(pan[1],-my,my)];}
  function draw(){if(disposed)return;const focusedBuilding=svg.contains(document.activeElement)?document.activeElement.closest('[data-campus-building]')?.dataset.campusBuilding:null;limitPan();const {fit,cx,cy}=viewMetrics(),scale=fit*zoom;
   const P=p=>{const v=project(p,yaw,elev);return [(v[0]-cx)*scale+width/2+pan[0],(v[1]-cy)*scale+height/2+pan[1],v[2]];};
   const polygon=(points,attrs='')=>`<polygon points="${points.map(p=>{const q=P(p);return q[0].toFixed(2)+','+q[1].toFixed(2);}).join(' ')}" ${attrs}/>`;
   const flat=(poly,z,attrs)=>polygon(poly.map(p=>[...p,z]),attrs);
   let out='<defs><pattern id="site-grain" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".6" fill="#8eae8b" opacity=".12"/></pattern></defs>';
   out+=flat(ground,0,'fill="#e4eddd" stroke="#becfba" stroke-width="1.2"');
   // Main open sports area and the school pool are placed on the east side, as in the plan.
   out+=flat([[1193,752],[1560,752],[1560,1020],[1193,1020]],.1,'fill="#e9dfc6" stroke="#d0c6ac" stroke-width="1"');
   out+=flat([[1287,1041],[1352,1041],[1352,1159],[1287,1159]],.2,'fill="#d9e2df" stroke="#a7bbb5"');
   out+=flat([[1298,1051],[1342,1051],[1342,1152],[1298,1152]],.3,'fill="#9acfd4" stroke="#679fa4"');
   // Two external courts on the east of the school.
   for(const [x,y,w,h] of [[1490,838,65,137],[1433,1050,91,98]]){out+=flat([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],.2,'fill="#c4d8c5" stroke="#a4bea8"');out+=flat([[x+7,y+8],[x+w-7,y+8],[x+w-7,y+h-8],[x+7,y+h-8]],.3,'fill="none" stroke="#f8fcf4" stroke-width="1"');}
   // West and east connecting passageways; these are not suggested pedestrian routes.
   const connectors=[[[882,810],[896,810],[885,894],[873,894]],[[1083,810],[1096,810],[1096,1027],[1083,1027]],[[875,1073],[1034,1073],[1034,1088],[875,1088]],[[1098,900],[1130,900],[1130,912],[1098,912]]];
   for(const p of connectors)out+=flat(p,5,'fill="#d2ded5" stroke="#b7c8bd" stroke-width="1"');
   const faces=[];
   for(const m of models){
    const h=filterFloor!=='all'&&selected===m.id?Math.min(m.height,m.height/m.floors*Number(filterFloor)):m.height;
    const color=selected&&selected!==m.id?'#e3e8e1':m.color,roof=selected===m.id?'#91c8b5':m.roof;
    for(let i=0;i<m.poly.length;i++){
     const a=m.poly[i],b=m.poly[(i+1)%m.poly.length];const points=[[...a,0],[...b,0],[...b,h],[...a,h]];
     const d=points.reduce((s,p)=>s+project(p,yaw,elev)[2],0)/points.length;
     const dx=b[0]-a[0],dy=b[1]-a[1],shade=Math.abs(dx)>Math.abs(dy)?'.96':'.84';
     faces.push({d,html:polygon(points,`fill="${color}" stroke="#8d9f94" stroke-width=".7" data-campus-building="${m.id}" class="building-face" style="filter:brightness(${shade})"`)});
     for(let f=1;f<m.floors;f++){const z=m.height/m.floors*f;if(z>=h)continue;const pp=[P([...a,z]),P([...b,z])];faces.push({d:d+.05,html:`<path d="M${pp[0][0]},${pp[0][1]}L${pp[1][0]},${pp[1][1]}" fill="none" stroke="#85988c" stroke-width="1" pointer-events="none"/>`});}
    }
    const pts=m.poly.map(p=>[...p,h]),d=pts.reduce((s,p)=>s+project(p,yaw,elev)[2],0)/pts.length;
    faces.push({d,html:polygon(pts,`fill="${roof}" stroke="${selected===m.id?'#2b7960':'#81978c'}" stroke-width="${selected===m.id?2:1}" data-campus-building="${m.id}" class="building-face"`)});
   }
   faces.sort((a,b)=>a.d-b.d);out+=faces.map(f=>f.html).join('');
   const labels=[];const label=(text,p,id)=>{
    const q=P(p),compact=width<600;if((compact&&!id)||q[0]<-20||q[0]>width+20||q[1]<-20||q[1]>height+20)return '';
    const shown=compact&&id==='仮設校舎'?'仮設':text.replace(compact?'・工事中':'__none__',''),font=compact?11:14,w=Math.max(compact?40:65,shown.length*font+(compact?12:20)),h=compact?24:30,candidates=[];
    for(let radius=0;radius<=220;radius+=22){for(let i=0;i<8;i++){const a=-Math.PI/2+i*Math.PI/4;candidates.push([clamp(q[0]+Math.cos(a)*radius,w/2+5,width-w/2-5),clamp(q[1]-16+Math.sin(a)*radius,h/2+5,height-h/2-5)]);}}
    const position=candidates.find(([x,y])=>!labels.some(b=>Math.abs(b.x-x)<(b.w+w)/2+4&&Math.abs(b.y-y)<(b.h+h)/2+4));if(!position)return '';
    const [x,y]=position;labels.push({x,y,w,h});return `<g ${id?`data-campus-building="${id}" role="button" tabindex="0" aria-label="${esc(id)}の教室一覧"`:''} class="building-label"><path d="M${q[0]},${q[1]}L${x},${y+h/2}" fill="none" stroke="#84a18b" stroke-width=".8" pointer-events="none"/><rect x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="${h/2}" fill="${id===selected?'#197b69':'#fff'}" stroke="${id===selected?'#197b69':'#c6d5c9'}"/><text x="${x}" y="${y+font*.35}" style="font-size:${font}px" fill="${id===selected?'#fff':'#305842'}" text-anchor="middle">${esc(shown)}</text></g>`;};
   for(const m of models){const h=filterFloor!=='all'&&selected===m.id?Math.min(m.height,m.height/m.floors*Number(filterFloor)):m.height;out+=label(m.id+(m.closed?'・工事中':''),[...m.label,h+2],m.id);}
   if(zoom<2){out+=label('グラウンド',[1395,895,0]);out+=label('プール',[1320,1105,0]);}
   svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.innerHTML=out;if(focusedBuilding){const target=svg.querySelector(`.building-label[data-campus-building="${focusedBuilding}"]`);(target||svg).focus({preventScroll:true});}
   options.onLimit?.({min:zoom<=1.0001,max:zoom>=5.999});
  }
  function paint(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;draw();});}
  function setZoom(next,point=[width/2,height/2]){const old=zoom;zoom=clamp(next,1,6);const factor=zoom/old;pan=[point[0]-width/2-(point[0]-width/2-pan[0])*factor,point[1]-height/2-(point[1]-height/2-pan[1])*factor];limitPan();paint();}
  function start(){const ps=[...pointers.values()];if(ps.length>=2){const a=ps[0],b=ps[1];gesture={type:'pinch',distance:Math.hypot(a.x-b.x,a.y-b.y),zoom,pan:[...pan],mid:screen([(a.x+b.x)/2,(a.y+b.y)/2]),moved:true};}else if(ps.length===1){const p=ps[0];gesture={type:'orbit',x:p.x,y:p.y,yaw,elev,moved:true,id:null};}else gesture=null;}
  svg.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});svg.setPointerCapture(e.pointerId);if(pointers.size===1)gesture={type:e.shiftKey?'pan':'orbit',x:e.clientX,y:e.clientY,yaw,elev,pan:[...pan],moved:false,id:e.target.closest('[data-campus-building]')?.dataset.campusBuilding};else start();});
  svg.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)||!gesture)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const ps=[...pointers.values()];if(ps.length>=2){const a=ps[0],b=ps[1],mid=screen([(a.x+b.x)/2,(a.y+b.y)/2]),factor=clamp(gesture.zoom*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,gesture.distance),1,6)/gesture.zoom;zoom=gesture.zoom*factor;pan=[mid[0]-width/2-(gesture.mid[0]-width/2-gesture.pan[0])*factor,mid[1]-height/2-(gesture.mid[1]-height/2-gesture.pan[1])*factor];}
   else{const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;if(Math.hypot(dx,dy)>7)gesture.moved=true;if(!gesture.moved)return;if(gesture.type==='pan')pan=[gesture.pan[0]+dx,gesture.pan[1]+dy];else{yaw=gesture.yaw+dx*.008;elev=clamp(gesture.elev+dy*.005,.28,Math.PI/2-.01);}}limitPan();paint();});
  const finish=(e,cancel=false)=>{if(!pointers.has(e.pointerId))return;const pick=!cancel&&pointers.size===1&&gesture&&!gesture.moved?gesture.id:null;pointers.delete(e.pointerId);if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);start();if(pick)options.onSelect?.(pick);};
  svg.addEventListener('pointerup',e=>finish(e));svg.addEventListener('pointercancel',e=>finish(e,true));svg.addEventListener('lostpointercapture',e=>{if(pointers.has(e.pointerId)){pointers.delete(e.pointerId);start();}});
  svg.addEventListener('wheel',e=>{e.preventDefault();setZoom(zoom*Math.exp(-clamp(e.deltaY,-100,100)*.004),screen([e.clientX,e.clientY]));},{passive:false});
  svg.addEventListener('keydown',e=>{const id=e.target.closest('[data-campus-building]')?.dataset.campusBuilding;if(id&&(e.key==='Enter'||e.key===' ')){e.preventDefault();options.onSelect?.(id);return;}if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','0'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')yaw-=.15;else if(e.key==='ArrowRight')yaw+=.15;else if(e.key==='ArrowUp')elev=clamp(elev+.12,.28,1.56);else if(e.key==='ArrowDown')elev=clamp(elev-.12,.28,1.56);else if(e.key==='-')setZoom(zoom/1.4);else if(e.key==='0'){zoom=1;pan=[0,0];}else setZoom(zoom*1.4);paint();}});
  const observer=new ResizeObserver(()=>{if(!host.isConnected){observer.disconnect();return;}const b=host.getBoundingClientRect();width=Math.max(260,b.width);height=Math.max(300,b.height);limitPan();paint();});observer.observe(host);const b=host.getBoundingClientRect();width=Math.max(260,b.width);height=Math.max(300,b.height);draw();
  return {select(id,f='all'){selected=id==='すべて'||id==='屋外'?'':id;filterFloor=f;paint();},zoomIn(){setZoom(zoom*1.4);},zoomOut(){setZoom(zoom/1.4);},reset(){yaw=-.38;elev=.85;zoom=1;pan=[0,0];paint();},top(){elev=Math.PI/2-.01;zoom=1;pan=[0,0];paint();},destroy(){disposed=true;observer.disconnect();if(frame)cancelAnimationFrame(frame);}};
 }
 return {mount,models,project,extent,source};
})();
