'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { useActiveProgram } from '@/controllers';
import { ArrowLeft } from 'lucide-react';

export default function ExercisesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: program } = useActiveProgram(user?.uid ?? '');

  const allExercises = program?.sessions
    .flatMap(s => s.exercises ?? [])
    .reduce<typeof program.sessions[0]['exercises']>((acc, ex) => {
      if (!acc!.find(e => e.exerciseId === ex.exerciseId)) acc!.push(ex);
      return acc;
    }, []) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 text-[#6B6B6B] hover:text-[#F5F5F5] transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-[#F5F5F5]">Exercise Database</h1>
      </div>

      {allExercises && allExercises.length > 0 ? (
        <div className="space-y-2">
          {allExercises.map(ex => (
            <div key={ex.exerciseId} className="glass-panel p-4 flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-[#F5F5F5]">{ex.name}</p>
                  {ex.isKPI && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[color:color-mix(in_srgb,var(--accent)_15%,transparent)] text-[color:var(--accent)] border border-[color:color-mix(in_srgb,var(--accent)_30%,transparent)]">
                      KPI
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6B6B6B]">{ex.sets} × {ex.reps} · {ex.rest}s rest</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-8 text-center">
          <p className="text-[#6B6B6B]">No exercises loaded. Import your plan first.</p>
        </div>
      )}
    </div>
  );
}
