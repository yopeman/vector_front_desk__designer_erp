import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { activitiesApi } from '../api/activities'
import { Activity } from '../../types/database'

export function useActivities() {
  const queryClient = useQueryClient()

  const activities = useQuery({
    queryKey: ['activities'],
    queryFn: activitiesApi.getAll,
  })

  const createActivity = useMutation({
    mutationFn: activitiesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })

  const updateActivity = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Activity> }) =>
      activitiesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })

  const deleteActivity = useMutation({
    mutationFn: activitiesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })

  return {
    activities,
    createActivity,
    updateActivity,
    deleteActivity,
  }
}
