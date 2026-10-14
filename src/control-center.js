import {ActionRowBuilder,ButtonBuilder,ButtonStyle,ModalBuilder,TextInputBuilder,TextInputStyle} from 'discord.js';

// Interactive panels call the existing command handlers; no separate team or competition business logic.
const actions={
 profile:{title:'My profile',fields:[['steam','Steam ID (optional)',false],['faceit','FACEIT ID (optional)',false]],command:'profile'},
 'team-create':{title:'Create a team',fields:[['name','Team name',true]],command:'team',sub:'create'},
 'team-invite':{title:'Invite player',fields:[['player','Discord user ID (from Copy User ID)',true]],command:'team',sub:'invite',users:['player']},
 'team-accept':{title:'Accept invitation',fields:[['team','Team ID',true]],command:'team',sub:'accept'},
 'team-roster':{command:'team',sub:'roster'},
 'team-remove':{title:'Remove player',fields:[['player','Discord user ID',true]],command:'team',sub:'remove',users:['player'],confirm:true},
 'team-captain':{title:'Transfer captaincy',fields:[['player','Discord user ID',true]],command:'team',sub:'captain',users:['player'],confirm:true},
 register:{title:'Register team',fields:[['competition','Competition ID',true]],command:'register'},
 standings:{title:'View standings',fields:[['competition','Competition ID',true]],command:'standings'},
 'check-in':{title:'Match check-in',fields:[['match','Match ID',true]],command:'check-in'},
 'match-result':{title:'Submit match result',fields:[['match','Match ID',true],['a','Team A score',true],['b','Team B score',true]],ints:['a','b'],command:'match-result',confirm:true},
 'competition-create':{title:'Create competition',fields:[['name','Competition name',true],['region','Region key (e.g. europe)',true],['zone','Server / latency policy',true],['roster','Minimum roster (5+)',true]],ints:['roster'],command:'competition',sub:'create',staff:true,confirm:true},
 'competition-close':{title:'Close competition',fields:[['competition','Competition ID',true]],command:'competition',sub:'close',staff:true,confirm:true},
 'match-create':{title:'Schedule match',fields:[['competition','Competition ID',true],['a','Team A ID',true],['b','Team B ID',true],['time','ISO date with timezone',true],['link','HTTPS match URL (optional)',false]],command:'match-create',staff:true,confirm:true},
 'result-resolve':{title:'Resolve result',fields:[['match','Match ID',true],['a','Team A score',true],['b','Team B score',true],['reason','Reason for decision',true]],ints:['a','b'],command:'result-resolve',staff:true,confirm:true},
 'match-archive':{title:'Archive match',fields:[['match','Match ID',true]],command:'match-archive',staff:true,confirm:true},
 'region-approve':{title:'Approve region change',fields:[['player','Discord user ID',true]],users:['player'],fixed:{decision:'approve'},command:'region-review',staff:true,confirm:true},
 'region-reject':{title:'Reject region change',fields:[['player','Discord user ID',true]],users:['player'],fixed:{decision:'reject'},command:'region-review',staff:true,confirm:true},
 'sws-audit':{command:'sws-audit',owner:true},
 'sws-setup':{command:'sws-setup',owner:true},
 'reset-preview':{command:'sws-reset-messages',fixed:{action:'preview'},owner:true},
 'reset-status':{command:'sws-reset-messages',fixed:{action:'status'},owner:true},
 'reset-resume':{command:'sws-reset-messages',fixed:{action:'resume'},owner:true,confirm:true},
 'reset-cancel':{command:'sws-reset-messages',fixed:{action:'cancel'},owner:true,confirm:true}
};
const groups=[
 ['👋 GETTING STARTED',[['profile','MY PROFILE'],['ticket','OPEN TICKET'],['onboarding','REGION & LANGUAGES'],['help','HELP']]],
 ['👥 TEAM MANAGEMENT',[['team-create','CREATE TEAM'],['team-invite','INVITE PLAYER'],['team-accept','ACCEPT INVITE'],['team-roster','MY ROSTER'],['team-remove','REMOVE PLAYER'],['team-captain','TRANSFER CAPTAIN']]],
 ['🏆 COMPETITIONS',[['register','REGISTER TEAM'],['standings','VIEW STANDINGS']]],
 ['🎮 MATCH CENTER',[['check-in','MATCH CHECK-IN'],['match-result','SUBMIT RESULT']]]
];
const staffGroups=[
 ['🏆 TOURNAMENT MANAGEMENT',[['competition-create','CREATE COMPETITION'],['competition-close','CLOSE COMPETITION'],['match-create','SCHEDULE MATCH'],['result-resolve','RESOLVE RESULT'],['match-archive','ARCHIVE MATCH'],['region-approve','APPROVE REGION'],['region-reject','REJECT REGION']]],
 ['🛠️ SERVER MAINTENANCE',[['sws-audit','SERVER AUDIT'],['sws-setup','SERVER SETUP'],['reset-preview','RESET PREVIEW'],['reset-status','RESET STATUS'],['reset-resume','RESUME RESET'],['reset-cancel','CANCEL RESET']]]
];
export function controlPanels(staff=false){return (staff?staffGroups:groups).map(([heading,buttons])=>({content:'**'+heading+'**\\nSelect an action below. Responses are private. Existing permissions and eligibility rules still apply.',components:buttons.reduce((rows,[id,label],index)=>{if(index%5===0)rows.push(new ActionRowBuilder());rows.at(-1).addComponents(new ButtonBuilder().setCustomId('sws:ui:'+id).setLabel(label).setStyle(staff?ButtonStyle.Secondary:ButtonStyle.Primary));return rows;},[])}));}
function form(id,def){const m=new ModalBuilder().setCustomId('sws:ui-form:'+id).setTitle(def.title.slice(0,45));for(const [key,label,required] of def.fields){m.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(key).setLabel(label.slice(0,45)).setStyle(TextInputStyle.Short).setRequired(required).setMaxLength(200)));}return m;}
export async function routeControl(i,{isStaff,isOwner,execute,onboarding}){
 const key=i.customId||'';
 if(!['sws:ui:','sws:ui-form:','sws:ui-confirm:'].some(prefix=>key.startsWith(prefix)))return false;
 const id=key.split(':')[2];
 if(id==='onboarding'){await i.reply({content:'Complete onboarding in '+onboarding+'. Choose your region and languages, then press ACCEPT RULES.',flags:64});return true;}
 if(id==='help'){await execute(i,'help',null,{});return true;}
 if(id==='ticket'){
  const modal=new ModalBuilder().setCustomId('sws:ticket-form').setTitle('Private support');
  for(const [field,label,required,style] of [['competition','Competition ID (optional)',false,TextInputStyle.Short],['reason','How can we help?',true,TextInputStyle.Paragraph]]){
   modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(field).setLabel(label).setStyle(style).setRequired(required)));
  }
  await i.showModal(modal);return true;
 }
 const def=actions[id];if(!def)throw Error('Unknown control center action');
 if(def.owner&&!isOwner(i))throw Error('Owner access required');
 if(def.staff&&!isStaff(i))throw Error('Tournament Manager access required');
 if(key.startsWith('sws:ui:')&&def.fields){await i.showModal(form(id,def));return true;}
 let values={...def.fixed};
 if(key.startsWith('sws:ui-form:')){
  for(const [name] of def.fields)values[name]=i.fields.getTextInputValue(name).trim();
  if(def.confirm){
   execute.pending.set(i.user.id+':'+id,{values,expires:Date.now()+300000});
   const summary=Object.entries(values).map(([k,v])=>'**'+k+':** '+String(v).slice(0,150)).join('\\n');
   const row=new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('sws:ui-confirm:'+id+':yes').setLabel('CONFIRM').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('sws:ui-confirm:'+id+':no').setLabel('CANCEL').setStyle(ButtonStyle.Secondary)
   );
   await i.reply({content:'Confirm **'+def.title+'**?\\n'+summary,components:[row],flags:64});
   return true;
  }
 }
 if(key.startsWith('sws:ui-confirm:')){
  if(!key.endsWith(':yes')){execute.pending.delete(i.user.id+':'+id);await i.reply({content:'Action cancelled.',flags:64});return true;}
  const pending=execute.pending.get(i.user.id+':'+id);
  if(!pending||pending.expires<Date.now())throw Error('Confirmation expired. Start again.');
  execute.pending.delete(i.user.id+':'+id);values=pending.values;
 }
 await execute(i,def.command,def.sub,values,def);
 return true;
}
export function getControlAction(id){return actions[id];}
