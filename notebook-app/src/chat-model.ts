export const CODE_ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function chatName(value:string){const name=value.normalize('NFKC').trim().replace(/ +/g,' ');if(name.length<2||name.length>24||/[@\u0000-\u001f\u007f]/.test(name))throw new Error('ユーザー名は改行を含まない2〜24文字で入力してください。');return{name,searchName:name.toLowerCase()};}
export function chatText(value:string){const text=value.trim();if(!text||text.length>2000)throw new Error('メッセージは1〜2,000文字で入力してください。');return text;}
export function normalizeCode(value:string){const code=value.normalize('NFKC').toUpperCase().replace(/[\s-]/g,'');return /^[A-HJ-NP-Z2-9]{8}$/.test(code)?code:null;}
export function roomIdFor(a:string,b:string){if(!a||!b||a===b||a.includes('~')||b.includes('~'))throw new Error('相手のユーザーを確認してください。');return[a,b].sort().join('~');}
