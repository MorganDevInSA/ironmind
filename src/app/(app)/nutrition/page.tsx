'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores';
import { useNutritionDay, useSaveNutritionDay, useActiveProgram } from '@/controllers';
import { today, formatDisplayDate, getCycleDay } from '@/lib/utils';
import { morganNutritionPlan } from '@/lib/seed/nutrition';
import { Utensils, CheckCircle2, Circle, MessageSquare, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DayType, Meal, MacroTargetRange } from '@/lib/types';

const DAY_TYPES: { value: DayType; label: string; color: string }[] = [
  { value: 'recovery',  label: 'Recovery',  color: 'text-[#6B6B6B]' },
  { value: 'moderate',  label: 'Moderate',  color: 'text-[#DC2626]' },
  { value: 'high',      label: 'High',      color: 'text-[#F59E0B]' },
  { value: 'highest',   label: 'Highest',   color: 'text-[#EF4444]' },
];

function buildDefaultMeals(dayType: DayType, isLiftDay: boolean): Meal[] {
  return morganNutritionPlan.mealSchedule
    .filter(slot => !(slot.liftDayOnly && !isLiftDay))
    .map(slot => ({
      slot: slot.slot,
      time: slot.time,
      foods: [],
      completed: false,
      description: isLiftDay
        ? (slot.liftDay ?? slot.default)
        : (slot.recoveryDay ?? slot.default),
    } as Meal & { description: string }));
}

