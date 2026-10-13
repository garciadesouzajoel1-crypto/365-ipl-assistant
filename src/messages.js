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
 return formatted.length<=2000?formatted:text;
}
export function visualPayload(payload,key='default'){
 if(typeof payload==='string')return {content:formatMessage(payload,key),allowedMentions:{parse:[]}};
 if(!payload||typeof payload!=='object'||typeof payload.content!=='string')return payload;
 return {...payload,content:formatMessage(payload.content,key)};
}
export const sendVisual=(target,payload,key='default')=>target.send(visualPayload(payload,key));
export const editVisual=(target,payload,key='default')=>target.edit(visualPayload(payload,key));
export const replyVisual=(i,payload)=>i.reply(visualPayload(payload,i.commandName||i.customId||'default'));
export const editReplyVisual=(i,payload)=>i.editReply(visualPayload(payload,i.commandName||i.customId||'default'));
