import {sendVisual,editVisual,replyVisual,editReplyVisual,formatMessage} from './src/messages.js';
import {inspect} from './src/setup.js';
import { verifyOAuth, oauthChallenge } from './oauth.js';
import { timingSafeEqual, randomUUID } from 'node:crypto';

const VERSION = '2025-03-26';
const ALLOWED = ['create_channel', 'rename_channel', 'move_channel', 'send_message'];
const schema = (properties, required = []) => ({type:'object', properties, required, additionalProperties:false});
const str = (description) => ({type:'string',description});
const TOOLS = [
 {name:'inspect_server',description:'Inspect roles, hierarchy, permissions and channel overwrites without changing anything.',inputSchema:schema({})},
 {name:'get_status',description:'Check whether 365 is connected to the Discord server.',inputSchema:schema({})},
 {name:'list_channels',description:'List channels and categories with IDs before proposing changes.',inputSchema:schema({})},
 {name:'propose_action',description:'Prepare ONE administrative action without executing it. Show the owner the concrete proposal and require explicit confirmation before execute_action.',inputSchema:schema({action:{type:'string',enum:ALLOWED},channel_id:str('Existing channel ID'),category_id:str('Destination category ID if applicable'),name:str('New channel name'),message:str('Message content, maximum 1800 characters')},['action'])},
 {name:'execute_action',description:'Execute a previous proposal only after the owner explicitly confirms that concrete proposal in conversation. Never execute on your own initiative.',inputSchema:schema({approval_id:str('ID returned by propose_action'),confirmation:{type:'string',enum:['CONFIRMO']}},['approval_id','confirmation'])}
];
function json(res,status,data,extra={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra});res.end(JSON.stringify(data));}
function secureBearer(req){
 const key=process.env.MCP_API_KEY;
 const header=req.headers.authorization||'';
 const value=header.startsWith('Bearer ')?header.slice(7):'';
 return Boolean(key && process.env.OWNER_ID && value.length===key.length && timingSafeEqual(Buffer.from(value),Buffer.from(key)));
}
function error(id,code,message){return {jsonrpc:'2.0',id,error:{code,message}};}
function result(id,data){return {jsonrpc:'2.0',id,result:data};}
function toolResult(data){return {content:[{type:'text',text:JSON.stringify(data)}],isError:false};}
async function readJSON(req){let text='';for await(const chunk of req){text+=chunk;if(text.length>12000)throw Error('Request too large');}return JSON.parse(text||'{}');}
function checkAction(p){
 if(!p || !ALLOWED.includes(p.action))throw Error('Action not allowed');
 const allowedKeys=new Set(['action','channel_id','category_id','name','message']);
 if(Object.keys(p).some(k=>!allowedKeys.has(k)))throw Error('Unknown parameters');
 if(p.action==='create_channel'||p.action==='rename_channel'){
  if(typeof p.name!=='string'||! /^[\p{L}\p{N}_\- ]{1,90}$/u.test(p.name))throw Error('Invalid name');
 }
 if(p.action!=='create_channel' && (!/^\d{16,22}$/.test(p.channel_id||'')))throw Error('Invalid channel ID');
 if((p.action==='move_channel'||p.category_id) && !/^\d{16,22}$/.test(p.category_id||''))throw Error('Invalid category ID');
 if(p.action==='send_message' && (typeof p.message!=='string'||!p.message.trim()||p.message.length>1800))throw Error('Invalid message');
 return Object.fromEntries(Object.entries(p).filter(([k])=>allowedKeys.has(k)));
}
export function makeMcpHandler({client,guildId,ChannelType}){
 const proposals=new Map();
 const guild=async()=>{if(!client.isReady())throw Error('Discord is not ready');return client.guilds.fetch(guildId);};
 async function callTool(name,args={}){
  const g=await guild();
  if(name==='inspect_server')return inspect(g);
  if(name==='get_status')return {ready:client.isReady(),bot:client.user?.tag,server:g.name};
  if(name==='list_channels'){
   const channels=await g.channels.fetch();
   return {channels:[...channels.values()].filter(Boolean).map(c=>({id:c.id,name:c.name,type:c.type===ChannelType.GuildCategory?'category':c.type===ChannelType.GuildText?'text':'other',parent_id:c.parentId}))};
  }
  if(name==='propose_action'){
   const p=checkAction(args);if(p.action==='send_message')p.message=formatMessage(p.message);
   if(p.action!=='create_channel'){
    const ch=await g.channels.fetch(p.channel_id).catch(()=>null);
    if(ch?.type!==ChannelType.GuildText)throw Error('Text channel not found');
   }
   if(p.category_id){const cat=await g.channels.fetch(p.category_id).catch(()=>null);if(cat?.type!==ChannelType.GuildCategory)throw Error('Category not found');}
   const approval_id=randomUUID();proposals.set(approval_id,{plan:p,expires:Date.now()+180000});
   if(proposals.size>100){for(const [id,v] of proposals)if(v.expires<Date.now())proposals.delete(id);}
   return {status:'AWAITING_APPROVAL',approval_id,expires_in_seconds:180,proposal:p,instructions:'Show proposal details to the owner and wait for explicit confirmation.'};
  }
  if(name==='execute_action'){
   if(args.confirmation!=='CONFIRMO'||typeof args.approval_id!=='string')throw Error('Explicit confirmation required');
   const entry=proposals.get(args.approval_id);
   if(!entry||entry.expires<Date.now())throw Error('Proposal missing or expired');
   proposals.delete(args.approval_id);
   const p=entry.plan,reason=`365 MCP aprobado para propietario ${process.env.OWNER_ID}`;
   let created;
   if(p.action==='create_channel')created=await g.channels.create({name:p.name,type:ChannelType.GuildText,parent:p.category_id||undefined,reason});
   else {
    const ch=await g.channels.fetch(p.channel_id);
    if(ch?.type!==ChannelType.GuildText)throw Error('Invalid channel');
    if(p.action==='rename_channel')created=await ch.setName(p.name,reason);
    if(p.action==='move_channel')created=await ch.setParent(p.category_id,{lockPermissions:false,reason});
    if(p.action==='send_message')created=await sendVisual(ch,{content:p.message,allowedMentions:{parse:[]}});
   }
   console.log('[365 MCP AUDIT]',new Date().toISOString(),p.action,created?.id);
   return {success:true,action:p.action,result_id:created?.id};
  }
  throw Error('Unknown tool');
 }
 return async function mcpHandler(req,res){
  if(!verifyOAuth(req))return oauthChallenge(res);
  if(req.method!=='POST')return json(res,405,{error:'Use POST for MCP'},{Allow:'POST'});
  let message;
  try{message=await readJSON(req);}catch{return json(res,400,error(null,-32700,'Invalid JSON'));}
  if(message.jsonrpc!=='2.0'||typeof message.method!=='string')return json(res,400,error(message.id??null,-32600,'Invalid JSON-RPC request'));
  if(message.method==='notifications/initialized')return res.writeHead(202).end();
  if(message.id===undefined)return res.writeHead(202).end();
  const id=message.id;
  try{
   if(message.method==='initialize')return json(res,200,result(id,{protocolVersion:VERSION,capabilities:{tools:{listChanged:false}},serverInfo:{name:'365 IPL Assistant',version:'4.0.0'}}));
   if(message.method==='ping')return json(res,200,result(id,{}));
   if(message.method==='tools/list')return json(res,200,result(id,{tools:TOOLS}));
   if(message.method==='tools/call'){
    const name=message.params?.name,args=message.params?.arguments||{};
    if(!TOOLS.some(t=>t.name===name))return json(res,200,error(id,-32602,'Unknown tool'));
    try{return json(res,200,result(id,toolResult(await callTool(name,args))));}
    catch(e){return json(res,200,result(id,{content:[{type:'text',text:`Error: ${e.message}`}],isError:true}));}
   }
   return json(res,200,error(id,-32601,'Method not found'));
  }catch(e){console.error('[365 MCP ERROR]',e);return json(res,500,error(id,-32603,'Internal error'));}
 };
}


