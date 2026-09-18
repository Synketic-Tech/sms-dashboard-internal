import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
import pg from 'pg';
test('source snapshots match recorded hashes',async()=>{
 const register=JSON.parse(await readFile('db/vendor/source-register.json','utf8'));
 for(const item of register){const file=item.source.split('/').at(-1);assert.equal(createHash('sha256').update(await readFile(`db/vendor/${file}`,'utf8')).digest('hex'),item.sha256);}
});
test('missing account stays null, grant revocation applies immediately, rollback disables gateway',async()=>{
 const db=new pg.Client({host:'127.0.0.1',user:'postgres',database:'sms_platform_admin_local'});await db.connect();
 const org=randomUUID(),actor=randomUUID();
 try{await db.query('begin');
 await db.query('insert into public.organizations(id,name) values($1,$2)',[org,'Synthetic missing account']);
 await db.query("insert into platform_admin.grants values($1,$2,'sandbox')",[actor,org]);
 const call=()=>db.query("select platform_admin.operate($1,'inspect',$2,'sandbox') r",[actor,org]);
 assert.equal((await call()).rows[0].r.account,null);
 await db.query('delete from platform_admin.grants where actor=$1',[actor]);
 await db.query('savepoint denied');await assert.rejects(call(),/Access denied/);await db.query('rollback to savepoint denied');
 const rollback=await readFile('db/rollback-disable.sql','utf8');await db.query(rollback.replace('begin;','').replace('commit;',''));
 await db.query('set local role sms_admin_gateway');await assert.rejects(call(),/permission denied/);
 }finally{await db.query('rollback');await db.end();}
});
