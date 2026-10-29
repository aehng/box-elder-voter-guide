import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type {
  UserAnswersMap,
  UserSettings,
  UserAnswer,
  UserStance,
  UserImportance,
  UserAnswerStatus,
  Contest,
  Candidate,
  Issue,
  Position,
  Fact,
  Source,
  MetaData,
  AlignmentDirection,
} from '../types';

import contestsData from '../data/contests.json';
import candidatesData from '../data/candidates.json';
import issuesData from '../data/issues.json';
import positionsData from '../data/positions.json';
import factsData from '../data/facts.json';
import sourcesData from '../data/sources.json';
import metaData from '../data/meta.json';

const STORAGE_ANSWERS_KEY = 'bevg.answers.v1';
const STORAGE_SETTINGS_KEY = 'bevg.settings.v1';

export type { AlignmentDirection };

interface VoterContextValue {
  // Data
  contests: Contest[];
  candidates: Candidate[];
  issues: Issue[];
  positions: Position[];
  facts: Fact[];
  sources: Source[];
  meta: MetaData;

  // Maps for fast lookup
  contestMap: Map<string, Contest>;
  candidateMap: Map<string, Candidate>;
  issueMap: Map<string, Issue>;
  sourceMap: Map<string, Source>;
  positionsByCandidate: Map<string, Position[]>;
  positionsByIssue: Map<string, Position[]>;
  factsByCandidate: Map<string, Fact[]>;

  // User state
  answers: UserAnswersMap;
  settings: UserSettings;
  setAnswer: (
    issueId: string,
    update: { stance?: UserStance; importance?: UserImportance; status?: UserAnswerStatus }
  ) => void;
  clearAnswer: (issueId: string) => void;
  resetAllAnswers: () => void;
  setIncludePartyAssumed: (include: boolean) => void;
  setRaceFilter: (filter: string[]) => void;
  toggleRaceFilter: (contestId: string) => void;
  clearRaceFilter: () => void;

  // Helpers
  answeredCount: number;
  noOpinionCount: number;
  skippedCount: number;
  totalActiveIssuesCount: number;
  getAlignment: (
    userStance: UserStance,
    candPosition: Position | undefined,
    includePartyAssumedOverride?: boolean
  ) => AlignmentDirection;
}

const VoterContext = createContext<VoterContextValue | null>(null);

function loadInitialAnswers(): UserAnswersMap {
  try {
    const raw = localStorage.getItem(STORAGE_ANSWERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const validIssueIds = new Set((issuesData as Issue[]).map((i) => i.id));
        const sanitized: UserAnswersMap = {};

        for (const [key, value] of Object.entries(parsed)) {
          // Drop entries whose issue id is not in issues.json
          if (!validIssueIds.has(key)) {
            continue;
          }
          if (!value || typeof value !== 'object') {
            continue;
          }
          const val = value as Partial<UserAnswer>;

          // stance in -2..2 | null
          let stance: UserStance = null;
          if (val.stance === null || val.stance === undefined) {
            stance = null;
          } else if (
            typeof val.stance === 'number' &&
            Number.isInteger(val.stance) &&
            val.stance >= -2 &&
            val.stance <= 2
          ) {
            stance = val.stance as UserStance;
          }

          // importance in 0..5 | null
          let importance: UserImportance = null;
          if (val.importance === null || val.importance === undefined) {
            importance = null;
          } else if (
            typeof val.importance === 'number' &&
            Number.isInteger(val.importance) &&
            val.importance >= 0 &&
            val.importance <= 5
          ) {
            importance = val.importance as UserImportance;
          }

          // status in 'answered' | 'no-opinion' | 'skipped'
          let status: UserAnswerStatus = 'skipped';
          if (val.status === 'answered' || val.status === 'no-opinion' || val.status === 'skipped') {
            status = val.status;
          } else if (stance !== null) {
            status = 'answered';
          }

          sanitized[key] = {
            stance,
            importance,
            status,
            updated: typeof val.updated === 'string' ? val.updated : new Date().toISOString(),
          };
        }
        return sanitized;
      }
    }
  } catch (err) {
    console.error('Failed to parse saved answers from localStorage:', err);
  }
  return {};
}

function loadInitialSettings(): UserSettings {
  const DEFAULT_SETTINGS: UserSettings = {
    includePartyAssumed: false,
    raceFilter: [],
  };

  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const knownContestIds = new Set((contestsData as Contest[]).map((c) => c.id));
        const validRaceFilter = Array.isArray(parsed.raceFilter)
          ? parsed.raceFilter.filter(
              (id: unknown): id is string => typeof id === 'string' && knownContestIds.has(id)
            )
          : [];

        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          includePartyAssumed: Boolean(parsed.includePartyAssumed),
          raceFilter: validRaceFilter,
        };
      }
    }
  } catch (err) {
    console.error('Failed to parse saved settings from localStorage:', err);
  }
  return DEFAULT_SETTINGS;
}

