import {useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendPasswordResetEmail,sendEmailVerification,signOut,setPersistence,browserLocalPersistence,browserSessionPersistence,type User} from 'firebase/auth';
import {auth} from './firebase';
import {createPlannerApi} from './store';
import Planner,{type PlannerApi} from './Planner';
import './style.css';
import './design.css';
import './theme.css';

function errorMessage(error:unknown){
 const code=(error as {code?:string})?.code;
 if(code==='auth/invalid-email')return 'メールアドレスを確認してください。';
 if(code==='auth/email-already-in-use')return 'このメールアドレスは登録済みです。ログインするか、パスワードを再設定してください。';
 if(code==='auth/weak-password')return 'パスワードをもう少し長く、推測しにくいものにしてください。';
 if(code==='auth/too-many-requests')return '操作が集中しています。少し時間をおいてからお試しください。';
 if(code==='auth/network-request-failed')return '接続できませんでした。通信環境を確認してお試しください。';
 if(['auth/invalid-credential','auth/user-not-found','auth/wrong-password'].includes(code||''))return 'メールアドレスとパスワードを確認してください。';
 if(code==='auth/operation-not-allowed')return '現在、このログイン方法は利用できません。時間をおいてお試しください。';
 return '処理できませんでした。通信環境を確認して、もう一度お試しください。';
}
const signedOutApi:PlannerApi=async()=>{throw new Error('ログインしてからお使いください。');};

function AuthDialog({close}:{close:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 const [mode,setMode]=useState<'login'|'register'|'reset'>('login'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState(''),[remember,setRemember]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{dialog.current?.showModal();return()=>dialog.current?.close();},[]);
 function changeMode(next:typeof mode){setMode(next);setError('');setNotice('');setPassword('');setConfirmation('');}
 async function submit(event:React.FormEvent){
  event.preventDefault();if(busy)return;setError('');setNotice('');
  if(mode==='register'&&password!==confirmation){setError('確認用パスワードが一致しません。');return;}
  setBusy(true);
  try{
   if(mode==='reset'){
    await sendPasswordResetEmail(auth,email.trim());
    setNotice('該当するアカウントがあれば、再設定メールを送信します。迷惑メールも確認してください。');
   }else{
    await setPersistence(auth,remember?browserLocalPersistence:browserSessionPersistence);
    if(mode==='register'){
     const credential=await createUserWithEmailAndPassword(auth,email.trim(),password);
     // Account creation already succeeded even when the optional confirmation email fails.
     await sendEmailVerification(credential.user).catch(()=>{});
    }else await signInWithEmailAndPassword(auth,email.trim(),password);
    setPassword('');setConfirmation('');close();
   }
  }catch(error){setError(errorMessage(error));}finally{setBusy(false);}
 }
 return <dialog ref={dialog} className="entry-dialog auth-dialog" aria-labelledby="auth-title" onCancel={event=>{event.preventDefault();if(!busy)close();}}><form onSubmit={submit}><fieldset className="form-fieldset" disabled={busy}><div className="dialog-title"><div><span className="eyebrow">自分だけの手帳</span><h2 id="auth-title">{mode==='register'?'自分の手帳をつくる':mode==='reset'?'パスワードを再設定':'手帳にログイン'}</h2></div><button type="button" aria-label="ログイン画面を閉じる" onClick={close}>×</button></div>{mode!=='reset'&&<div className="segmented"><button type="button" aria-pressed={mode==='login'} onClick={()=>changeMode('login')}>ログイン</button><button type="button" aria-pressed={mode==='register'} onClick={()=>changeMode('register')}>新規登録</button></div>}<p className="small-muted">自分のメールアドレスで利用できます。記録はアカウントごとに保存されます。</p><label>メールアドレス<input type="email" autoComplete="email" autoFocus required maxLength={254} value={email} onChange={event=>setEmail(event.currentTarget.value)}/></label>{mode!=='reset'&&<><label>パスワード<input type="password" minLength={mode==='register'?8:1} maxLength={128} autoComplete={mode==='register'?'new-password':'current-password'} required value={password} onChange={event=>setPassword(event.currentTarget.value)}/>{mode==='register'&&<small>8文字以上。ほかのサービスとは別のものを使ってください。</small>}</label>{mode==='register'&&<label>パスワードをもう一度<input type="password" minLength={8} maxLength={128} autoComplete="new-password" required value={confirmation} onChange={event=>setConfirmation(event.currentTarget.value)}/></label>}<label className="remember-option"><input type="checkbox" checked={remember} onChange={event=>setRemember(event.currentTarget.checked)}/>この端末でログインを保持する</label><p className="small-muted">学校などの共用端末ではチェックせず、利用後にログアウトしてください。</p></>}{error&&<p className="error" role="alert">{error}</p>}{notice&&<p className="auth-notice" role="status">{notice}</p>}<button className="button primary auth-submit" type="submit">{busy?'処理中…':mode==='register'?'登録して手帳をはじめる':mode==='reset'?'再設定メールを送る':'ログイン'}</button>{mode==='reset'?<button type="button" className="text-button" onClick={()=>changeMode('login')}>ログインに戻る</button>:<button type="button" className="text-button" onClick={()=>changeMode('reset')}>パスワードを忘れたとき</button>}</fieldset></form></dialog>;
}

function App(){
 const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(false),[showAuth,setShowAuth]=useState(false),[error,setError]=useState('');
 useEffect(()=>onAuthStateChanged(auth,user=>{setUser(user);setReady(true);setError('');if(user)setShowAuth(false);},()=>{setReady(true);setError('ログイン状態を確認できませんでした。再読込してください。');}),[]);
 const api=useMemo(()=>user?createPlannerApi(user.uid):signedOutApi,[user?.uid]);
 useEffect(()=>()=>{if('dispose' in api)(api as ReturnType<typeof createPlannerApi>).dispose();},[api]);
 if(!ready)return <main className="auth-loading" role="status">手帳を開いています…</main>;
 return <>{error&&<div className="error" role="alert">{error}</div>}<Planner key={user?.uid||'signed-out'} uid={user?.uid} signedIn={!!user} displayName="あなた" api={api} onSignIn={()=>setShowAuth(true)} onSignOut={async()=>{try{await signOut(auth);}catch(error){throw new Error(errorMessage(error));}}}/>{showAuth&&!user&&<AuthDialog close={()=>setShowAuth(false)}/>}</>;
}
createRoot(document.getElementById('root')!).render(<App/>);
