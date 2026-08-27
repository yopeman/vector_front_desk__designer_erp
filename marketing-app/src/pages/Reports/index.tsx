import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase/client'
// @ts-ignore - jsPDF types may not be available
import jsPDF from 'jspdf'

interface MenuItem {
  name: string
  icon: string
}

interface MenuCategory {
  name: string
  submenu: MenuItem[]
}

interface Column {
  key: string
  label: string
}

interface DataRow {
  [key: string]: any
  _source?: string
}

const menuItems: MenuCategory[] = [
  {
    name: 'Campaigns',
    submenu: [
      { name: 'Campaigns', icon: 'fa-bullhorn' },
      { name: 'Campaign Targets', icon: 'fa-crosshairs' },
      { name: 'Activities', icon: 'fa-tasks' },
    ]
  },
  {
    name: 'Sales',
    submenu: [
      { name: 'Proposals', icon: 'fa-file-signature' },
      { name: 'Proformas', icon: 'fa-file-invoice' },
      { name: 'Tenders', icon: 'fa-file-contract' },
    ]
  },
  {
    name: 'Products',
    submenu: [
      { name: 'Products/Services', icon: 'fa-box' },
    ]
  },
  {
    name: 'Financial',
    submenu: [
      { name: 'Expenses', icon: 'fa-receipt' },
    ]
  },
  {
    name: 'Market Research',
    submenu: [
      { name: 'Market Insights', icon: 'fa-lightbulb' },
    ]
  },
]

