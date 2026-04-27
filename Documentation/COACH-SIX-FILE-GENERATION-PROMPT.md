# Coach prompt: generate the 6 IronMind seed JSON files (parse-safe, 14-day cycle)

Use this prompt with an LLM after the athlete completes the intake questionnaire. Shapes align with **`AthleteProfile`**, **`Program`**, **`NutritionPlanSeed`**, **`SupplementProtocol`**, **`Phase`**, **`VolumeLandmarks`** in `src/lib/types/index.ts`, **`NutritionPlanSeed`** in `src/lib/seed/nutrition.ts`, and worked examples in **`src/lib/seed/program.ts`**. Import validation lives in **`src/services/import.service.ts`**.

---

## IronMind semantics (do not skip)

- These **six files** define the athlete’s **templates** (profile, program blueprint, nutrition bands, supplements, phase targets, weekly volume landmarks). They are **imported into Firestore** as structured documents.
- They do **not** create fourteen separate **logged workout rows**—**historical logs** come from in-app tracking or demo generators. You still output a **complete 14-day program blueprint** and coherent targets.
- **`training_program.json` / `phase.json` `startDate`:** Use a real **`YYYY-MM-DD`** when the coach intends a fixed block start; IronMind import **keeps** that date when valid. Users can later adjust **Week 1 start** in the app (dashboard + training); dashboard trend presets align **forward** from `Program.startDate`.

### Which files are “14 days”?

| File                           | “14 days” meaning                                                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`training_program.json`**    | **Yes** — exactly **14** `sessions`, `dayNumber` **1…14**.                                                                                                                           |
| **`nutrition_plan.json`**      | **No** — **four** macro bands (`recovery` / `moderate` / `high` / `highest`). Map program days → band in **Coach Notes**; optionally add **`byDayType`** on meal rows (see example). |
| **`supplement_protocol.json`** | **No** — daily **windows** only.                                                                                                                                                     |
| **`volume_landmarks.json`**    | **No** — **weekly** `sets/week` per muscle group (8 keys).                                                                                                                           |
| **`phase.json`**               | **No** — one active phase block.                                                                                                                                                     |
| **`athlete_profile.json`**     | **No** — one profile object.                                                                                                                                                         |

---

## Parse compatibility — **training_program.json** (mandatory)

These rules match import-safe JSON that mirrors **`src/lib/seed/program.ts`** and legacy coach files that **always** use objects/arrays instead of `null` for session blocks.

1. **Never use JSON `null`** for **`cardio`**, **`breathWork`**, **`coreWork`**, or **`exercises`** on any session. Optional UI fields must be either **real values** or **the key omitted** — but for sessions, IronMind expects a **consistent shape**:
   - **`lift`** days: non-empty **`exercises`** array; **`cardio`** = a **`CardioBlock` object** (e.g. cool-down walk 10 min); **`breathWork`** = array (one short drill or empty `[]`); **`coreWork`** = array (entries or `[]`); **`mobility`** = array of strings (can be `[]`).
   - **`cardio`** / **`recovery`** days: **`exercises`** = `[]`; **`cardio`** = object; **`breathWork`** and **`coreWork`** = arrays (use `[]` if none).
2. **`breathWork`[]** items: include **`name`**, **`inhale`**, **`exhale`**, **`rounds`** (numbers). Include **`hold`** and **`holdOut`** as numbers — use **`0`** when there is no hold (do not omit if your serializer requires all five).
3. **`coreWork`[]** items: **`name`**, **`sets`**, **`perSide`**, **`prolapseSafe`** always. Use **`reps`** _or_ **`holdSec`** — **never** `"reps": null` or `"holdSec": null`. Omit unused fields entirely.
4. **`SessionExercise`**: include **`isKPI`: true** only on KPI lifts — **omit** `isKPI` when false (do not write `"isKPI": false`). Omit empty **`notes`** or use a non-empty string.
5. **`volumeTracking`**: use **only** these keys (same as landmarks): **`chest`**, **`back`**, **`quads`**, **`hamstrings`**, **`delts`**, **`biceps`**, **`triceps`**, **`calves`** — no extra muscle keys.
6. **`kpis[].days`**: every value must be a **`dayNumber`** between **1** and **14**.

---

## Prompt body (copy from here)

The athlete's intake questionnaire is provided below. You will read it, apply your full coaching expertise, and generate the **6 seed data files** that populate their IronMind personal coaching app when imported at onboarding.

This is not a coaching conversation. This is a **data generation task**. Your output is 6 JSON files — nothing else. Every value in every file is a coaching decision. Make it count.

Before writing a single JSON field, answer these four questions **internally**:

