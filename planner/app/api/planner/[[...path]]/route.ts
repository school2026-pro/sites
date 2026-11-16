import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../../chatgpt-auth';
import {plannerAPI} from '../../../../lib/server';
export const dynamic='force-dynamic';
async function handle(request:Request){const user=await getChatGPTUser();return plannerAPI(request,env.DB,user?.userId??null);}
export {handle as GET,handle as POST,handle as PUT,handle as DELETE,handle as PATCH};
