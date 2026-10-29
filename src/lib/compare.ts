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
}

export interface RelationOptions {
  includePartyAssumed?: boolean;
}

/**
 * Compares a user's answer with a candidate's position according to QA brief specification:
 * - if user status no-opinion -> 'no-opinion'
 * - user unanswered -> 'unanswered'
 * - cand null / unknown -> 'unknown'
 * - cand party-assumed && !includePartyAssumed -> 'assumed-excluded'
 * - else d = |u - c|:
 *     if (u === 0) !== (c === 0) && d <= 2 -> 'partial' (middle vs a side, e.g. Moesinger 0 vs user -2 = partial)
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
 * Returns canonical stance label per QA brief:
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
  candidatePosition: PositionValue;
  candPosObj?: Position;
  userStanceLabel: string;
  candidateStanceLabel: string;
  relation: ComparisonRelation;
  importance: number;
  closeness: number | null; // 0 to 1 if counted, null if unknown/assumed-excluded
  weightedContribution: number | null;
  sources: Source[];
}

export interface CandidateClosenessResult {
  candidate: Candidate;
  score: number | null; // 0 to 1, or null if no weight / unranked
  counted: number;
  answeredRelevant: number;
  unknownCount: number;
  coverage: number; // counted / answeredRelevant
  isRanked: boolean; // counted >= 2 AND coverage >= 0.5
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
 * For each candidate, over issues the user answered with importance>0 and stance not null:
 * closeness = 1 - |u - c| / 4, weight = importance.
 * Score = sum(w * closeness) / sum(w).
 * Exclude unknown and (unless toggle) party-assumed.
 * coverage = counted / answeredRelevant.
 * A candidate is "ranked" only if counted >= 2 AND counted / answeredRelevant >= 0.5; others shown as "Not enough info".
 * Importance-0 answers excluded.
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
  hasExcludedImportanceZero: boolean;
  results: CandidateClosenessResult[];
} {
  // Identify answered relevant issues for this contest:
  // answered with stance not null and effective importance > 0
  let hasExcludedImportanceZero = false;

  const relevantIssues = contestIssues.filter((issue) => {
    const ans = answers[issue.id];
    if (!ans || ans.status !== 'answered' || ans.stance === null || ans.stance === undefined) {
      return false;
    }
    // Check if importance is explicitly 0
    if (ans.importance === 0) {
      hasExcludedImportanceZero = true;
      return false;
    }
    return true;
  });

  const answeredRelevant = relevantIssues.length;

  const results: CandidateClosenessResult[] = candidates.map((candidate) => {
    const candPositions = positionsByCandidate.get(candidate.id) || [];
    let sumWeightedCloseness = 0;
    let sumWeight = 0;
    let counted = 0;
    let unknownCount = 0;
    let agreeCount = 0;
    let partialCount = 0;
    let differCount = 0;
    let weightedAgree = 0;
    let weightedDiffer = 0;

    const traces: CandidateIssueTrace[] = [];

    // Evaluate over all contest issues the user answered (relevant issues)
    for (const issue of relevantIssues) {
      const userAns = answers[issue.id];
      const effImp = getEffectiveImportance(userAns);
      const candPos = candPositions.find((p) => p.issueId === issue.id);
      const rel = relation(userAns, candPos, { includePartyAssumed });

      const userStanceLabel = formatStanceLabel(userAns?.stance, issue);
      const candidateStanceLabel =
        candPos && candPos.position !== null && candPos.position !== undefined
          ? formatStanceLabel(candPos.position, issue)
          : 'No public stance';

      const sources = (candPos?.sourceIds || [])
        .map((sid) => sourceMap?.get(sid))
        .filter((s): s is Source => Boolean(s));

      let closeness: number | null = null;
      let weightedContribution: number | null = null;

      if (rel === 'agree' || rel === 'partial' || rel === 'differ') {
        const u = userAns.stance!;
        const c = candPos!.position!;
        const d = Math.abs(u - c);
        closeness = 1 - d / 4;
        const weightedVal = effImp * closeness;
        sumWeightedCloseness += weightedVal;
        sumWeight += effImp;
        counted++;
        weightedContribution = weightedVal;

        if (rel === 'agree') {
          agreeCount++;
          weightedAgree += effImp;
        } else if (rel === 'partial') {
          partialCount++;
        } else if (rel === 'differ') {
          differCount++;
          weightedDiffer += effImp;
        }
      } else {
        unknownCount++;
      }

      traces.push({
        issueId: issue.id,
        issue,
        userStance: userAns.stance,
        candidatePosition: candPos?.position ?? null,
        candPosObj: candPos,
        userStanceLabel,
        candidateStanceLabel,
        relation: rel,
        importance: effImp,
        closeness,
        weightedContribution,
        sources,
      });
    }

    // Sort traces by importance descending, then issue title
    traces.sort((a, b) => {
      if (b.importance !== a.importance) {
        return b.importance - a.importance;
      }
      return a.issue.question.localeCompare(b.issue.question);
    });

    const score = sumWeight > 0 ? sumWeightedCloseness / sumWeight : null;
    const coverage = answeredRelevant > 0 ? counted / answeredRelevant : 0;
    const isRanked = counted >= 2 && coverage >= 0.5;

    return {
      candidate,
      score,
      counted,
      answeredRelevant,
      unknownCount,
      coverage,
      isRanked,
      traces,
      agreeCount,
      partialCount,
      differCount,
      weightedAgree,
      weightedDiffer,
    };
  });

  // Sort candidates: ranked first by descending score, then unranked by counted descending
  results.sort((a, b) => {
    if (a.isRanked && !b.isRanked) return -1;
    if (!a.isRanked && b.isRanked) return 1;
    if (a.isRanked && b.isRanked) {
      const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
      if (Math.abs(scoreDiff) > 0.0001) return scoreDiff;
      if (b.counted !== a.counted) return b.counted - a.counted;
      return a.candidate.name.localeCompare(b.candidate.name);
    }
    // Both unranked
    if (b.counted !== a.counted) return b.counted - a.counted;
    return a.candidate.name.localeCompare(b.candidate.name);
  });

  return {
    answeredRelevant,
    hasExcludedImportanceZero,
    results,
  };
}
