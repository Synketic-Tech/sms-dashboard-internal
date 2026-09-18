import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import pg from 'pg';
import {createApp,OWNER,ARCHITECT} from '../server.mjs';
const config=JSON.parse(await readFile('.local/config.json','utf8'));
const gateway=new pg.Pool({...config,max:8});
const root=new pg.Pool({host:'127.0.0.1',user:'postgres',database:'sms_platform_admin_local',max:8});
const org='10000000-0000-4000-8000-000000000001', other='10000000-0000-4000-8000-000000000002';
const op=async(action,payload={},actor=OWNER,organization=org,environment='sandbox',pool=gateway)=>(await pool.query('select platform_admin.operate($1,$2,$3,$4,$5) result',[actor,action,organization,environment,payload])).rows[0].result;
const create=async(amount=5,environment='sandbox')=>op('create',{id:randomUUID(),amount,reason:'Synthetic acceptance test',category:amount>0?'internal_test_grant':'approved_removal'},OWNER,org,environment);
const approved=async(amount=5)=>{const r=await create(amount);const issued=await op('issue_mock',r);const approval=await op('confirm_mock',{...r,secret:issued.mockSecret});assert.equal(approval.status,'approved');return approval;};
const account=async()=> (await op('inspect')).account;
after(async()=>{await gateway.end();await root.end();});

