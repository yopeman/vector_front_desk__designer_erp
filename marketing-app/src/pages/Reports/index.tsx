import { useState, useEffect, useRef, type ChangeEvent, type DragEvent, type ClipboardEvent } from 'react'
import { supabase } from '../../lib/supabase/client'
// @ts-ignore - jsPDF types may not be available
import jsPDF from 'jspdf'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

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

interface ReportFile {
  id: number
  name: string
  path: string
  mime_type?: string
  file_size?: number
}

interface SavedReport {
  id: number
  user_id?: string
  department?: string
  from_date?: string
  to_date?: string
  note?: string
  attached_file_ids?: number[]
  created_at?: string
  files: ReportFile[]
  creatorName?: string | null
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
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [data, setData] = useState<DataRow[]>([])
  const [loading, setLoading] = useState(false)
  const [tableColumnVisibility, setTableColumnVisibility] = useState<Record<string, Record<string, boolean>>>({})
  const [tableSearchQueries, setTableSearchQueries] = useState<Record<string, string>>({})
  const [tableCurrentPages, setTableCurrentPages] = useState<Record<string, number>>({})
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showReportDropdown, setShowReportDropdown] = useState(false)

  // Save Report
  const [activeReportTab, setActiveReportTab] = useState<'generate' | 'saved'>('generate')
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportMarkdown, setReportMarkdown] = useState('')
  const [reportFromDate, setReportFromDate] = useState('')
  const [reportToDate, setReportToDate] = useState('')
  const [reportDept] = useState('marketing')
  const [reportUserId, setReportUserId] = useState<string | null>(null)
  const [reportFiles, setReportFiles] = useState<File[]>([])
  const [reportDragActive, setReportDragActive] = useState(false)
  const [reportSaving, setReportSaving] = useState(false)
  const [savedReports, setSavedReports] = useState<SavedReport[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [viewReport, setViewReport] = useState<SavedReport | null>(null)
  const [downloadingFileId, setDownloadingFileId] = useState<number | null>(null)
  const reportFileInputRef = useRef<HTMLInputElement>(null)

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

  const mdComponents = {
    a: ({ children, ...props }: any) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{children}</a>,
    table: ({ children, ...props }: any) => <div className="overflow-x-auto my-2"><table className="w-full border-collapse text-xs" {...props}>{children}</table></div>,
    th: ({ children, ...props }: any) => <th className="border border-slate-300 bg-slate-100 px-2 py-1 text-left font-semibold" {...props}>{children}</th>,
    td: ({ children, ...props }: any) => <td className="border border-slate-200 px-2 py-1 align-top" {...props}>{children}</td>,
    code: ({ inline, children, ...props }: any) => inline
      ? <code className="bg-slate-100 text-slate-800 rounded px-1 py-0.5 text-xs font-mono" {...props}>{children}</code>
      : <code {...props}>{children}</code>,
    pre: ({ children, ...props }: any) => <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 text-xs font-mono overflow-x-auto my-2" {...props}>{children}</pre>,
    ul: ({ children, ...props }: any) => <ul className="list-disc pl-5 my-1.5" {...props}>{children}</ul>,
    ol: ({ children, ...props }: any) => <ol className="list-decimal pl-5 my-1.5" {...props}>{children}</ol>,
    blockquote: ({ children, ...props }: any) => <blockquote className="border-l-4 border-blue-500 pl-3 my-2 text-slate-600 italic" {...props}>{children}</blockquote>,
    h1: ({ children, ...props }: any) => <h1 className="text-base font-bold my-2" {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 className="text-sm font-bold my-2" {...props}>{children}</h2>,
    h3: ({ children, ...props }: any) => <h3 className="text-sm font-semibold my-1.5" {...props}>{children}</h3>,
  }

  const openSaveReportModal = async () => {
    setReportFromDate(fromDate || '')
    setReportToDate(toDate || '')
    setReportMarkdown('')
    setReportFiles([])
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setReportUserId(user?.id || null)
    } catch (error) {
      console.error('Error getting current user:', error)
      setReportUserId(null)
    }
    setShowReportModal(true)
  }

  const addReportFiles = (list: FileList | null) => {
    if (!list) return
    const incoming = Array.from(list)
    setReportFiles(prev => {
      const existing = new Set(prev.map(f => `${f.name}-${f.size}-${f.lastModified}`))
      const unique = incoming.filter(f => !existing.has(`${f.name}-${f.size}-${f.lastModified}`))
      return [...prev, ...unique]
    })
  }

  const handleReportFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    addReportFiles(e.target.files)
    e.target.value = ''
  }

  const handleReportDrop = (e: DragEvent) => {
    e.preventDefault()
    setReportDragActive(false)
    addReportFiles(e.dataTransfer.files)
  }

  const handleReportDragOver = (e: DragEvent) => {
    e.preventDefault()
    setReportDragActive(true)
  }

  const handleReportDragLeave = (e: DragEvent) => {
    e.preventDefault()
    setReportDragActive(false)
  }

  const handleReportPaste = (e: ClipboardEvent) => {
    const files = e.clipboardData?.files
    if (files && files.length > 0) {
      e.preventDefault()
      addReportFiles(files)
    }
  }

  const uploadReportFile = async (file: File) => {
    const fileName = `${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file)

    if (error) throw error

    const { data: fileRecord, error: insertError } = await supabase
      .from('files')
      .insert({
        name: file.name,
        path: data.path,
        mime_type: file.type,
        file_size: file.size,
        uploaded_by: reportUserId
      })
      .select()
      .single()

    if (insertError) throw insertError

    return fileRecord.id
  }

  const handleSaveReport = async () => {
    if (!reportUserId) {
      alert('Could not determine current user. Please sign in and try again.')
      return
    }
    if (!reportFromDate || !reportToDate) {
      alert('From date and To date are required.')
      return
    }
    if (!reportMarkdown.trim()) {
      alert('Please enter the report content.')
      return
    }

    setReportSaving(true)
    try {
      const fileIds: number[] = []
      for (const file of reportFiles) {
        try {
          const fileId = await uploadReportFile(file)
          fileIds.push(fileId)
        } catch (error) {
          console.error('Error uploading file:', file.name, error)
          alert(`Failed to upload file: ${file.name}`)
        }
      }

      const { error } = await supabase
        .from('report_captions')
        .insert({
          user_id: reportUserId,
          department: reportDept,
          from_date: reportFromDate,
          to_date: reportToDate,
          note: reportMarkdown,
          attached_file_ids: fileIds
        })

      if (error) throw error

      alert('Report saved successfully.')
      setShowReportModal(false)
      fetchSavedReports()
    } catch (error) {
      console.error('Error saving report:', error)
      alert('Error saving report: ' + (error as Error).message)
    } finally {
      setReportSaving(false)
    }
  }

  const fetchSavedReports = async () => {
    setReportsLoading(true)
    try {
      const { data, error } = await supabase
        .from('report_captions')
        .select('*')
        .eq('department', 'marketing')
        .order('created_at', { ascending: false })

      if (error) throw error

      const reportIds = (data || []).flatMap((r: any) => r.attached_file_ids || [])
      let fileMap: Record<number, ReportFile> = {}
      let userMap: Record<string, string> = {}

      if (reportIds.length > 0) {
        const { data: files } = await supabase
          .from('files')
          .select('id, name, path, mime_type, file_size')
          .in('id', reportIds)
        fileMap = Object.fromEntries((files || []).map((f: any) => [f.id, f]))
      }

      const creatorIds = (data || []).map((r: any) => r.user_id).filter(Boolean)
      if (creatorIds.length > 0) {
        const { data: creators } = await supabase
          .from('users')
          .select('id, username')
          .in('id', creatorIds)
        userMap = Object.fromEntries((creators || []).map((u: any) => [u.id, u.username]))
      }

      setSavedReports((data || []).map((r: any) => ({
        ...r,
        files: (r.attached_file_ids || []).map((id: number) => fileMap[id]).filter(Boolean),
        creatorName: userMap[r.user_id] || null
      })))
    } catch (error) {
      console.error('Error fetching saved reports:', error)
      setSavedReports([])
    } finally {
      setReportsLoading(false)
    }
  }

  useEffect(() => {
    fetchSavedReports()
  }, [])

  const switchReportTab = (tab: 'generate' | 'saved') => {
    setActiveReportTab(tab)
    if (tab === 'saved') {
      fetchSavedReports()
    }
  }

  const openReportInGenerate = (report: SavedReport) => {
    setFromDate(report.from_date || '')
    setToDate(report.to_date || '')
    setSelectedSubmenus(menuItems.flatMap(menu => menu.submenu.map(sub => sub.name)))
    setViewReport(null)
    setActiveReportTab('generate')
  }

  const downloadReportFile = async (file: ReportFile) => {
    setDownloadingFileId(file.id)
    try {
      const { data } = await supabase.storage
        .from('documents')
        .createSignedUrl(file.path, 60)
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank')
      }
    } catch (error) {
      console.error('Error getting file download link:', error)
      alert('Failed to get download link for: ' + file.name)
    } finally {
      setDownloadingFileId(null)
    }
  }

  const formatReportDate = (value?: string) => {
    if (!value) return ''
    const [y, m, d] = String(value).split('-')
    if (y && m && d) {
      const date = new Date(Number(y), Number(m) - 1, Number(d))
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    }
    return String(value)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Marketing Reports</h2>
        {activeReportTab === 'generate' && (
          <div className="flex items-center gap-2">
            <button
              onClick={openSaveReportModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-colors border-none cursor-pointer"
            >
              <i className="fa-solid fa-plus"></i> Save Report
            </button>
            <button
              onClick={handleExportPDF}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-colors border-none cursor-pointer"
              disabled={data.length === 0}
            >
              <i className="fa-solid fa-file-pdf"></i> Export PDF
            </button>
          </div>
        )}
      </div>

      {/* Report Tabs */}
      <div className="flex gap-2 border-b border-slate-200 mb-6">
        <button
          onClick={() => switchReportTab('generate')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-xs font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
            activeReportTab === 'generate'
              ? 'border-blue-600 text-blue-700 bg-blue-50'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <i className="fa-solid fa-file-pen"></i> Generate Report
        </button>
        <button
          onClick={() => switchReportTab('saved')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-xs font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
            activeReportTab === 'saved'
              ? 'border-blue-600 text-blue-700 bg-blue-50'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <i className="fa-solid fa-folder-open"></i> Saved Reports
          {savedReports.length > 0 && (
            <span className="ml-0.5 grid min-w-4 h-4 px-1 place-items-center rounded-full bg-blue-600 text-white text-[10px] font-semibold leading-none">
              {savedReports.length}
            </span>
          )}
        </button>
      </div>

      {activeReportTab === 'generate' ? (
        <>

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
        </>
      ) : (
        <div>
          {reportsLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
              <i className="fa-solid fa-spinner fa-spin text-2xl"></i>
              <span className="text-sm">Loading saved reports…</span>
            </div>
          ) : savedReports.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 border-dashed py-16 text-center">
              <i className="fa-solid fa-folder-open text-3xl text-slate-300 mb-3"></i>
              <p className="text-sm text-slate-500">No saved reports yet.</p>
              <p className="text-xs text-slate-400 mt-1">Go to the <span className="font-medium text-slate-600">Generate Report</span> tab and save one.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedReports.map(report => (
                <div key={report.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex justify-between items-start gap-4 p-4 border-b border-slate-100 bg-slate-50">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-semibold">
                          <i className="fa-solid fa-calendar-days"></i>
                          {formatReportDate(report.from_date)} → {formatReportDate(report.to_date)}
                        </span>
                        <span className="text-xs text-slate-500">
                          {report.creatorName ? `by ${report.creatorName}` : `by #${(report.user_id || '').slice(0, 8)}`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5">
                        Saved {new Date(report.created_at!).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        {report.files.length > 0 && (
                          <span className="ml-2">
                            <i className="fa-solid fa-paperclip mr-1"></i>{report.files.length} attachment{report.files.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openReportInGenerate(report)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 text-green-600 hover:bg-green-50 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                        title="Apply this report's date range, select all modules, and open in the Generate Report tab"
                      >
                        <i className="fa-solid fa-file-pen"></i> Open in Generate
                      </button>
                      <button
                        onClick={() => setViewReport(report)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                      >
                        <i className="fa-solid fa-eye"></i> View
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    {report.note && report.note.trim() ? (
                      <div className="max-h-44 overflow-hidden relative">
                        <MDEditor.Markdown source={report.note} />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent"></div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">No content.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save Report Modal */}
      {showReportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !reportSaving && setShowReportModal(false)}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Save Report</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Marketing Report · Department: <span className="text-slate-700 font-medium">marketing</span> · User: {reportUserId ? `#${reportUserId.slice(0, 8)}` : '(resolving…)'}
                </p>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                disabled={reportSaving}
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors border-none cursor-pointer disabled:opacity-50"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">From Date</label>
                  <input
                    type="date"
                    value={reportFromDate}
                    onChange={(e) => setReportFromDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-black bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">To Date</label>
                  <input
                    type="date"
                    value={reportToDate}
                    onChange={(e) => setReportToDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-black bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department</label>
                  <input
                    type="text"
                    value={reportDept}
                    disabled
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-slate-100 text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Report Content</label>
                <MDEditor
                  value={reportMarkdown}
                  onChange={(value) => setReportMarkdown(value || '')}
                  onPaste={handleReportPaste}
                  preview="live"
                  height={300}
                  previewOptions={{ components: mdComponents }}
                  textareaProps={{
                    placeholder: '# Report title\n\nWrite your report in Markdown…\n\n- bullet points\n- **bold** and *italic*'
                  }}
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  Markdown supported with live preview. You can also drag &amp; drop, select, or paste (Ctrl+V) files into the editor.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Attached Files</label>
                <div
                  onDragEnter={handleReportDragOver}
                  onDragOver={handleReportDragOver}
                  onDragLeave={handleReportDragLeave}
                  onDrop={handleReportDrop}
                  onClick={() => reportFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${reportDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
                >
                  <input
                    ref={reportFileInputRef}
                    type="file"
                    multiple
                    onChange={handleReportFileChange}
                    className="hidden"
                  />
                  <div className="text-sm text-slate-600 mb-1">
                    <i className="fa-solid fa-cloud-arrow-up text-blue-500 mr-1.5"></i>
                    Drag &amp; drop files here, click to select, or paste (Ctrl+V)
                  </div>
                  <div className="text-xs text-slate-400">Multiple files supported</div>
                </div>

                {reportFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {reportFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <i className="fa-solid fa-file text-blue-500 shrink-0"></i>
                          <span className="text-sm text-slate-700 truncate">{file.name}</span>
                          <span className="text-xs text-slate-500 shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReportFiles(prev => prev.filter((_, i) => i !== index))}
                          className="text-slate-400 hover:text-red-500 transition-colors border-none cursor-pointer"
                          title="Remove file"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                disabled={reportSaving}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReport}
                disabled={reportSaving}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-colors border-none cursor-pointer disabled:opacity-60"
              >
                {reportSaving ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Saving…
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk"></i> Save Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Report Modal */}
      {viewReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setViewReport(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Saved Report</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="inline-flex items-center gap-1 rounded bg-blue-100 text-blue-700 px-1.5 py-0.5 text-[11px] font-semibold">
                    <i className="fa-solid fa-calendar-days"></i>
                    {formatReportDate(viewReport.from_date)} → {formatReportDate(viewReport.to_date)}
                  </span>
                  <span className="ml-2">
                    Department: <span className="text-slate-700 font-medium">marketing</span>
                  </span>
                  <span className="ml-2">
                    Saved on {new Date(viewReport.created_at!).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    {viewReport.creatorName ? ` · by ${viewReport.creatorName}` : ''}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setViewReport(null)}
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors border-none cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Report Content</label>
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 text-sm">
                  {viewReport.note && viewReport.note.trim() ? (
                    <MDEditor.Markdown source={viewReport.note} />
                  ) : (
                    <p className="text-slate-400 text-sm">No content.</p>
                  )}
                </div>
              </div>

              {viewReport.files.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Attached Files</label>
                  <div className="space-y-2">
                    {viewReport.files.map(file => (
                      <div key={file.id} className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <i className="fa-solid fa-file text-blue-500 shrink-0"></i>
                          <span className="text-sm text-slate-700 truncate">{file.name}</span>
                          {typeof file.file_size === 'number' && (
                            <span className="text-xs text-slate-500 shrink-0">({(file.file_size / 1024).toFixed(1)} KB)</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => downloadReportFile(file)}
                          disabled={downloadingFileId === file.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-100 px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer disabled:opacity-60"
                        >
                          {downloadingFileId === file.id ? (
                            <i className="fa-solid fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fa-solid fa-download"></i>
                          )}
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end">
              <button
                onClick={() => setViewReport(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
