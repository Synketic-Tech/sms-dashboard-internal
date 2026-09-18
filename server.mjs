import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import pg from 'pg';
export const OWNER='00000000-0000-4000-8000-000000000001';
export const ARCHITECT='00000000-0000-4000-8000-000000000002';
const same=(a,b)=>typeof a==='string' && typeof b==='string' && a.length===b.length && timingSafeEqual(Buffer.from(a),Buffer.from(b));
export function createApp(pool,config) {
 const sessions=new Map(); const failures=new Map();
 return http.createServer(async(req,res)=>{
  const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  try {
   if (!['127.0.0.1','localhost'].includes((req.headers.host||'').split(':')[0])) return send(403,{error:'Local host required'});
   if(req.method==='GET' && ['/','/app.js','/style.css'].includes(req.url)) {
    const file=req.url==='/'?'index.html':req.url.slice(1);
    res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",'X-Content-Type-Options':'nosniff'});return res.end(await readFile(new URL(`./public/${file}`,import.meta.url)));
   }
   if(req.method!=='POST') return send(405,{error:'POST required; opening a link never executes a change'});
   if(req.headers.origin!==`http://${req.headers.host}` || !req.headers['content-type']?.startsWith('application/json')) return send(403,{error:'Same-origin JSON required'});
   let raw=''; for await(const chunk of req) {raw+=chunk;if(raw.length>8192)return send(413,{error:'Request too large'});}
   let body;try {body=JSON.parse(raw);} catch {return send(400,{error:'Invalid JSON'});}
   if(req.url==='/api/login') {
    const address=req.socket.remoteAddress;const attempt=failures.get(address);if(attempt && attempt.count>=10 && Date.now()-attempt.at<60000)return send(429,{error:'Too many attempts; retry in one minute'});
    const actor=same(body.key,config.ownerKey)?OWNER:same(body.key,config.architectKey)?ARCHITECT:null;
    if(!actor){failures.set(address,{count:(attempt?.count||0)+1,at:Date.now()});return send(401,{error:'Invalid local fixture key'});}
    failures.delete(address);const token=randomBytes(32).toString('hex'),csrf=randomBytes(32).toString('hex');sessions.set(token,{actor,csrf,expires:Date.now()+3600000});
    res.setHeader('Set-Cookie',`sms_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600`);return send(200,{actor,csrf,mode:'LOCAL SYNTHETIC ONLY'});
   }
   const token=req.headers.cookie?.match(/(?:^|; )sms_session=([a-f0-9]{64})(?:;|$)/)?.[1]; const session=sessions.get(token);
   if(!session || session.expires<Date.now())return send(401,{error:'Session expired. Sign in again; your form remains available.'});
   if(!same(req.headers['x-csrf-token'],session.csrf))return send(403,{error:'Invalid request confirmation token'});
   if(req.url==='/api/logout'){sessions.delete(token);return send(200,{ok:true});}
   if(req.url!=='/api/operate')return send(404,{error:'Unknown endpoint'});
   const {action,organization,environment,payload={}}=body;
   if(!['lookup','inspect','create','edit','preview','issue_mock','confirm_mock','apply'].includes(action)||!['sandbox','production'].includes(environment)||typeof payload!=='object'||payload===null||Array.isArray(payload))return send(400,{error:'Invalid operation'});
   if(action!=='lookup' && !/^[a-f0-9-]{36}$/i.test(organization||''))return send(400,{error:'Select an explicit organization'});
   if(['create','edit'].includes(action) && (!Number.isInteger(payload.amount)||payload.amount===0||Math.abs(payload.amount)>100000||typeof payload.reason!=='string'||!payload.reason.trim()||payload.reason.length>400))return send(400,{error:'Enter a nonzero integer up to 100000 and a reason of 1–400 characters'});
   const result=await pool.query('select platform_admin.operate($1,$2,$3,$4,$5) as result',[session.actor,action,organization||null,environment,payload]);
   const data=result.rows[0].result;return send(data?.error?409:200,data);
  }catch(e){return send(e.code==='42501'?403:503,{error:e.code==='42501'?'Access denied for this organization and environment':'Operation unavailable. Preserve this request and retry with the same request ID.'});}
 });
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
 const config=JSON.parse(await readFile('.local/config.json','utf8'));
 if(config.host!=='127.0.0.1'||config.database!=='sms_platform_admin_local'||config.user!=='sms_admin_gateway')throw new Error('This build supports only the isolated local fixture database');
 const pool=new pg.Pool({...config,max:8,statement_timeout:10000});
 createApp(pool,config).listen(4317,'127.0.0.1',()=>console.log('Local synthetic Platform Administration: http://127.0.0.1:4317. Use ownerKey or architectKey from .local/config.json.'));
}