export default function ReportPage() {
  const [selectedSubmenus, setSelectedSubmenus] = useState<string[]>([])
  const [fromDate, setFromDate] = useState(() => {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${now.getFullYear()}-${month}-${day}`
  })
  const [toDate, setToDate] = useState(() => {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${now.getFullYear()}-${month}-${day}`
  })
  const [data, setData] = useState<DataRow[]>([])
  const [loading, setLoading] = useState(false)
  const [tableColumnVisibility, setTableColumnVisibility] = useState<Record<string, Record<string, boolean>>>({})
  const [tableSearchQueries, setTableSearchQueries] = useState<Record<string, string>>({})
  const [tableCurrentPages, setTableCurrentPages] = useState<Record<string, number>>({})
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showReportDropdown, setShowReportDropdown] = useState(false)

  useEffect(() => {
    fetchData()
  }, [selectedSubmenus, fromDate, toDate])

  useEffect(() => {
    Object.keys(tableSearchQueries).forEach(submenu => {
      if (tableSearchQueries[submenu] !== undefined) {
        setCurrentPage(submenu, 1)
      }
    })
  }, [tableSearchQueries])

  const fetchData = async () => {
    setLoading(true)
    try {
      let allData: DataRow[] = []

      for (const submenu of selectedSubmenus) {
        const tableName = getTableName(submenu)
        const selectFields = getSelectFields(submenu)
        const dateField = getDateField(submenu)

        if (!tableName) continue

        let query = supabase
          .from(tableName)
          .select(selectFields)
          .order(dateField, { ascending: false })

        // Apply specific filters based on submenu
        if (fromDate && dateField) {
          query = query.gte(dateField, fromDate)
        }
        if (toDate && dateField) {
          query = query.lte(dateField, toDate)
        }

        const { data: result, error } = await query

        if (error) throw error

        const dataWithSource = (result || []).map((item: any) => ({
          ...item,
          _source: submenu
        }))

        allData = [...allData, ...dataWithSource]

        const columns = getColumns(submenu)
        if (!tableColumnVisibility[submenu]) {
          tableColumnVisibility[submenu] = {}
          columns.forEach(col => {
            tableColumnVisibility[submenu][col.key] = true
          })
        }
      }

      setData(allData)
    } catch (error) {
      console.error('Error fetching data:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const getTableName = (submenu: string): string => {
    const tableMap: Record<string, string> = {
      'Campaigns': 'mrkt_campaigns',
      'Campaign Targets': 'mrkt_campaign_targets',
      'Activities': 'mrkt_activities',
      'Proposals': 'mrkt_proposals',
      'Proformas': 'mrkt_proformas',
      'Tenders': 'mrkt_tenders',
      'Products/Services': 'mrkt_products_services',
      'Expenses': 'mrkt_expenses',
      'Market Insights': 'mrkt_market_insights',
      'Notes': 'mrkt_notes',
      'Conversations': 'mrkt_conversations',
      'Messages': 'mrkt_messages',
    }
    return tableMap[submenu] || ''
  }

  const getSelectFields = (submenu: string): string => {
    const fieldMap: Record<string, string> = {
      'Campaigns': '*',
      'Campaign Targets': '*',
      'Activities': '*',
      'Proposals': '*',
      'Proformas': '*',
      'Tenders': '*',
      'Products/Services': '*',
      'Expenses': '*',
      'Market Insights': '*',
      'Notes': '*',
      'Conversations': '*',
      'Messages': '*',
    }
    return fieldMap[submenu] || '*'
  }

  const getDateField = (submenu: string): string => {
    const dateMap: Record<string, string> = {
      'Campaigns': 'start_date',
      'Campaign Targets': 'target_date',
      'Activities': 'scheduled_start',
      'Proposals': 'submitted_at',
      'Proformas': 'requested_at',
      'Tenders': 'deadline',
      'Products/Services': 'created_at',
      'Expenses': 'expense_date',
      'Market Insights': 'date_identified',
      'Notes': 'created_at',
      'Conversations': 'created_at',
      'Messages': 'created_at',
    }
    return dateMap[submenu] || 'created_at'
  }

  const getColumns = (submenu: string): Column[] => {
    const columnMap: Record<string, Column[]> = {
      'Campaigns': [
        { key: 'name', label: 'Name' },
        { key: 'status', label: 'Status' },
        { key: 'start_date', label: 'Start Date' },
        { key: 'end_date', label: 'End Date' },
        { key: 'budget_estimated', label: 'Budget' },
      ],
      'Campaign Targets': [
        { key: 'metric', label: 'Metric' },
        { key: 'target_value', label: 'Target' },
        { key: 'actual_value', label: 'Actual' },
        { key: 'target_date', label: 'Target Date' },
      ],
      'Activities': [
        { key: 'title', label: 'Title' },
        { key: 'type', label: 'Type' },
        { key: 'status', label: 'Status' },
        { key: 'scheduled_start', label: 'Scheduled Start' },
        { key: 'assigned_to', label: 'Assigned To' },
      ],
      'Proposals': [
        { key: 'client_name', label: 'Client' },
        { key: 'amount', label: 'Amount' },
        { key: 'status', label: 'Status' },
        { key: 'submitted_at', label: 'Submitted Date' },
      ],
      'Proformas': [
        { key: 'client_name', label: 'Client' },
        { key: 'amount', label: 'Amount' },
        { key: 'status', label: 'Status' },
        { key: 'requested_at', label: 'Requested Date' },
      ],
      'Tenders': [
        { key: 'title', label: 'Title' },
        { key: 'client_name', label: 'Client' },
        { key: 'amount', label: 'Amount' },
        { key: 'status', label: 'Status' },
        { key: 'deadline', label: 'Deadline' },
      ],
      'Products/Services': [
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
        { key: 'category', label: 'Category' },
        { key: 'sku', label: 'SKU' },
        { key: 'unit_price', label: 'Unit Price' },
      ],
      'Expenses': [
        { key: 'category', label: 'Category' },
        { key: 'description', label: 'Description' },
        { key: 'amount', label: 'Amount' },
        { key: 'expense_date', label: 'Expense Date' },
        { key: 'approval_status', label: 'Approval Status' },
      ],
      'Market Insights': [
        { key: 'type', label: 'Type' },
        { key: 'title', label: 'Title' },
        { key: 'source', label: 'Source' },
        { key: 'date_identified', label: 'Date Identified' },
        { key: 'relevance_score', label: 'Relevance Score' },
      ],
      'Notes': [
        { key: 'title', label: 'Title' },
        { key: 'color', label: 'Color' },
        { key: 'is_pinned', label: 'Pinned' },
        { key: 'created_at', label: 'Created Date' },
      ],
      'Conversations': [
        { key: 'name', label: 'Name' },
        { key: 'is_group_chat', label: 'Group Chat' },
        { key: 'created_by', label: 'Created By' },
      ],
      'Messages': [
        { key: 'conversation_id', label: 'Conversation' },
        { key: 'sender_id', label: 'Sender' },
        { key: 'content', label: 'Content' },
        { key: 'is_read', label: 'Read' },
        { key: 'created_at', label: 'Created Date' },
      ],
    }
    return columnMap[submenu] || []
  }

  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj)
  }

  const toggleTableColumn = (submenu: string, columnKey: string) => {
    setTableColumnVisibility(prev => ({
      ...prev,
      [submenu]: {
        ...(prev[submenu] || {}),
        [columnKey]: !prev[submenu]?.[columnKey]
      }
    }))
  }

  const setCurrentPage = (submenu: string, page: number) => {
    setTableCurrentPages(prev => ({
      ...prev,
      [submenu]: page
    }))
  }

  const getTotalPages = (dataLength: number): number => {
    return Math.ceil(dataLength / itemsPerPage)
  }

  const getPaginatedData = (data: DataRow[], currentPage: number): DataRow[] => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const toggleSubmenu = (submenu: string) => {
    setSelectedSubmenus(prev =>
      prev.includes(submenu)
        ? prev.filter(s => s !== submenu)
        : [...prev, submenu]
    )
  }

  const handleExportPDF = () => {
    try {
      // @ts-ignore
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const leftMargin = 15
      const rightMargin = pageWidth / 2 + 10
      let y = 20

      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('Marketing Report', pageWidth / 2, y, { align: 'center' })
      y += 10

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`From: ${fromDate}  To: ${toDate}`, pageWidth / 2, y, { align: 'center' })
      y += 10

      selectedSubmenus.forEach((submenu) => {
        const submenuData = data.filter(row => row._source === submenu)
        const columns = getColumns(submenu)

        if (submenuData.length === 0) return

        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text(`${submenu} (${submenuData.length})`, leftMargin, y)
        y += 8

        const midPoint = Math.ceil(submenuData.length / 2)
        const leftData = submenuData.slice(0, midPoint)
        const rightData = submenuData.slice(midPoint)

        let leftY = y
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('Section 1', leftMargin, leftY)
        leftY += 6

        leftData.forEach((row, index) => {
          if (leftY > pageHeight - 20) {
            doc.addPage()
            leftY = 20
          }

          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.text(`Record ${index + 1}:`, leftMargin, leftY)
          leftY += 5

          columns.forEach(col => {
            if (leftY > pageHeight - 15) {
              doc.addPage()
              leftY = 20
            }
            let value = getNestedValue(row, col.key)
            if (value && typeof value === 'object') {
              value = value.name || value.order_no || value.invoice_no || ''
            }
            doc.setFont('helvetica', 'normal')
            doc.text(`${col.label}:`, leftMargin, leftY)
            doc.text(`${value || '-'}`, leftMargin + 35, leftY)
            leftY += 4
          })
          leftY += 3
        })

        let rightY = y
        if (leftY > pageHeight / 2) {
          doc.addPage()
          rightY = 20
        }

        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('Section 2', rightMargin, rightY)
        rightY += 6

        rightData.forEach((row, index) => {
          if (rightY > pageHeight - 20) {
            doc.addPage()
            rightY = 20
          }

          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.text(`Record ${midPoint + index + 1}:`, rightMargin, rightY)
          rightY += 5

          columns.forEach(col => {
            if (rightY > pageHeight - 15) {
              doc.addPage()
              rightY = 20
            }
            let value = getNestedValue(row, col.key)
            if (value && typeof value === 'object') {
              value = value.name || value.order_no || value.invoice_no || ''
            }
            doc.setFont('helvetica', 'normal')
            doc.text(`${col.label}:`, rightMargin, rightY)
            doc.text(`${value || '-'}`, rightMargin + 35, rightY)
            rightY += 4
          })
          rightY += 3
        })

        doc.addPage()
        y = 20
      })

      doc.save(`Marketing_Report_${selectedSubmenus.join('_').replace(/\s+/g, '_')}_${fromDate}_to_${toDate}.pdf`)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Error exporting PDF: ' + (error as Error).message)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Marketing Reports</h2>
        <button
          onClick={handleExportPDF}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-colors border-none cursor-pointer"
          disabled={data.length === 0}
        >
          <i className="fa-solid fa-file-pdf"></i> Export PDF
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6">
        <div className="flex gap-4 items-center flex-wrap">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">From Date</label>
            <input
              type="date"
              value={data.length === 0 ? fromDate : fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-xs text-black bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-xs text-black bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Items Per Page</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setTableCurrentPages({})
              }}
              className="border border-slate-300 rounded-lg px-3 py-2 text-xs text-black focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6">
        <label className="block text-xs font-medium text-slate-700 mb-1">Select Reports</label>
        <div className="relative">
          <button
            onClick={() => setShowReportDropdown(!showReportDropdown)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-black focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-left flex justify-between items-center"
          >
            <span>
              {selectedSubmenus.length === 0 
                ? 'Select reports...' 
                : `${selectedSubmenus.length} report${selectedSubmenus.length > 1 ? 's' : ''} selected`}
            </span>
            <i className={`fa-solid fa-chevron-${showReportDropdown ? 'up' : 'down'}`}></i>
          </button>
          
          {showReportDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-10 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {menuItems.map(menu => (
                  <div key={menu.name}>
                    <div className="text-sm font-semibold text-black mb-2">{menu.name}</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {menu.submenu.map(sub => (
                        <label key={sub.name} className="flex items-center gap-2 cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={selectedSubmenus.includes(sub.name)}
                              onChange={() => toggleSubmenu(sub.name)}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 border border-slate-300 rounded flex items-center justify-center ${selectedSubmenus.includes(sub.name) ? 'bg-white' : 'bg-white'}`}>
                              {selectedSubmenus.includes(sub.name) && (
                                <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-black">{sub.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="text-center py-8 text-slate-500">Loading data...</div>
      )}

      {selectedSubmenus.map(submenu => {
        const submenuData = data.filter(row => row._source === submenu)
        const columns = getColumns(submenu)
        const visibleColumnsForSubmenu = columns.filter(col => 
          tableColumnVisibility[submenu]?.[col.key] !== false
        )

        const tableSearchQuery = tableSearchQueries[submenu] || ''
        const filteredSubmenuData = submenuData.filter(row => {
          if (!tableSearchQuery) return true
          return columns.some(col => {
            let value = getNestedValue(row, col.key)
            if (value && typeof value === 'object') {
              value = value.name || value.order_no || value.invoice_no || ''
            }
            return value && String(value).toLowerCase().includes(tableSearchQuery.toLowerCase())
          })
        })

        const currentPage = tableCurrentPages[submenu] || 1
        const totalPages = getTotalPages(filteredSubmenuData.length)
        const paginatedData = getPaginatedData(filteredSubmenuData, currentPage)

        return (
          <div key={submenu} className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-800">{submenu} ({filteredSubmenuData.length})</h3>
              </div>
              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder={`Search ${submenu}...`}
                    value={tableSearchQueries[submenu] || ''}
                    onChange={(e) => setTableSearchQueries(prev => ({
                      ...prev,
                      [submenu]: e.target.value
                    }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-black bg-white placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {columns.map(col => (
                    <button
                      key={col.key}
                      onClick={() => toggleTableColumn(submenu, col.key)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs border cursor-pointer transition-colors ${
                        tableColumnVisibility[submenu]?.[col.key] !== false
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <i className={`fa-solid ${tableColumnVisibility[submenu]?.[col.key] !== false ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                      <span>{col.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <table className="w-full text-black">
              <thead className="bg-slate-50 border-b border-slate-200 text-black">
                <tr>
                  <th className="p-4 text-left text-xs font-semibold text-black">#</th>
                  {visibleColumnsForSubmenu.map(col => (
                    <th key={col.key} className="p-4 text-left text-xs font-semibold text-black">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-black">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnsForSubmenu.length + 1} className="p-8 text-center text-black">
                      No data found
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, index) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="p-4 text-center text-black">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      {visibleColumnsForSubmenu.map(col => (
                        <td key={col.key} className="p-4 text-black">
                          {renderCellValue(row, col.key)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-black">
                <div className="text-xs text-slate-600">
                  Page {currentPage} of {totalPages} ({filteredSubmenuData.length} total)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(submenu, currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded border border-slate-300 text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(submenu, page)}
                        className={`px-3 py-1 rounded border text-xs cursor-pointer ${
                          currentPage === page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(submenu, currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded border border-slate-300 text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function renderCellValue(row: DataRow, key: string): string {
  const value = key.split('.').reduce((acc: any, part: string) => acc && acc[part], row)
  if (value === null || value === undefined) return '-'
  if (typeof value === 'object') {
    return value.name || value.order_no || value.invoice_no || JSON.stringify(value)
  }
  if (key.includes('amount') || key.includes('price') || key.includes('budget') || key.includes('total')) {
    return typeof value === 'number' ? `$${value.toFixed(2)}` : String(value)
  }
  if (key.includes('date') && value) {
    return new Date(value).toLocaleDateString()
  }
  if (key === 'is_pinned') {
    return value ? 'Yes' : 'No'
  }
  if (key === 'is_group_chat') {
    return value ? 'Yes' : 'No'
  }
  if (key === 'is_read') {
    return value ? 'Yes' : 'No'
  }
  return String(value)
}
