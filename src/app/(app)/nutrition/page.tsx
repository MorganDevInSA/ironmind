'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores';
import { useNutritionDay, useSaveNutritionDay, useActiveProgram, useNutritionPlan } from '@/controllers';
import { today, formatDisplayDate, getCycleDay } from '@/lib/utils';
import { mortonNutritionPlan } from '@/lib/seed/nutrition';
import { getDefaultPlanLine, getPlanLineOptions, mergePlanLineOptions } from '@/lib/nutrition/meal-plan-options';
import { Utensils, CheckCircle2, Circle, MessageSquare, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DayType, Meal, MacroTargetRange } from '@/lib/types';

function buildDefaultMeals(
  schedule: typeof mortonNutritionPlan.mealSchedule,
  isLiftDay: boolean
): Meal[] {
  return schedule
    .filter((slot) => !(slot.liftDayOnly && !isLiftDay))
    .map((slot) => ({
      slot: slot.slot,
      time: slot.time,
      foods: [],
      completed: false,
    }));
}

const DAY_TYPES: { value: DayType; label: string; color: string }[] = [
  { value: 'recovery', label: 'Recovery', color: 'text-[#6B6B6B]' },
  { value: 'moderate', label: 'Moderate', color: 'text-[#DC2626]' },
  { value: 'high', label: 'High', color: 'text-[#F59E0B]' },
  { value: 'highest', label: 'Highest', color: 'text-[#EF4444]' },
];

