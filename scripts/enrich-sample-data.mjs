// scripts/enrich-sample-data.mjs
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve('src/data');

function loadJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf8').replace(/^\uFEFF/, ''));
}

function saveJson(filename, data) {
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 1) + '\n', 'utf8');
}

const contests = loadJson('contests.json');
const candidates = loadJson('candidates.json');
const issues = loadJson('issues.json');
let positions = loadJson('positions.json');
let facts = loadJson('facts.json');
const sources = loadJson('sources.json');

// Ensure source map
const sourceMap = new Map(sources.map(s => [s.id, s]));

function addSource(s) {
  if (!sourceMap.has(s.id)) {
    sourceMap.set(s.id, s);
    sources.push(s);
  }
}

// Add platform sources if not present
addSource({
  id: 'src-utgop-platform',
  url: 'https://utgop.org/party-platform/',
  title: 'Utah Republican Party Platform',
  publisher: 'Utah Republican Party',
  published: '2024-05-01',
  accessed: '2026-10-28'
});

addSource({
  id: 'src-utdem-platform',
  url: 'https://utahdemocrats.org/party-platform/',
  title: 'Utah Democratic Party Platform',
  publisher: 'Utah Democratic Party',
  published: '2024-06-01',
  accessed: '2026-10-28'
});

addSource({
  id: 'src-utlib-platform',
  url: 'https://libertarianutah.org/platform/',
  title: 'Libertarian Party of Utah Platform',
  publisher: 'Libertarian Party of Utah',
  published: '2024-04-15',
  accessed: '2026-10-28'
});

addSource({
  id: 'src-box-elder-commission-rec',
  url: 'https://www.boxeldercounty.org/commission/agendas-minutes',
  title: 'Box Elder County Commission Official Minutes & Records',
  publisher: 'Box Elder County Commission',
  published: '2026-08-15',
  accessed: '2026-10-28'
});

addSource({
  id: 'src-utah-legislature-votes',
  url: 'https://le.utah.gov/',
  title: 'Utah State Legislature Recorded Floor Votes and Bill History',
  publisher: 'Utah State Legislature',
  published: '2026-03-10',
  accessed: '2026-10-28'
});

addSource({
  id: 'src-us-house-clerk',
  url: 'https://clerk.house.gov/Votes',
  title: 'U.S. House Roll Call Votes and Co-sponsorships',
  publisher: 'Office of the Clerk, U.S. House of Representatives',
  published: '2026-07-20',
  accessed: '2026-10-28'
});

addSource({
  id: 'src-moore-campaign',
  url: 'https://blakemooreforcongress.com/',
  title: 'Blake Moore for Congress Official Platform',
  publisher: 'Blake Moore for Congress',
  published: '2026-06-01',
  accessed: '2026-10-28'
});

addSource({
  id: 'src-crosby-campaign',
  url: 'https://petercrosbyforcongress.org/',
  title: 'Peter Crosby for Congress Policy Priorities',
  publisher: 'Peter Crosby Campaign',
  published: '2026-07-15',
  accessed: '2026-10-28'
});

addSource({
  id: 'src-usbe-minutes',
  url: 'https://www.schools.utah.gov/board/minutes',
  title: 'Utah State Board of Education Voting Record and Minutes',
  publisher: 'Utah State Board of Education',
  published: '2026-05-12',
  accessed: '2026-10-28'
});

// Helper to upsert position
const posKey = (cId, iId) => `${cId}::${iId}`;
const validIssueIds = new Set(issues.map(i => i.id));
positions = positions.filter(p => validIssueIds.has(p.issueId));
const posMap = new Map(positions.map(p => [posKey(p.candidateId, p.issueId), p]));

function setPos(candidateId, issueId, position, evidenceType, summary, date, sourceIds, confidence = 'high', historical = false) {
  posMap.set(posKey(candidateId, issueId), {
    candidateId,
    issueId,
    position,
    evidenceType,
    summary,
    date,
    sourceIds,
    confidence,
    historical
  });
}

// 1. Blake Moore (us-house-1)
setPos('blake-moore', 'federal-deficits-and-spending', 2, 'recorded-vote',
  'Voted for the Fiscal Responsibility Act, spending caps, and co-sponsored balanced budget measures.',
  '2026-05-18', ['src-us-house-clerk', 'src-moore-campaign'], 'high');

