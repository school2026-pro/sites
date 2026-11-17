import {readFileSync} from 'node:fs';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,getDocs,collection,query,limit,updateDoc,deleteDoc,serverTimestamp,Timestamp} from 'firebase/firestore';
import assert from 'node:assert/strict';
const env=await initializeTestEnvironment({projectId:'demo-school-notebook',firestore:{rules:readFileSync(new URL('../firestore.rules',import.meta.url),'utf8')}});
let count=0;
async function ok(p){await assertSucceeds(p);count++;}async function deny(p){await assertFails(p);count++;}
const a=env.authenticatedContext('alice').firestore(),b=env.authenticatedContext('bob').firestore(),anon=env.unauthenticatedContext().firestore();
const path='notebooks/alice/entries/entry1',ref=doc(a,path);
const entry=()=>({title:'数学2ページ',date:'2026-11-17',kind:'task',start:'17:00',end:'17:20',category:'学習',priority:2,notes:'',done:0,version:1,deleted:false,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
const review=()=>({date:'2026-11-17',mood:3,focus:4,minutes:30,wins:'できた',obstacles:'',learned:'',next_action:'英語5分',version:1,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
try{
 await ok(setDoc(ref,entry()));await ok(getDoc(ref));await ok(getDocs(query(collection(a,'notebooks/alice/entries'),limit(2001))));
 for(const client of [b,anon]){await deny(getDoc(doc(client,path)));await deny(getDocs(collection(client,'notebooks/alice/entries')));await deny(setDoc(doc(client,'notebooks/alice/entries/attack'),entry()));await deny(updateDoc(doc(client,path),{done:1,version:2,updatedAt:serverTimestamp()}));await deny(deleteDoc(doc(client,path)));}
 await deny(getDocs(collection(a,'notebooks')));await deny(getDocs(collection(a,'entries')));await deny(setDoc(doc(a,'notebooks/alice'),{isAdmin:true}));
 for(const patch of [{notes:'x'.repeat(4001)},{title:'x'.repeat(121)},{title:3},{title:'   '},{category:'admin'},{done:2},{priority:0},{minutes:-1},{uid:'bob'},{ownerId:'bob'},{isAdmin:true},{extra:'bad'},{createdAt:Timestamp.fromMillis(1)},{version:9},{start:'25:00'},{end:'16:00'},{kind:'event',end:null}]){
  await deny(updateDoc(ref,{version:2,updatedAt:serverTimestamp(),...patch}));
 }
 await deny(setDoc(doc(a,'notebooks/alice/entries/missing'),{title:'bad'}));
 await ok(updateDoc(ref,{done:1,version:2,updatedAt:serverTimestamp()}));
 await deny(updateDoc(ref,{done:0,version:2,updatedAt:serverTimestamp()}));
 await ok(updateDoc(ref,{deleted:true,version:3,updatedAt:serverTimestamp()}));
 await deny(updateDoc(ref,{title:'changed while deleted',version:4,updatedAt:serverTimestamp()}));
 await ok(updateDoc(ref,{deleted:false,version:4,updatedAt:serverTimestamp()}));await deny(deleteDoc(ref));
 const rr=doc(a,'notebooks/alice/reflections/2026-11-17');await ok(setDoc(rr,review()));await deny(getDoc(doc(b,rr.path)));
 for(const patch of [{wins:'x'.repeat(4001)},{next_action:'x'.repeat(501)},{minutes:-1},{minutes:1441},{minutes:2.5},{mood:0},{focus:6},{date:'2026-11-18'},{extra:1},{createdAt:Timestamp.fromMillis(1)}])await deny(updateDoc(rr,{version:2,updatedAt:serverTimestamp(),...patch}));
 await ok(updateDoc(rr,{wins:'更新',version:2,updatedAt:serverTimestamp()}));await deny(deleteDoc(rr));

 const schoolPath='notebooks/alice/schooldays/2026-11-17',sr=doc(a,schoolPath);
 const school=()=>({date:'2026-11-17',lessons:Array.from({length:8},()=>({subject:'数学',materials:'教科書、ノート',room:'3年教室'})),essentials:'筆箱',note:'提出物あり',packed:[0,1],version:1,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
 await ok(setDoc(sr,school()));await ok(getDoc(sr));await ok(getDocs(collection(a,'notebooks/alice/schooldays')));
 for(const client of [b,anon]){await deny(getDoc(doc(client,schoolPath)));await deny(getDocs(collection(client,'notebooks/alice/schooldays')));await deny(setDoc(doc(client,schoolPath),school()));await deny(updateDoc(doc(client,schoolPath),{note:'attack',version:2,updatedAt:serverTimestamp()}));}
 for(const patch of [{lessons:[]},{lessons:Array.from({length:9},()=>({subject:'英語',materials:'',room:''}))},{lessons:[{subject:7,materials:'',room:''}]},{lessons:[{subject:'英語',materials:'x'.repeat(601),room:''}]},{lessons:[{subject:'英語',materials:'',room:'x'.repeat(81)}]},{lessons:[{subject:'x'.repeat(61),materials:'',room:''}]},{lessons:[{subject:'英語',materials:'',room:'',owner:'bob'}]},{lessons:[{subject:'英語',materials:''}]},{lessons:[...school().lessons.slice(0,7),{subject:'bad',materials:42,room:''}]},{essentials:'x'.repeat(1201)},{note:'x'.repeat(1001)},{packed:[-1]},{packed:[64]},{packed:[0.5]},{packed:['0']},{packed:[0,0]},{date:'2026-11-18'},{owner:'bob'},{createdAt:Timestamp.fromMillis(1)}]){
  await deny(updateDoc(sr,{version:2,updatedAt:serverTimestamp(),...patch}));
  if(!('date' in patch))await deny(setDoc(doc(a,'notebooks/alice/schooldays/2026-11-18'),{...school(),date:'2026-11-18',...patch}));
 }
 await deny(setDoc(doc(a,'notebooks/alice/schooldays/2026-11-19'),{...school(),date:'2026-11-19',lessons:null}));
 await ok(updateDoc(sr,{packed:[0,1,2],version:2,updatedAt:serverTimestamp()}));
 await ok(updateDoc(sr,{packed:Array.from({length:64},(_,i)=>i),version:3,updatedAt:serverTimestamp()}));
 await ok(setDoc(doc(a,'notebooks/alice/schooldays/2026-11-20'),{...school(),date:'2026-11-20',lessons:Array.from({length:6},()=>({subject:'',materials:'',room:''})),essentials:'',note:'',packed:[]}));
 await deny(updateDoc(sr,{note:'stale',version:2,updatedAt:serverTimestamp()}));await deny(deleteDoc(sr));
 assert.equal((await getDoc(ref)).data().version,4);console.log(`${count} security-rule assertions passed.`);
}finally{await env.cleanup();}
