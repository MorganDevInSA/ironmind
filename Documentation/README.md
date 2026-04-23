# IRONMIND documentation index

| File                                                                                 | Purpose                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)**                                             | Canonical technical overview: stack, folders, layered data flow, Firebase map, query cache, UI tokens, quality gates.                                                                   |
| **[STYLE-GUIDE.md](./STYLE-GUIDE.md)**                                               | Current visual implementation guide (tokens, preset + custom themes, selected-state system, shell alerts, dashboard trend window); defer to `globals.css` when conflicts appear.        |
| **[LOGO-BRIEF.md](./LOGO-BRIEF.md)**                                                 | Brand prompts for logo work + **in-repo raster paths** under `public/brand/` and `brandAssets`.                                                                                         |
| **[IMPLEMENTATION-REVIEW-2026-04-21.md](./IMPLEMENTATION-REVIEW-2026-04-21.md)**     | Full request-to-delivery trace for the UI/documentation retrofit: deleted coaching UI, export note composer, synchronized selected glow, onboarding theme step, expanded demo profiles. |
| **[PRINCIPAL-REVIEW-DATA-2026-04-23.md](./PRINCIPAL-REVIEW-DATA-2026-04-23.md)**     | Principal-level data review: Firestore modeling, bounded queries, transactions, import semantics, remediation phases; canonical reference for data-layer hardening work.                |
| **[EXPERT-DEMO-DATA-AND-STORAGE-GUIDE.md](./EXPERT-DEMO-DATA-AND-STORAGE-GUIDE.md)** | For fitness/demo experts: where seed and demo data live, Firestore vs Storage, files to edit, indexes, and what not to do.                                                              |
| **[SALES-TECHNICAL.md](./SALES-TECHNICAL.md)**                                       | Long-form **technical** sales narrative: architecture, stack, security framing, evaluation checklist, objection handling.                                                               |
| **[SALES-USER-VALUE.md](./SALES-USER-VALUE.md)**                                     | Long-form **user / coach** value narrative: outcomes, problems solved, fit / non-fit, trust and export.                                                                                 |
| **[SALES-CORPORATE-VALUE.md](./SALES-CORPORATE-VALUE.md)**                           | Long-form **corporate** narrative: ROI, risk, strategic paths, diligence prompts—grounded in what the repo substantiates.                                                               |
| **[Data/](./Data/)**                                                                 | Archived snippets only — see notes inside; live config lives at repo root.                                                                                                              |

## Root-level reference READMEs (narrative pillars)

| File                                                   | Area                                                                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| **[../README_DATA_LAYER.md](../README_DATA_LAYER.md)** | Three-tier data architecture, TanStack cache, error contracts, Firebase abstraction                    |
| **[../README_UIUX.md](../README_UIUX.md)**             | Design tokens, panels, accordions, motion, typography, accessibility                                   |
| **[../README_CICD.md](../README_CICD.md)**             | Environments, MCP, typed platform config, delivery pipeline, secrets, rollback, observability, scaling |

When something in here disagrees with source code (`package.json`, `next.config.mjs`, `src/lib/constants/**`), **trust the repo sources**.
