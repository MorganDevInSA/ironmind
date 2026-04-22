'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { useRecentWorkouts } from '@/controllers';
import { ArrowLeft, Dumbbell } from 'lucide-react';
import { formatDisplayDate } from '@/lib/utils';

export default function WorkoutHistoryPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: workouts, isLoading } = useRecentWorkouts(user?.uid ?? '', 28);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 text-[color:var(--text-2)] hover:text-[color:var(--text-0)] transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-[color:var(--accent)]">Workout History</h1>
      </div>

      {isLoading && <div className="glass-panel p-8 text-center"><div className="spinner mx-auto" /></div>}

      {!isLoading && workouts && workouts.length > 0 && (
        <div className="space-y-3">
          {workouts.map(w => (
            <div key={w.id} className="glass-panel p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-[color:var(--text-0)]">{w.sessionName}</p>
                  <p className="text-xs text-[color:var(--text-2)]">{formatDisplayDate(w.date)} · Day {w.cycleDayNumber}</p>
                </div>
                <span className="font-mono tabular-nums text-sm text-[color:var(--text-2)]">{w.durationMinutes}min</span>
              </div>
              {w.exercises.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {w.exercises.slice(0, 4).map(e => (
                    <span key={e.exerciseId} className="text-xs px-2 py-0.5 rounded-md bg-[rgba(18,14,14,0.6)] text-[color:var(--text-2)]">{e.name}</span>
                  ))}
                  {w.exercises.length > 4 && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-[rgba(18,14,14,0.6)] text-[color:var(--text-2)]">+{w.exercises.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!isLoading && (!workouts || workouts.length === 0) && (
        <div className="glass-panel p-8 text-center space-y-3">
          <Dumbbell size={32} className="mx-auto text-[color:var(--text-2)]" />
          <p className="text-[color:var(--text-2)]">No workouts logged yet. Start your first session.</p>
          <button onClick={() => router.push('/training/workout')} className="btn-primary">Start Workout</button>
        </div>
      )}
    </div>
  );
}
