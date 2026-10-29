export type EvidenceType =
  | 'recorded-vote'
  | 'explicit-statement'
  | 'campaign-site'
  | 'news'
  | 'inference'
  | 'party-assumed'
  | 'unknown';

export type AlignmentDirection = 'agree' | 'differ' | 'middle' | 'unknown' | 'assumed' | 'unanswered';

export interface Source {
  id: string;
  url: string;
  title: string;
  publisher?: string;
  published?: string | null;
  accessed: string;
}

export type ContestGroup = 'federal' | 'legislature' | 'education' | 'county' | 'amendments' | 'judges';

export interface Contest {
  id: string;
  office: string;
  district?: string;
  type: 'candidate' | 'amendment' | 'judicial';
  group: ContestGroup;
  order: number;
  whatOfficeDecides: string[];
  howItAffectsVoters: string;
  candidateIds: string[];
  issueIds: string[];
  uncontested?: boolean;
}

export type ResearchStatus = 'solid' | 'partial' | 'limited';

export interface Candidate {
  id: string;
  name: string;
  party?: string | null;
  contestId: string;
  incumbent?: boolean;
  status?: string;
  campaignUrl?: string | null;
  bio?: string;
  background?: string[];
  researchStatus: ResearchStatus;
  sourceIds: string[];
}

export interface Issue {
  id: string;
  contestIds: string[];
  category: string;
  question: string;
  leftLabel: string;
  rightLabel: string;
  leftPros: string[];
  leftCons: string[];
  rightPros: string[];
  rightCons: string[];
  background: string;
  whyLive?: string;
  sourceIds: string[];
}

export type PositionValue = -2 | -1 | 0 | 1 | 2 | null;
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface Position {
  candidateId: string;
  issueId: string;
  position: PositionValue;
  evidenceType: EvidenceType;
  summary: string;
  date?: string | null;
  sourceIds: string[];
  confidence: ConfidenceLevel;
  historical?: boolean;
}

export type FactKind =
  | 'vote'
  | 'bill'
  | 'statement'
  | 'record'
  | 'accomplishment'
  | 'criticism'
  | 'background'
  | 'endorsement';

export interface Fact {
  candidateId: string;
  kind: FactKind;
  text: string;
  date?: string | null;
  sourceIds: string[];
}

export interface MetaData {
  lastUpdated: string;
}

export type UserStance = -2 | -1 | 0 | 1 | 2 | null;
export type UserImportance = 0 | 1 | 2 | 3 | 4 | 5 | null;
export type UserAnswerStatus = 'answered' | 'no-opinion' | 'skipped';

export interface UserAnswer {
  stance: UserStance;
  importance: UserImportance;
  status: UserAnswerStatus;
  updated: string;
}

export type UserAnswersMap = Record<string, UserAnswer>;

export interface UserSettings {
  includePartyAssumed: boolean;
  groupBy?: 'category' | 'race';
  raceFilter?: string[];
}
