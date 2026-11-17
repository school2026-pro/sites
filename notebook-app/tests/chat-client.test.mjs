import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {readdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {collection,doc,getDoc,getDocs,query,limit} from 'firebase/firestore';
const compile=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','src/chat-store.ts','--outDir','.chat-test','--module','ESNext','--moduleResolution','bundler','--target','ES2022','--skipLibCheck'],{stdio:'inherit'});
if(compile.status)process.exit(compile.status);
mkdirSync('.chat-test',{recursive:true});writeFileSync('.chat-test/package.json','{"type":"module"}');
for(const file of readdirSync('.chat-test').filter(f=>f.endsWith('.js'))){const path='.chat-test/'+file;writeFileSync(path,readFileSync(path,'utf8').replace(/from '(\.\/[^']+)'/g,"from '$1.js'"));}
const {createChatClient}=await import('../.chat-test/chat-store.js');
const env=await initializeTestEnvironment({projectId:'demo-school-notebook',firestore:{rules:readFileSync('firestore.rules','utf8')}});
const dbA=env.authenticatedContext('sdkAlice').firestore(),dbB=env.authenticatedContext('sdkBob').firestore();
const a=createChatClient('sdkAlice',{db:dbA,auth:{currentUser:{uid:'sdkAlice'}}}),b=createChatClient('sdkBob',{db:dbB,auth:{currentUser:{uid:'sdkBob'}}});
function next(register,predicate=()=>true){return new Promise((resolve,reject)=>{let stop=()=>{};const timer=setTimeout(()=>{stop();reject(new Error('Live update timeout'));},10000);stop=register(value=>{if(predicate(value)){clearTimeout(timer);stop();resolve(value);}},e=>{clearTimeout(timer);reject(e);});});}
try{
 await env.clearFirestore();
 const pa=await a.saveProfile('  ミント  '),pb=await b.saveProfile('Sky');
 assert.equal(pa.name,'ミント');assert.equal(pa.code.length,8);assert.notEqual(pa.code,pb.code);
 assert.equal((await b.searchUsers(pa.code.slice(0,4)+'-'+pa.code.slice(4)))[0].uid,pa.uid);
 assert.equal((await a.searchUsers('ｓｋｙ'))[0].uid,pb.uid);
 assert.equal((await a.saveProfile('Mint')).code,pa.code);
 const id=await a.requestChat(pb);assert.equal(await a.requestChat(pb),id);
 const incoming=await next((cb,e)=>b.subscribeRooms(cb,e),rs=>rs.some(r=>r.id===id));
 assert.equal(incoming[0].status,'pending');
 await assert.rejects(()=>a.sendMessage(id,'承認前','before-consent'));
 await b.acceptRoom(incoming[0]);
 const delivery=next((cb,e)=>b.subscribeMessages(id,cb,e),ms=>ms.some(m=>m.id==='first'));
 await a.sendMessage(id,'明日は体育があります。\n体操服を忘れずに！','first');
 assert.equal((await delivery)[0].text,'明日は体育があります。\n体操服を忘れずに！');
 await a.sendMessage(id,'明日は体育があります。\n体操服を忘れずに！','first');
 assert.equal((await getDocs(query(collection(dbA,'chatRooms',id,'messages'),limit(50)))).size,1);
 await b.markRead(id,'first');assert.equal((await getDoc(doc(dbB,'chatState','sdkBob','rooms',id))).data().lastMessageId,'first');
 await b.sendMessage(id,'ありがとう！','reply');await b.markRead(id,'reply');await b.markRead(id,'first');
 assert.equal((await getDoc(doc(dbB,'chatState','sdkBob','rooms',id))).data().lastMessageId,'reply');
 await b.setBlocked(pa.uid,true);await assert.rejects(()=>a.sendMessage(id,'blocked','blocked'));await assert.rejects(()=>b.sendMessage(id,'blocked','blocked'));
 await b.setBlocked(pa.uid,false);await a.sendMessage(id,'解除後','unblocked');
 const ms=await next((cb,e)=>b.subscribeMessages(id,cb,e),ms=>ms.length===3);
 assert.equal(ms[0].text,'解除後');assert.deepEqual(await a.olderMessages(id,ms.at(-1)),[]);
 a.dispose();assert.throws(()=>a.newMessageId('unused')&&a.subscribeRooms(()=>{},()=>{}));
 console.log('Chat client integration: profile, code/name search, consent, live delivery, idempotent retry, read markers, block/unblock and history PASS');
}finally{a.dispose();b.dispose();await env.cleanup();}