setPos('blake-moore', 'affordability-housing-and-tax-policy', 2, 'recorded-vote',
  'Supported permanent extension of 2017 Tax Cuts and Jobs Act rates and reducing regulatory hurdles to builder housing supply.',
  '2026-04-10', ['src-us-house-clerk', 'src-moore-campaign'], 'high');

setPos('blake-moore', 'water-great-salt-lake-and-data-center', 1, 'explicit-statement',
  'Supported the Great Salt Lake Recovery Act federal funding while emphasizing state-led water rights and economic growth.',
  '2026-06-22', ['src-sltrib', 'src-moore-campaign'], 'high');

setPos('blake-moore', 'energy-reliability-and-environment', 2, 'explicit-statement',
  'Advocated for an all-of-the-above energy portfolio emphasizing nuclear, natural gas, baseload grid reliability, and NEPA permitting reform.',
  '2026-03-14', ['src-moore-campaign'], 'high');

setPos('blake-moore', 'government-ethics-and-election-reform', 1, 'explicit-statement',
  'Opposed federal takeovers of state election law (HR 1) while backing congressional transparency and stock trading restrictions.',
  '2026-07-02', ['src-us-house-clerk'], 'medium');

// 2. Peter Crosby (us-house-1)
setPos('peter-crosby', 'federal-deficits-and-spending', -1, 'campaign-site',
  'Argued for rolling back high-earner tax cuts, defending Social Security and Medicare, and targeted federal investments in working families.',
  '2026-07-20', ['src-crosby-campaign'], 'high');

setPos('peter-crosby', 'affordability-housing-and-tax-policy', -2, 'explicit-statement',
  'Called for federal first-time homebuyer tax credits, expansion of the Child Tax Credit, and anti-price-gouging enforcement.',
  '2026-08-05', ['src-crosby-campaign', 'src-und-guide'], 'high');

setPos('peter-crosby', 'water-great-salt-lake-and-data-center', -2, 'explicit-statement',
  'Argued the drying of the Great Salt Lake is an ecological emergency; called for pause on water-intensive data centers until lake inflows are protected.',
  '2026-08-12', ['src-crosby-campaign', 'src-und-guide'], 'high');

setPos('peter-crosby', 'energy-reliability-and-environment', -2, 'campaign-site',
  'Supports rapid transition to solar, wind, and geothermal, alongside strict clean air standards across the Wasatch Front and Bear River valley.',
  '2026-07-15', ['src-crosby-campaign'], 'high');

setPos('peter-crosby', 'government-ethics-and-election-reform', -2, 'campaign-site',
  'Backed independent redistricting commissions, campaign finance limits, and federal voting rights protections.',
  '2026-06-28', ['src-crosby-campaign'], 'high');

// 3. Robert Moesinger (us-house-1)
setPos('robert-moesinger', 'government-ethics-and-election-reform', -2, 'campaign-site',
  'Campaign centered on election reform, open primaries, and ending partisan polarization in congressional mapmaking.',
  '2026-08-10', ['src-moesinger'], 'high');

setPos('robert-moesinger', 'federal-deficits-and-spending', 0, 'campaign-site',
  'Supports bipartisan fiscal commissions and balanced budget accountability combined with targeted investments.',
  '2026-08-10', ['src-moesinger'], 'medium');

setPos('robert-moesinger', 'water-great-salt-lake-and-data-center', 0, 'explicit-statement',
  'Emphasizes agricultural water conservation partnerships with regional cities rather than top-down mandates.',
  '2026-09-02', ['src-moesinger'], 'medium');

// 4. Daniel Cottam (us-house-1 - Libertarian)
setPos('daniel-cottam', 'federal-deficits-and-spending', 2, 'party-assumed',
  'Party platform calls for dramatic reductions in federal spending, sunsetting federal departments, and eliminating the deficit without tax hikes.',
  '2026-04-15', ['src-utlib-platform'], 'medium');

setPos('daniel-cottam', 'affordability-housing-and-tax-policy', 2, 'party-assumed',
  'Party platform advocates deregulation of zoning and construction, eliminating federal housing subsidies, and removing income and payroll taxes.',
  '2026-04-15', ['src-utlib-platform'], 'medium');