test('database roles deny customer RPC access, raw tables, clinical schema and arbitrary SQL',async()=>{
 await assert.rejects(gateway.query('select * from platform_admin.grants'),/permission denied/);
 await assert.rejects(gateway.query('select * from public.fce_sandbox_report_token_accounts'),/permission denied/);
 await assert.rejects(gateway.query("select public.apply_fce_sandbox_report_token_adjustment($1,'forbidden:direct:adjust','support_adjustment',1,'test')",[org]),/permission denied/);
 await root.query('create table if not exists public.synthetic_patient_canary(secret text)');
 await assert.rejects(gateway.query('select * from public.synthetic_patient_canary'),/permission denied/);
 const client=await root.connect();try{await client.query('set role authenticated');await assert.rejects(op('inspect',{},OWNER,org,'sandbox',client),/permission denied/);}finally{await client.query('reset role');client.release();}
 assert.equal((await op('drop table',{})).error,'Unsupported operation');
});
test('explicit actor grants, cross-organization isolation and environment binding',async()=>{
 await assert.rejects(op('inspect',{},randomUUID()),/Access denied/);
 await assert.rejects(op('inspect',{},ARCHITECT,other),/Access denied/);
 const matches=await op('lookup',{query:'Restricted'},ARCHITECT,null);assert.deepEqual(matches,[]);
 const r=await create();assert.match((await op('preview',r,OWNER,other)).error,/unavailable/);
 assert.match((await op('preview',r,OWNER,org,'production')).error,/unavailable/);
 await assert.rejects(op('inspect',{},OWNER,org,'invalid'),/Access denied/);
});
test('preview is read-only and production grant/application remains disabled',async()=>{
 const before=await op('inspect',{},OWNER,org,'production');const r=await create(8,'production');
 const preview=await op('preview',r,OWNER,org,'production');assert.equal(preview.availableAfter,before.account.available_tokens+8);
 assert.match((await op('issue_mock',r,OWNER,org,'production')).error,/sandbox-only/);
 assert.match((await op('apply',r,OWNER,org,'production')).error,/Production application disabled/);
 assert.deepEqual((await op('inspect',{},OWNER,org,'production')).account,before.account);
});
test('approval tampering, expiry, replay, edit invalidation and requester binding',async()=>{
 const r=await create();let issued=await op('issue_mock',r);
 assert.match((await op('confirm_mock',{...r,secret:'tampered'})).error,/invalid/);
 assert.match((await op('confirm_mock',{...r,secret:issued.mockSecret},ARCHITECT)).error,/requesting administrator/);
 const edited=await op('edit',{...r,amount:6});assert.equal(edited.revision,2);
 assert.match((await op('confirm_mock',{...edited,secret:issued.mockSecret})).error,/invalid/);
 issued=await op('issue_mock',edited);
 await root.query("update platform_admin.requests set expires_at=now()-interval '1 second' where id=$1",[r.id]);
 assert.match((await op('confirm_mock',{...edited,secret:issued.mockSecret})).error,/expired/);
 issued=await op('issue_mock',edited);await op('confirm_mock',{...edited,secret:issued.mockSecret});
 assert.match((await op('confirm_mock',{...edited,secret:issued.mockSecret})).error,/already used/);
 await root.query("update platform_admin.requests set expires_at=now()-interval '1 second' where id=$1",[r.id]);
 assert.match((await op('apply',edited)).error,/current approval/);
});
test('concurrent idempotent create and application give exactly one ledger effect and complete audit',async()=>{
 const input={id:randomUUID(),amount:7,reason:'Synthetic concurrent test',category:'internal_test_grant'};
 const created=await Promise.all(Array.from({length:6},()=>op('create',input)));assert.ok(created.every(r=>r.id===input.id));
 assert.match((await op('create',{...input,reason:'Changed reason'})).error,/conflict/);
 const issued=await op('issue_mock',created[0]);const r=await op('confirm_mock',{...created[0],secret:issued.mockSecret});
 const before=await account();const results=await Promise.all(Array.from({length:8},()=>op('apply',r)));
 assert.ok(results.every(x=>x.status==='applied'));assert.equal((await account()).available_tokens,before.available_tokens+7);assert.equal((await account()).reserved_tokens,before.reserved_tokens);
 assert.equal((await root.query('select count(*)::int n from public.fce_sandbox_report_token_ledger_entries where event_key=$1',[`platform-admin:${r.id}`])).rows[0].n,1);
 const audit=(await root.query("select detail from platform_admin.audit where request_id=$1 and action='apply'",[r.id])).rows;assert.equal(audit.length,1);
 const applied=audit[0].detail.request;assert.equal(applied.result.requester,OWNER);assert.equal(applied.result.approver,OWNER);assert.equal(applied.result.beforeAvailable,before.available_tokens);assert.ok(applied.result.appliedAt);assert.equal(applied.category,'internal_test_grant');
 await assert.rejects(gateway.query('delete from platform_admin.audit'),/permission denied/);
 await assert.rejects(root.query('delete from platform_admin.audit where request_id=$1',[r.id]),/append-only/);
});
test('insufficient available balance preserves reservations and request for recovery',async()=>{
 const before=await account();const r=await approved(-100000);const result=await op('apply',r);assert.match(result.error,/insufficient/);assert.deepEqual(await account(),before);
 const current=(await root.query('select status from platform_admin.requests where id=$1',[r.id])).rows[0];assert.equal(current.status,'approved');
 assert.equal((await root.query("select count(*)::int n from platform_admin.audit where request_id=$1 and action='failed:apply'",[r.id])).rows[0].n,1);
});
test('competing removals serialize; only available tokens are spendable',async()=>{
 const before=await account();const quantity=Math.floor(before.available_tokens*0.7);const a=await approved(-quantity),b=await approved(-quantity);
 const results=await Promise.all([op('apply',a),op('apply',b)]);assert.equal(results.filter(x=>x.status==='applied').length,1);assert.equal(results.filter(x=>x.error?.includes('insufficient')).length,1);
 assert.equal((await account()).available_tokens,before.available_tokens-quantity);assert.equal((await account()).reserved_tokens,before.reserved_tokens);
 // Restore via the same approved ledger path for repeatable test runs.
 await op('apply',await approved(quantity));
});
test('approval expiry is rechecked after waiting for the account lock',async()=>{
 const r=await approved();const client=await root.connect();
 try{await client.query('begin');await client.query('select * from public.fce_sandbox_report_token_accounts where organization_id=$1 for update',[org]);
 await root.query("update platform_admin.requests set expires_at=clock_timestamp()+interval '300 milliseconds' where id=$1",[r.id]);
 const apply=op('apply',r);await new Promise(resolve=>setTimeout(resolve,500));await client.query('commit');assert.match((await apply).error,/expired/);
 }finally{await client.query('rollback');client.release();}
});
test('existing purchase, reservation, consumption, release and retry remain compatible',async()=>{
 const id=randomUUID(),reservation=randomUUID();const before=await account();
 await root.query("select public.apply_fce_sandbox_report_token_adjustment($1,$2,'purchase',5,null)",[org,`purchase:${id}`]);
 await root.query("select public.reserve_fce_sandbox_report_tokens($1,$2,$3,3,now()+interval '1 hour')",[org,reservation,`reserve:${id}`]);
 const receipt=`fce-sandbox-report-receipt:${id.replaceAll('-','').repeat(2)}`;
 const consume=()=>root.query('select public.consume_fce_sandbox_report_token($1,$2,$3,$4) r',[org,receipt,`consume:${id}`,reservation]);
 assert.equal((await consume()).rows[0].r.consumed,1);assert.equal((await consume()).rows[0].r.replayed,true);
 await root.query('select public.release_fce_sandbox_report_token_reservation($1,$2,$3)',[org,reservation,`release:${id}`]);
 const after=await account();assert.equal(after.available_tokens,before.available_tokens+4);assert.equal(after.reserved_tokens,before.reserved_tokens);
 const response=JSON.stringify(await op('inspect'));assert.ok(!response.includes(receipt));assert.ok(!response.includes(reservation));assert.ok(!response.includes('approval_hash'));
});
test('HTTP rejects unauthenticated, forged actor, cross-origin, GET and malformed writes',async()=>{
 const server=createApp(gateway,config);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${server.address().port}`;
 const post=(path,body,headers={})=>fetch(url+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:url,...headers},body:JSON.stringify(body)});
 try{
 assert.equal((await post('/api/operate',{action:'inspect',organization:org,environment:'sandbox'})).status,401);
 const login=await post('/api/login',{key:config.architectKey});const identity=await login.json();const headers={Cookie:login.headers.get('set-cookie').split(';')[0],'X-CSRF-Token':identity.csrf};
 assert.equal((await post('/api/operate',{action:'inspect',organization:other,environment:'sandbox',actor:OWNER},headers)).status,403);
 assert.equal((await post('/api/operate',{action:'inspect',organization:org,environment:'sandbox'},{...headers,Origin:'https://evil.invalid'})).status,403);
 assert.equal((await fetch(url+'/api/operate',{headers})).status,405);
 assert.equal((await post('/api/operate',{action:'create',organization:org,environment:'sandbox',payload:{id:randomUUID(),amount:1.5,reason:'test'}},headers)).status,400);
 assert.equal((await post('/api/operate',{action:'inspect',organization:org,environment:'sandbox'},headers)).status,200);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
