// Audit data stays in the running bot's private storage, never in source control.
import {REGIONS} from './regions.js';
const groups={ 'START HERE':'entry',GLOBAL:'global','PRIVATE WORKSPACES':'private',...Object.fromEntries(Object.entries(REGIONS).map(([key,[name]])=>[name.toUpperCase(),key]))};
const entry=['welcome','rules','choose-region','entry-support'];
const global=['announcements','competition-calendar','competition-guide','world-finals','community','clips','support','commands'];
const regional=['announcements','general','registrations','looking-for-team','looking-for-player','scrims','standings','support'];
const normalize=rows=>JSON.stringify(rows.map(o=>[o.id,o.type,String(o.allow),String(o.deny)]).sort((a,b)=>a[0].localeCompare(b[0])));
export function recoveryPlan(audit,current,resources){
 if(audit.guild!==current.guild)throw Error('Audit belongs to another server');
 const live=new Map(current.channels.map(c=>[c.id,c])),cats=new Map(audit.channels.filter(c=>c.type===4&&groups[c.name]).map(c=>[c.id,c]));
 const result=[];for(const item of audit.channels){let key;if(cats.has(item.id))key='category:'+groups[item.name];else {const parent=cats.get(item.parent);if(!parent||item.type!==0)continue;const group=groups[parent.name],allowed=group==='entry'?entry:group==='global'?global:group==='private'?[]:regional;if(!allowed.includes(item.name))continue;key=group+':'+item.name;}
 if(resources[key]===item.id)continue;if(resources[key])throw Error('Conflicting stored resource: '+key);
 const sameKey=audit.channels.filter(c=>c.name===item.name&&c.type===item.type&&c.parent===item.parent);if(sameKey.length!==1)throw Error('Ambiguous audited channel: '+key);
 const now=live.get(item.id);if(!now||now.name!==item.name||now.type!==item.type||now.parent!==item.parent||normalize(now.overwrites)!==normalize(item.overwrites))throw Error('Channel changed since audit: '+key);
 if(item.parent){const ap=cats.get(item.parent),lp=live.get(item.parent);if(!lp||lp.name!==ap.name||lp.type!==4)throw Error('Parent category changed: '+key);}
 result.push({key,id:item.id,snapshot:item});}
 return result;
}
export function applyRecovery(plan,current,store){
 const audit={guild:current.guild,channels:[...current.channels.filter(c=>c.type===4),...plan.filter(r=>r.snapshot.type!==4).map(r=>r.snapshot)]};
 // Recheck every captured snapshot, including category overwrites, immediately before recording IDs.
 for(const r of plan){const c=current.channels.find(c=>c.id===r.id);if(!c||c.name!==r.snapshot.name||c.type!==r.snapshot.type||c.parent!==r.snapshot.parent||normalize(c.overwrites)!==normalize(r.snapshot.overwrites))throw Error('Recovery preview is stale: '+r.key);if(store.data.resources[r.key]&&store.data.resources[r.key]!==r.id)throw Error('Stored resource changed: '+r.key);}
 recoveryPlan(audit,current,store.data.resources);
 store.transaction(d=>{for(const r of plan)d.resources[r.key]=r.id;});
 return plan.length;
}
