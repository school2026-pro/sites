import {getChatGPTUser,chatGPTSignInPath,chatGPTSignOutPath} from './chatgpt-auth';
import Planner from './planner';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();return <Planner signedIn={!!user} displayName={user?.fullName||'あなた'} signIn={chatGPTSignInPath('/')} signOut={chatGPTSignOutPath('/')}/>;}
