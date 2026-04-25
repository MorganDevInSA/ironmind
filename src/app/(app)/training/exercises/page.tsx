'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { useActiveProgram } from '@/controllers';
import { ArrowLeft } from 'lucide-react';

export default function ExercisesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: program } = useActiveProgram(user?.uid ?? '');

  const allExercises =
    program?.sessions
      .flatMap((s) => s.exercises ?? [])
      .reduce<(typeof program.sessions)[0]['exercises']>((acc, ex) => {
        if (!acc!.find((e) => e.exerciseId === ex.exerciseId)) acc!.push(ex);
        return acc;
      }, []) ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 text-[color:var(--text-2)] hover:text-[color:var(--text-0)] transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-[color:var(--accent)]">Exercise Database</h1>
      </div>

      {allExercises && allExercises.length > 0 ? (
        <div className="space-y-2">
          {allExercises.map((ex) => (
            <div key={ex.exerciseId} className="glass-panel p-4 flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-[color:var(--text-0)]">{ex.name}</p>
                  {ex.isKPI && <span className="workout-kpi-badge">KPI</span>}
                </div>
                <p className="text-xs text-[color:var(--text-2)]">
                  {ex.sets} × {ex.reps} · {ex.rest}s rest
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-8 text-center">
          <p className="text-[color:var(--text-2)]">No exercises loaded. Import your plan first.</p>
        </div>
      )}
    </div>
  );
}
