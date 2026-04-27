'use client';

import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { queryKeys, staleTimes } from '@/lib/constants';
import {
  getPrograms,
  getActiveProgram,
  getWorkouts,
  getWorkout,
  createWorkout,
  updateWorkout,
  updateProgram,
  saveWorkout,
  deleteWorkout,
  getRecentWorkouts,
  applyWorkoutSetChange,
  deleteCurrentWeekVolumeRollup,
  getLastWorkoutYouTubeUrl,
  saveLastWorkoutYouTubeUrl,
} from '@/services';
import type { Program, Workout } from '@/lib/types';
import { onMutationError } from './_shared/on-error';
import { invalidateDashboardBundle } from './_shared/invalidate-dashboard';

function invalidateVolumeAfterWorkoutWrite(queryClient: QueryClient, userId: string) {
  void deleteCurrentWeekVolumeRollup(userId).catch(() => {});
  void queryClient.invalidateQueries({ queryKey: queryKeys(userId).volume.all });
}

// Programs
export function usePrograms(userId: string) {
  return useQuery({
    queryKey: queryKeys(userId).training.programs(),
    queryFn: () => getPrograms(userId),
    staleTime: staleTimes.programs,
    enabled: !!userId,
  });
}

export function useActiveProgram(userId: string) {
  return useQuery({
    queryKey: queryKeys(userId).training.activeProgram(),
    queryFn: () => getActiveProgram(userId),
    staleTime: staleTimes.activeProgram,
    enabled: !!userId,
  });
}

export function useUpdateProgram(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ programId, updates }: { programId: string; updates: Partial<Program> }) =>
      updateProgram(userId, programId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys(userId).training.all });
      invalidateDashboardBundle(queryClient, userId);
    },
    onError: onMutationError,
  });
}

export function useWorkoutMediaPreference(userId: string) {
  return useQuery({
    queryKey: queryKeys(userId).training.workoutMediaPreference(),
    queryFn: () => getLastWorkoutYouTubeUrl(userId),
    staleTime: staleTimes.workoutMediaPreference,
    enabled: !!userId,
  });
}

export function useSaveWorkoutMediaPreference(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (url: string | null) => saveLastWorkoutYouTubeUrl(userId, url),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys(userId).training.workoutMediaPreference(),
      });
    },
    onError: onMutationError,
  });
}

// Workouts
export function useWorkouts(
  userId: string,
  dateRange: { from: string; to: string } | undefined,
  options?: { enabled?: boolean },
) {
  const enabled = (options?.enabled ?? true) && !!userId && !!dateRange?.from && !!dateRange?.to;
  return useQuery({
    queryKey: queryKeys(userId).training.workouts(dateRange),
    queryFn: () => getWorkouts(userId, dateRange!),
    staleTime: staleTimes.workouts,
    enabled,
  });
}

export function useRecentWorkouts(
  userId: string,
  days: number = 14,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys(userId).training.recentWorkouts(days),
    queryFn: () => getRecentWorkouts(userId, days),
    staleTime: staleTimes.workouts,
    enabled: (options?.enabled ?? true) && !!userId,
  });
}

export function useWorkout(userId: string, workoutId: string) {
  return useQuery({
    queryKey: queryKeys(userId).training.workout(workoutId),
    queryFn: () => getWorkout(userId, workoutId),
    staleTime: staleTimes.workouts,
    enabled: !!userId && !!workoutId,
  });
}

// Mutations
export function useCreateWorkout(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workout: Omit<Workout, 'id'>) => createWorkout(userId, workout),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys(userId).training.all });
      invalidateVolumeAfterWorkoutWrite(queryClient, userId);
      invalidateDashboardBundle(queryClient, userId);
    },
    onError: onMutationError,
  });
}

export function useUpdateWorkout(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workoutId, updates }: { workoutId: string; updates: Partial<Workout> }) =>
      updateWorkout(userId, workoutId, updates),
    onSuccess: (_, { workoutId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys(userId).training.workout(workoutId) });
      queryClient.invalidateQueries({ queryKey: queryKeys(userId).training.all });
      invalidateVolumeAfterWorkoutWrite(queryClient, userId);
      invalidateDashboardBundle(queryClient, userId);
    },
    onError: onMutationError,
  });
}

export function useSaveWorkout(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workout: Workout) => saveWorkout(userId, workout),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys(userId).training.all });
      invalidateVolumeAfterWorkoutWrite(queryClient, userId);
      invalidateDashboardBundle(queryClient, userId);
    },
    onError: onMutationError,
  });
}

export function useDeleteWorkout(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workoutId: string) => deleteWorkout(userId, workoutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys(userId).training.all });
      invalidateVolumeAfterWorkoutWrite(queryClient, userId);
      invalidateDashboardBundle(queryClient, userId);
    },
    onError: onMutationError,
  });
}

// Save set mutation with optimistic update
export function useSaveSet(userId: string, workoutId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      exerciseIndex,
      setIndex,
      set,
    }: {
      exerciseIndex: number;
      setIndex: number;
      set: Workout['exercises'][0]['sets'][0];
    }) => {
      const workout = await getWorkout(userId, workoutId);
      if (!workout) throw new Error('Workout not found');

      return applyWorkoutSetChange(userId, workoutId, {
        exerciseIndex,
        setIndex,
        set,
        baseUpdatedAt: workout.updatedAt,
      });
    },
    onMutate: async ({ exerciseIndex, setIndex, set }) => {
      const qk = queryKeys(userId).training.workout(workoutId);

      await queryClient.cancelQueries({ queryKey: qk });

      const previousWorkout = queryClient.getQueryData<Workout>(qk);

      if (previousWorkout) {
        const updatedWorkout = { ...previousWorkout };
        updatedWorkout.exercises = [...updatedWorkout.exercises];
        updatedWorkout.exercises[exerciseIndex] = {
          ...updatedWorkout.exercises[exerciseIndex],
        };
        updatedWorkout.exercises[exerciseIndex].sets = [
          ...updatedWorkout.exercises[exerciseIndex].sets,
        ];
        updatedWorkout.exercises[exerciseIndex].sets[setIndex] = set;

        queryClient.setQueryData(qk, updatedWorkout);
      }

      return { previousWorkout };
    },
    onError: (error, _, context) => {
      if (context?.previousWorkout) {
        queryClient.setQueryData(
          queryKeys(userId).training.workout(workoutId),
          context.previousWorkout,
        );
      }
      onMutationError(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys(userId).training.workout(workoutId) });
      invalidateVolumeAfterWorkoutWrite(queryClient, userId);
      invalidateDashboardBundle(queryClient, userId);
    },
  });
}
