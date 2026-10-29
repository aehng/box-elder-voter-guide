import { describe, it, expect } from 'vitest';
import {
  relation,
  calculateContestCloseness,
  formatStanceLabel,
  getEffectiveImportance,
  getShortIssueName,
} from './compare';
import type { Issue, Candidate, Position, UserAnswer } from '../types';

const mockIssue = (id: string, question: string = id): Issue => ({
  id,
  contestIds: ['test-contest'],
  category: 'General',
  question,
  leftLabel: 'Left option',
  rightLabel: 'Right option',
  leftPros: [],
  leftCons: [],
  rightPros: [],
  rightCons: [],
  background: 'Background info',
  sourceIds: [],
});

const mockCandidate = (id: string, name: string = id): Candidate => ({
  id,
  name,
  contestId: 'test-contest',
  party: 'Independent',
  researchStatus: 'solid',
  sourceIds: [],
});

describe('helpers', () => {
  it('formats stance labels according to formatStanceLabel', () => {
    const issue = mockIssue('test', 'Test Question');
    expect(formatStanceLabel(-2, issue)).toBe(`Strongly: ${issue.leftLabel}`);
    expect(formatStanceLabel(-1, issue)).toBe(`Lean: ${issue.leftLabel}`);
    expect(formatStanceLabel(0, issue)).toBe('Middle ground');
    expect(formatStanceLabel(1, issue)).toBe(`Lean: ${issue.rightLabel}`);
    expect(formatStanceLabel(2, issue)).toBe(`Strongly: ${issue.rightLabel}`);
    expect(formatStanceLabel(null, issue)).toBe('No stance');
  });

  it('determines effective importance (unset defaults to 3)', () => {
    expect(getEffectiveImportance(undefined)).toBe(3);
    expect(getEffectiveImportance({ importance: null })).toBe(3);
    expect(getEffectiveImportance({ importance: 0 })).toBe(0);
    expect(getEffectiveImportance({ importance: 5 })).toBe(5);
  });

  it('retrieves short issue names', () => {
    expect(getShortIssueName({ id: 'water-great-salt-lake-and-data-center' })).toBe('Water & Salt Lake');
    expect(getShortIssueName({ id: 'unknown-custom-issue-slug' })).toBe('Unknown Custom Issue');
  });
});

describe('relation() function', () => {
  it('covers partial rule: middle ground 0 vs -2 returns partial', () => {
    // user 0 vs candidate -2
    const rel1 = relation(
      { stance: 0, status: 'answered', importance: 3 },
      { position: -2, evidenceType: 'explicit-statement' }
    );
    expect(rel1).toBe('partial');

    // user -2 vs candidate 0
    const rel2 = relation(
      { stance: -2, status: 'answered', importance: 3 },
      { position: 0, evidenceType: 'explicit-statement' }
    );
    expect(rel2).toBe('partial');

    // user 0 vs candidate 2
    const rel3 = relation(
      { stance: 0, status: 'answered', importance: 3 },
      { position: 2, evidenceType: 'explicit-statement' }
    );
    expect(rel3).toBe('partial');

    // user 0 vs candidate 1
    const rel4 = relation(
      { stance: 0, status: 'answered', importance: 3 },
      { position: 1, evidenceType: 'explicit-statement' }
    );
    expect(rel4).toBe('partial');

    // both 0 returns agree
    const relBothZero = relation(
      { stance: 0, status: 'answered', importance: 3 },
      { position: 0, evidenceType: 'explicit-statement' }
    );
    expect(relBothZero).toBe('agree');

    // opposite sides without middle ground: -1 vs 1 returns differ
    const relOpposite = relation(
      { stance: -1, status: 'answered', importance: 3 },
      { position: 1, evidenceType: 'explicit-statement' }
    );
    expect(relOpposite).toBe('differ');
  });

  it('handles no-opinion as no-opinion relation', () => {
    const rel = relation(
      { status: 'no-opinion' },
      { position: 2, evidenceType: 'explicit-statement' }
    );
    expect(rel).toBe('no-opinion');
  });

  it('handles unknown candidate position as unknown relation', () => {
    const rel1 = relation(
      { stance: 1, status: 'answered' },
      undefined
    );
    expect(rel1).toBe('unknown');

    const rel2 = relation(
      { stance: 1, status: 'answered' },
      { position: null, evidenceType: 'unknown' }
    );
    expect(rel2).toBe('unknown');
  });
});

