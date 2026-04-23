# IRONMIND — Technical Sales Document

**Audience:** developers, CTOs, technical evaluators, security-minded architects, and teams considering a fork, acquisition, or long-term maintainership of a fitness-domain codebase.

**Purpose:** Sell IRONMIND on **engineering excellence and operational safety**, not on hype. Every claim below is grounded in repository structure and committed documentation.

---

## Executive summary

IRONMIND is a **Next.js 14 (App Router)** web application backed by **Firebase** (Auth, Firestore, Storage). It implements a **non-negotiable layered data architecture**: UI pages and components consume **TanStack Query controllers**; controllers call **domain services**; services own **Firestore and Storage** access. That separation is not aspirational copy—it is the **core contract** of the codebase, documented in [ARCHITECTURE.md](./ARCHITECTURE.md) and expanded in [README_DATA_LAYER.md](../README_DATA_LAYER.md).

If you are evaluating whether this project can survive **real users, real coaches, and real money**, the answer hinges on whether the team can **extend without entangling UI and persistence**. IRONMIND is built to pass that test.

---

## The problem technical buyers actually fear

Fitness products often collapse under their own success:

- **Tangled data access:** React components import Firebase SDK calls directly. Refactors become rewrites. Cache invalidation becomes folklore.
- **Unbounded queries:** “It worked in dev” until production datasets grow and Firestore bills spike.
- **Weak typing:** `any` leaks across boundaries; Zod is optional decoration instead of a contract.
- **No CI truth:** “Works on my machine” ships to production; regressions surface in user sessions.

IRONMIND addresses these failure modes **by design**, not by accident.

---

## Architecture you can defend in a room

### Layered data flow

Canonical flow (see [ARCHITECTURE.md](./ARCHITECTURE.md)):

```text
Pages / Components → Controllers (TanStack Query) → Services → Firebase SDK
```

**Why it matters:**

- **Services** (`src/services/`) concentrate domain rules and I/O. They are the natural home for transactions, idempotent writes, and future server-side entry points.
- **Controllers** (`src/controllers/`) own cache keys, stale times, optimistic updates, and error surfaces—**without** embedding Firestore paths in UI.
- **Pages** stay declarative: they compose hooks and render; they do not become persistence layers.

This is the same class of discipline you expect from a **Series A product team** that has already paid the tax for maintainability.

### Multi-user data model

The system is built for **multiple independent athletes**: each authenticated user operates on data scoped under their identity. That is the baseline for **SaaS readiness** or **white-label deployments** where many athletes share a platform but never share rows.

### Type safety and validation

- **TypeScript** in strict mode.
- **Zod** paired with **React Hook Form** for validated inputs at the edge of the system.

These choices reduce the class of bugs that destroy trust in a performance product—wrong units, impossible macro totals, or silent corruption of program state.

---

## Stack credibility (authoritative)

Runtime choices are listed in [ARCHITECTURE.md](./ARCHITECTURE.md) and version-pinned in `package.json`. At a high level:

| Concern         | IRONMIND approach                                       |
| --------------- | ------------------------------------------------------- |
| Rendering model | Next.js App Router, React 18                            |
| Remote state    | TanStack Query v5 (cache-first, explicit contracts)     |
| Local UI state  | Zustand                                                 |
| Persistence     | Firebase Auth + Firestore + Storage                     |
| Charts          | Recharts                                                |
| Motion          | Framer Motion                                           |
| Quality gates   | ESLint (zero-warning policy in CI), `tsc`, `next build` |

**Note for evaluators:** `AGENTS.md` instructs contributors to read **project-local Next.js docs** before assuming training-cutoff APIs. That is a maturity signal: the maintainers acknowledge framework drift and bake mitigation into the workflow.

---

## Delivery and platform hygiene

IRONMIND documents a **three-environment** mental model—local (including emulators), preview (per change), production—and ties delivery to **GitHub Actions** plus **Vercel**. Root [README_CICD.md](../README_CICD.md) covers typed platform configuration, secrets posture, rollback, and scaling readiness.

