import { Client } from 'pg';
import { readFile, mkdir, copyFile, writeFile } from 'node:fs/promises';
import { randomBytes, createHash } from 'node:crypto';
const database = 'sms_platform_admin_local';
const root = new Client({host:'127.0.0.1',user:'postgres',database:'postgres'});
await root.connect();
if ((await root.query('select 1 from pg_database where datname=$1',[database])).rowCount) throw new Error('Local database already exists; refusing to overwrite.');
await root.query(`create database ${database}`); await root.end();
const db = new Client({host:'127.0.0.1',user:'postgres',database}); await db.connect();
await db.query(await readFile('db/local-bootstrap.sql','utf8'));
await mkdir('db/vendor',{recursive:true});
const sources = ['20260901010000_fce_report_token_ledger.sql','20260910010000_fce_sandbox_report_token_ledger.sql'];
const register=[];
for (const name of sources) {
  const source = `../synketic-dashboard/supabase/migrations/${name}`;
  // Reproducible source snapshot: never modify the separate customer project.
  try { await readFile(`db/vendor/${name}`); } catch { await copyFile(source,`db/vendor/${name}`); }
  const sql=await readFile(`db/vendor/${name}`,'utf8');
  register.push({source,sha256:createHash('sha256').update(sql).digest('hex')}); await db.query(sql);
}
await db.query(await readFile('db/001-platform-admin.sql','utf8'));
await db.query(await readFile('db/local-fixtures.sql','utf8'));
const password=randomBytes(32).toString('hex');
await db.query(`alter role sms_admin_gateway password '${password}'`);
await mkdir('.local',{recursive:true});
await writeFile('.local/config.json',JSON.stringify({database,host:'127.0.0.1',user:'sms_admin_gateway',password,ownerKey:randomBytes(32).toString('hex'),architectKey:randomBytes(32).toString('hex')},null,2));
await writeFile('db/vendor/source-register.json',JSON.stringify(register,null,2));
await db.end(); console.log('Isolated local database created. Credentials are in ignored .local/config.json. No hosted connections.');
