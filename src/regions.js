export const REGIONS = {
 europe:['Europe','AD AL AT AX BA BE BG BY CH CZ DE DK EE ES FI FO FR GB GG GI GR HR HU IE IM IS IT JE LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS RU SE SI SJ SK SM UA VA XK'],
 'north-america':['North America','BM CA GL PM US'],
 'central-america-caribbean':['Central America & Caribbean','AG AI AW BB BL BQ BS BZ CR CU CW DM DO GD GP GT HN HT JM KN KY LC MF MQ MS MX NI PA PR SV SX TC TT VC VG VI'],
 'south-america':['South America','AR BO BR CL CO EC FK GF GY PE PY SR UY VE'],
 'north-africa':['North Africa','DZ EG EH LY MA SD TN'],
 'sub-saharan-africa':['Sub-Saharan Africa','AO BF BI BJ BW CD CF CG CI CM CV DJ ER ET GA GH GM GN GQ GW IO KE KM LR LS MG ML MR MU MW MZ NA NE NG RE RW SC SH SL SN SO SS ST SZ TD TF TG TZ UG YT ZA ZM ZW'],
 'middle-east':['Middle East','AE AM AZ BH CY GE IL IQ IR JO KW LB OM PS QA SA SY TR YE'],
 'central-asia':['Central Asia','KZ KG TJ TM UZ'],
 'south-asia':['South Asia','AF BD BT IN LK MV NP PK'],
 'east-asia':['East Asia','CN HK JP KP KR MN MO TW'],
 'southeast-asia':['Southeast Asia','BN ID KH LA MM MY PH SG TH TL VN'],
 oceania:['Oceania','AS AU CC CK CX FJ FM GU HM KI MH MP NC NF NR NU NZ PF PG PN PW SB TK TO TV UM VU WF WS']
};
export const LANGUAGES = ['English','Spanish','Portuguese','French','German','Italian','Arabic','Russian','Turkish','Hindi','Bengali','Chinese','Japanese','Korean','Indonesian','Vietnamese','Thai'];
export function regionFor(code){return Object.keys(REGIONS).find(k=>REGIONS[k][1].split(' ').includes(code.toUpperCase()))||null;}
export function countryGuide(){const names=new Intl.DisplayNames(['en'],{type:'region'});return Object.entries(REGIONS).map(([k,[name,codes]])=>`**${name}**\n${codes.split(' ').map(c=>`${names.of(c)} (${c})`).join(', ')}`).join('\n\n')+'\n\nAntarctica (AQ), Bouvet Island (BV), South Georgia & South Sandwich Islands (GS), and unlisted locations: open entry support for individual placement. These are Discord access groups, not guaranteed competitive server zones. Russia is assigned to Europe; Cyprus, Türkiye and the South Caucasus to Middle East; Mexico to Central America & Caribbean. Territory placement is an operational convention, not a political claim. Match zones depend on measured latency, available servers and participation.';}
