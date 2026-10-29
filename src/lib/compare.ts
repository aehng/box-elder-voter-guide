import type {
  UserAnswer,
  UserStance,
  UserAnswerStatus,
  Position,
  PositionValue,
  EvidenceType,
  Candidate,
  Issue,
  Source,
} from '../types';

export type ComparisonRelation =
  | 'agree'
  | 'partial'
  | 'differ'
  | 'unknown'
  | 'assumed-excluded'
  | 'no-opinion'
  | 'unanswered';

export interface UserInputLike {
  stance?: UserStance | null;
  status?: UserAnswerStatus;
  importance?: number | null;
}

export interface CandidatePositionLike {
  position?: PositionValue | null;
  evidenceType?: EvidenceType;
  sourceIds?: string[];
  summary?: string;
  confidence?: string;
}

export interface RelationOptions {
  includePartyAssumed?: boolean;
}

export const SHORT_TITLES: Record<string, string> = {
  'water-great-salt-lake-and-data-center': 'Water & Salt Lake',
  'affordability-housing-and-tax-policy': 'Housing & Taxes',
  'federal-deficits-and-spending': 'Deficits & Spending',
  'government-ethics-and-election-reform': 'Ethics & Elections',
  'energy-reliability-and-environment': 'Energy & Grid',
  'fair-voting-maps': 'Voting Maps',
  'water-conservation-and-agriculture': 'Water & Ag',
  'taxes-and-affordability': 'Tax Relief',
  'stratos-data-center-and-mida': 'Stratos / MIDA',
  'starter-housing-and-growth': 'Starter Housing',
  'farm-water-rights-and-conservation': 'Farm Water Rights',
  'tax-transparency-and-affordability': 'Tax Transparency',
  'government-accountability': 'Accountability',
  'utah-fits-all-public-funding': 'Utah Fits All',
  'sensitive-materials-removal': 'School Materials',
  'school-immigration-enforcement': 'Immigration & Schools',
  'third-grade-reading-retention': '3rd Grade Reading',
  'bell-to-bell-cellphone-policy': 'Cellphone Policy',
  'property-tax-increase-and-budget': 'Tax & Budget',
  'facilities-and-school-configuration': 'School Facilities',
  'secondary-grading-and-graduation': 'Grading Standards',
  'teacher-pay-and-workplace-support': 'Teacher Pay',
  'phones-and-state-testing': 'Phones & Testing',
  'stratos-approval-and-oversight': 'Stratos Oversight',
  'water-and-resource-planning': 'Water & Resources',
  'development-tax-and-public-benefit': 'Dev Incentives',
  'county-budget-and-property-taxes': 'County Budget',
  'dispatch-reliability-and-governance': 'Dispatch Reliability',
  'sheriff-management-accountability': 'Sheriff Oversight',
  'public-safety-budget-and-staffing': 'Safety & Staffing',
  'critical-incident-and-dispatch-practices': 'Incident Practices',
  'election-administration-and-access': 'Election Access',
  'election-transparency-and-records': 'Election Records',
  'election-readiness-and-resources': 'Election Readiness',
  'prosecution-and-victim-services': 'Prosecution & Victims',
  'legal-review-and-independence': 'Legal Independence',
  'county-legal-risk-and-disclosure': 'Legal Risk',
  'budget-transparency-and-fiscal-control': 'Budget Transparency',
  'property-tax-administration-and-relief': 'Tax Relief Admin',
  'budget-reserves-and-service-costs': 'Budget Reserves',
  'fraud-and-mismanagement-reporting': 'Fraud Reporting',
  'amendment-a-publication-method': 'Amendment A',
  'amendment-b-tax-initiative-threshold': 'Amendment B',
};