export const VoterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const contests = contestsData as Contest[];
  const candidates = candidatesData as Candidate[];
  const issues = issuesData as Issue[];
  const positions = positionsData as Position[];
  const facts = factsData as Fact[];
  const sources = sourcesData as Source[];
  const meta = metaData as MetaData;

  const [answers, setAnswers] = useState<UserAnswersMap>(loadInitialAnswers);
  const [settings, setSettings] = useState<UserSettings>(loadInitialSettings);

  // Sync answers to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ANSWERS_KEY, JSON.stringify(answers));
    } catch (err) {
      console.error('Failed to persist answers to localStorage:', err);
    }
  }, [answers]);

  // Sync settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {
      console.error('Failed to persist settings to localStorage:', err);
    }
  }, [settings]);

  // Build lookups
  const contestMap = useMemo(() => new Map(contests.map((c) => [c.id, c])), [contests]);
  const candidateMap = useMemo(() => new Map(candidates.map((k) => [k.id, k])), [candidates]);
  const issueMap = useMemo(() => new Map(issues.map((i) => [i.id, i])), [issues]);
  const sourceMap = useMemo(() => new Map(sources.map((s) => [s.id, s])), [sources]);

  const positionsByCandidate = useMemo(() => {
    const map = new Map<string, Position[]>();
    for (const p of positions) {
      const list = map.get(p.candidateId) || [];
      list.push(p);
      map.set(p.candidateId, list);
    }
    return map;
  }, [positions]);

  const positionsByIssue = useMemo(() => {
    const map = new Map<string, Position[]>();
    for (const p of positions) {
      const list = map.get(p.issueId) || [];
      list.push(p);
      map.set(p.issueId, list);
    }
    return map;
  }, [positions]);

  const factsByCandidate = useMemo(() => {
    const map = new Map<string, Fact[]>();
    for (const f of facts) {
      const list = map.get(f.candidateId) || [];
      list.push(f);
      map.set(f.candidateId, list);
    }
    return map;
  }, [facts]);

  const setAnswer = (
    issueId: string,
    update: { stance?: UserStance; importance?: UserImportance; status?: UserAnswerStatus }
  ) => {
    setAnswers((prev) => {
      const existing = prev[issueId] || {
        stance: null,
        importance: null,
        status: 'answered' as UserAnswerStatus,
        updated: new Date().toISOString(),
      };

      const updatedAnswer: UserAnswer = {
        stance: update.stance !== undefined ? update.stance : existing.stance,
        importance: update.importance !== undefined ? update.importance : existing.importance,
        status: update.status !== undefined ? update.status : existing.status,
        updated: new Date().toISOString(),
      };

      return {
        ...prev,
        [issueId]: updatedAnswer,
      };
    });
  };

  const clearAnswer = (issueId: string) => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[issueId];
      return copy;
    });
  };

  const resetAllAnswers = () => {
    setAnswers({});
  };

  const setIncludePartyAssumed = (include: boolean) => {
    setSettings((prev) => ({ ...prev, includePartyAssumed: include }));
  };

  const setRaceFilter = (filter: string[]) => {
    const knownContestIds = new Set(contests.map((c) => c.id));
    const valid = filter.filter((id) => knownContestIds.has(id));
    setSettings((prev) => ({ ...prev, raceFilter: valid }));
  };

  const toggleRaceFilter = (contestId: string) => {
    setSettings((prev) => {
      const knownContestIds = new Set(contests.map((c) => c.id));
      if (!knownContestIds.has(contestId)) return prev;
      const current = prev.raceFilter || [];
      const exists = current.includes(contestId);
      const updated = exists ? current.filter((id) => id !== contestId) : [...current, contestId];
      return { ...prev, raceFilter: updated };
    });
  };

  const clearRaceFilter = () => {
    setSettings((prev) => ({ ...prev, raceFilter: [] }));
  };

  const answeredCount = useMemo(() => {
    return Object.values(answers).filter((a) => a.status === 'answered' && a.stance !== null).length;
  }, [answers]);

  const noOpinionCount = useMemo(() => {
    return Object.values(answers).filter((a) => a.status === 'no-opinion').length;
  }, [answers]);

  const skippedCount = useMemo(() => {
    return Math.max(0, issues.length - answeredCount - noOpinionCount);
  }, [issues.length, answeredCount, noOpinionCount]);

  const totalActiveIssuesCount = issues.length;

  const getAlignment = (
    userStance: UserStance,
    candPosition: Position | undefined,
    includePartyAssumedOverride?: boolean
  ): AlignmentDirection => {
    const includeAssumed = includePartyAssumedOverride ?? settings.includePartyAssumed;

    if (userStance === null) {
      return 'unanswered';
    }

    if (!candPosition || candPosition.position === null || candPosition.evidenceType === 'unknown') {
      return 'unknown';
    }

    if (candPosition.evidenceType === 'party-assumed' && !includeAssumed) {
      return 'assumed';
    }

    const cVal = candPosition.position;
    const uVal = userStance;

    if (cVal === 0 || uVal === 0) {
      return 'middle';
    }

    if ((uVal > 0 && cVal > 0) || (uVal < 0 && cVal < 0)) {
      return 'agree';
    }

    return 'differ';
  };

  return (
    <VoterContext.Provider
      value={{
        contests,
        candidates,
        issues,
        positions,
        facts,
        sources,
        meta,
        contestMap,
        candidateMap,
        issueMap,
        sourceMap,
        positionsByCandidate,
        positionsByIssue,
        factsByCandidate,
        answers,
        settings,
        setAnswer,
        clearAnswer,
        resetAllAnswers,
        setIncludePartyAssumed,
        setRaceFilter,
        toggleRaceFilter,
        clearRaceFilter,
        answeredCount,
        noOpinionCount,
        skippedCount,
        totalActiveIssuesCount,
        getAlignment,
      }}
    >
      {children}
    </VoterContext.Provider>
  );
};

export function useVoter(): VoterContextValue {
  const context = useContext(VoterContext);
  if (!context) {
    throw new Error('useVoter must be used within a VoterProvider');
  }
  return context;
}