function MacroBar({
  label,
  actual,
  target,
  color,
}: {
  label: string;
  actual: number;
  target: number | [number, number];
  color: string;
}) {
  const max = Array.isArray(target) ? target[1] : target;
  const pct = max > 0 ? Math.min(100, (actual / max) * 100) : 0;
  const targetStr = Array.isArray(target) ? `${target[0]}–${target[1]}` : String(target);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-[#6B6B6B]">{label}</span>
        <span className="font-mono tabular-nums text-[#F5F5F5]">
          {Math.round(actual)} / {targetStr}g
        </span>
      </div>
      <div className="h-1.5 bg-[rgba(16,22,34,0.72)] rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function NutritionPage() {
  const { user } = useAuthStore();
  const userId = user?.uid ?? '';
  const todayStr = today();

  const { data: nutritionDay, isLoading } = useNutritionDay(userId, todayStr);
  const { data: program } = useActiveProgram(userId);
  const { data: nutritionPlanData } = useNutritionPlan(userId);
  const { mutate: saveDay, isPending: isSaving } = useSaveNutritionDay(userId);

  const activePlan = nutritionPlanData ?? mortonNutritionPlan;
  const schedule = activePlan.mealSchedule;

  const cycleDay = program
    ? getCycleDay(program.startDate ?? todayStr, todayStr, program.cycleLengthDays)
    : null;
  const todaySession = program?.sessions.find((s) => s.dayNumber === cycleDay);
  const isLiftDay = todaySession?.type === 'lift';

  const [dayType, setDayType] = useState<DayType>('moderate');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [agentNotes, setAgentNotes] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const persistNutritionDay = useCallback(
    (nextMeals: Meal[], nextDayType: DayType = dayType, nextNotes: string = agentNotes) => {
      const targets = activePlan.macroTargetsByDayType[nextDayType];
      const macroTargets: MacroTargetRange = {
        calories: targets.calories,
        protein: targets.protein,
        carbs: targets.carbs,
        fat: null,
      };
      const completed = nextMeals.filter((m) => m.completed).length;
      const complianceScore =
        nextMeals.length > 0 ? Math.round((completed / nextMeals.length) * 100) : 0;

      saveDay(
        {
          date: todayStr,
          data: {
            date: todayStr,
            dayType: nextDayType,
            meals: nextMeals.map((m) => ({
              slot: m.slot,
              time: m.time,
              foods: m.foods,
              completed: m.completed,
              ...(m.planLine?.trim() ? { planLine: m.planLine.trim() } : {}),
            })),
            macroTargets,
            macroActuals: nutritionDay?.macroActuals ?? { calories: 0, protein: 0, carbs: 0, fat: 0 },
            complianceScore,
            agentNotes: nextNotes.trim() ? nextNotes.trim() : undefined,
          },
        },
        {
          onSuccess: () => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          },
        }
      );
    },
    [agentNotes, dayType, nutritionDay?.macroActuals, saveDay, todayStr]
  );

  useEffect(() => {
    const lift = isLiftDay ?? false;
    if (nutritionDay) {
      setDayType(nutritionDay.dayType);
      setAgentNotes(nutritionDay.agentNotes ?? '');
      const seedMeals = buildDefaultMeals(schedule, lift);
      const merged = seedMeals.map((seed) => {
        const existing = nutritionDay.meals.find((m) => m.slot === seed.slot);
        return existing
          ? {
              slot: seed.slot,
              time: seed.time,
              foods: existing.foods ?? [],
              completed: existing.completed ?? false,
              planLine: existing.planLine,
            }
          : seed;
      });
      setMeals(merged);
    } else if (!isLoading) {
      setMeals(buildDefaultMeals(schedule, lift));
    }
  }, [nutritionDay, isLoading, isLiftDay, schedule]);

  const toggleMeal = (slot: string) => {
    const next = meals.map((m) => (m.slot === slot ? { ...m, completed: !m.completed } : m));
    setMeals(next);
    persistNutritionDay(next);
  };

  const handlePlanLineChange = (slot: string, value: string) => {
    const next = meals.map((m) => (m.slot === slot ? { ...m, planLine: value } : m));
    setMeals(next);
    persistNutritionDay(next);
  };

  const completedCount = meals.filter((m) => m.completed).length;
  const targets = activePlan.macroTargetsByDayType[dayType];

  const handleSave = () => {
    persistNutritionDay(meals, dayType, agentNotes);
  };

  const handleDayTypeChange = (next: DayType) => {
    setDayType(next);
    persistNutritionDay(meals, next, agentNotes);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6B6B6B] mb-1">
            {formatDisplayDate(new Date())}
          </p>
          <h1 className="text-2xl font-bold text-[#F5F5F5]">Nutrition</h1>
          {program && cycleDay && (
            <p className="text-sm text-[#6B6B6B] mt-0.5">
              Day {cycleDay} · {isLiftDay ? 'Lift Day' : 'Recovery Day'}
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all',
            saved
              ? 'border-[rgba(16,185,129,0.4)] bg-[rgba(16,185,129,0.12)] text-[#10B981]'
              : 'border-[rgba(80,96,128,0.35)] text-[#9A9A9A] hover:border-[rgba(212,175,55,0.4)] hover:text-[#F5F5F5]'
          )}
        >
          {isSaving ? (
            <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin inline-block" />
          ) : saved ? (
            <CheckCircle2 size={16} />
          ) : (
            <Save size={16} />
          )}
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* Day type selector */}
      <div className="glass-panel p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">Day Type</p>
        <div className="grid grid-cols-4 gap-2">
          {DAY_TYPES.map((dt) => (
            <button
              key={dt.value}
              type="button"
              onClick={() => handleDayTypeChange(dt.value)}
              className={cn(
                'py-2 rounded-lg text-sm font-semibold border transition-all',
                dayType === dt.value
                  ? 'border-[rgba(212,175,55,0.5)] bg-[rgba(212,175,55,0.1)] text-[#DC2626]'
                  : 'border-[rgba(80,96,128,0.2)] text-[#6B6B6B] hover:text-[#F5F5F5]'
              )}
            >
              {dt.label}
            </button>
          ))}
        </div>

        <div className="pt-2 space-y-2.5 border-t border-[rgba(80,96,128,0.15)]">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#6B6B6B]">Calories target</span>
            <span className="font-mono tabular-nums text-[#F5F5F5]">
              {targets.calories[0]}–{targets.calories[1]} kcal
            </span>
          </div>
          <MacroBar
            label="Protein"
            actual={nutritionDay?.macroActuals.protein ?? 0}
            target={targets.protein}
            color="bg-[#DC2626]"
          />
          <MacroBar
            label="Carbs"
            actual={nutritionDay?.macroActuals.carbs ?? 0}
            target={targets.carbs}
            color="bg-[#F59E0B]"
          />
        </div>
      </div>

      {/* Meal plan */}
      <div className="glass-panel overflow-hidden">
        <div className="px-4 py-3 border-b border-[rgba(80,96,128,0.15)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils size={18} className="text-[#DC2626]" />
            <h2 className="font-semibold text-[#F5F5F5]">Today&apos;s Meals</h2>
          </div>
          <span className="text-sm font-mono tabular-nums text-[#6B6B6B]">
            {completedCount}/{meals.length} eaten
          </span>
        </div>

        <div className="h-0.5 bg-[rgba(16,22,34,0.72)]">
          <div
            className="h-full bg-[#10B981] transition-all duration-500"
            style={{ width: meals.length > 0 ? `${(completedCount / meals.length) * 100}%` : '0%' }}
          />
        </div>

        <div className="divide-y divide-[rgba(80,96,128,0.1)]">
          {meals.map((meal) => {
            const slotDef = schedule.find((s) => s.slot === meal.slot);
            const defaultLine = slotDef ? getDefaultPlanLine(slotDef, isLiftDay) : '';
            const displayLine =
              meal.planLine?.trim() ||
              (slotDef ? getDefaultPlanLine(slotDef, isLiftDay) : '');
            const baseOptions = slotDef ? getPlanLineOptions(slotDef, isLiftDay ?? false) : [];
            const optionList = mergePlanLineOptions(baseOptions, displayLine);
            const isOpen = expanded === meal.slot;
            const showPicker = optionList.length > 1;

            return (
              <div key={meal.slot} className={cn('transition-all', meal.completed && 'opacity-75')}>
                <div className="flex items-start sm:items-center px-4 py-3.5 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => toggleMeal(meal.slot)}
                    className="shrink-0 w-6 h-6 mt-0.5 sm:mt-0 flex items-center justify-center"
                  >
                    {meal.completed ? (
                      <CheckCircle2 size={22} className="text-[#10B981]" />
                    ) : (
                      <Circle size={22} className="text-[#6B6B6B]/50" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2">
                    <button
                      type="button"
                      className="flex-1 text-left min-w-0"
                      onClick={() => setExpanded(isOpen ? null : meal.slot)}
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-mono tabular-nums text-xs text-[#6B6B6B] shrink-0 w-10">
                          {meal.time}
                        </span>
                        <span
                          className={cn(
                            'font-semibold capitalize text-sm shrink-0',
                            meal.completed ? 'text-[#6B6B6B]' : 'text-[#F5F5F5]'
                          )}
                        >
                          {meal.slot.replace('-', ' ')}
                        </span>
                      </div>
                      {!isOpen && (
                        <p className="text-xs text-[#6B6B6B] mt-1 line-clamp-2" title={displayLine}>
                          {displayLine}
                        </p>
                      )}
                    </button>

                    {showPicker ? (
                      <label className="block shrink-0 w-full sm:w-auto sm:max-w-[min(100%,18rem)]">
                        <span className="sr-only">Meal option for {meal.slot}</span>
                        <select
                          value={optionList.includes(displayLine) ? displayLine : optionList[0]}
                          onChange={(e) => handlePlanLineChange(meal.slot, e.target.value)}
                          disabled={isSaving}
                          title={displayLine}
                          className={cn(
                            'w-full text-xs sm:text-sm rounded-lg border bg-[rgba(16,22,34,0.75)] px-2 py-2',
                            'border-[rgba(80,96,128,0.35)] text-[#F5F5F5]',
                            'focus:outline-none focus:ring-2 focus:ring-[rgba(220,38,38,0.45)]',
                            'disabled:opacity-50'
                          )}
                        >
                          {optionList.map((opt) => (
                            <option key={opt} value={opt} className="bg-[#0d0d0d]">
                              {opt.length > 90 ? `${opt.slice(0, 87)}…` : opt}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <p className="text-xs text-[#9A9A9A] max-w-md truncate" title={displayLine}>
                        {displayLine}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : meal.slot)}
                    className="text-[#6B6B6B] shrink-0 mt-0.5 sm:mt-0"
                  >
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {isOpen && (
                  <div className="px-4 pb-4 pl-[3.25rem] space-y-3">
                    <div className="p-3 bg-[rgba(16,22,34,0.5)] rounded-lg border border-[rgba(80,96,128,0.15)]">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1">
                        Active plan line
                      </p>
                      <p className="text-sm text-[#D4D4D4] whitespace-pre-wrap">{displayLine}</p>
                      {slotDef && (
                        <p className="text-[11px] text-[#6B6B6B] mt-2">
                          Default for today ({isLiftDay ? 'lift' : 'recovery'}): {defaultLine}
                        </p>
                      )}
                    </div>
                    {!meal.completed && (
                      <button
                        type="button"
                        onClick={() => toggleMeal(meal.slot)}
                        className="text-xs font-semibold text-[#10B981] hover:text-[#34D399] transition-colors"
                      >
                        ✓ Mark as eaten
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Agent Review Notes */}
      <div className="glass-panel overflow-hidden">
        <button
          type="button"
          onClick={() => setNotesOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 border-b border-[rgba(80,96,128,0.15)]"
        >
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-[#DC2626]" />
            <span className="font-semibold text-[#F5F5F5]">Notes for Coach AI Review</span>
            {agentNotes && <span className="w-2 h-2 rounded-full bg-[#DC2626] shrink-0" />}
          </div>
          {notesOpen ? (
            <ChevronUp size={16} className="text-[#6B6B6B]" />
          ) : (
            <ChevronDown size={16} className="text-[#6B6B6B]" />
          )}
        </button>

        {notesOpen && (
          <div className="p-4 space-y-3">
            <p className="text-xs text-[#6B6B6B]">
              Add anything your coach AI should know about today&apos;s nutrition — cravings, digestion,
              energy crashes, deviation from plan, or context for decisions.
            </p>
            <textarea
              value={agentNotes}
              onChange={(e) => setAgentNotes(e.target.value)}
              placeholder="e.g. Skipped bed meal — not hungry. Lunch was late due to work. Felt good energy post-workout shake…"
              rows={4}
              className="w-full bg-[rgba(16,22,34,0.6)] border border-[rgba(80,96,128,0.25)] rounded-lg p-3 text-sm text-[#F5F5F5] placeholder:text-[#6B6B6B]/50 focus:outline-none focus:border-[rgba(59,130,246,0.5)] resize-none"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
            >
              <Save size={14} /> {isSaving ? 'Saving…' : 'Save Notes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
