# Frontend brief — Box Elder County Voter Guide (Nov 3, 2026 general election)

Build in the CURRENT directory (repo root already has research/ — do not touch research/). Use the Impeccable skill (~/.gemini/skills/impeccable) for design quality. Write copy that sounds human: plain, short, no AI-isms, no em-dash overuse, no hype.

Stack: Vite + React + TypeScript + Tailwind CSS (v3 or v4 via @tailwindcss/vite) + lucide-react + react-router-dom using **HashRouter** (GitHub Pages). pnpm. vite `base: './'`. No backend. Charts in plain SVG.

## Data (src/data/*.json, typed in src/types.ts) — build with realistic SAMPLE data now; real data will replace these files with the SAME shape.
```ts
type EvidenceType = 'recorded-vote'|'explicit-statement'|'campaign-site'|'news'|'inference'|'party-assumed'|'unknown';
interface Source { id:string; url:string; title:string; publisher?:string; published?:string|null; accessed:string }
interface Contest { id:string; office:string; district?:string; type:'candidate'|'amendment'|'judicial'; group:'federal'|'legislature'|'education'|'county'|'amendments'|'judges'; order:number; whatOfficeDecides:string[]; howItAffectsVoters:string; candidateIds:string[]; issueIds:string[]; uncontested?:boolean }
interface Candidate { id:string; name:string; party?:string|null; contestId:string; incumbent?:boolean; status?:string; campaignUrl?:string|null; bio?:string; background?:string[]; researchStatus:'solid'|'partial'|'limited'; sourceIds:string[] }
interface Issue { id:string; contestIds:string[]; category:string; question:string; leftLabel:string; rightLabel:string; leftPros:string[]; leftCons:string[]; rightPros:string[]; rightCons:string[]; background:string; whyLive?:string; sourceIds:string[] }
interface Position { candidateId:string; issueId:string; position:-2|-1|0|1|2|null; evidenceType:EvidenceType; summary:string; date?:string|null; sourceIds:string[]; confidence:'high'|'medium'|'low'; historical?:boolean }
interface Fact { candidateId:string; kind:'vote'|'bill'|'statement'|'record'|'accomplishment'|'criticism'|'background'|'endorsement'; text:string; date?:string|null; sourceIds:string[] }
// files: contests.json Contest[], candidates.json Candidate[], issues.json Issue[], positions.json Position[], facts.json Fact[], sources.json Source[], meta.json {lastUpdated:string}
```
User answers in localStorage key `bevg.answers.v1`: Record<issueId,{stance:-2..2|null, importance:0..5|null, status:'answered'|'no-opinion'|'skipped', updated:string}>. Untouched = absent. Settings `bevg.settings.v1`: {includePartyAssumed:boolean (default false)}. Use a React context so changes update everywhere live.

## Routes (HashRouter)
- `/` Landing: "Find out where you stand." subline "Explore the issues, understand your candidates, and make an informed voting decision." Buttons: Explore my ballot (/explore), Research candidates (/ballot). Election date, note it covers Box Elder County ballot.
- `/ballot` all contests grouped (Federal, State Legislature, Education, County, Constitutional Amendments, Judicial Retention) with candidate chips, party, incumbent badge, research-status badge, uncontested label. Note: legislative/school districts vary by address; tell users to check their sample ballot at vote.utah.gov (don't guess districts).
- `/explore` questionnaire: one issue at a time, "Question 6 of 25 — Category", grouped by category, side nav/jump list (sheet on mobile) showing answered/skipped status, prev/next/skip. Question, short background, two side-by-side policy cards (stack on mobile) with pros/drawbacks, collapsible "Learn more" (whyLive + sources). Slider 1: 5 stops, ends labeled with the actual leftLabel/rightLabel text, middle stops "Lean ..." / "Middle ground"; slider starts with NO selection state (no thumb highlighted) until user picks; explicit "No opinion / not sure" button. Slider 2: importance 0-5 with labels Not important, Slightly, Somewhat, Moderately, Very, Essential. Autosave. After answering, compact "Where candidates stand" mini chart for that issue. For amendment issues same UI.
- `/my-views` dashboard: issues sorted by importance desc, each a horizontal -2..+2 chart with user marker (distinct shape/color) and candidate dots (initials, tooltip), unknown candidates listed beside chart as "No public position found", party-assumed dots hollow/faded and labeled. Inline editable sliders. Toggle "Include party-based assumptions" (default off). Empty state linking to /explore.
- `/compare` choose contest (tabs/select); per candidate cards with background, research badge; "Your views vs. their positions" table rows: question, your stance, their stance, same direction? (Agree / Differ / Middle / Unknown / Assumed), your importance, evidence type + source link. Filters by category and min importance. Per-contest counts like "Agree on 3 high-priority issues, differ on 1, unknown on 2" — NO single percent score, no winner. Unknowns never count toward agree/differ; party-assumed excluded unless toggle on.
- `/candidate/:id` sections: Overview (bio, background, party, campaign link), Policy positions by issue (value bar + evidence label + summary + dated sources), Track record (facts kind vote/bill/record), Arguments & criticisms (accomplishment/criticism/endorsement), Compared with others in contest, Compared with you, Sources list. If researchStatus limited show "Public information limited" banner listing what's unknown.
- `/issues/:id` issue detail: both sides, pros/cons, background, all candidates' positions with evidence.
- `/judges/:id` and judges contest: placeholder "Judicial retention research coming soon" linking https://judges.utah.gov (Utah JPEC). No partisan labels.
- `/sources` all sources table with publisher/date and methodology: evidence types explained, position scale, null vs 0, party-assumed rules.
- `/about` purpose, nonpartisan, limits, not an endorsement, last updated.
Evidence badges: Recorded vote, Public statement, Campaign site, News report, Inference, Party-assumed (dashed/faded), Unknown.

## Design
Mobile-first, civic, neutral (no red/blue party color coding; party shown as text). Excellent typography (e.g. Inter / Source Serif via @fontsource or system), generous spacing, clean cards, bottom nav on mobile (Ballot, Explore, My views, Compare), top nav on desktop. Accessible: keyboard sliders, focus rings, aria labels, contrast AA.

## Deliverables
- `pnpm build` passes with no TS errors. `scripts/validate.mjs` (node) checks data: referenced ids exist, positions in range or null, null with evidenceType unknown, party-assumed has sources, every sourceId resolves; `pnpm validate` script. Run it.
- Do NOT git push. Do not create GitHub workflows (orchestrator handles deploy). Final message: summary of what was built.
