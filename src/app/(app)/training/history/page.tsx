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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 text-[#6B6B6B] hover:text-[#F5F5F5] transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-[#F5F5F5]">Workout History</h1>
      </div>

      {isLoading && <div className="glass-panel p-8 text-center"><div className="spinner mx-auto" /></div>}

      {!isLoading && workouts && workouts.length > 0 && (
        <div className="space-y-3">
          {workouts.map(w => (
            <div key={w.id} className="glass-panel p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-[#F5F5F5]">{w.sessionName}</p>
                  <p className="text-xs text-[#6B6B6B]">{formatDisplayDate(w.date)} · Day {w.cycleDayNumber}</p>
                </div>
                <span className="font-mono tabular-nums text-sm text-[#6B6B6B]">{w.durationMinutes}min</span>
              </div>
              {w.exercises.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {w.exercises.slice(0, 4).map(e => (
                    <span key={e.exerciseId} className="text-xs px-2 py-0.5 rounded-md bg-[rgba(16,22,34,0.6)] text-[#6B6B6B]">{e.name}</span>
                  ))}
                  {w.exercises.length > 4 && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-[rgba(16,22,34,0.6)] text-[#6B6B6B]">+{w.exercises.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!isLoading && (!workouts || workouts.length === 0) && (
        <div className="glass-panel p-8 text-center space-y-3">
          <Dumbbell size={32} className="mx-auto text-[#6B6B6B]" />
          <p className="text-[#6B6B6B]">No workouts logged yet. Start your first session.</p>
          <button onClick={() => router.push('/training/workout')} className="btn-primary">Start Workout</button>
        </div>
      )}
    </div>
  );
}
