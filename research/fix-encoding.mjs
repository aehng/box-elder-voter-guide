import fs from 'node:fs';
for (const d of ['research/pass1','research/pass2']) for (const f of fs.readdirSync(d)) {
  const p=d+'/'+f; let s=fs.readFileSync(p,'utf8'); const b=s;
  s=s.replace(/â€™/g,'\u2019').replace(/â€œ/g,'\u201C').replace(/â€\u009d|â€/g,'\u201D').replace(/â€”/g,'\u2014').replace(/\uFFFD/g,'\u2019')
     .replace(/([A-Za-z])\?(s|t|re|ll|d|ve|m)\b/g,'$1\u2019$2');
  if(s!==b){fs.writeFileSync(p,s);console.log('fixed',p)}
}
