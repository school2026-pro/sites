import {collection,doc,getFirestore,onSnapshot,query,runTransaction,serverTimestamp,type DocumentData,type QuerySnapshot} from 'firebase/firestore';
import {app,auth} from './firebase';
import {entryInput,reflectionInput,validDate} from './model';

// Enterprise native database. Core queries are used because the notebook needs
// real-time cross-device updates; private records stay in memory, never IndexedDB.
export const db=getFirestore(app,'default');
const conflict=()=>new Error('別の画面で更新されています。再読込してから、もう一度編集してください。');
function readable(error:unknown){const code=(error as {code?:string}).code;if(code==='permission-denied')return new Error('保存先にアクセスできません。ログイン状態を確認してください。');if(code==='unavailable')return new Error('通信できません。入力はそのままに、接続後もう一度保存してください。');return error;}
export function createPlannerApi(uid:string){
 const root=collection(db,'notebooks',uid,'entries'),reviews=collection(db,'notebooks',uid,'reflections');
 const callbacks=new Set<()=>void>();let stops:(()=>void)[]=[],dead=false;
 let es:QuerySnapshot<DocumentData>|undefined,rs:QuerySnapshot<DocumentData>|undefined,fail:unknown;
 let waiters:{resolve:()=>void;reject:(error:unknown)=>void}[]=[];
 function check(){if(dead||auth.currentUser?.uid!==uid)throw new Error('ログインし直してください。');}
 function changed(){if(fail||!es||!rs)return;for(const w of waiters)w.resolve();waiters=[];for(const cb of callbacks)cb();}
 function failed(e:unknown){fail=readable(e);es=undefined;rs=undefined;for(const w of waiters)w.reject(fail);waiters=[];for(const stop of stops)stop();stops=[];}
 function start(){if(stops.length||dead)return;stops=[onSnapshot(query(root),{includeMetadataChanges:true},s=>{if(s.metadata.fromCache||s.metadata.hasPendingWrites)return;es=s;changed();},failed),onSnapshot(query(reviews),{includeMetadataChanges:true},s=>{if(s.metadata.fromCache||s.metadata.hasPendingWrites)return;rs=s;changed();},failed)];}
 async function ready(){check();if(fail){fail=undefined;es=undefined;rs=undefined;for(const stop of stops)stop();stops=[];}start();if(!es||!rs)await new Promise<void>((resolve,reject)=>{const timeout=setTimeout(()=>{waiters=waiters.filter(w=>w!==waiter);reject(new Error('通信の確認に時間がかかっています。接続後に再読込してください。'));},15000);const waiter={resolve:()=>{clearTimeout(timeout);resolve();},reject:(e:unknown)=>{clearTimeout(timeout);reject(e);}};waiters.push(waiter);});check();if(fail)throw fail;}
 const api=async(path:string,method='GET',body?:unknown):Promise<any>=>{try{check();const b=body as any;
  if(method==='GET'){
   await ready();const entries=es!.docs.filter(d=>!d.data().deleted).map(d=>({...d.data(),id:d.id})),reflections=rs!.docs.map(d=>d.data());
   if(path==='/export'){return{format:'school-notebook-v1',exported_at:new Date().toISOString(),entries,reflections};}
   const params=new URLSearchParams(path.replace(/^\?/,'')),from=params.get('from'),to=params.get('to');if(!validDate(from)||!validDate(to))throw new Error('表示期間を確認してください。');
   return{entries:entries.filter((e:any)=>(e.date>=from&&e.date<=to)||(e.kind==='task'&&!e.done&&e.date<from)),reflections:reflections.filter(r=>r.date>=from&&r.date<=to),limited:false};
  }
  if(path==='/entries'&&method==='POST'){
   const data=entryInput(b),ref=doc(root);await runTransaction(db,async tx=>{check();tx.set(ref,{...data,version:1,deleted:false,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});});return{id:ref.id,version:1};
  }
  const match=path.match(/^\/entries\/([A-Za-z0-9_-]{1,128})$/);
  if(match&&['PUT','DELETE','PATCH'].includes(method)){
   const ref=doc(root,match[1]);return await runTransaction(db,async tx=>{check();const snap=await tx.get(ref),old=snap.data();if(!old||old.version!==b?.version)throw conflict();let data;
    if(method==='PUT'){if(old.deleted)throw conflict();data={...entryInput(b),deleted:false};}
    else if(method==='DELETE'){if(old.deleted)throw conflict();data={...old,deleted:true};}
    else{if(!old.deleted||b.restore!==true)throw conflict();data={...old,deleted:false};}
    const version=old.version+1;check();tx.set(ref,{...data,createdAt:old.createdAt,updatedAt:serverTimestamp(),version});return{id:ref.id,version};
   });
  }
  if(path==='/reflection'&&method==='PUT'){
   const data=reflectionInput(b),ref=doc(reviews,data.date);return await runTransaction(db,async tx=>{check();const snap=await tx.get(ref),old=snap.data();if((old?.version||0)!==b?.version)throw conflict();const version=(old?.version||0)+1;check();tx.set(ref,{...data,version,createdAt:old?.createdAt||serverTimestamp(),updatedAt:serverTimestamp()});return{version};});
  }
  throw new Error('この操作には対応していません。');
 }catch(error){throw readable(error);}};
 return Object.assign(api,{subscribe(callback:()=>void){callbacks.add(callback);start();if(es&&rs)queueMicrotask(()=>{if(callbacks.has(callback))callback();});return()=>callbacks.delete(callback);},dispose(){dead=true;for(const stop of stops)stop();stops=[];callbacks.clear();for(const w of waiters)w.reject(new Error('ログアウトしました。'));waiters=[];es=undefined;rs=undefined;}});
}
