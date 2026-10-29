// Merge research/pass1/*.json + research/pass2/*.json -> src/data/*.json
import fs from 'node:fs'; import path from 'node:path';
const R='research', OUT='src/data'; const groups=['federal','legislature','education','county','amendments'];
const read=f=>{try{return JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''))}catch(e){console.warn('skip',f,e.message);return null}};
const contests=[],candidates=[],issues=new Map(),positions=[],facts=[],sources=new Map();
let order=0;
for(const g of groups){
  const p1=read(path.join(R,'pass1',g+'.json')); if(!p1) continue;
  const p2=read(path.join(R,'pass2',g+'.json'))||{positions:[],facts:[],sources:[]};
  for(const s of [...(p1.sources||[]),...(p2.sources||[])]) if(s?.id&&s.url&&!sources.has(s.id)) sources.set(s.id,{accessed:'2026-10-28',...s});
  for(const c of p1.contests||[]){
    const candIds=(c.candidates||[]).map(x=>x.id);
    contests.push({id:c.id,office:c.office,district:c.district,type:c.type==='amendment'?'amendment':'candidate',group:g,order:order++,
      whatOfficeDecides:c.whatOfficeDecides||[],howItAffectsVoters:c.howItAffectsVoters||'',candidateIds:candIds,issueIds:(c.issues||[]).map(i=>i.id),uncontested:candIds.length===1});
    for(const k of c.candidates||[]) candidates.push({id:k.id,name:k.name,party:k.party??null,contestId:c.id,incumbent:!!k.incumbent,status:k.status,campaignUrl:k.campaignUrl??null,bio:k.bio||'',background:k.background||[],sourceIds:k.sourceIds||[],researchStatus:'limited'});
    for(const i of c.issues||[]){ const ex=issues.get(i.id); if(ex){ex.contestIds.push(c.id);continue}
      issues.set(i.id,{id:i.id,contestIds:[c.id],category:i.category||'Other',question:i.question,leftLabel:i.leftLabel,rightLabel:i.rightLabel,leftPros:i.leftPros||[],leftCons:i.leftCons||[],rightPros:i.rightPros||[],rightCons:i.rightCons||[],background:i.background||'',whyLive:i.whyLive||'',sourceIds:i.sourceIds||[]});}
  }
  for(const p of p2.positions||[]){ if(![-2,-1,0,1,2,null].includes(p.position)) p.position=null; if(p.position===null) p.evidenceType='unknown'; positions.push({confidence:'low',sourceIds:[],...p}); }
  facts.push(...(p2.facts||[]));
}
// ensure every candidate x issue in its contest has a position row (unknown default)
const cmap=new Map(contests.map(c=>[c.id,c]));
for(const k of candidates){ const c=cmap.get(k.contestId); for(const iid of c.issueIds){ if(!positions.find(p=>p.candidateId===k.id&&p.issueId===iid)) positions.push({candidateId:k.id,issueId:iid,position:null,evidenceType:'unknown',summary:'No public position found during research.',date:null,sourceIds:[],confidence:'low'}); } }
// research status
for(const k of candidates){ const ps=positions.filter(p=>p.candidateId===k.id); const ev=ps.filter(p=>p.position!==null&&p.evidenceType!=='party-assumed').length;
  k.researchStatus = ps.length && ev/ps.length>=0.6 ? 'solid' : ev>0 ? 'partial' : 'limited'; }
// drop dangling source ids
const fix=o=>{o.sourceIds=(o.sourceIds||[]).filter(id=>sources.has(id))};
[...candidates,...issues.values(),...positions,...facts].forEach(fix);
// judges placeholder
contests.push({id:'judicial-retention',office:'Judicial Retention',type:'judicial',group:'judges',order:999,whatOfficeDecides:['Voters decide whether each judge keeps their seat for another term.'],howItAffectsVoters:'Retention research is not done yet. See the Utah Judicial Performance Evaluation Commission reports.',candidateIds:[],issueIds:[]});
fs.mkdirSync(OUT,{recursive:true});
const w=(n,d)=>fs.writeFileSync(path.join(OUT,n),JSON.stringify(d,null,1));
w('contests.json',contests);w('candidates.json',candidates);w('issues.json',[...issues.values()]);w('positions.json',positions);w('facts.json',facts);w('sources.json',[...sources.values()]);w('meta.json',{lastUpdated:new Date().toISOString().slice(0,10)});
console.log({contests:contests.length,candidates:candidates.length,issues:issues.size,positions:positions.length,facts:facts.length,sources:sources.size});
for(const k of candidates) console.log(k.contestId.padEnd(14),k.id.padEnd(22),k.researchStatus);
