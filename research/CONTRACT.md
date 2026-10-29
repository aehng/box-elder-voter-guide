# Research contract — Box Elder County, Utah, General Election Nov 3, 2026

Scope: ONLY these races/candidates. Judges skipped for now.

Race groups & stable IDs (use exactly):
- federal: contest `us-house-1` — candidates `peter-crosby`, `daniel-cottam`, `robert-moesinger`, `blake-moore`, `carlton-bowen`
- legislature: `ut-senate-1` — `claudia-bigler`, `scott-sandall`, `julie-quinlan`; `ut-house-6` — `rob-bishop`, `james-rich`
- education: `usbe-1` (State School Board D1) — `jennie-earl`, `cathy-callow-heusser`; `besd-7` (Box Elder School Board D7) — `karen-cronin`, `tara-tonioli`
- county: `commission-a` — `vance-smith`, `alan-williams`; `commission-b` — `nathan-tueller`; `sheriff` — `mike-allred`, `douglas-christensen`, `allan-shinney`, `chad-hayman`; `clerk` — `marla-young`; `attorney` — `blair-wardle`; `auditor` — `shirlene-larsen`
- amendments: `amendment-a`, `amendment-b` (Utah constitutional amendments on the 2026 ballot)

Rules:
- Evidence only. Never invent positions. Never infer from party alone unless labeled `party-assumed` AND you cite the party platform source.
- Unknown = position null, evidenceType "unknown". Not answering a questionnaire is NOT opposition.
- Source priority: official records > recorded votes/minutes > questionnaires/direct statements > campaign sites > established news > other.
- Record contradictory evidence. Mark historical (pre-2026 campaign) statements in summary.
- Every source: url, title, publisher, published (YYYY-MM-DD or null), accessed "2026-10-28".
- Verify party, withdrawals, incumbency against official Utah/Box Elder election sources.
- Write valid JSON (UTF-8). Write early and update incrementally so partial work survives.

## Pass 1 output: research/pass1/<group>.json
{
 "group": "...",
 "contests": [{
   "id": "us-house-1", "office": "...", "district": "...", "type": "candidate|amendment",
   "whatOfficeDecides": ["concise bullet", ...],
   "howItAffectsVoters": "2-3 sentences",
   "candidates": [{"id","name","party","incumbent":bool,"status":"on ballot|withdrawn (still on ballot)","campaignUrl","bio":"2-4 sentences factual","background":["career/office facts"],"sourceIds":[...]}],
   "issues": [{
     "id": "kebab-case-stable", "category": "Economy|Taxes|Housing & Growth|Water & Land|Education|Public Safety|Government & Elections|Health|Energy & Environment|Immigration|Social Issues|Federal Lands|Other",
     "question": "neutral question",
     "leftLabel": "short policy alternative (position -2 end)", "rightLabel": "short alternative (+2 end)",
     "leftPros": [...], "leftCons": [...], "rightPros": [...], "rightCons": [...],
     "background": "2-3 sentences", "whyLive": "evidence this divides candidates / is live in this race", "sourceIds": [...]
   }]  // 3-6 issues per contest, only ones that genuinely matter for this office & race. For amendments: one issue = For/Against with exact legal change.
 }],
 "sources": [{"id":"src-...","url","title","publisher","published","accessed":"2026-10-28"}]
}

## Pass 2 output: research/pass2/<group>.json
{
 "group": "...",
 "positions": [{"candidateId","issueId","position": -2|-1|0|1|2|null,
   "evidenceType": "recorded-vote|explicit-statement|campaign-site|news|inference|party-assumed|unknown",
   "summary":"1-2 sentences what they said/did and why it maps to this value",
   "date":"YYYY-MM-DD|null","sourceIds":[...],"confidence":"high|medium|low","historical":bool}],
 "facts": [{"candidateId","kind":"vote|bill|statement|record|accomplishment|criticism|background|endorsement","text","date","sourceIds":[...]}],
 "sources": [ same shape as pass 1, may include pass1 ids ]
}
Position scale: -2 strongly leftLabel, -1 lean left, 0 documented middle/mixed, +1 lean right, +2 strongly rightLabel. Double-check direction matches labels.
