const {DatabaseSync}=require('node:sqlite');const fs=require('node:fs');const assert=require('node:assert/strict');
const {plannerAPI}=require('../.sites-runtime/tests/server.js');const {validDate,addDays,entryInput,reflectionInput,overlaps,insights,todayJST}=require('../.sites-runtime/tests/model.js');
const sql=new DatabaseSync(':memory:');sql.exec(fs.readFileSync('drizzle/0000_little_layla_miller.sql','utf8').replaceAll('--> statement-breakpoint',''));
const db={prepare(q){return {bind(...args){const s=sql.prepare(q);return {async all(){return {results:s.all(...args)};},async run(){return {meta:{changes:Number(s.run(...args).changes)}};}};}};}};
let checks=0;function ok(a,b){assert.deepEqual(a,b);checks++;}
const valid={title:'数学を2ページ',kind:'task',date:todayJST(),start:'17:00',end:'17:20',category:'学習',priority:1,notes:'<script>literal only</script>',done:0};
async function call(path='',method='GET',body,owner='A',origin='https://planner.test'){const h={};if(method!=='GET'){h.origin=origin;h['content-type']='application/json';}const r=await plannerAPI(new Request('https://planner.test/api/planner'+path,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body)}),db,owner);return {status:r.status,data:await r.json(),headers:r.headers};}
(async()=>{
 ok(validDate('2028-02-29'),true);ok(validDate('2027-02-29'),false);ok(addDays('2028-02-28',1),'2028-02-29');ok(addDays('2028-12-31',1),'2029-01-01');assert.throws(()=>entryInput({...valid,start:'18:00',end:'17:00'}));checks++;assert.throws(()=>reflectionInput({date:valid.date,mood:6,focus:3,minutes:0}));checks++;
 let r=await call('?from=2026-01-01&to=2026-12-31','GET',undefined,null);ok(r.status,401);ok(r.headers.get('cache-control'),'private, no-store');r=await call('/entries','POST',valid,'A','https://evil.test');ok(r.status,403);
 r=await call('/entries','POST',valid);ok(r.status,201);const id=r.data.id;const query=`?from=${valid.date}&to=${valid.date}`;
 ok((await call(query)).data.entries.length,1);ok((await call(query,'GET',undefined,'B')).data.entries.length,0);
 ok((await call('/entries/'+id,'PUT',{...valid,title:'other owner',version:1},'B')).status,409);ok((await call('/entries/'+id,'DELETE',{version:1},'B')).status,409);
 r=await call('/entries/'+id,'PUT',{...valid,done:1,version:1});ok(r.status,200);ok(r.data.version,2);ok((await call('/entries/'+id,'PUT',{...valid,version:1})).status,409);
 r=await call('/entries/'+id,'DELETE',{version:2});ok(r.data.version,3);ok((await call(query)).data.entries.length,0);ok((await call('/entries/'+id,'PATCH',{version:3,restore:true},'B')).status,409);ok((await call('/entries/'+id,'PATCH',{version:3,restore:true})).data.version,4);
 const review={date:valid.date,mood:4,focus:3,minutes:40,wins:'できた',obstacles:'集中が切れた',learned:'短く区切る',next_action:'英語5分',version:0};
 ok((await call('/reflection','PUT',review)).data.version,1);ok((await call('/reflection','PUT',review)).status,409);ok((await call('/reflection','PUT',{...review,version:1})).data.version,2);ok((await call(query,'GET',undefined,'B')).data.reflections.length,0);ok((await call('/export','GET',undefined,'B')).data.entries.length,0);ok((await call('/export')).data.reflections.length,1);
 ok((await call('/reflection','PUT',{...review,date:addDays(valid.date,1)})).status,400);
 const event={...valid,id:'x',kind:'event',version:1};ok(overlaps([event],{...event,id:'y',start:'17:10',end:'17:30'}).length,1);ok(overlaps([event],{...event,id:'y',start:'17:20',end:'17:30'}).length,0);
 ok(overlaps([event],{...event,id:'t',kind:'task',start:'17:10',end:'17:30'}).length,1);
 const insert=sql.prepare('INSERT INTO planner_entries(id,owner,title,kind,date,category,priority,notes,done,version,created_at,updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?)');sql.exec('BEGIN');for(let i=0;i<2001;i++)insert.run(crypto.randomUUID(),'C','old '+i,'task','2001-01-01','学習',2,'','','');const currentId=crypto.randomUUID();insert.run(currentId,'C','current','task',valid.date,'学習',2,'','','');sql.exec('COMMIT');const capped=await call(query,'GET',undefined,'C');ok(capped.data.entries[0].id,currentId);ok(capped.data.limited,true);
 const stats=insights([{...valid,id,version:4,done:1}],[review],valid.date);ok(stats.done,1);ok(stats.minutes,40);ok(stats.days,1);
 console.log(`${checks} meaningful checks passed: isolation, ownership, CSRF, stale versions, delete/restore, export, reflection, date and overlap boundaries.`);
})().catch(e=>{console.error(e);process.exit(1)});