**What you should look for in any serious evaluation:**

- CI runs **lint, typecheck, and build** on every push.
- Pre-commit automation reduces formatting and lint debt before it lands on `main`.
- Firebase **rules and indexes** live in-repo (`firestore.rules`, `firestore.indexes.json`, `storage.rules`), aligning infrastructure with version control.

---

## Security and data lifecycle (framing, not a certification)

IRONMIND is not marketed as a compliance-certified medical device. It **is** architected so that **data access boundaries** and **Firestore rules** are first-class concerns, with documentation that includes **principal-level data reviews** (see [PRINCIPAL-REVIEW-DATA-2026-04-23.md](./PRINCIPAL-REVIEW-DATA-2026-04-23.md)).

For enterprise conversations, that document is your **due-diligence starter pack**: it names modeling risks, query bounds, and remediation phases in language architects respect.

---

## Extensibility: import, seed, and export

Technical buyers should examine three integration surfaces:

1. **Seed pipeline** — deterministic first-login experience for demos and onboarding (`src/lib/seed/`, documented for experts in [EXPERT-DEMO-DATA-AND-STORAGE-GUIDE.md](./EXPERT-DEMO-DATA-AND-STORAGE-GUIDE.md)).
2. **Coach import** — structured ingestion path for JSON-shaped coach outputs (`src/services/import.service.ts` and related UI).
3. **Markdown export** — full athlete state serialized for **LLM continuity** (`src/lib/export/`). This is not a gimmick; it is a **portable integration boundary** that avoids vendor lock-in for “second brain” workflows.

---

## Competitive technical positioning (honest)

| Alternative                           | Typical weakness for serious hypertrophy workflows          | IRONMIND angle                                                 |
| ------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| Generic gym loggers                   | Strong at sets/reps, weak at **cross-domain coherence**     | Program + nutrition day-types + recovery + alerts in one model |
| Hypertrophy-specialized consumer apps | Polished UX, closed ecosystem, limited export / forkability | **MIT** codebase, **documented** architecture, self-host path  |
| Spreadsheet + chat                    | Flexible, fragile, non-enforced invariants                  | Typed domain layer + enforced UI/service separation            |

IRONMIND will not win on **exercise video count**. It wins when the buyer values **systems engineering** applied to a niche that rewards precision.

---

## Evaluation checklist (90 minutes)

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) end-to-end.
2. Skim [README_DATA_LAYER.md](../README_DATA_LAYER.md) for cache and invalidation philosophy.
3. Trace one user journey in code: page → controller hook → service → Firestore path.
4. Run `npm run ci` locally and confirm the same gates your team would enforce.
5. Read [PRINCIPAL-REVIEW-DATA-2026-04-23.md](./PRINCIPAL-REVIEW-DATA-2026-04-23.md) for known hardening themes.

---

## Objection handling

**“We would rewrite the UI anyway.”**  
The highest-cost part of fitness SaaS is rarely pixels—it is **data modeling, migration safety, and cache correctness**. IRONMIND gives you a **working domain spine** to re-skin or progressively replace UI.

**“Firebase does not scale.”**  
Firestore scales when **access patterns and indexes** are disciplined. IRONMIND’s documentation explicitly engages with bounded queries and modeling tradeoffs—ask to walk the Firestore map in [ARCHITECTURE.md](./ARCHITECTURE.md).

**“We need a mobile app day one.”**  
This repository is a **web-first** product. The win is **spec and architecture clarity** you can port, or a **PWA path** if you choose it—do not expect native binaries in-tree.

---

## Call to action

If IRONMIND matches your technical bar, the next step is a **fork + threat model + Firestore rules review** workshop. Bring one staff engineer and one architect. The repository is **MIT licensed**—your legal team gets a straightforward starting point.

**Primary references:** [ARCHITECTURE.md](./ARCHITECTURE.md), [README_DATA_LAYER.md](../README_DATA_LAYER.md), [README_CICD.md](../README_CICD.md), root [README.md](../README.md).
