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
 assert.equal((await getDoc(ref)).data().version,4);console.log(`${count} security-rule assertions passed.`);
}finally{await env.cleanup();}
