// scripts/validate.mjs
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve('src/data');

function loadJson(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required data file: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

const errors = [];
function assert(cond, msg) {
  if (!cond) {
    errors.push(msg);
  }
}

try {
  const contests = loadJson('contests.json');
  const candidates = loadJson('candidates.json');
  const issues = loadJson('issues.json');
  const positions = loadJson('positions.json');
  const facts = loadJson('facts.json');
  const sources = loadJson('sources.json');
  const meta = loadJson('meta.json');

  assert(Array.isArray(contests), 'contests.json must be an array');
  assert(Array.isArray(candidates), 'candidates.json must be an array');
  assert(Array.isArray(issues), 'issues.json must be an array');
  assert(Array.isArray(positions), 'positions.json must be an array');
  assert(Array.isArray(facts), 'facts.json must be an array');
  assert(Array.isArray(sources), 'sources.json must be an array');
  assert(meta && typeof meta.lastUpdated === 'string', 'meta.json must have lastUpdated string');

  const contestMap = new Map();
  for (const c of contests) {
    assert(c.id, 'Contest missing id');
    assert(!contestMap.has(c.id), `Duplicate contest id: ${c.id}`);
    contestMap.set(c.id, c);
  }

  const candidateMap = new Map();
  for (const k of candidates) {
    assert(k.id, 'Candidate missing id');
    assert(!candidateMap.has(k.id), `Duplicate candidate id: ${k.id}`);
    candidateMap.set(k.id, k);
  }

  const issueMap = new Map();
  for (const i of issues) {
    assert(i.id, 'Issue missing id');
    assert(!issueMap.has(i.id), `Duplicate issue id: ${i.id}`);
    issueMap.set(i.id, i);
  }

  const sourceMap = new Map();
  for (const s of sources) {
    assert(s.id, 'Source missing id');
    assert(!sourceMap.has(s.id), `Duplicate source id: ${s.id}`);
    assert(s.url, `Source ${s.id} missing url`);
    assert(s.title, `Source ${s.id} missing title`);
    assert(s.accessed, `Source ${s.id} missing accessed date`);
    sourceMap.set(s.id, s);
  }

  // Cross reference checks
  for (const c of contests) {
    for (const kid of c.candidateIds || []) {
      assert(candidateMap.has(kid), `Contest ${c.id} references non-existent candidate: ${kid}`);
    }
    for (const iid of c.issueIds || []) {
      assert(issueMap.has(iid), `Contest ${c.id} references non-existent issue: ${iid}`);
    }
  }

  for (const k of candidates) {
    assert(contestMap.has(k.contestId), `Candidate ${k.id} references non-existent contest: ${k.contestId}`);
    for (const sid of k.sourceIds || []) {
      assert(sourceMap.has(sid), `Candidate ${k.id} references non-existent source: ${sid}`);
    }
  }

  for (const i of issues) {
    for (const cid of i.contestIds || []) {
      assert(contestMap.has(cid), `Issue ${i.id} references non-existent contest: ${cid}`);
    }
    for (const sid of i.sourceIds || []) {
      assert(sourceMap.has(sid), `Issue ${i.id} references non-existent source: ${sid}`);
    }
  }

  const VALID_POSITIONS = new Set([-2, -1, 0, 1, 2, null]);
  const VALID_EVIDENCE = new Set([
    'recorded-vote',
    'explicit-statement',
    'campaign-site',
    'news',
    'inference',
    'party-assumed',
    'unknown',
  ]);

  for (const p of positions) {
    assert(candidateMap.has(p.candidateId), `Position references non-existent candidate: ${p.candidateId}`);
    assert(issueMap.has(p.issueId), `Position references non-existent issue: ${p.issueId}`);
    assert(
      VALID_POSITIONS.has(p.position),
      `Position for ${p.candidateId}/${p.issueId} has invalid value: ${p.position}`
    );
    assert(
      VALID_EVIDENCE.has(p.evidenceType),
      `Position for ${p.candidateId}/${p.issueId} has invalid evidenceType: ${p.evidenceType}`
    );

    // null with evidenceType unknown
    if (p.position === null) {
      assert(
        p.evidenceType === 'unknown',
        `Position for ${p.candidateId}/${p.issueId} is null but evidenceType is '${p.evidenceType}' (expected 'unknown')`
      );
    }

    // party-assumed has sources
    if (p.evidenceType === 'party-assumed') {
      assert(
        Array.isArray(p.sourceIds) && p.sourceIds.length > 0,
        `Position for ${p.candidateId}/${p.issueId} is party-assumed but has no sourceIds`
      );
    }

    for (const sid of p.sourceIds || []) {
      assert(sourceMap.has(sid), `Position for ${p.candidateId}/${p.issueId} references non-existent source: ${sid}`);
    }
  }

  for (const f of facts) {
    assert(candidateMap.has(f.candidateId), `Fact references non-existent candidate: ${f.candidateId}`);
    for (const sid of f.sourceIds || []) {
      assert(sourceMap.has(sid), `Fact references non-existent source: ${sid}`);
    }
  }

  // Check all strings in src/data for encoding corruption / mojibake per QA brief
  const letterQuestionPattern = /[A-Za-z]\?(s|t|re|ll|d|ve|m)\b/;

  function validateStrings(obj, location) {
    if (typeof obj === 'string') {
      if (obj.includes('â€')) {
        errors.push(`String in ${location} contains 'â€': "${obj.slice(0, 80)}"`);
      }
      if (obj.includes('\uFFFD')) {
        errors.push(`String in ${location} contains U+FFFD: "${obj.slice(0, 80)}"`);
      }
      // Check letter-?-letter pattern outside URLs
      const withoutUrls = obj.replace(/https?:\/\/[^\s"'<>]+/gi, '');
      const match = withoutUrls.match(letterQuestionPattern);
      if (match) {
        errors.push(
          `String in ${location} contains corrupted punctuation ('${match[0]}') outside URLs: "${obj.slice(0, 80)}"`
        );
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, idx) => validateStrings(item, `${location}[${idx}]`));
    } else if (obj !== null && typeof obj === 'object') {
      for (const [key, val] of Object.entries(obj)) {
        validateStrings(val, `${location}.${key}`);
      }
    }
  }

  const allFiles = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
  for (const filename of allFiles) {
    const data = loadJson(filename);
    validateStrings(data, filename);
  }

  if (errors.length > 0) {
    console.error(`Validation FAILED with ${errors.length} error(s):`);
    for (const err of errors.slice(0, 30)) {
      console.error(` - ${err}`);
    }
    if (errors.length > 30) {
      console.error(` ... and ${errors.length - 30} more.`);
    }
    process.exit(1);
  }

  console.log('✓ Validation passed successfully!');
  console.log(`  Contests: ${contests.length}`);
  console.log(`  Candidates: ${candidates.length}`);
  console.log(`  Issues: ${issues.length}`);
  console.log(`  Positions: ${positions.length}`);
  console.log(`  Facts: ${facts.length}`);
  console.log(`  Sources: ${sources.length}`);
  process.exit(0);
} catch (e) {
  console.error('Validation script exception:', e);
  process.exit(1);
}