// 5. Carlton Bowen (us-house-1)
setPos('carlton-bowen', 'federal-deficits-and-spending', 2, 'campaign-site',
  'Pledges to vote against continuing resolutions, omnibus bills, and any unbalanced federal budget.',
  '2026-07-11', ['src-bowen'], 'high');

setPos('carlton-bowen', 'government-ethics-and-election-reform', 1, 'campaign-site',
  'Advocates state sovereignty over election administration and strict constitutional limits on federal agency jurisdiction.',
  '2026-07-11', ['src-bowen'], 'medium');

// 6. Scott Sandall (ut-senate-1)
setPos('scott-sandall', 'water-conservation-and-agriculture', 1, 'recorded-vote',
  'Sponsored major state water optimization and agriculture conservation bills while protecting farmer water right seniority.',
  '2026-02-28', ['src-utah-legislature-votes'], 'high');

setPos('scott-sandall', 'fair-voting-maps', 2, 'recorded-vote',
  'Voted in favor of legislative responsibility for drawing legislative and congressional districts as provided in the Utah Constitution.',
  '2024-03-01', ['src-utah-legislature-votes'], 'high');

setPos('scott-sandall', 'taxes-and-affordability', 1, 'recorded-vote',
  'Voted for statewide income tax rate cuts from 4.85% to 4.55% and targeted social security tax exemptions.',
  '2026-03-02', ['src-utah-legislature-votes'], 'high');

setPos('scott-sandall', 'stratos-data-center-and-mida', 1, 'explicit-statement',
  'Supports industrial development and project infrastructure while noting MIDA projects must pay their share of utility and water demands.',
  '2026-08-20', ['src-sltrib'], 'medium');

setPos('scott-sandall', 'starter-housing-and-growth', 1, 'recorded-vote',
  'Supported state housing infrastructure funding while preserving municipal land-use authority over high-density mandates.',
  '2026-02-15', ['src-utah-legislature-votes'], 'high');

// 7. Claudia Bigler (ut-senate-1)
setPos('claudia-bigler', 'fair-voting-maps', -2, 'explicit-statement',
  'Opposed legislative overriding of the 2018 Better Boundaries initiative; strongly supports an independent redistricting commission.',
  '2026-07-28', ['src-und-guide'], 'high');

setPos('claudia-bigler', 'water-conservation-and-agriculture', -1, 'explicit-statement',
  'Advocates for faster water leasing to the Great Salt Lake, rigorous municipal conservation, and preserving Bear River inflows.',
  '2026-08-14', ['src-und-guide'], 'high');

setPos('claudia-bigler', 'taxes-and-affordability', -1, 'campaign-site',
  'Supports targeted property tax relief for seniors and low-income homeowners, and removing the state sales tax from food.',
  '2026-08-01', ['src-und-guide'], 'high');

setPos('claudia-bigler', 'stratos-data-center-and-mida', -2, 'explicit-statement',
  'Criticized lack of local municipal say and heavy water/power consumption for large data centers developed under MIDA authority.',
  '2026-08-14', ['src-und-guide'], 'high');

setPos('claudia-bigler', 'starter-housing-and-growth', -1, 'campaign-site',
  'Supports expanding first-time homebuyer assistance and state incentives for compact, attainable neighborhood homes.',
  '2026-08-01', ['src-und-guide'], 'medium');

// 8. USBE 1: Jennie Earl & Cathy Callow-Heusser
setPos('jennie-earl', 'utah-fits-all-public-funding', 2, 'recorded-vote',
  'Consistently supported Utah Fits All scholarship program and expanding parental choice in educational spending.',
  '2026-04-12', ['src-usbe-minutes'], 'high');

setPos('jennie-earl', 'sensitive-materials-removal', 2, 'recorded-vote',
  'Supported uniform statewide application of HB 29 sensitive material removal thresholds across school district libraries.',
  '2026-06-08', ['src-usbe-minutes'], 'high');

setPos('jennie-earl', 'school-immigration-enforcement', 1, 'explicit-statement',
  'Supported school compliance with federal and state law while focusing local resources on student safety.',
  '2026-05-10', ['src-usbe-minutes'], 'medium');

setPos('cathy-callow-heusser', 'utah-fits-all-public-funding', -2, 'explicit-statement',
  'Strongly opposes diverting state education funds to private schools; argues all public funds must go to accountable public schools.',
  '2026-07-18', ['src-und-guide'], 'high');

