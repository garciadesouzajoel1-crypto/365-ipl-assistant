// One presentation layer for Discord messages; API responses and audit JSON stay machine-readable.
const themes = {
 welcome:['👋','Welcome to STARPOINT'],rules:['📜','Community rules'],region:['🌍','Your region & languages'],
 support:['🆘','Private support'],ticket:['🎫','Support ticket'],team:['👥','Team management'],
 competition:['🏆','Competition centre'],registration:['📝','Registration'],standings:['📊','Standings'],
 match:['🎮','Match centre'],result:['✅','Match result'],reminder:['⏰','Match reminder'],
 audit:['🔎','Server audit'],setup:['🛠️','Server setup'],error:['⚠️','Action needs attention'],
 profile:['🔗','Player profile'],log:['📋','Operations log'],default:['⭐','STARPOINT WORLD SERIES']
};
function theme(key,text){if(/^Unable to complete request/.test(text))return 'error';if(/Registration pending|requires tournament staff review|disputed/.test(text))return 'registration';if(themes[key])return key;return key.includes('team')?'team':key.includes('result')?'result':key.includes('match')||key==='check-in'?'match':key.includes('ticket')?'ticket':key.includes('audit')?'audit':key.includes('setup')?'setup':key==='register'?'registration':key.includes('region')||key.includes('language')||key.includes('accept')?'region':'default';}
export function formatMessage(text,key='default'){
 if(typeof text!=='string'||!text.trim()||text.startsWith('### '))return text;
 const [emoji,title]=themes[theme(key,text)];
 // Separate short sentences; don't split links, timestamps, decimal scores or command arguments.
 const body=text.replace(/\. (?=[A-Z][a-z])/g,'.\n\n').split('\n').map(line=>{
 const match=line.match(/^(ID|Captain|Region|Competition|Team A|Team B|Start|Reason|Minimum confirmed roster|Server \/ latency policy|Confirmed players and substitutes|Pending invitations):\s*(.*)$/);
 if(match)return `• **${match[1]}:** ${match[2]}`;
 return line;
 }).join('\n');
 const formatted=`### ${emoji} ${title}\n\n${body}`;
 // Never silently truncate externally supplied text or long tables.
 return formatted;
}
export function visualPayload(payload,key='default'){
 if(typeof payload==='string')return {content:formatMessage(payload,key),allowedMentions:{parse:[]}};
 if(!payload||typeof payload!=='object'||typeof payload.content!=='string')return payload;
 return {...payload,content:formatMessage(payload.content,key)};
}

// Prefer paragraph, line and sentence boundaries. Oversized sentences continue at whitespace.
export function splitMessage(text,limit=1900){
 if(typeof text!=='string')return [text];if(limit<100||limit>2000)throw Error('Invalid message limit');
 const chunks=[];let rest=text;
 while(rest.length>limit){const head=rest.slice(0,limit);let cut=head.lastIndexOf('\n\n');
 if(cut<limit/3)cut=head.lastIndexOf('\n');
 if(cut<limit/3){const matches=[...head.matchAll(/[.!?;,]\s+/g)];cut=matches.length?matches.at(-1).index+1:-1;}
 if(cut<limit/3){const whitespace=[...head.matchAll(/\s+/g)];cut=whitespace.length?whitespace.at(-1).index:-1;}
 if(cut<=0||cut>limit)throw Error('A single word or link exceeds the Discord message limit; shorten it before publishing');
 if(/[\uD800-\uDBFF]/.test(rest[cut-1]))cut--;
 chunks.push(rest.slice(0,cut));rest=rest.slice(cut);
 }
 if(rest.length||!chunks.length)chunks.push(rest);return chunks;
}
export function visualParts(payload,key='default'){
 const p=visualPayload(payload,key);if(!p||typeof p.content!=='string')return [p];
 return splitMessage(p.content).map((content,index,all)=>{
 const part={content,allowedMentions:p.allowedMentions||{parse:[]}};
 if(index===0)for(const field of ['files','embeds','flags','attachments','nonce','enforceNonce'])if(p[field]!==undefined)part[field]=p[field];
 if(index===all.length-1&&p.components!==undefined)part.components=p.components;
 return part;
 });
}
export async function sendVisual(target,payload,key='default'){
 const parts=visualParts(payload,key),sent=[];for(const part of parts)sent.push(await target.send(part));
 sent[0].continuationIds=sent.slice(1).map(m=>m.id);return sent[0];
}
export async function upsertVisual(target,ids,payload,key='default'){
 const parts=visualParts(payload,key),sent=[];
 for(let index=0;index<parts.length;index++){
 const old=ids[index]?await target.messages.fetch(ids[index]).catch(e=>{if(e.code===10008)return null;throw e;}):null;
 if(old&&old.author?.id!==target.client.user.id)throw Error('Stored message is not owned by this bot');
 sent.push(old?await old.edit({...parts[index],components:parts[index].components||[]}):await target.send(parts[index]));
 }
 for(const id of ids.slice(parts.length)){const old=await target.messages.fetch(id).catch(e=>{if(e.code===10008)return null;throw e;});if(old?.author.id===target.client.user.id)await old.delete();}
 return sent.map(m=>m.id);
}
export const editVisual=(target,payload,key='default')=>{
 const parts=visualParts(payload,key);if(parts.length>1)throw Error('Use upsertVisual for a multi-message edit');return target.edit(parts[0]);
};
async function interactionVisual(i,payload,edit){
 const parts=visualParts(payload,i.commandName||i.customId||'default');
 const first=edit?await i.editReply(parts[0]):await i.reply(parts[0]);
 for(const part of parts.slice(1))await i.followUp({...part,flags:64});return first;
}
export const replyVisual=(i,payload)=>interactionVisual(i,payload,false);
export const editReplyVisual=(i,payload)=>interactionVisual(i,payload,true);