describe('calculateContestCloseness()', () => {
  it('unknowns do not lower a candidate score', () => {
    const contestIssues = [
      mockIssue('issue-1'),
      mockIssue('issue-2'),
      mockIssue('issue-3'),
    ];
    const candidateA = mockCandidate('cand-a', 'Candidate A');
    const candidateB = mockCandidate('cand-b', 'Candidate B');

    // User answered all 3 issues with stance = 2, importance = 3
    const answers: Record<string, UserAnswer> = {
      'issue-1': { stance: 2, importance: 3, status: 'answered', updated: '' },
      'issue-2': { stance: 2, importance: 3, status: 'answered', updated: '' },
      'issue-3': { stance: 2, importance: 3, status: 'answered', updated: '' },
    };

    // Candidate A has stances on all 3 (all 2, so 100% closeness)
    // Candidate B has stance only on issue-1 (stance 2, 100% closeness), other 2 are unknown
    const positionsByCandidate = new Map<string, Position[]>([
      [
        'cand-a',
        [
          { candidateId: 'cand-a', issueId: 'issue-1', position: 2, evidenceType: 'explicit-statement', summary: '', sourceIds: [], confidence: 'high' },
          { candidateId: 'cand-a', issueId: 'issue-2', position: 2, evidenceType: 'explicit-statement', summary: '', sourceIds: [], confidence: 'high' },
          { candidateId: 'cand-a', issueId: 'issue-3', position: 2, evidenceType: 'explicit-statement', summary: '', sourceIds: [], confidence: 'high' },
        ],
      ],
      [
        'cand-b',
        [
          { candidateId: 'cand-b', issueId: 'issue-1', position: 2, evidenceType: 'explicit-statement', summary: '', sourceIds: [], confidence: 'high' },
        ],
      ],
    ]);

    const res = calculateContestCloseness({
      contestIssues,
      candidates: [candidateA, candidateB],
      positionsByCandidate,
      answers,
    });

    const resA = res.results.find((r) => r.candidate.id === 'cand-a')!;
    const resB = res.results.find((r) => r.candidate.id === 'cand-b')!;

    // Both candidates agree 100% on compared issues
    expect(resA.score).toBe(1.0);
    // Candidate B's missing data must NOT lower their score to 0.33!
    expect(resB.score).toBe(1.0);
    expect(resB.counted).toBe(1);
    expect(resB.unknownCount).toBe(2);
  });

  it('excludes importance 0 issues from score calculation', () => {
    const contestIssues = [
      mockIssue('issue-1'),
      mockIssue('issue-2'),
    ];
    const candidate = mockCandidate('cand-1');

    // Issue 1: user answered with importance 0 (must be excluded)
    // Issue 2: user answered with importance 3, stance 2
    const answers: Record<string, UserAnswer> = {
      'issue-1': { stance: 2, importance: 0, status: 'answered', updated: '' },
      'issue-2': { stance: 2, importance: 3, status: 'answered', updated: '' },
    };

    // Candidate disagrees on issue 1 (stance -2), agrees on issue 2 (stance 2)
    const positionsByCandidate = new Map<string, Position[]>([
      [
        'cand-1',
        [
          { candidateId: 'cand-1', issueId: 'issue-1', position: -2, evidenceType: 'explicit-statement', summary: '', sourceIds: [], confidence: 'high' },
          { candidateId: 'cand-1', issueId: 'issue-2', position: 2, evidenceType: 'explicit-statement', summary: '', sourceIds: [], confidence: 'high' },
        ],
      ],
    ]);

    const res = calculateContestCloseness({
      contestIssues,
      candidates: [candidate],
      positionsByCandidate,
      answers,
    });

    expect(res.hasExcludedImportanceZero).toBe(true);
    expect(res.answeredRelevant).toBe(1);
    const candRes = res.results[0];
    // Score should be 1.0 from issue-2, completely ignoring issue-1
    expect(candRes.score).toBe(1.0);
    expect(candRes.counted).toBe(1);
  });

  it('excludes no-opinion issues from score calculation but includes in traces', () => {
    const contestIssues = [
      mockIssue('issue-1'),
      mockIssue('issue-2'),
    ];
    const candidate = mockCandidate('cand-1');

    const answers: Record<string, UserAnswer> = {
      'issue-1': { stance: null, importance: null, status: 'no-opinion', updated: '' },
      'issue-2': { stance: 2, importance: 4, status: 'answered', updated: '' },
    };

    const positionsByCandidate = new Map<string, Position[]>([
      [
        'cand-1',
        [
          { candidateId: 'cand-1', issueId: 'issue-1', position: -2, evidenceType: 'explicit-statement', summary: '', sourceIds: [], confidence: 'high' },
          { candidateId: 'cand-1', issueId: 'issue-2', position: 2, evidenceType: 'explicit-statement', summary: '', sourceIds: [], confidence: 'high' },
        ],
      ],
    ]);

    const res = calculateContestCloseness({
      contestIssues,
      candidates: [candidate],
      positionsByCandidate,
      answers,
    });

    expect(res.answeredRelevant).toBe(1); // only issue-2
    expect(res.totalAnsweredInContest).toBe(2); // both issue-1 and issue-2
    const candRes = res.results[0];
    expect(candRes.score).toBe(1.0);
    expect(candRes.counted).toBe(1);

    // Traces must include both issues for the expanded issue-by-issue view
    expect(candRes.traces.length).toBe(2);
    const traceNoOp = candRes.traces.find((t) => t.issueId === 'issue-1')!;
    expect(traceNoOp.userStatus).toBe('no-opinion');
    expect(traceNoOp.relation).toBe('no-opinion');
    expect(traceNoOp.closeness).toBeNull();
  });

  it('applies importance weighting correctly', () => {
    const contestIssues = [
      mockIssue('issue-high-weight'),
      mockIssue('issue-low-weight'),
    ];
    const candidate = mockCandidate('cand-weighted');

    // Issue 1: weight 5, user stance 2
    // Issue 2: weight 1, user stance -2
    const answers: Record<string, UserAnswer> = {
      'issue-high-weight': { stance: 2, importance: 5, status: 'answered', updated: '' },
      'issue-low-weight': { stance: -2, importance: 1, status: 'answered', updated: '' },
    };

    // Candidate stance 2 on issue 1 (closeness = 1.0)
    // Candidate stance 2 on issue 2 (user -2 vs cand 2 -> d=4, closeness = 0.0)
    const positionsByCandidate = new Map<string, Position[]>([
      [
        'cand-weighted',
        [
          { candidateId: 'cand-weighted', issueId: 'issue-high-weight', position: 2, evidenceType: 'explicit-statement', summary: '', sourceIds: [], confidence: 'high' },
          { candidateId: 'cand-weighted', issueId: 'issue-low-weight', position: 2, evidenceType: 'explicit-statement', summary: '', sourceIds: [], confidence: 'high' },
        ],
      ],
    ]);

    const res = calculateContestCloseness({
      contestIssues,
      candidates: [candidate],
      positionsByCandidate,
      answers,
    });

    const candRes = res.results[0];
    // Expected weighted closeness: (5 * 1.0 + 1 * 0.0) / (5 + 1) = 5 / 6 = 0.8333333333333334
    expect(candRes.score).toBeCloseTo(5 / 6, 4);
  });

  it('sorts candidates with coverage >= 60% first, then low coverage (<60%), then 0 compared', () => {
    // 5 issues answered by user
    const contestIssues = [
      mockIssue('i1'),
      mockIssue('i2'),
      mockIssue('i3'),
      mockIssue('i4'),
      mockIssue('i5'),
    ];

    const candHighCov = mockCandidate('cand-high', 'High Coverage Cand');
    const candLowCov = mockCandidate('cand-low', 'Low Coverage Cand');
    const candZeroCov = mockCandidate('cand-zero', 'Zero Coverage Cand');

    // User answered all 5 issues
    const answers: Record<string, UserAnswer> = {
      i1: { stance: 2, importance: 3, status: 'answered', updated: '' },
      i2: { stance: 2, importance: 3, status: 'answered', updated: '' },
      i3: { stance: 2, importance: 3, status: 'answered', updated: '' },
      i4: { stance: 2, importance: 3, status: 'answered', updated: '' },
      i5: { stance: 2, importance: 3, status: 'answered', updated: '' },
    };

    // candHighCov: has 4 issues (4/5 = 80% coverage >= 60%), with closeness = 0.75
    // candLowCov: has 1 issue (1/5 = 20% coverage < 60%), with closeness = 1.00
    // candZeroCov: has 0 issues (0% coverage)
    const positionsByCandidate = new Map<string, Position[]>([
      [
        'cand-high',
        [
          { candidateId: 'cand-high', issueId: 'i1', position: 1, evidenceType: 'explicit-statement', summary: '', sourceIds: [], confidence: 'high' },
          { candidateId: 'cand-high', issueId: 'i2', position: 1, evidenceType: 'explicit-statement', summary: '', sourceIds: [], confidence: 'high' },
          { candidateId: 'cand-high', issueId: 'i3', position: 1, evidenceType: 'explicit-statement', summary: '', sourceIds: [], confidence: 'high' },
          { candidateId: 'cand-high', issueId: 'i4', position: 1, evidenceType: 'explicit-statement', summary: '', sourceIds: [], confidence: 'high' },
        ],
      ],
      [
        'cand-low',
        [
          { candidateId: 'cand-low', issueId: 'i1', position: 2, evidenceType: 'explicit-statement', summary: '', sourceIds: [], confidence: 'high' },
        ],
      ],
      ['cand-zero', []],
    ]);

    const res = calculateContestCloseness({
      contestIssues,
      candidates: [candLowCov, candZeroCov, candHighCov],
      positionsByCandidate,
      answers,
    });

    expect(res.results.length).toBe(3);

    // 1st place: candHighCov (coverage 80% >= 60%)
    expect(res.results[0].candidate.id).toBe('cand-high');
    expect(res.results[0].coverage).toBe(0.8);
    expect(res.results[0].isLowCoverage).toBe(false);

    // 2nd place: candLowCov (coverage 20% < 60%, flagged as low coverage)
    expect(res.results[1].candidate.id).toBe('cand-low');
    expect(res.results[1].coverage).toBe(0.2);
    expect(res.results[1].isLowCoverage).toBe(true);
    expect(res.results[1].score).toBe(1.0);

    // 3rd place: candZeroCov (0 compared)
    expect(res.results[2].candidate.id).toBe('cand-zero');
    expect(res.results[2].counted).toBe(0);
    expect(res.results[2].score).toBeNull();
  });
});