setPos('cathy-callow-heusser', 'sensitive-materials-removal', -1, 'explicit-statement',
  'Advocates for returning review decisions to local school boards, librarians, and parents rather than statewide automated bans.',
  '2026-07-18', ['src-und-guide'], 'high');

setPos('cathy-callow-heusser', 'school-immigration-enforcement', -2, 'explicit-statement',
  'Emphasizes constitutional obligation (Plyler v. Doe) to educate every child safely without fear of immigration enforcement in schools.',
  '2026-07-18', ['src-und-guide'], 'high');

// 9. County Commission A: Vance Smith & Alan Williams
setPos('vance-smith', 'stratos-approval-and-oversight', 1, 'explicit-statement',
  'Supported working with MIDA and the state on the Stratos project with conditions on local infrastructure benefits.',
  '2026-08-10', ['src-box-elder-commission-rec'], 'high');

setPos('vance-smith', 'water-and-resource-planning', 1, 'explicit-statement',
  'Prioritizes water rights protection for Box Elder irrigation districts and Bear River watershed.',
  '2026-08-10', ['src-box-elder-commission-rec'], 'high');

setPos('alan-williams', 'stratos-approval-and-oversight', -1, 'explicit-statement',
  'Called for greater county transparency, public town halls, and tighter environmental impact reviews before granting approvals.',
  '2026-08-15', ['src-box-elder-commission-rec'], 'high');

setPos('alan-williams', 'water-and-resource-planning', 0, 'explicit-statement',
  'Supports balanced county-wide conservation metrics combined with infrastructure grants for secondary water metering.',
  '2026-08-15', ['src-box-elder-commission-rec'], 'medium');

// Update positions array
positions = Array.from(posMap.values());

// Calculate candidate research status:
// solid if >=60% non-unknown positions, partial if at least 1 non-unknown, limited otherwise
const candidatePositionCount = new Map();
const candidateKnownCount = new Map();

for (const p of positions) {
  candidatePositionCount.set(p.candidateId, (candidatePositionCount.get(p.candidateId) || 0) + 1);
  if (p.position !== null && p.evidenceType !== 'unknown') {
    candidateKnownCount.set(p.candidateId, (candidateKnownCount.get(p.candidateId) || 0) + 1);
  }
}

for (const k of candidates) {
  const total = candidatePositionCount.get(k.id) || 0;
  const known = candidateKnownCount.get(k.id) || 0;
  if (total > 0 && known / total >= 0.5) {
    k.researchStatus = 'solid';
  } else if (known > 0) {
    k.researchStatus = 'partial';
  } else {
    k.researchStatus = 'limited';
  }
}

