import {categories,entryInput,reflectionInput,validDate,todayJST} from './model';
class Failure extends Error{constructor(public status:number,message:string){super(message);}}
const json=(v:unknown,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
const version=(v:unknown)=>Number.isInteger(v)&&Number(v)>=0?Number(v):(()=>{throw new Failure(400,'版番号が不正です。');})();
export async function plannerAPI(req:Request,db:D1Database|undefined,owner:string|null){
 try{
  if(!owner)return json({error:'ログインが必要です。'},401);
  if(!db)throw new Failure(503,'保存先に接続できません。時間をおいて再試行してください。');
  const url=new URL(req.url),path=url.pathname.replace(/^\/api\/planner\/?/,'');
  if(req.method!=='GET'){
   if(req.headers.get('origin')!==url.origin||req.headers.get('sec-fetch-site')==='cross-site')throw new Failure(403,'このページから操作し直してください。');
   if(!req.headers.get('content-type')?.startsWith('application/json'))throw new Failure(415,'JSON形式が必要です。');
   if(Number(req.headers.get('content-length')||0)>30000)throw new Failure(413,'入力が長すぎます。');
  }
  if(req.method==='GET'&&!path){
   const from=url.searchParams.get('from'),to=url.searchParams.get('to');if(!validDate(from)||!validDate(to)||from>to||(+new Date(to)-+new Date(from))/86400000>400)throw new Failure(400,'表示期間が不正です。');
   const es=await db.prepare('SELECT id,title,kind,date,start,end,category,priority,notes,done,version,created_at,updated_at FROM planner_entries WHERE owner=? AND deleted_at IS NULL AND ((date>=? AND date<=?) OR (kind=\'task\' AND done=0 AND date<?)) ORDER BY CASE WHEN date>=? AND date<=? THEN 0 ELSE 1 END,date,start,id LIMIT 2001').bind(owner,from,to,todayJST(),from,to).all();
   const rs=await db.prepare('SELECT date,mood,focus,minutes,wins,obstacles,learned,next_action,version FROM planner_reflections WHERE owner=? AND date>=? AND date<=? ORDER BY date').bind(owner,from,to).all();
   return json({entries:es.results.slice(0,2000),reflections:rs.results,limited:es.results.length>2000});
  }
  if(req.method==='GET'&&path==='export'){
   const es=await db.prepare('SELECT id,title,kind,date,start,end,category,priority,notes,done,version FROM planner_entries WHERE owner=? AND deleted_at IS NULL ORDER BY date').bind(owner).all();
   const rs=await db.prepare('SELECT date,mood,focus,minutes,wins,obstacles,learned,next_action,version FROM planner_reflections WHERE owner=? ORDER BY date').bind(owner).all();return json({format:'school-planner-v1',exportedAt:new Date().toISOString(),timezone:'Asia/Tokyo',entries:es.results,reflections:rs.results});
  }
  const raw=await req.text();if(raw.length>30000)throw new Failure(413,'入力が長すぎます。');let v:any;try{v=JSON.parse(raw);}catch{throw new Failure(400,'入力を読み取れませんでした。');}
  if(path==='entries'&&req.method==='POST'){
   const e=entryInput(v),id=crypto.randomUUID(),now=new Date().toISOString();
   await db.prepare('INSERT INTO planner_entries (id,owner,title,kind,date,start,end,category,priority,notes,done,version,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,1,?,?)').bind(id,owner,e.title,e.kind,e.date,e.start,e.end,e.category,e.priority,e.notes,e.done,now,now).run();return json({id,version:1},201);
  }
  const m=path.match(/^entries\/([a-f0-9-]{36})$/);
  if(m&&['PUT','DELETE','PATCH'].includes(req.method)){
   const id=m[1],rev=version(v.version),now=new Date().toISOString();let statement;
   if(req.method==='PUT'){const e=entryInput(v);statement=db.prepare('UPDATE planner_entries SET title=?,kind=?,date=?,start=?,end=?,category=?,priority=?,notes=?,done=?,version=version+1,updated_at=? WHERE id=? AND owner=? AND version=? AND deleted_at IS NULL').bind(e.title,e.kind,e.date,e.start,e.end,e.category,e.priority,e.notes,e.done,now,id,owner,rev);}
   else if(req.method==='DELETE')statement=db.prepare('UPDATE planner_entries SET deleted_at=?,version=version+1,updated_at=? WHERE id=? AND owner=? AND version=? AND deleted_at IS NULL').bind(now,now,id,owner,rev);
   else {if(v.restore!==true)throw new Failure(400,'復元の指定が必要です。');statement=db.prepare('UPDATE planner_entries SET deleted_at=NULL,version=version+1,updated_at=? WHERE id=? AND owner=? AND version=? AND deleted_at IS NOT NULL').bind(now,id,owner,rev);}
   const result=await statement.run();if(!result.meta.changes)throw new Failure(409,'別の画面で変更されたか、予定がありません。更新して確認してください。');return json({id,version:rev+1});
  }
  if(path==='reflection'&&req.method==='PUT'){
   const r=reflectionInput(v),rev=version(v.version),now=new Date().toISOString();if(r.date>todayJST())throw new Failure(400,'未来の日付の振り返りは保存できません。');let result;
   if(rev===0)result=await db.prepare('INSERT INTO planner_reflections (owner,date,mood,focus,minutes,wins,obstacles,learned,next_action,version,updated_at) VALUES (?,?,?,?,?,?,?,?,?,1,?) ON CONFLICT(owner,date) DO NOTHING').bind(owner,r.date,r.mood,r.focus,r.minutes,r.wins,r.obstacles,r.learned,r.next_action,now).run();
   else result=await db.prepare('UPDATE planner_reflections SET mood=?,focus=?,minutes=?,wins=?,obstacles=?,learned=?,next_action=?,version=version+1,updated_at=? WHERE owner=? AND date=? AND version=?').bind(r.mood,r.focus,r.minutes,r.wins,r.obstacles,r.learned,r.next_action,now,owner,r.date,rev).run();
   if(!result.meta.changes)throw new Failure(409,'別の画面で振り返りが更新されています。入力を控えてから、再読込してください。');return json({version:rev+1});
  }
  throw new Failure(404,'操作が見つかりません。');
 }catch(e){if(e instanceof Failure)return json({error:e.message},e.status);if(e instanceof Error&&/確認|入力|時刻/.test(e.message))return json({error:e.message},400);return json({error:'保存処理に失敗しました。入力を残したまま再試行できます。'},500);}
}