function MacroBar({ label, actual, target, color }: { label: string; actual: number; target: number | [number, number]; color: string }) {
  const max = Array.isArray(target) ? target[1] : target;
  const pct = max > 0 ? Math.min(100, (actual / max) * 100) : 0;
  const targetStr = Array.isArray(target) ? `${target[0]}–${target[1]}` : String(target);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-[#6B6B6B]">{label}</span>
        <span className="font-mono tabular-nums text-[#F5F5F5]">{Math.round(actual)} / {targetStr}g</span>
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
  const { mutate: saveDay, isPending: isSaving } = useSaveNutritionDay(userId);

  const cycleDay = program
    ? getCycleDay(program.startDate ?? todayStr, todayStr, program.cycleLengthDays)
    : null;
  const todaySession = program?.sessions.find(s => s.dayNumber === cycleDay);
  const isLiftDay = todaySession?.type === 'lift';

  // Local state mirrors Firestore — optimistic UI
  const [dayType, setDayType] = useState<DayType>('moderate');
  const [meals, setMeals] = useState<(Meal & { description?: string })[]>([]);
  const [agentNotes, setAgentNotes] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  // Sync from Firestore when data loads
  useEffect(() => {
    if (nutritionDay) {
      setDayType(nutritionDay.dayType);
      setAgentNotes(nutritionDay.agentNotes ?? '');
      // Merge existing meals with descriptions from seed
      const seedMeals = buildDefaultMeals(nutritionDay.dayType, isLiftDay ?? false);
      const merged = seedMeals.map(seed => {
        const existing = nutritionDay.meals.find(m => m.slot === seed.slot);
        return existing
          ? { ...existing, description: (seed as Meal & { description?: string }).description }
          : seed;
      });
      setMeals(merged);
    } else if (!isLoading) {
      // No data yet — initialize from seed
      const initial = buildDefaultMeals(dayType, isLiftDay ?? false);
      setMeals(initial);
    }
  }, [nutritionDay, isLoading, isLiftDay]);

  const toggleMeal = (slot: string) => {
    setMeals(prev => prev.map(m => m.slot === slot ? { ...m, completed: !m.completed } : m));
  };

  const completedCount = meals.filter(m => m.completed).length;
  const targets = morganNutritionPlan.macroTargetsByDayType[dayType];

  const handleSave = () => {
    const macroTargets: MacroTargetRange = {
      calories: targets.calories,
      protein: targets.protein,
      carbs: targets.carbs,
      fat: null,
    };

    const complianceScore = meals.length > 0 ? Math.round((completedCount / meals.length) * 100) : 0;

    saveDay(
      {
        date: todayStr,
        data: {
          date: todayStr,
          dayType,
          meals: meals.map(m => ({ slot: m.slot, time: m.time, foods: m.foods, completed: m.completed })),
          macroTargets,
          macroActuals: nutritionDay?.macroActuals ?? { calories: 0, protein: 0, carbs: 0, fat: 0 },
          complianceScore,
          agentNotes: agentNotes || undefined,
        },
      },
      { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); } }
    );
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
          {isSaving
            ? <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin inline-block" />
            : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* Day type selector */}
      <div className="glass-panel p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">Day Type</p>
        <div className="grid grid-cols-4 gap-2">
          {DAY_TYPES.map(dt => (
            <button
              key={dt.value}
              onClick={() => setDayType(dt.value)}
              className={cn(
                'py-2 rounded-lg text-sm font-semibold border transition-all',
                dayType === dt.value
                  ? 'border-[rgba(212,175,55,0.5)] bg-[rgba(212,175,55,0.1)] text-[#DC2626]'
                  : 'border-[rgba(80,96,128,0.2)] text-[#6B6B6B] hover:text-[#F5F5F5]'
              )}
            >{dt.label}</button>
          ))}
        </div>

        {/* Macro targets for day type */}
        <div className="pt-2 space-y-2.5 border-t border-[rgba(80,96,128,0.15)]">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#6B6B6B]">Calories target</span>
            <span className="font-mono tabular-nums text-[#F5F5F5]">{targets.calories[0]}–{targets.calories[1]} kcal</span>
          </div>
          <MacroBar label="Protein" actual={nutritionDay?.macroActuals.protein ?? 0} target={targets.protein} color="bg-[#DC2626]" />
          <MacroBar label="Carbs" actual={nutritionDay?.macroActuals.carbs ?? 0} target={targets.carbs} color="bg-[#F59E0B]" />
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

        {/* Progress bar */}
        <div className="h-0.5 bg-[rgba(16,22,34,0.72)]">
          <div
            className="h-full bg-[#10B981] transition-all duration-500"
            style={{ width: meals.length > 0 ? `${(completedCount / meals.length) * 100}%` : '0%' }}
          />
        </div>

        <div className="divide-y divide-[rgba(80,96,128,0.1)]">
          {meals.map((meal) => {
            const mealWithDesc = meal as Meal & { description?: string };
            const isOpen = expanded === meal.slot;

            return (
              <div key={meal.slot} className={cn('transition-all', meal.completed && 'opacity-75')}>
                <div className="flex items-center px-4 py-3.5 gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleMeal(meal.slot)}
                    className="shrink-0 w-6 h-6 flex items-center justify-center"
                  >
                    {meal.completed
                      ? <CheckCircle2 size={22} className="text-[#10B981]" />
                      : <Circle size={22} className="text-[#6B6B6B]/50" />}
                  </button>

                  {/* Time + content */}
                  <button
                    className="flex-1 text-left"
                    onClick={() => setExpanded(isOpen ? null : meal.slot)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono tabular-nums text-xs text-[#6B6B6B] shrink-0 w-10">{meal.time}</span>
                      <div className="flex-1 min-w-0">
                        <span className={cn('font-semibold capitalize text-sm',
                          meal.completed ? 'text-[#6B6B6B]' : 'text-[#F5F5F5]')}>
                          {meal.slot.replace('-', ' ')}
                        </span>
                        {!isOpen && mealWithDesc.description && (
                          <p className="text-xs text-[#6B6B6B] truncate mt-0.5">{mealWithDesc.description}</p>
                        )}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setExpanded(isOpen ? null : meal.slot)}
                    className="text-[#6B6B6B] shrink-0"
                  >
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* Expanded: description */}
                {isOpen && (
                  <div className="px-4 pb-4 pl-[3.25rem] space-y-2">
                    {mealWithDesc.description && (
                      <div className="p-3 bg-[rgba(16,22,34,0.5)] rounded-lg border border-[rgba(80,96,128,0.15)]">
                        <p className="text-sm text-[#9A9A9A]">{mealWithDesc.description}</p>
                      </div>
                    )}
                    {/* Mark as eaten shortcut */}
                    {!meal.completed && (
                      <button
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
          onClick={() => setNotesOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 border-b border-[rgba(80,96,128,0.15)]"
        >
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-[#DC2626]" />
            <span className="font-semibold text-[#F5F5F5]">Notes for Coach AI Review</span>
            {agentNotes && <span className="w-2 h-2 rounded-full bg-[#DC2626] shrink-0" />}
          </div>
          {notesOpen ? <ChevronUp size={16} className="text-[#6B6B6B]" /> : <ChevronDown size={16} className="text-[#6B6B6B]" />}
        </button>

        {notesOpen && (
          <div className="p-4 space-y-3">
            <p className="text-xs text-[#6B6B6B]">
              Add anything your coach AI should know about today&apos;s nutrition — cravings, digestion, energy crashes, deviation from plan, or context for decisions.
            </p>
            <textarea
              value={agentNotes}
              onChange={e => setAgentNotes(e.target.value)}
              placeholder="e.g. Skipped bed meal — not hungry. Lunch was late due to work. Felt good energy post-workout shake…"
              rows={4}
              className="w-full bg-[rgba(16,22,34,0.6)] border border-[rgba(80,96,128,0.25)] rounded-lg p-3 text-sm text-[#F5F5F5] placeholder:text-[#6B6B6B]/50 focus:outline-none focus:border-[rgba(59,130,246,0.5)] resize-none"
            />
            <button onClick={handleSave} disabled={isSaving} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
              <Save size={14} /> {isSaving ? 'Saving…' : 'Save Notes'}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
