'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, staleTimes } from '@/lib/constants';
import {
  getPrograms,
  getActiveProgram,
  getWorkouts,
  getWorkout,
  createWorkout,
  updateWorkout,
  saveWorkout,
  deleteWorkout,
  getRecentWorkouts,
} from '@/services';
import type { Workout } from '@/lib/types';
import { onMutationError } from './_shared/on-error';

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

// Workouts
export function useWorkouts(userId: string, dateRange?: { from: string; to: string }) {
  return useQuery({
    queryKey: queryKeys(userId).training.workouts(dateRange),
    queryFn: () => getWorkouts(userId, dateRange),
    staleTime: staleTimes.workouts,
    enabled: !!userId,
  });
}

export function useRecentWorkouts(userId: string, days: number = 14) {
  return useQuery({
    queryKey: queryKeys(userId).training.recentWorkouts(days),
    queryFn: () => getRecentWorkouts(userId, days),
    staleTime: staleTimes.workouts,
    enabled: !!userId,
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

      workout.exercises[exerciseIndex].sets[setIndex] = set;
      await saveWorkout(userId, workout);
      return workout;
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
    },
  });
}