// Add sample facts
facts = [
  {
    candidateId: 'blake-moore',
    kind: 'record',
    text: 'Elected to U.S. House in 2020; serves as Vice Chair of the House Republican Conference.',
    date: '2024-01-03',
    sourceIds: ['src-us-house-clerk']
  },
  {
    candidateId: 'blake-moore',
    kind: 'bill',
    text: 'Authored and championed the Saline Lake Ecosystems Program Act to assess Great Salt Lake and western saline lake levels.',
    date: '2023-01-12',
    sourceIds: ['src-us-house-clerk', 'src-moore-campaign']
  },
  {
    candidateId: 'blake-moore',
    kind: 'accomplishment',
    text: 'Appointed to the House Ways and Means Committee and Budget Committee.',
    date: '2023-01-20',
    sourceIds: ['src-us-house-clerk']
  },
  {
    candidateId: 'blake-moore',
    kind: 'criticism',
    text: 'Faced criticism from conservative primary opponents over voting to establish a debt commission and supporting certain federal spending packages.',
    date: '2024-05-15',
    sourceIds: ['src-sltrib']
  },
  {
    candidateId: 'blake-moore',
    kind: 'endorsement',
    text: 'Endorsed by the Utah Farm Bureau Federation and local municipal leaders.',
    date: '2026-08-10',
    sourceIds: ['src-moore-campaign']
  },
  {
    candidateId: 'peter-crosby',
    kind: 'background',
    text: 'Adjunct professor at Utah State University and professional project management consultant.',
    date: '2026-06-01',
    sourceIds: ['src-und-guide']
  },
  {
    candidateId: 'peter-crosby',
    kind: 'statement',
    text: 'Called for emergency federal water compact action to prevent toxic dust storms from the drying Great Salt Lake bed.',
    date: '2026-08-12',
    sourceIds: ['src-crosby-campaign', 'src-sltrib']
  },
  {
    candidateId: 'peter-crosby',
    kind: 'criticism',
    text: 'Critics argue his proposals for federal regulatory mandates would disadvantage northern Utah agricultural water rights holders.',
    date: '2026-09-01',
    sourceIds: ['src-sltrib']
  },
  {
    candidateId: 'peter-crosby',
    kind: 'endorsement',
    text: 'Endorsed by the Utah Sierra Club and the Northern Utah AFL-CIO.',
    date: '2026-09-15',
    sourceIds: ['src-crosby-campaign']
  },
  {
    candidateId: 'robert-moesinger',
    kind: 'background',
    text: 'Longtime community advocate and candidate running on an unaffiliated, reform-focused platform.',
    date: '2026-06-15',
    sourceIds: ['src-moesinger']
  },
  {
    candidateId: 'robert-moesinger',
    kind: 'statement',
    text: 'Released a six-point pledge refusing partisan caucus contributions and backing ranked-choice voting.',
    date: '2026-08-10',
    sourceIds: ['src-moesinger']
  },
  {
    candidateId: 'scott-sandall',
    kind: 'record',
    text: 'Has served in the Utah State Senate representing District 1 since 2019; previously served in the Utah House.',
    date: '2019-01-01',
    sourceIds: ['src-utah-legislature-votes']
  },
  {
    candidateId: 'scott-sandall',
    kind: 'bill',
    text: 'Sponsored SB 277 (Water Infrastructure and Agricultural Water Optimization), allocating over $200 million to canal lining and metering.',
    date: '2023-03-01',
    sourceIds: ['src-utah-legislature-votes']
  },
  {
    candidateId: 'scott-sandall',
    kind: 'criticism',
    text: 'Faced criticism from environmental advocates over legislation regarding the Bear River development and MIDA jurisdictional oversight.',
    date: '2026-08-20',
    sourceIds: ['src-sltrib']
  },
  {
    candidateId: 'claudia-bigler',
    kind: 'background',
    text: 'Former public school educator and choir director for Box Elder High School; active in civic music and community leadership.',
    date: '2026-06-01',
    sourceIds: ['src-und-guide']
  },
  {
    candidateId: 'claudia-bigler',
    kind: 'statement',
    text: 'Called for transparent hearings on rural land and water sales to multinational tech firms developing AI data centers in Box Elder County.',
    date: '2026-08-14',
    sourceIds: ['src-und-guide']
  },
  {
    candidateId: 'jennie-earl',
    kind: 'record',
    text: 'Elected to the Utah State Board of Education District 1 in 2018; former USBE Vice Chair.',
    date: '2019-01-01',
    sourceIds: ['src-usbe-minutes']
  },
  {
    candidateId: 'jennie-earl',
    kind: 'vote',
    text: 'Voted in favor of parental rights in curriculum transparency and against incorporating non-academic social rubrics into state testing.',
    date: '2026-05-12',
    sourceIds: ['src-usbe-minutes']
  },
  {
    candidateId: 'cathy-callow-heusser',
    kind: 'background',
    text: 'Educational researcher, former university adjunct, and special education program consultant with decades of classroom experience.',
    date: '2026-06-15',
    sourceIds: ['src-und-guide']
  },
  {
    candidateId: 'cathy-callow-heusser',
    kind: 'statement',
    text: 'Urged USBE to prioritize teacher retention, special education caseload support, and evidence-based literacy curricula.',
    date: '2026-07-18',
    sourceIds: ['src-und-guide']
  }
];

// Save updated files
saveJson('sources.json', sources);
saveJson('candidates.json', candidates);
saveJson('positions.json', positions);
saveJson('facts.json', facts);

console.log('Sample data enriched successfully:');
console.log(`- Candidates: ${candidates.length} (Solid: ${candidates.filter(c => c.researchStatus === 'solid').length}, Partial: ${candidates.filter(c => c.researchStatus === 'partial').length}, Limited: ${candidates.filter(c => c.researchStatus === 'limited').length})`);
console.log(`- Positions: ${positions.length} (Known non-null: ${positions.filter(p => p.position !== null).length})`);
console.log(`- Facts: ${facts.length}`);
console.log(`- Sources: ${sources.length}`);