1. **What are this athlete's hard contraindications?** List every movement pattern to exclude from the program.
2. **What phase are they in?** This determines calorie direction (surplus / deficit / maintenance) and program intensity (conservative intro / moderate / aggressive).
3. **What is their recovery capacity?** Age, stress, sleep, and training age all cap the volume ceiling. Set **`mrv`** and **`currentTarget`** in `volume_landmarks.json` accordingly (weekly targets, not per-day).
4. **What are their 2–3 priority KPIs?** These are the lifts that define progress this cycle. Flag **`isKPI`: true** only on those exercises in `training_program.json`, and align **`kpis`** array with the same display names / cycle days.

**14-day cycle rule (mandatory):**

- **`training_program.json`**: **`cycleLengthDays`: `14`**, **`sessions`**: exactly **14** objects, **`dayNumber`**: **`1`…`14`** in order. Follow **Parse compatibility** above on every session.
- **`nutrition_plan.json`**: Four **`macroTargetsByDayType`** bands. In **Coach Notes**, map **each program day 1–14** to **`recovery` | `moderate` | `high` | `highest`**. Optionally add **`byDayType`** on **`mealSchedule`** rows for band-specific meal text (see example).
- **`supplement_protocol.json`**: Daily **windows** only.
- **`volume_landmarks.json`**: Eight muscle groups only — weekly landmarks.
- **`phase.json`** + **`athlete_profile.json`**: Single coherent narrative.

Then generate all 6 files.

---

### Canonical example — **`training_program.json` — one lift day** (copy shape exactly; then repeat for days 2–14)

```json
{
  "dayNumber": 1,
  "name": "Upper — Chest & Back",
  "type": "lift",
  "exercises": [
    {
      "exerciseId": "db-floor-press",
      "name": "DB Floor Press",
      "sets": 3,
      "reps": "8-12",
      "rest": 120,
      "isKPI": true,
      "notes": "Controlled tempo; exhale on press."
    },
    {
      "exerciseId": "weighted-pull-up",
      "name": "Weighted Pull-Up",
      "sets": 3,
      "reps": "6-10",
      "rest": 120
    }
  ],
  "cardio": { "type": "walk", "duration": 10, "note": "Cool-down; easy nasal breathing" },
  "breathWork": [
    { "name": "Long Exhale Reset", "inhale": 4, "hold": 0, "exhale": 8, "holdOut": 0, "rounds": 5 }
  ],
  "coreWork": [
    { "name": "Dead Bug", "sets": 2, "reps": 8, "perSide": true, "prolapseSafe": true },
    { "name": "Side Plank", "sets": 2, "holdSec": 20, "perSide": true, "prolapseSafe": true }
  ],
  "mobility": ["thoracic extension", "hip flexor stretch"],
  "notes": "Optional session notes."
}
```

**Cardio-only day** (still no `null` — empty arrays allowed):

```json
{
  "dayNumber": 3,
  "name": "Cardio & Breath",
  "type": "cardio",
  "exercises": [],
  "cardio": { "type": "brisk-walk", "duration": 30, "note": "Conversational pace" },
  "breathWork": [
    { "name": "Box Breathing", "inhale": 4, "hold": 4, "exhale": 4, "holdOut": 4, "rounds": 5 }
  ],
  "coreWork": [],
  "mobility": ["hip openers", "thoracic rotations"]
}
```

---

### OUTPUT FILE 1 — `athlete_profile.json`

Maps to **`AthleteProfile`**. Only these fields — **`metabolismNote`** may be `null` or omitted per app usage; prefer string or `null`.

**Minimal valid fragment:**

```json
{
  "age": 47,
  "height": "178cm",
  "currentWeight": 77,
  "targetWeight": 83,
  "weightUnit": "kg",
  "trainingAge": "advanced",
  "currentPhase": "Off-season lean gain",
  "primaryGoal": "One precise sentence.",
  "secondaryGoals": ["Goal A", "Goal B"],
  "injuryConstraints": [
    {
      "name": "Example constraint",
      "implications": ["Pattern to avoid"],
      "adaptations": ["Safer replacement"]
    }
  ],
  "strengthBodyparts": ["Shoulders"],
  "weakpointBodyparts": ["Chest"],
  "nutritionStyle": "Flexible dieting",
  "metabolismNote": null
}
```

---

### OUTPUT FILE 2 — `training_program.json`

Full top-level shape:

