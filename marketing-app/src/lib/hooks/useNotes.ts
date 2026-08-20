import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notesApi } from '../api/notes'
import { Note } from '../../types/database'

export function useNotes() {
  const queryClient = useQueryClient()

  const notes = useQuery({
    queryKey: ['notes'],
    queryFn: notesApi.getAll,
  })

  const createNote = useMutation({
    mutationFn: notesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })

  const updateNote = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Note> }) =>
      notesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })

  const deleteNote = useMutation({
    mutationFn: notesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })

  return {
    notes,
    createNote,
    updateNote,
    deleteNote,
  }
}
