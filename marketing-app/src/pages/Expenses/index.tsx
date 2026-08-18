import { useState } from 'react'
import { useExpenses } from '../../lib/hooks/useExpenses'
import { useAuthStore } from '../../stores/authStore'
import { Expense } from '../../types/database'
import { ExpenseList } from '../../components/modules/expenses/ExpenseList'
import { ExpenseForm } from '../../components/modules/expenses/ExpenseForm'
import { BudgetDashboard } from '../../components/modules/expenses/BudgetDashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'

export default function ExpensesPage() {
  const { expenses, createExpense, updateExpense, deleteExpense, setApproval } = useExpenses()
  const { user } = useAuthStore()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>()

  const canApprove = user?.role === 'executive' || user?.role === 'manager'

  const handleCreate = () => {
    setEditingExpense(undefined)
    setIsFormOpen(true)
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      await deleteExpense.mutateAsync(id)
    }
  }

  const handleSubmit = async (data: Partial<Expense>) => {
    if (editingExpense) {
      await updateExpense.mutateAsync({ id: editingExpense.id, data })
    } else {
      await createExpense.mutateAsync(data as any)
    }
    setIsFormOpen(false)
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setEditingExpense(undefined)
  }

  const handleApprove = async (id: string) => {
    await setApproval.mutateAsync({ id, status: 'approved', approvedBy: user?.id })
  }

  const handleReject = async (id: string) => {
    await setApproval.mutateAsync({ id, status: 'rejected', approvedBy: user?.id })
  }

  if (expenses.isLoading) {
    return <div className="text-center py-12">Loading expenses...</div>
  }

  if (expenses.error) {
    return <div className="text-center py-12 text-red-600">Error loading expenses</div>
  }

  return (
    <>
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Expenses</TabsTrigger>
          <TabsTrigger value="dashboard">Budget Dashboard</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <ExpenseList
            expenses={expenses.data || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreate={handleCreate}
            onApprove={handleApprove}
            onReject={handleReject}
            canApprove={canApprove}
          />
        </TabsContent>
        <TabsContent value="dashboard">
          <BudgetDashboard />
        </TabsContent>
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Submit Expense'}</DialogTitle>
          </DialogHeader>
          <ExpenseForm
            expense={editingExpense}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createExpense.isPending || updateExpense.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
