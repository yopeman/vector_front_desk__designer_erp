import { useMemo, useState } from 'react'
import { Expense } from '../../../types/database'
import { Button } from '../../ui/button'
import { StatusBadge } from '../../shared/StatusBadge'
import { formatCurrency, formatDate } from '../../../lib/utils/formatters'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'

interface ExpenseListProps {
  expenses: Expense[]
  onEdit: (expense: Expense) => void
  onDelete: (id: string) => void
  onCreate: () => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  canApprove: boolean
  title?: string
  createLabel?: string
}

const categories = ['advertising', 'content', 'events', 'travel', 'software', 'personnel', 'other']

export function ExpenseList({ expenses, onEdit, onDelete, onCreate, onApprove, onReject, canApprove, title = 'Expenses', createLabel = 'Submit Expense' }: ExpenseListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const statusOk = statusFilter === 'all' || e.approval_status === statusFilter
      const catOk = categoryFilter === 'all' || e.category === categoryFilter
      return statusOk && catOk
    })
  }, [expenses, statusFilter, categoryFilter])

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <Button onClick={onCreate}>{createLabel}</Button>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No expenses yet</p>
          <Button onClick={onCreate}>{createLabel}</Button>
        </div>
      ) : (
        <>
          <div className="flex gap-3 text-gray-800">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value ?? 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border bg-white shadow-sm overflow-hidden text-gray-800">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{formatDate(expense.expense_date, 'PP')}</TableCell>
                    <TableCell className="capitalize">{expense.category}</TableCell>
                    <TableCell className="max-w-xs truncate">{expense.description || '—'}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(expense.amount)}</TableCell>
                    <TableCell>
                      <StatusBadge status={expense.approval_status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        {canApprove && expense.approval_status === 'pending' && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => onApprove(expense.id)}>
                              Approve
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => onReject(expense.id)}>
                              Reject
                            </Button>
                          </>
                        )}
                        <Button variant="outline" size="sm" onClick={() => onEdit(expense)}>
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onDelete(expense.id)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
