import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useCreativeAuth } from '../contexts/CreativeAuthContext'
import jsPDF from 'jspdf'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

const REPORT_MODULES = [
  { id: 'prototype', label: 'Prototype Request', table: 'crt_prototype_requests' },
  { id: 'idea', label: 'Idea', table: 'crt_idea_hub' },
  { id: 'design', label: 'Design Log', table: 'crt_design_bom' },
]

const mdComponents = {
  a: ({ children, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{children}</a>,
  table: ({ children, ...props }) => <div className="overflow-x-auto my-2"><table className="w-full border-collapse text-xs" {...props}>{children}</table></div>,
  th: ({ children, ...props }) => <th className="border border-slate-300 bg-slate-100 px-2 py-1 text-left font-semibold" {...props}>{children}</th>,
  td: ({ children, ...props }) => <td className="border border-slate-200 px-2 py-1 align-top" {...props}>{children}</td>,
  code: ({ inline, children, ...props }) => inline
    ? <code className="bg-slate-100 text-slate-800 rounded px-1 py-0.5 text-xs font-mono" {...props}>{children}</code>
    : <code {...props}>{children}</code>,
  pre: ({ children, ...props }) => <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 text-xs font-mono overflow-x-auto my-2" {...props}>{children}</pre>,
  ul: ({ children, ...props }) => <ul className="list-disc pl-5 my-1.5" {...props}>{children}</ul>,
  ol: ({ children, ...props }) => <ol className="list-decimal pl-5 my-1.5" {...props}>{children}</ol>,
  blockquote: ({ children, ...props }) => <blockquote className="border-l-4 border-blue-500 pl-3 my-2 text-slate-600 italic" {...props}>{children}</blockquote>,
  h1: ({ children, ...props }) => <h1 className="text-base font-bold my-2" {...props}>{children}</h1>,
  h2: ({ children, ...props }) => <h2 className="text-sm font-bold my-2" {...props}>{children}</h2>,
  h3: ({ children, ...props }) => <h3 className="text-sm font-semibold my-1.5" {...props}>{children}</h3>,
}

const ReportTable = ({ module, data, loading, onSearch, onPaginationChange, onColumnVisibilityChange, initialColumnVisibility }) => {
  const [localSearch, setLocalSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filteredData, setFilteredData] = useState([])
  const [visibleColumns, setVisibleColumns] = useState({})
  const [showColumnSelector, setShowColumnSelector] = useState(false)

  const paginationOptions = [5, 10, 25, 50, 100]

  // Initialize visible columns when data changes or from parent
  useEffect(() => {
    if (data && data.length > 0) {
      const columns = Object.keys(data[0])
      
      // Use parent's visibility if available, otherwise initialize all as visible
      if (initialColumnVisibility && Object.keys(initialColumnVisibility).length > 0) {
        setVisibleColumns(initialColumnVisibility)
      } else {
        const initialVis = columns.reduce((acc, col) => {
          acc[col] = true
          return acc
        }, {})
        setVisibleColumns(initialVis)
        // Notify parent of initial visibility
        if (onColumnVisibilityChange) {
          onColumnVisibilityChange(module.id, initialVis)
        }
      }
    }
  }, [data, initialColumnVisibility, module.id, onColumnVisibilityChange])

  useEffect(() => {
    if (data) {
      if (localSearch) {
        const filtered = data.filter(row =>
          Object.values(row).some(value =>
            String(value).toLowerCase().includes(localSearch.toLowerCase())
          )
        )
        setFilteredData(filtered)
      } else {
        setFilteredData(data)
      }
      setCurrentPage(1)
    }
  }, [data, localSearch])

  const handleSearch = (value) => {
    setLocalSearch(value)
    if (onSearch) onSearch(module.id, value)
  }

  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setCurrentPage(1)
    if (onPaginationChange) onPaginationChange(module.id, size, 1)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    if (onPaginationChange) onPaginationChange(module.id, pageSize, page)
  }

  const getHeaders = () => {
    if (!filteredData || filteredData.length === 0) return []
    
    return Object.keys(filteredData[0])
      .filter(key => visibleColumns[key])
      .map(key => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
  }

  const toggleColumn = (columnKey) => {
    const newVisibility = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey]
    }
    setVisibleColumns(newVisibility)
    // Notify parent of visibility change
    if (onColumnVisibilityChange) {
      onColumnVisibilityChange(module.id, newVisibility)
    }
  }

  const getVisibleColumns = () => {
    if (!filteredData || filteredData.length === 0) return []
    return Object.keys(filteredData[0]).filter(key => visibleColumns[key])
  }

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      const lineHeight = 8
      let yPosition = margin

      // Header
      doc.setFontSize(20)
      doc.setTextColor(59, 130, 246)
      doc.setFont('helvetica', 'bold')
      doc.text(module.label.toUpperCase(), pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 15

      // Sub-header
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'normal')
      doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 10

      // Divider
      doc.setDrawColor(59, 130, 246)
      doc.setLineWidth(0.5)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10

      // Records count
      doc.setFontSize(10)
      doc.setTextColor(80, 80, 80)
      doc.text(`Total Records: ${filteredData.length}`, margin, yPosition)
      yPosition += 10

      // Format data as form (key-value pairs)
      const visibleCols = getVisibleColumns()
      
      paginatedData.forEach((row, rowIndex) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
          doc.addPage()
          yPosition = margin
        }

        // Record header
        doc.setFontSize(12)
        doc.setTextColor(59, 130, 246)
        doc.setFont('helvetica', 'bold')
        doc.text(`Record #${rowIndex + 1}`, margin, yPosition)
        yPosition += lineHeight

        // Form fields for this record
        doc.setFontSize(9)
        doc.setTextColor(60, 60, 60)
        doc.setFont('helvetica', 'normal')

        visibleCols.forEach(column => {
          if (yPosition > pageHeight - 20) {
            doc.addPage()
            yPosition = margin
          }

          const label = column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          const value = formatCellValue(row[column])

          // Label
          doc.setFont('helvetica', 'bold')
          doc.text(`${label}:`, margin, yPosition)
          
          // Value (with wrapping if needed)
          doc.setFont('helvetica', 'normal')
          const maxWidth = pageWidth - (margin * 2) - 40
          const splitValue = doc.splitTextToSize(value, maxWidth)
          doc.text(splitValue, margin + 40, yPosition)
          
          yPosition += lineHeight * (splitValue.length > 1 ? splitValue.length : 1)
        })

        yPosition += 5 // Spacing between records
      })

      // Footer
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.setFont('helvetica', 'normal')
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        )
      }

      doc.save(`${module.label.toLowerCase().replace(/\s+/g, '_')}_report_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF: ' + error.message)
    }
  }

  const isBase64 = (str) => {
    if (typeof str !== 'string') return false
    // Check if string looks like base64 (long string with only base64 characters)
    if (str.length > 100 && /^[A-Za-z0-9+/=]+$/.test(str)) {
      // Additional check: base64 strings often have padding
      return str.endsWith('=') || str.endsWith('==')
    }
    return false
  }

  const formatCellValue = (value) => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'object') return JSON.stringify(value)
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (typeof value === 'number' && value > 1000) return value.toLocaleString()
    if (value instanceof Date) return value.toLocaleDateString()
    if (typeof value === 'string') {
      // Check for base64 data
      if (isBase64(value)) {
        return '[File Data]'
      }
      // Check for data URLs
      if (value.startsWith('data:')) {
        return '[File Data]'
      }
      // Check for very long strings (likely file content)
      if (value.length > 500) {
        return value.substring(0, 50) + '...'
      }
    }
    return String(value)
  }

  const totalPages = Math.ceil(filteredData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = filteredData.slice(startIndex, endIndex)

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-6">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-lg">{module.label}</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Total: {filteredData.length} records</span>
            <button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition flex items-center gap-2"
            >
              <i className={`fa-solid ${showColumnSelector ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              Columns
            </button>
          </div>
        </div>
      </div>

      {/* Column Selector */}
      {showColumnSelector && (
        <div className="p-4 border-b border-slate-200 bg-slate-100">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {Object.keys(filteredData[0] || {}).map(column => (
              <button
                key={column}
                onClick={() => toggleColumn(column)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                  visibleColumns[column]
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-slate-200 text-slate-500 border border-slate-300'
                }`}
              >
                <i className={`fa-solid ${visibleColumns[column] ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                <span className="truncate">{column.replace(/_/g, ' ')}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder={`Search ${module.label}...`}
            value={localSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
          />
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-slate-500 mt-4 text-sm">Loading data...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <i className="fa-solid fa-inbox text-4xl mb-2 text-slate-300"></i>
            <p>No data available</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
                    {getHeaders().map((header, index) => (
                      <th key={index} className="px-4 py-3 text-left font-semibold border-r border-primary-500 last:border-r-0">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {paginatedData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-slate-50 transition">
                      {getVisibleColumns().map(column => (
                        <td key={column} className="px-4 py-2 text-slate-700 border-r border-slate-100 last:border-r-0 whitespace-nowrap">
                          {formatCellValue(row[column])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-3 py-1 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {paginationOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const ReportsTab = ({ isActive }) => {
  const [selectedModules, setSelectedModules] = useState([])
  const [moduleData, setModuleData] = useState({})
  const [loading, setLoading] = useState({})
  const [generalSearch, setGeneralSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [columnVisibility, setColumnVisibility] = useState({})

  // Save Report
  const [activeReportTab, setActiveReportTab] = useState('generate')
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportMarkdown, setReportMarkdown] = useState('')
  const [reportFromDate, setReportFromDate] = useState('')
  const [reportToDate, setReportToDate] = useState('')
  const [reportDept] = useState('creative')
  const [reportUserId, setReportUserId] = useState(null)
  const [reportFiles, setReportFiles] = useState([])
  const [reportDragActive, setReportDragActive] = useState(false)
  const [reportSaving, setReportSaving] = useState(false)
  const [savedReports, setSavedReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [viewReport, setViewReport] = useState(null)
  const [downloadingFileId, setDownloadingFileId] = useState(null)
  const reportFileInputRef = useRef(null)

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

  const addReportFiles = (list) => {
    if (!list) return
    const incoming = Array.from(list)
    setReportFiles(prev => {
      const existing = new Set(prev.map(f => `${f.name}-${f.size}-${f.lastModified}`))
      const unique = incoming.filter(f => !existing.has(`${f.name}-${f.size}-${f.lastModified}`))
      return [...prev, ...unique]
    })
  }

  const handleReportFileChange = (e) => {
    addReportFiles(e.target.files)
    e.target.value = ''
  }

  const handleReportDrop = (e) => {
    e.preventDefault()
    setReportDragActive(false)
    addReportFiles(e.dataTransfer.files)
  }

  const handleReportDragOver = (e) => {
    e.preventDefault()
    setReportDragActive(true)
  }

  const handleReportDragLeave = (e) => {
    e.preventDefault()
    setReportDragActive(false)
  }

  const handleReportPaste = (e) => {
    const files = e.clipboardData?.files
    if (files && files.length > 0) {
      e.preventDefault()
      addReportFiles(files)
    }
  }

  const uploadReportFile = async (file) => {
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
      const fileIds = []
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
      alert('Error saving report: ' + error.message)
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
        .eq('department', 'creative')
        .order('created_at', { ascending: false })

      if (error) throw error

      const reportIds = (data || []).flatMap(r => r.attached_file_ids || [])
      let fileMap = {}
      let userMap = {}

      if (reportIds.length > 0) {
        const { data: files } = await supabase
          .from('files')
          .select('id, name, path, mime_type, file_size')
          .in('id', reportIds)
        fileMap = Object.fromEntries((files || []).map(f => [f.id, f]))
      }

      const creatorIds = (data || []).map(r => r.user_id).filter(Boolean)
      if (creatorIds.length > 0) {
        const { data: creators } = await supabase
          .from('users')
          .select('id, username')
          .in('id', creatorIds)
        userMap = Object.fromEntries((creators || []).map(u => [u.id, u.username]))
      }

      setSavedReports((data || []).map(r => ({
        ...r,
        files: (r.attached_file_ids || []).map(id => fileMap[id]).filter(Boolean),
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

  const switchReportTab = (tab) => {
    setActiveReportTab(tab)
    if (tab === 'saved') {
      fetchSavedReports()
    }
  }

  const openReportInGenerate = (report) => {
    setFromDate(report.from_date || '')
    setToDate(report.to_date || '')
    setSelectedModules(REPORT_MODULES.map(m => m.id))
    const missing = REPORT_MODULES
      .map(m => m.id)
      .filter(id => !moduleData[id] && !loading[id])
    missing.forEach(id => fetchModuleData(id))
    setViewReport(null)
    setActiveReportTab('generate')
  }

  const downloadReportFile = async (file) => {
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

  const formatReportDate = (value) => {
    if (!value) return ''
    const [y, m, d] = String(value).split('-')
    if (y && m && d) {
      const date = new Date(y, m - 1, d)
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    }
    return String(value)
  }

  const handleColumnVisibilityChange = (moduleId, visibility) => {
    setColumnVisibility(prev => ({
      ...prev,
      [moduleId]: visibility
    }))
  }

  const handleModuleToggle = (moduleId) => {
    setSelectedModules(prev => {
      const newSelected = prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
      
      // Fetch data for newly selected module
      if (!prev.includes(moduleId) && newSelected.includes(moduleId)) {
        fetchModuleData(moduleId)
      }
      
      // Remove data for deselected module
      if (prev.includes(moduleId) && !newSelected.includes(moduleId)) {
        setModuleData(prev => {
          const newData = { ...prev }
          delete newData[moduleId]
          return newData
        })
      }
      
      return newSelected
    })
  }

  const fetchModuleData = async (moduleId) => {
    const module = REPORT_MODULES.find(m => m.id === moduleId)
    if (!module) return

    setLoading(prev => ({ ...prev, [moduleId]: true }))

    try {
      const { data, error } = await supabase
        .from(module.table)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (!error && data) {
        setModuleData(prev => ({
          ...prev,
          [moduleId]: data
        }))
      } else {
        console.error(`Error fetching ${module.label}:`, error)
        setModuleData(prev => ({
          ...prev,
          [moduleId]: []
        }))
      }
    } catch (error) {
      console.error(`Error fetching ${module.label}:`, error)
      setModuleData(prev => ({
        ...prev,
        [moduleId]: []
      }))
    } finally {
      setLoading(prev => ({ ...prev, [moduleId]: false }))
    }
  }

  // Apply general filters to data
  const applyFilters = (data) => {
    if (!data) return []

    let filtered = [...data]

    // Apply general search
    if (generalSearch) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(generalSearch.toLowerCase())
        )
      )
    }

    // Apply date filter
    if (fromDate || toDate) {
      filtered = filtered.filter(row => {
        const createdAt = row.created_at
        if (!createdAt) return false

        const rowDate = new Date(createdAt)
        const fromDateObj = fromDate ? new Date(fromDate) : null
        const toDateObj = toDate ? new Date(toDate) : null

        if (fromDateObj && rowDate < fromDateObj) return false
        if (toDateObj) {
          const endOfDay = new Date(toDateObj)
          endOfDay.setHours(23, 59, 59, 999)
          if (rowDate > endOfDay) return false
        }

        return true
      })
    }

    return filtered
  }

  const getFilteredModuleData = (moduleId) => {
    const data = moduleData[moduleId] || []
    return applyFilters(data)
  }

  const handleGlobalExportPDF = () => {
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      const lineHeight = 8
      let yPosition = margin

      // Main Header
      doc.setFontSize(20)
      doc.setTextColor(59, 130, 246)
      doc.setFont('helvetica', 'bold')
      doc.text('COMPREHENSIVE REPORT', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 15

      // Sub-header
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'normal')
      doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 10

      // Divider
      doc.setDrawColor(59, 130, 246)
      doc.setLineWidth(0.5)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10

      // Export each selected module
      selectedModules.forEach((moduleId, moduleIndex) => {
        const module = REPORT_MODULES.find(m => m.id === moduleId)
        if (!module) return

        const data = getFilteredModuleData(moduleId)
        
        // Check if we need a new page for module header
        if (yPosition > pageHeight - 40) {
          doc.addPage()
          yPosition = margin
        }

        // Module header
        doc.setFontSize(16)
        doc.setTextColor(59, 130, 246)
        doc.setFont('helvetica', 'bold')
        doc.text(`${moduleIndex + 1}. ${module.label.toUpperCase()}`, margin, yPosition)
        yPosition += 10

        // Module records count
        doc.setFontSize(10)
        doc.setTextColor(80, 80, 80)
        doc.setFont('helvetica', 'normal')
        doc.text(`Records: ${data.length}`, margin, yPosition)
        yPosition += 8

        // Module divider
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.3)
        doc.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 8

        // Format data as form (key-value pairs)
        if (data.length > 0) {
          const allColumns = Object.keys(data[0])
          // Only include visible columns
          const columns = allColumns.filter(col => 
            columnVisibility[moduleId]?.[col] !== false
          )
          
          data.slice(0, 50).forEach((row, rowIndex) => {
            // Check if we need a new page
            if (yPosition > pageHeight - 30) {
              doc.addPage()
              yPosition = margin
            }

            // Record header
            doc.setFontSize(11)
            doc.setTextColor(59, 130, 246)
            doc.setFont('helvetica', 'bold')
            doc.text(`Record #${rowIndex + 1}`, margin, yPosition)
            yPosition += lineHeight

            // Form fields for this record
            doc.setFontSize(9)
            doc.setTextColor(60, 60, 60)
            doc.setFont('helvetica', 'normal')

            columns.forEach(column => {
              if (yPosition > pageHeight - 20) {
                doc.addPage()
                yPosition = margin
              }

              const label = column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
              const value = row[column] === null || row[column] === undefined 
                ? '-' 
                : typeof row[column] === 'string' && row[column].length > 500
                  ? row[column].substring(0, 50) + '...'
                  : String(row[column])

              // Label
              doc.setFont('helvetica', 'bold')
              doc.text(`${label}:`, margin, yPosition)
              
              // Value (with wrapping if needed)
              doc.setFont('helvetica', 'normal')
              const maxWidth = pageWidth - (margin * 2) - 40
              const splitValue = doc.splitTextToSize(value, maxWidth)
              doc.text(splitValue, margin + 40, yPosition)
              
              yPosition += lineHeight * (splitValue.length > 1 ? splitValue.length : 1)
            })

            yPosition += 5 // Spacing between records
          })

          if (data.length > 50) {
            doc.setFontSize(9)
            doc.setTextColor(150, 150, 150)
            doc.setFont('helvetica', 'italic')
            doc.text(`... and ${data.length - 50} more records (showing first 50)`, margin, yPosition)
            yPosition += 8
          }
        } else {
          doc.setFontSize(10)
          doc.setTextColor(150, 150, 150)
          doc.setFont('helvetica', 'italic')
          doc.text('No data available for this module', margin, yPosition)
          yPosition += 8
        }

        yPosition += 10 // Spacing between modules
      })

      // Footer
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.setFont('helvetica', 'normal')
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        )
      }

      doc.save(`comprehensive_report_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF: ' + error.message)
    }
  }

  if (!isActive) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Reports</h2>
        <p className="text-slate-600">Select and view data from different modules</p>
      </div>

      {/* Report Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => switchReportTab('generate')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
            activeReportTab === 'generate'
              ? 'border-primary-600 text-primary-700 bg-primary-50'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <i className="fa-solid fa-file-pen"></i> Generate Report
        </button>
        <button
          onClick={() => switchReportTab('saved')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
            activeReportTab === 'saved'
              ? 'border-primary-600 text-primary-700 bg-primary-50'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <i className="fa-solid fa-folder-open"></i> Saved Reports
          {savedReports.length > 0 && (
            <span className="ml-0.5 grid min-w-4 h-4 px-1 place-items-center rounded-full bg-primary-600 text-white text-[10px] font-semibold leading-none">
              {savedReports.length}
            </span>
          )}
        </button>
      </div>

      {activeReportTab === 'generate' ? (
        <>
      {/* General Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-800">General Filters</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={openSaveReportModal}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition flex items-center gap-2"
            >
              <i className="fa-solid fa-plus"></i>
              Save Report
            </button>
          {selectedModules.length > 0 && (
            <button
              onClick={handleGlobalExportPDF}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition flex items-center gap-2"
            >
              <i className="fa-solid fa-file-pdf"></i>
              Export All to PDF
            </button>
          )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search all modules..."
              value={generalSearch}
              onChange={(e) => setGeneralSearch(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Module Selection */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Select Report Modules</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {REPORT_MODULES.map(module => (
            <label
              key={module.id}
              className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition ${
                selectedModules.includes(module.id)
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedModules.includes(module.id)}
                onChange={() => handleModuleToggle(module.id)}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="font-medium text-slate-700">{module.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Report Tables */}
      {selectedModules.map(moduleId => {
        const module = REPORT_MODULES.find(m => m.id === moduleId)
        if (!module) return null

        return (
          <ReportTable
            key={moduleId}
            module={module}
            data={getFilteredModuleData(moduleId)}
            loading={loading[moduleId] || false}
            onColumnVisibilityChange={handleColumnVisibilityChange}
            initialColumnVisibility={columnVisibility[moduleId]}
          />
        )
      })}

      {selectedModules.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
          <i className="fa-solid fa-chart-bar text-6xl text-slate-300 mb-4"></i>
          <p className="text-slate-500 text-lg">Select modules above to view reports</p>
        </div>
      )}
        </>
      ) : (
        <div>
          {reportsLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
              <i className="fa-solid fa-spinner fa-spin text-2xl"></i>
              <span className="text-sm">Loading saved reports…</span>
            </div>
          ) : savedReports.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 border-dashed py-16 text-center">
              <i className="fa-solid fa-folder-open text-3xl text-slate-300 mb-3"></i>
              <p className="text-sm text-slate-500">No saved reports yet.</p>
              <p className="text-xs text-slate-400 mt-1">Go to the <span className="font-medium text-slate-600">Generate Report</span> tab and save one.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedReports.map(report => (
                <div key={report.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                  <div className="flex justify-between items-start gap-4 p-4 border-b border-slate-100 bg-slate-50">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary-100 text-primary-700 px-2 py-0.5 text-sm font-semibold">
                          <i className="fa-solid fa-calendar-days"></i>
                          {formatReportDate(report.from_date)} → {formatReportDate(report.to_date)}
                        </span>
                        <span className="text-sm text-slate-500">
                          {report.creatorName ? `by ${report.creatorName}` : `by #${(report.user_id || '').slice(0, 8)}`}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1.5">
                        Saved {new Date(report.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
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
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer"
                        title="Apply this report's date range, select all modules, and open in the Generate Report tab"
                      >
                        <i className="fa-solid fa-file-pen"></i> Open in Generate
                      </button>
                      <button
                        onClick={() => setViewReport(report)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-primary-300 text-primary-600 hover:bg-primary-50 px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer"
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
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Save Report</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  Creative Report · Department: <span className="text-slate-700 font-medium">creative</span> · User: {reportUserId ? `#${reportUserId.slice(0, 8)}` : '(resolving…)'}
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
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">From Date</label>
                  <input
                    type="date"
                    value={reportFromDate}
                    onChange={(e) => setReportFromDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">To Date</label>
                  <input
                    type="date"
                    value={reportToDate}
                    onChange={(e) => setReportToDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department</label>
                  <input
                    type="text"
                    value={reportDept}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Report Content</label>
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
                <p className="text-sm text-slate-400 mt-1.5">
                  Markdown supported with live preview. You can also drag &amp; drop, select, or paste (Ctrl+V) files into the editor.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Attached Files</label>
                <div
                  onDragEnter={handleReportDragOver}
                  onDragOver={handleReportDragOver}
                  onDragLeave={handleReportDragLeave}
                  onDrop={handleReportDrop}
                  onClick={() => reportFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${reportDragActive ? 'border-primary-500 bg-primary-50' : 'border-slate-200'}`}
                >
                  <input
                    ref={reportFileInputRef}
                    type="file"
                    multiple
                    onChange={handleReportFileChange}
                    className="hidden"
                  />
                  <div className="text-sm text-slate-600 mb-1">
                    <i className="fa-solid fa-cloud-arrow-up text-primary-500 mr-1.5"></i>
                    Drag &amp; drop files here, click to select, or paste (Ctrl+V)
                  </div>
                  <div className="text-sm text-slate-400">Multiple files supported</div>
                </div>

                {reportFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {reportFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-primary-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <i className="fa-solid fa-file text-primary-500 shrink-0"></i>
                          <span className="text-sm text-slate-700 truncate">{file.name}</span>
                          <span className="text-sm text-slate-500 shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
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

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                disabled={reportSaving}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReport}
                disabled={reportSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors border-none cursor-pointer disabled:opacity-60"
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
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Saved Report</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  <span className="inline-flex items-center gap-1 rounded bg-primary-100 text-primary-700 px-1.5 py-0.5 text-xs font-semibold">
                    <i className="fa-solid fa-calendar-days"></i>
                    {formatReportDate(viewReport.from_date)} → {formatReportDate(viewReport.to_date)}
                  </span>
                  <span className="ml-2">
                    Department: <span className="text-slate-700 font-medium">creative</span>
                  </span>
                  <span className="ml-2">
                    Saved on {new Date(viewReport.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
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
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Report Content</label>
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
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Attached Files</label>
                  <div className="space-y-2">
                    {viewReport.files.map(file => (
                      <div key={file.id} className="flex items-center justify-between bg-primary-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <i className="fa-solid fa-file text-primary-500 shrink-0"></i>
                          <span className="text-sm text-slate-700 truncate">{file.name}</span>
                          {typeof file.file_size === 'number' && (
                            <span className="text-sm text-slate-500 shrink-0">({(file.file_size / 1024).toFixed(1)} KB)</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => downloadReportFile(file)}
                          disabled={downloadingFileId === file.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-primary-300 text-primary-600 hover:bg-primary-100 px-2.5 py-1 text-sm font-medium transition-colors cursor-pointer disabled:opacity-60"
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

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setViewReport(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
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

export default ReportsTab