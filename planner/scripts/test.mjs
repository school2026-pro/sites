import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
mkdirSync('.sites-runtime/tests',{recursive:true});
execFileSync(process.execPath,['node_modules/typescript/bin/tsc','lib/model.ts','lib/server.ts','--outDir','.sites-runtime/tests','--module','commonjs','--target','es2022','--skipLibCheck','--types','@cloudflare/workers-types'],{stdio:'inherit'});
writeFileSync('.sites-runtime/tests/package.json','{"type":"commonjs"}');
execFileSync(process.execPath,['tests/api-test.cjs'],{stdio:'inherit'});
