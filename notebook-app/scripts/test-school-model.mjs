import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const compile=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','src/model.ts','src/school-model.ts','--outDir','.model-test','--module','commonjs','--target','ES2022','--skipLibCheck'],{stdio:'inherit'});
if(compile.status!==0)process.exit(compile.status||1);
mkdirSync('.model-test',{recursive:true});writeFileSync('.model-test/package.json','{"type":"commonjs"}');
const run=spawnSync(process.execPath,['tests/school-model.test.cjs'],{stdio:'inherit'});process.exit(run.status||0);