export function getShortIssueName(issue: { id: string }): string {
  if (SHORT_TITLES[issue.id]) {
    return SHORT_TITLES[issue.id];
  }
  return issue.id
    .split('-')
    .slice(0, 3)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Compares a user's answer with a candidate's position:
 * - if user status no-opinion -> 'no-opinion'
 * - user unanswered -> 'unanswered'
 * - cand null / unknown -> 'unknown'
 * - cand party-assumed && !includePartyAssumed -> 'assumed-excluded'
 * - else d = |u - c|:
 *     if (u === 0) !== (c === 0) && d <= 2 -> 'partial' (middle vs a side, e.g. 0 vs -2 = partial)
 *     else if same sign or d <= 1 -> 'agree'
 *     else d >= 2 -> 'differ'
 */
export function relation(
  user: UserInputLike | null | undefined,
  cand: CandidatePositionLike | null | undefined,
  options?: RelationOptions
): ComparisonRelation {
  if (user?.status === 'no-opinion') {
    return 'no-opinion';
  }
  if (!user || user.status === 'skipped' || user.stance === null || user.stance === undefined) {
    return 'unanswered';
  }
  if (!cand || cand.position === null || cand.position === undefined || cand.evidenceType === 'unknown') {
    return 'unknown';
  }
  if (cand.evidenceType === 'party-assumed' && !options?.includePartyAssumed) {
    return 'assumed-excluded';
  }

  const u = user.stance;
  const c = cand.position;
  const d = Math.abs(u - c);

  // if (u===0) !== (c===0) && d<=2 -> 'partial'
  if ((u === 0) !== (c === 0) && d <= 2) {
    return 'partial';
  }

  // else if same sign or d<=1 -> 'agree'
  const sameSign = (u > 0 && c > 0) || (u < 0 && c < 0) || (u === 0 && c === 0);
  if (sameSign || d <= 1) {
    return 'agree';
  }

  // else d>=2 -> 'differ'
  return 'differ';
}

/**
 * Returns canonical stance label:
 * 'Strongly: <left>', 'Lean: <left>', 'Middle ground', 'Lean: <right>', 'Strongly: <right>'
 */
export function formatStanceLabel(
  stance: number | null | undefined,
  issue: { leftLabel: string; rightLabel: string }
): string {
  if (stance === null || stance === undefined) {
    return 'No stance';
  }
  switch (stance) {
    case -2:
      return `Strongly: ${issue.leftLabel}`;
    case -1:
      return `Lean: ${issue.leftLabel}`;
    case 0:
      return 'Middle ground';
    case 1:
      return `Lean: ${issue.rightLabel}`;
    case 2:
      return `Strongly: ${issue.rightLabel}`;
    default:
      return String(stance);
  }
}

/**
 * Edge case helper: unassigned priority is treated as 3 (Moderately important).
 */
export function getEffectiveImportance(ans: UserInputLike | null | undefined): number {
  if (!ans || ans.importance === null || ans.importance === undefined) {
    return 3;
  }
  return ans.importance;
}

export interface CandidateIssueTrace {
  issueId: string;
  issue: Issue;
  userStance: UserStance;
  userStatus: UserAnswerStatus;
  candidatePosition: PositionValue;
  candPosObj?: Position;
  userStanceLabel: string;
  candidateStanceLabel: string;
  relation: ComparisonRelation;
  importance: number;
  closeness: number | null; // 0 to 1 if counted, null if unknown/assumed-excluded/no-opinion
  weightedContribution: number | null;
  sources: Source[];
}

export interface CandidateClosenessResult {
  candidate: Candidate;
  score: number | null; // 0 to 1 if counted >= 1, null if 0 compared
  counted: number;
  answeredRelevant: number;
  totalAnsweredInContest: number;
  unknownCount: number;
  coverage: number; // counted / answeredRelevant
  isLowCoverage: boolean; // coverage < 0.60
  isRanked: boolean; // backward-compatibility: counted >= 1
  traces: CandidateIssueTrace[];
  agreeCount: number;
  partialCount: number;
  differCount: number;
  weightedAgree: number;
  weightedDiffer: number;
}

export interface CalculateContestClosenessParams {
  contestIssues: Issue[];
  candidates: Candidate[];
  positionsByCandidate: Map<string, Position[]>;
  answers: Record<string, UserAnswer>;
  sourceMap?: Map<string, Source>;
  includePartyAssumed?: boolean;
}

/**
 * Closeness per contest:
 * Unknown/missing candidate data must NOT lower a score.
 * Score = importance-weighted closeness over ONLY issues where the user answered (status answered, importance>0; unset=3)
 * AND the candidate has a known stance (party-assumed only when toggle on).
 * Closeness = 1 - |u - c| / 4, weight = importance.
 *
 * Always show the score when >=1 issue compared; with 0 compared show "No data on your issues".
 * Low coverage (< 60%) flagged.
 * Sort: candidates with coverage >= 60% first by score desc, then low-coverage ones by score desc, then 0-compared. Neutral wording.
 */
export function calculateContestCloseness({
  contestIssues,
  candidates,
  positionsByCandidate,
  answers,
  sourceMap,
  includePartyAssumed = false,
}: CalculateContestClosenessParams): {
  answeredRelevant: number;
  totalAnsweredInContest: number;
  hasExcludedImportanceZero: boolean;
  results: CandidateClosenessResult[];
} {
  let hasExcludedImportanceZero = false;

  // Identify issues in this contest that the user answered with stance != null and importance > 0
  const relevantIssues = contestIssues.filter((issue) => {
    const ans = answers[issue.id];
    if (!ans || ans.status !== 'answered' || ans.stance === null || ans.stance === undefined) {
      return false;
    }
    if (ans.importance === 0) {
      hasExcludedImportanceZero = true;
      return false;
    }
    return true;
  });

  const answeredRelevant = relevantIssues.length;

  // Identify ALL issues the user interacted with in this contest (answered or no-opinion)
  // for the issue-by-issue breakdown
  const allAnsweredContestIssues = contestIssues.filter((issue) => {
    const ans = answers[issue.id];
    return ans && (
      (ans.status === 'answered' && ans.stance !== null && ans.stance !== undefined) ||
      ans.status === 'no-opinion'
    );
  });

  const totalAnsweredInContest = allAnsweredContestIssues.length;

  const results: CandidateClosenessResult[] = candidates.map((candidate) => {
    const candPositions = positionsByCandidate.get(candidate.id) || [];
    let sumWeightedCloseness = 0;
    let sumWeight = 0;
    let counted = 0;
    let agreeCount = 0;
    let partialCount = 0;
    let differCount = 0;
    let weightedAgree = 0;
    let weightedDiffer = 0;

    // First: calculate score strictly over relevantIssues
    for (const issue of relevantIssues) {
      const userAns = answers[issue.id];
      const effImp = getEffectiveImportance(userAns);
      const candPos = candPositions.find((p) => p.issueId === issue.id);
      const rel = relation(userAns, candPos, { includePartyAssumed });

      if (rel === 'agree' || rel === 'partial' || rel === 'differ') {
        const u = userAns.stance!;
        const c = candPos!.position!;
        const d = Math.abs(u - c);
        const closeness = 1 - d / 4;
        const weightedVal = effImp * closeness;
        sumWeightedCloseness += weightedVal;
        sumWeight += effImp;
        counted++;

        if (rel === 'agree') {
          agreeCount++;
          weightedAgree += effImp;
        } else if (rel === 'partial') {
          partialCount++;
        } else if (rel === 'differ') {
          differCount++;
          weightedDiffer += effImp;
        }
      }
    }

    const unknownCount = Math.max(0, answeredRelevant - counted);
    const score = sumWeight > 0 ? sumWeightedCloseness / sumWeight : null;
    const coverage = answeredRelevant > 0 ? counted / answeredRelevant : 0;
    const isLowCoverage = coverage < 0.60;
    const isRanked = counted >= 1;

    // Second: build traces for EVERY issue in the contest that user answered (including no-opinion and imp 0)
    const traces: CandidateIssueTrace[] = allAnsweredContestIssues.map((issue) => {
      const userAns = answers[issue.id];
      const effImp = getEffectiveImportance(userAns);
      const candPos = candPositions.find((p) => p.issueId === issue.id);
      const rel = relation(userAns, candPos, { includePartyAssumed });

      const isNoOp = userAns?.status === 'no-opinion';
      const userStanceLabel = isNoOp
        ? 'No opinion - not counted'
        : formatStanceLabel(userAns?.stance, issue);

      let candidateStanceLabel = 'Unknown';
      if (candPos && candPos.position !== null && candPos.position !== undefined) {
        if (candPos.evidenceType === 'party-assumed' && !includePartyAssumed) {
          candidateStanceLabel = 'Unknown (party platform estimate excluded)';
        } else {
          candidateStanceLabel = formatStanceLabel(candPos.position, issue);
        }
      }

      const sources = (candPos?.sourceIds || [])
        .map((sid) => sourceMap?.get(sid))
        .filter((s): s is Source => Boolean(s));

      let closeness: number | null = null;
      let weightedContribution: number | null = null;

      if (!isNoOp && userAns?.importance !== 0 && (rel === 'agree' || rel === 'partial' || rel === 'differ')) {
        const u = userAns.stance!;
        const c = candPos!.position!;
        const d = Math.abs(u - c);
        closeness = 1 - d / 4;
        weightedContribution = effImp * closeness;
      }

      return {
        issueId: issue.id,
        issue,
        userStance: userAns?.stance ?? null,
        userStatus: userAns?.status || 'answered',
        candidatePosition: candPos?.position ?? null,
        candPosObj: candPos,
        userStanceLabel,
        candidateStanceLabel,
        relation: rel,
        importance: effImp,
        closeness,
        weightedContribution,
        sources,
      };
    });

    // Sort traces by importance descending (no-opinion at bottom), then issue question title
    traces.sort((a, b) => {
      const aNoOp = a.userStatus === 'no-opinion' ? 1 : 0;
      const bNoOp = b.userStatus === 'no-opinion' ? 1 : 0;
      if (aNoOp !== bNoOp) return aNoOp - bNoOp;
      if (b.importance !== a.importance) {
        return b.importance - a.importance;
      }
      return a.issue.question.localeCompare(b.issue.question);
    });

    return {
      candidate,
      score,
      counted,
      answeredRelevant,
      totalAnsweredInContest,
      unknownCount,
      coverage,
      isLowCoverage,
      isRanked,
      traces,
      agreeCount,
      partialCount,
      differCount,
      weightedAgree,
      weightedDiffer,
    };
  });

  // Sort: candidates with coverage >= 60% first by score desc, then low-coverage ones by score desc, then 0-compared.
  results.sort((a, b) => {
    // Tier 1: coverage >= 0.60 and counted >= 1
    // Tier 2: coverage < 0.60 and counted >= 1
    // Tier 3: counted === 0
    const aTier = a.counted === 0 ? 3 : a.coverage >= 0.60 ? 1 : 2;
    const bTier = b.counted === 0 ? 3 : b.coverage >= 0.60 ? 1 : 2;

    if (aTier !== bTier) {
      return aTier - bTier;
    }

    if (aTier !== 3) {
      const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
      if (Math.abs(scoreDiff) > 0.0001) {
        return scoreDiff;
      }
      if (b.coverage !== a.coverage) {
        return b.coverage - a.coverage;
      }
      if (b.counted !== a.counted) {
        return b.counted - a.counted;
      }
      return a.candidate.name.localeCompare(b.candidate.name);
    }

    // Both Tier 3 (0 compared)
    return a.candidate.name.localeCompare(b.candidate.name);
  });

  return {
    answeredRelevant,
    totalAnsweredInContest,
    hasExcludedImportanceZero,
    results,
  };
}