```json
{
  "name": "<string>",
  "cycleLengthDays": 14,
  "splitType": "<string>",
  "isActive": true,
  "startDate": "<YYYY-MM-DD>",
  "sessions": [
    /* 14 objects — follow canonical lift / cardio examples */
  ],
  "kpis": [
    { "exercise": "<Display Name matching exercise.name>", "metric": "<string>", "days": [1, 8] }
  ],
  "progressionRule": "<string>",
  "volumeTracking": {
    "chest": { "setsPerCycle": 0, "setsPerWeek": 0, "status": "<string>" },
    "back": { "setsPerCycle": 0, "setsPerWeek": 0, "status": "<string>" },
    "quads": { "setsPerCycle": 0, "setsPerWeek": 0, "status": "<string>" },
    "hamstrings": { "setsPerCycle": 0, "setsPerWeek": 0, "status": "<string>" },
    "delts": { "setsPerCycle": 0, "setsPerWeek": 0, "status": "<string>" },
    "biceps": { "setsPerCycle": 0, "setsPerWeek": 0, "status": "<string>" },
    "triceps": { "setsPerCycle": 0, "setsPerWeek": 0, "status": "<string>" },
    "calves": { "setsPerCycle": 0, "setsPerWeek": 0, "status": "<string>" }
  }
}
```

---

### OUTPUT FILE 3 — `nutrition_plan.json`

Maps to **`NutritionPlanSeed`**. **`fat`** must be JSON **`null`** in each band (schema literal).

**Example `mealSchedule` row with optional `byDayType`** (helps the athlete see band-specific food guidance without 14 duplicate rows):

```json
{
  "slot": "Lunch",
  "time": "13:00",
  "liftDay": "Protein + rice/potato + vegetables",
  "recoveryDay": "Protein + moderate carbs + vegetables",
  "liftDayOnly": false,
  "default": "Largest meal of the day",
  "byDayType": {
    "recovery": "Protein + vegetables; lighter starch",
    "moderate": "Protein + 1 cup rice + vegetables",
    "high": "Protein + 1.5 cups rice + vegetables",
    "highest": "Double protein + 2 cups rice + vegetables"
  }
}
```

Full file still includes **`proteinTarget`**, **`coreProteinRotation`**, **`macroTargetsByDayType`** (all four keys), **`emergencyRule`**.

---

### OUTPUT FILE 4 — `supplement_protocol.json`

Maps to **`SupplementProtocol`**.

**One window example:**

```json
{
  "timing": "morning",
  "withMeal": "Breakfast",
  "time": "07:30",
  "supplements": ["Creatine", "Vitamin D3"],
  "optional": ["Electrolytes"]
}
```

Include **`windows`** (array), **`notes`** (array of strings), **`intent`** (array of strings).

---

### OUTPUT FILE 5 — `phase.json`

Maps to **`Omit<Phase, 'id'>`.**

```json
{
  "name": "<string>",
  "type": "<string>",
  "startDate": "<YYYY-MM-DD>",
  "isActive": true,
  "targets": {
    "startWeight": 77,
    "targetWeight": 83,
    "weightUnit": "kg",
    "strategy": "<string>"
  }
}
```

---

### OUTPUT FILE 6 — `volume_landmarks.json`

Exactly **eight** keys — **`sets/week`** — no extra bodyparts.

**One-group example (repeat for all eight keys — valid JSON object):**

```json
{
  "chest": { "mv": 10, "mev": 12, "mav": 18, "mrv": 22, "currentTarget": 14, "unit": "sets/week" }
}
```

The full file must include **`back`**, **`quads`**, **`hamstrings`**, **`delts`**, **`biceps`**, **`triceps`**, **`calves`** with the same shape.

---

### OUTPUT FORMAT RULES

1. Begin with **Coach Notes** — maximum **10** bullet points. Include **one bullet** listing **days 1–14 → nutrition day type** (`recovery` / `moderate` / `high` / `highest`).
2. Output all 6 JSON files in order, each preceded by: `// FILE: filename.json`
3. No prose between JSON blocks after Coach Notes.
4. Use **`null` only** where the schema explicitly allows it (**`metabolismNote`**, **`withMeal`**, **`fat`** in macro bands). **Never** use `null` for **`cardio`**, **`breathWork`**, **`coreWork`**, or numeric **`reps` / `holdSec`** in **`coreWork`**.

---

### QUESTIONNAIRE ANSWERS

```
[PASTE THE COMPLETED QUESTIONNAIRE JSON HERE]
```

---

### Generator self-check (before sending output)

- [ ] **`training_program.json`**: **14** sessions, **`dayNumber` 1–14**, **no** `null` **`cardio` / `breathWork` / `coreWork`**, **no** `"reps": null` / `"holdSec": null` in **`coreWork`**, **`isKPI`** only where true.
- [ ] **`kpis[].days`** ⊆ **1…14**; **`exercise`** strings match **`sessions[].exercises[].name`** for KPI lifts.
- [ ] **`volumeTracking`** keys = exactly the **8** landmark muscle keys.
- [ ] **`macroTargetsByDayType`**: all four bands; Coach Notes map **14 days** to bands.
- [ ] **`volume_landmarks.json`**: exactly **8** muscle keys, all numbers.

---

_Generate Coach Notes followed by all 6 JSON files now._
