import {spawnSync} from 'node:child_process';
const persist=process.argv[2]||'.wrangler/state';
const r=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','migrations','apply','DB','--local','--config','wrangler.local.jsonc','--persist-to',persist],{stdio:'inherit',env:{...process.env,CI:'true'}});
if(r.error)throw r.error;process.exit(r.status??1);
