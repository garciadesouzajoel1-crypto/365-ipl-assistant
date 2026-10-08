import crypto from 'node:crypto';
const origin = (process.env.OAUTH_BASE_URL || 'https://365-ipl-assistant-production.up.railway.app').replace(/\/$/, '');
const resource = `${origin}/mcp`;
const secret = process.env.OAUTH_OWNER_SECRET || '';
const signing = process.env.OAUTH_SIGNING_KEY || '';
const codes = new Map(), failures = new Map();
const b64 = b => Buffer.from(b).toString('base64url');
const sha = s => b64(crypto.createHash('sha256').update(s).digest());
const signRequest = data => { const value=b64(JSON.stringify(data)); return `${value}.${b64(crypto.createHmac('sha256',signing).update(`oauth-request:${value}`).digest())}`; };
const readRequest = value => { if(typeof value!=='string'||value.length>4096)return null; const parts=value.split('.');if(parts.length!==2)return null;const [data,mac]=parts;const expected=b64(crypto.createHmac('sha256',signing).update(`oauth-request:${data}`).digest());if(!equal(mac,expected))return null;try{const r=JSON.parse(Buffer.from(data,'base64url').toString());return r.expires>Date.now()&&r.expires<Date.now()+600000&&typeof r.client_id==='string'&&typeof r.redirect_uri==='string'&&typeof r.challenge==='string'&&typeof r.state==='string'?r:null;}catch{return null;} };
const equal = (a,b) => typeof a==='string' && typeof b==='string' && a.length===b.length && crypto.timingSafeEqual(Buffer.from(a),Buffer.from(b));
// Registro de cliente firmado: sobrevive a reinicios y evita depender de memoria.
const clientIdFor = redirects => {const payload=b64(JSON.stringify({redirects,iat:Date.now()}));return `${payload}.${b64(crypto.createHmac('sha256',signing).update(`oauth-client:${payload}`).digest())}`;};
const getClient = id => {if(typeof id!=='string'||id.length>4096)return null;const parts=id.split('.');if(parts.length!==2)return null;const [payload,mac]=parts;const expected=b64(crypto.createHmac('sha256',signing).update(`oauth-client:${payload}`).digest());if(!equal(mac,expected))return null;try{const d=JSON.parse(Buffer.from(payload,'base64url').toString());return Array.isArray(d.redirects)&&d.redirects.length>0&&d.redirects.every(allowedRedirect)&&Number.isFinite(d.iat)&&d.iat<=Date.now()+60000&&d.iat>Date.now()-30*86400000?{redirect_uris:d.redirects}:null;}catch{return null;}};
const resourceMatches = supplied => !supplied || supplied===resource;
const respond = (res, status, data, headers={}) => {res.writeHead(status, {'Content-Type':'application/json','Cache-Control':'no-store',...headers});res.end(JSON.stringify(data));};
const fail = (res, status, message) => respond(res,status,{error:message});
const clean = m => {for(const [k,v] of m)if(v.expires && v.expires<Date.now())m.delete(k);};
const allowedRedirect = s => {try {const u=new URL(s);return u.protocol==='https:' && (u.hostname==='chatgpt.com'||u.hostname.endsWith('.chatgpt.com')||u.hostname==='openai.com'||u.hostname.endsWith('.openai.com')) && !u.username && !u.password && !u.hash;}catch{return false;}};
const enabled = () => secret.length>=24 && signing.length>=32 && Boolean(process.env.OWNER_ID);
const token = () => {const payload={aud:resource,sub:process.env.OWNER_ID,exp:Math.floor(Date.now()/1000)+3600,iat:Math.floor(Date.now()/1000),jti:crypto.randomUUID()};const body=b64(JSON.stringify(payload));const mac=b64(crypto.createHmac('sha256',signing).update(body).digest());return `${body}.${mac}`;};
export function verifyOAuth(req){if(!enabled())return false;const match=/^Bearer (\S+)$/.exec(req.headers.authorization||'');if(!match)return false;const [body,mac,...extra]=match[1].split('.');if(!body||!mac||extra.length)return false;const expected=b64(crypto.createHmac('sha256',signing).update(body).digest());if(!equal(mac,expected))return false;try{const p=JSON.parse(Buffer.from(body,'base64url'));return p.aud===resource && p.sub===process.env.OWNER_ID && p.exp>Math.floor(Date.now()/1000);}catch{return false;}}
export function oauthChallenge(res){respond(res,401,{error:'No autorizado'},{'WWW-Authenticate':`Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource"`});}
async function body(req,limit=8192){let data='';for await(const c of req){data+=c;if(data.length>limit)throw Error('too_large');}const type=req.headers['content-type']||'';return type.includes('application/json')?JSON.parse(data):Object.fromEntries(new URLSearchParams(data));}
function loginPage(res,id){const html=`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>365 · Autorizar ChatGPT</title><body style="font:16px system-ui;background:#111;color:white;max-width:450px;margin:10vh auto;padding:24px"><h1>365 | IPL Assistant</h1><p>Vas a autorizar a ChatGPT para consultar y proponer cambios en el Discord de IPL. Confirma solamente si tú has iniciado esta conexión.</p><form method="post" action="/oauth/approve"><input type="hidden" name="request_id" value="${id}"><label>Contraseña privada de autorización<br><input name="password" type="password" autocomplete="off" required style="width:100%;padding:12px;margin:12px 0"></label><button style="padding:12px">Autorizar conexión</button></form></body></html>`;res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",'X-Frame-Options':'DENY','Referrer-Policy':'no-referrer'});res.end(html);}
export async function oauthRoute(req,res){const url=new URL(req.url,origin), path=url.pathname;
 if(path==='/.well-known/oauth-protected-resource'||path==='/.well-known/oauth-protected-resource/mcp'){respond(res,200,{resource,authorization_servers:[origin]});return true;}
 if(path==='/.well-known/oauth-authorization-server'){respond(res,200,{issuer:origin,authorization_endpoint:`${origin}/oauth/authorize`,token_endpoint:`${origin}/oauth/token`,registration_endpoint:`${origin}/oauth/register`,response_types_supported:['code'],grant_types_supported:['authorization_code'],code_challenge_methods_supported:['S256'],token_endpoint_auth_methods_supported:['none'],scopes_supported:['ipl:manage']});return true;}
 if(!path.startsWith('/oauth/'))return false;
 if(!enabled()){fail(res,503,'Configura OAUTH_OWNER_SECRET (24+), OAUTH_SIGNING_KEY (32+) y OWNER_ID');return true;}
 try{
 if(path==='/oauth/register'&&req.method==='POST'){
  const p=await body(req);if(!Array.isArray(p.redirect_uris)||p.redirect_uris.length<1||p.redirect_uris.length>5||!p.redirect_uris.every(allowedRedirect))return fail(res,400,'invalid_redirect_uri'),true;
  if(p.token_endpoint_auth_method && p.token_endpoint_auth_method!=='none')return fail(res,400,'invalid_client_metadata'),true;
  clean(clients);if(clients.size>50)return fail(res,429,'too_many_clients'),true;
  const id=crypto.randomUUID();clients.set(id,{redirect_uris:p.redirect_uris,created:Date.now(),expires:Date.now()+7*86400000});respond(res,201,{client_id:id,client_id_issued_at:Math.floor(Date.now()/1000),redirect_uris:p.redirect_uris,client_name:p.client_name||'ChatGPT',grant_types:['authorization_code'],response_types:['code'],token_endpoint_auth_method:'none'});return true;
 }
 if(path==='/oauth/authorize'&&req.method==='GET'){
  const q=url.searchParams,client=getClient(q.get('client_id'));
  if(!client||!client.redirect_uris.includes(q.get('redirect_uri'))||q.get('response_type')!=='code'||q.get('code_challenge_method')!=='S256'||!/^[A-Za-z0-9_-]{43}$/.test(q.get('code_challenge')||'')||!resourceMatches(q.get('resource'))||!q.get('state'))return fail(res,400,'invalid_request'),true;
  const id=signRequest({client_id:q.get('client_id'),redirect_uri:q.get('redirect_uri'),challenge:q.get('code_challenge'),state:q.get('state'),expires:Date.now()+300000});loginPage(res,id);return true;
 }
 if(path==='/oauth/approve'&&req.method==='POST'){
  const ip=req.socket.remoteAddress||'unknown';const attempts=failures.get(ip)||{count:0,expires:Date.now()+900000};if(attempts.expires<Date.now()){attempts.count=0;attempts.expires=Date.now()+900000;}if(attempts.count>=5)return fail(res,429,'Demasiados intentos. Espera 15 minutos.'),true;
  const p=await body(req),r=readRequest(p.request_id);if(!r)return fail(res,400,'Solicitud caducada o inválida. Reinicia la conexión.'),true;
  if(!equal(p.password,secret)){attempts.count++;failures.set(ip,attempts);return fail(res,403,'Contraseña incorrecta. Inicia la conexión de nuevo.'),true;}failures.delete(ip);
  const code=crypto.randomBytes(32).toString('base64url');codes.set(sha(code),{...r,expires:Date.now()+120000});const redirect=new URL(r.redirect_uri);redirect.searchParams.set('code',code);redirect.searchParams.set('state',r.state);res.writeHead(302,{Location:redirect.toString(),'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});res.end();return true;
 }
 if(path==='/oauth/token'&&req.method==='POST'){
  clean(codes);const p=await body(req),r=codes.get(sha(p.code||''));if(p.grant_type!=='authorization_code'||!r||p.client_id!==r.client_id||p.redirect_uri!==r.redirect_uri||!resourceMatches(p.resource)||sha(p.code_verifier||'')!==r.challenge)return fail(res,400,'invalid_grant'),true;
  codes.delete(sha(p.code));respond(res,200,{access_token:token(),token_type:'Bearer',expires_in:3600,scope:'ipl:manage'});return true;
 }
 fail(res,404,'not_found');return true;
 }catch(e){fail(res,400,'invalid_request');return true;}
}
