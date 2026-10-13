import {attachRuntime,swsCommands} from './src/runtime.js';
import { oauthRoute } from './oauth.js';
import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import crypto from 'node:crypto';
import { makeMcpHandler } from './mcp.js';
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID, OPENAI_API_KEY, OWNER_ID } = process.env;
if (![DISCORD_TOKEN, CLIENT_ID, GUILD_ID].every(Boolean)) throw new Error('Missing DISCORD_TOKEN, CLIENT_ID or GUILD_ID');
if(process.env.SWS_ENABLED==='true'&&!process.env.SWS_DATA_PATH)throw Error('SWS_DATA_PATH on a persistent volume is required');
const commands = process.env.SWS_ENABLED === 'true' ? swsCommands : [new SlashCommandBuilder().setName('ping').setDescription('Check whether 365 is online').toJSON()];
const rest = new REST({version:'10'}).setToken(DISCORD_TOKEN);
await rest.put(Routes.applicationGuildCommands(CLIENT_ID,GUILD_ID),{body:commands});
console.log('365 guild commands registered');
const client = new Client({intents:[GatewayIntentBits.Guilds, ...(process.env.SWS_ENABLED === 'true' ? [GatewayIntentBits.GuildMembers] : [])]});
if (process.env.SWS_ENABLED === 'true') attachRuntime(client, GUILD_ID);
client.on('interactionCreate', async i => { if(i.inGuild() && i.guildId === GUILD_ID && i.isChatInputCommand() && i.commandName === 'ping') await i.reply({content:'365 is online.',flags:MessageFlags.Ephemeral}); });
await client.login(DISCORD_TOKEN);


// V3: API privada para futuros conectores ChatGPT/MCP.
// No habilitar sin BRIDGE_API_KEY y OWNER_ID configurados.
import http from 'node:http';
import { timingSafeEqual, randomUUID } from 'node:crypto';
const bridgeKey = process.env.BRIDGE_API_KEY;
const plans = new Map();
const safeName = name => typeof name==='string' && /^[\p{L}\p{N}_\- ]{1,90}$/u.test(name);
const sendJSON=(res,status,data)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data));};
function isAuthorized(req){
 const header=req.headers.authorization||'';
 const supplied=header.startsWith('Bearer ')?header.slice(7):'';
 if(!bridgeKey||!process.env.OWNER_ID||supplied.length!==bridgeKey.length)return false;
 return timingSafeEqual(Buffer.from(supplied),Buffer.from(bridgeKey));
}
async function getBody(req){
 let body='';
 for await(const chunk of req){body+=chunk;if(body.length>10000)throw Error('Request too large');}
 return JSON.parse(body||'{}');
}
const mcpHandler=makeMcpHandler({client,guildId:GUILD_ID,ChannelType});
const server=http.createServer(async(req,res)=>{
  if(await oauthRoute(req,res))return;
  if(req.url?.split('?')[0]==='/mcp')return mcpHandler(req,res);
 if(req.url==='/health'&&req.method==='GET')return sendJSON(res,200,{ok:true,botReady:client.isReady()});
 if(!req.url?.startsWith('/bridge/'))return sendJSON(res,404,{error:'Not found'});
 if(!isAuthorized(req))return sendJSON(res,401,{error:'Unauthorized'});
 try{
  const guild=await client.guilds.fetch(GUILD_ID);
  if(req.url==='/bridge/status'&&req.method==='GET')return sendJSON(res,200,{bot:client.user?.tag,server:guild.name,ready:client.isReady()});
  if(req.url==='/bridge/channels'&&req.method==='GET'){
   const channels=await guild.channels.fetch();
   return sendJSON(res,200,{channels:[...channels.values()].filter(Boolean).map(c=>({id:c.id,name:c.name,type:c.type,parentId:c.parentId}))});
  }
  if(req.url==='/bridge/plan'&&req.method==='POST'){
   const body=await getBody(req);
   if(!['create_channel','rename_channel','move_channel','send_message'].includes(body.action))return sendJSON(res,400,{error:'Action not allowed'});
   if(body.action==='create_channel'&&!safeName(body.name))return sendJSON(res,400,{error:'Invalid name'});
   if(body.action==='rename_channel'&&!safeName(body.name))return sendJSON(res,400,{error:'Invalid name'});
   if(body.action==='send_message'&&(!body.message||typeof body.message!=='string'||body.message.length>1800))return sendJSON(res,400,{error:'Invalid message'});
   if(body.action!=='create_channel'){
    const channel=await guild.channels.fetch(body.channel_id).catch(()=>null);
    if(!channel||channel.guildId!==GUILD_ID)return sendJSON(res,400,{error:'Invalid channel'});
   }
   if(body.action==='move_channel' || (body.action==='create_channel'&&body.category_id)){
    const category=await guild.channels.fetch(body.category_id).catch(()=>null);
    if(!category||category.type!==ChannelType.GuildCategory)return sendJSON(res,400,{error:'Invalid category'});
   }
   const id=randomUUID();plans.set(id,{body,expires:Date.now()+5*60*1000});
   return sendJSON(res,200,{approval_id:id,expires_in_seconds:300,proposal:body,warning:'Explicit owner confirmation is required'});
  }
  if(req.url==='/bridge/execute'&&req.method==='POST'){
   const {approval_id,confirm}=await getBody(req);
   const plan=plans.get(approval_id);
   if(!plan||plan.expires<Date.now())return sendJSON(res,404,{error:'Proposal expired or not found'});
   if(confirm!==true)return sendJSON(res,400,{error:'Confirmation required'});
   plans.delete(approval_id);
   const b=plan.body;
   let result;
   if(b.action==='create_channel')result=await guild.channels.create({name:b.name,type:ChannelType.GuildText,parent:b.category_id||undefined,reason:'365: orden privada aprobada'});
   else{
    const channel=await guild.channels.fetch(b.channel_id);
    if(b.action==='rename_channel')result=await channel.setName(b.name,'365: orden privada aprobada');
    if(b.action==='move_channel')result=await channel.setParent(b.category_id,{lockPermissions:false});
    if(b.action==='send_message')result=await channel.send({content:b.message,allowedMentions:{parse:[]}});
   }
   console.log('[365 BRIDGE AUDIT]',new Date().toISOString(),b.action,JSON.stringify(b).slice(0,300));
   return sendJSON(res,200,{success:true,action:b.action,result_id:result?.id});
  }
  return sendJSON(res,404,{error:'Unknown route'});
 }catch(e){console.error('[365 BRIDGE ERROR]',e);return sendJSON(res,500,{error:'Unable to complete request'});}
});
server.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('365 Bridge listening on PORT'));

