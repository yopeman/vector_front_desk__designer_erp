import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import jsPDF from 'jspdf'

const REPORT_MODULES = [
  { id: 'prototype', label: 'Prototype Request', table: 'crt_prototype_requests' },
  { id: 'idea', label: 'Idea', table: 'crt_idea_hub' },
  { id: 'design', label: 'Design Log', table: 'crt_design_bom' },
]

const ReportTable = ({ module, data, loading, onSearch, onPaginationChange, onColumnVisibilityChange, initialColumnVisibility }) => {
  const [localSearch, setLocalSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filteredData, setFilteredData] = useState([])
  const [visibleColumns, setVisibleColumns] = useState({})
  const [showColumnSelector, setShowColumnSelector] = useState(false)

  const paginationOptions = [5, 10, 25, 50, 100]

  useEffect(() => {
    if (data && data.length > 0) {
      const columns = Object.keys(data[0])
      
      if (initialColumnVisibility && Object.keys(initialColumnVisibility).length > 0) {
        setVisibleColumns(initialColumnVisibility)
      } else {
        const initialVis = columns.reduce((acc, col) => {
          acc[col] = true
          return acc
        }, {})
        setVisibleColumns(initialVis)
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

      doc.setFontSize(20)
      doc.setTextColor(59, 130, 246)
      doc.setFont('helvetica', 'bold')
      doc.text(module.label.toUpperCase(), pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 15

      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'normal')
      doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 10

      doc.setDrawColor(59, 130, 246)
      doc.setLineWidth(0.5)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setTextColor(80, 80, 80)
      doc.text(`Total Records: ${filteredData.length}`, margin, yPosition)
      yPosition += 10

      const visibleCols = getVisibleColumns()
      
      paginatedData.forEach((row, rowIndex) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage()
          yPosition = margin
        }

        doc.setFontSize(12)
        doc.setTextColor(59, 130, 246)
        doc.setFont('helvetica', 'bold')
        doc.text(`Record #${rowIndex + 1}`, margin, yPosition)
        yPosition += lineHeight

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

          doc.setFont('helvetica', 'bold')
          doc.text(`${label}:`, margin, yPosition)
          
          doc.setFont('helvetica', 'normal')
          const maxWidth = pageWidth - (margin * 2) - 40
          const splitValue = doc.splitTextToSize(value, maxWidth)
          doc.text(splitValue, margin + 40, yPosition)
          
          yPosition += lineHeight * (splitValue.length > 1 ? splitValue.length : 1)
        })

        yPosition += 5
      })

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
    if (str.length > 100 && /^[A-Za-z0-9+/=]+$/.test(str)) {
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
      if (isBase64(value)) {
        return '[File Data]'
      }
      if (value.startsWith('data:')) {
        return '[File Data]'
      }
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

const PublicHeader = () => {
  return (
    <header className="bg-white border-b border-primary-100 h-16 flex items-center justify-between px-6 md:px-8 shrink-0 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-slate-800">Creative Public Report</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold border border-slate-700">
              P
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 text-sm truncate">Public Access</p>
            <p className="text-[10px] text-slate-500">View Only Mode</p>
          </div>
        </div>
      </div>
    </header>
  )
}

const PublicSidebar = () => {
  const navigate = useNavigate()
  
  const tabs = [
    { id: 'dashboardTab', label: 'Dashboard', icon: 'fa-table-columns', color: 'text-primary-400' },
    { id: 'prototypeTab', label: 'Prototype Request', icon: 'fa-flask', color: 'text-primary-400' },
    { id: 'ideaTab', label: 'Idea', icon: 'fa-lightbulb', color: 'text-primary-400' },
    { id: 'designTab', label: 'Design Log', icon: 'fa-compass-drafting', color: 'text-primary-400' },
    { id: 'reportsTab', label: 'Reports', icon: 'fa-chart-bar', color: 'text-primary-400' },
    { id: 'messagesTab', label: 'Message', icon: 'fa-envelope', color: 'text-primary-400' },
    { id: 'notificationsTab', label: 'Notifications', icon: 'fa-bell', color: 'text-primary-400' },
    { id: 'notesTab', label: 'Notes', icon: 'fa-sticky-note', color: 'text-primary-400' },
    { id: 'settingsTab', label: 'Settings', icon: 'fa-gear', color: 'text-primary-400' },
  ]

  const handleTabClick = (tabId) => {
    navigate('/login')
  }

  return (
    <aside className="w-68 bg-primary-900 text-slate-200 flex flex-col justify-between hidden md:flex z-10 shadow-2xl shrink-0">
      <div>
        <div className="p-6 flex items-center gap-3 border-b border-primary-800 bg-primary-950/40">
          <div className="bg-gradient-to-tr from-primary-500 to-primary-600 p-2.5 rounded-xl text-white shadow-md shadow-primary-500/20">
            <i className="fa-solid fa-cubes text-xl"></i>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-white tracking-wide">V☰CTOR A&M</h1>
            <span className="text-xs text-primary-400 font-semibold tracking-wider uppercase">ERP Premium v2.0</span>
          </div>
        </div>

        <div className="p-4 pt-6 text-xs font-bold text-slate-500 uppercase tracking-widest px-6">Main Modules</div>
        <nav className="p-4 space-y-1.5 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className="tab-btn w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium transition text-left text-slate-400 hover:bg-primary-800 hover:text-slate-100 cursor-pointer"
            >
              <i className={`fa-solid ${tab.icon} text-base ${tab.color || ''}`}></i>
              {tab.label}
            </button>
          ))}
          
          <button
            onClick={() => window.open('https://vectoradvert.com/erp/hr', '_self')}
            className="w-full flex items-center justify-between gap-3.5 px-4 py-3 rounded-xl font-medium transition text-left text-slate-400 hover:bg-primary-800 hover:text-slate-100 cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <i className="fa-solid fa-file-lines text-base text-primary-400"></i>
              <span>HR Request</span>
            </div>
          </button>
        </nav>
      </div>
    </aside>
  )
}

const PublicReport = () => {
  const navigate = useNavigate()
  const [selectedModules, setSelectedModules] = useState([])
  const [moduleData, setModuleData] = useState({})
  const [loading, setLoading] = useState({})
  const [generalSearch, setGeneralSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [columnVisibility, setColumnVisibility] = useState({})

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
      
      if (!prev.includes(moduleId) && newSelected.includes(moduleId)) {
        fetchModuleData(moduleId)
      }
      
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

  const applyFilters = (data) => {
    if (!data) return []

    let filtered = [...data]

    if (generalSearch) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(generalSearch.toLowerCase())
        )
      )
    }

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

      doc.setFontSize(20)
      doc.setTextColor(59, 130, 246)
      doc.setFont('helvetica', 'bold')
      doc.text('COMPREHENSIVE REPORT', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 15

      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'normal')
      doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 10

      doc.setDrawColor(59, 130, 246)
      doc.setLineWidth(0.5)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10

      selectedModules.forEach((moduleId, moduleIndex) => {
        const module = REPORT_MODULES.find(m => m.id === moduleId)
        if (!module) return

        const data = getFilteredModuleData(moduleId)
        
        if (yPosition > pageHeight - 40) {
          doc.addPage()
          yPosition = margin
        }

        doc.setFontSize(16)
        doc.setTextColor(59, 130, 246)
        doc.setFont('helvetica', 'bold')
        doc.text(`${moduleIndex + 1}. ${module.label.toUpperCase()}`, margin, yPosition)
        yPosition += 10

        doc.setFontSize(10)
        doc.setTextColor(80, 80, 80)
        doc.setFont('helvetica', 'normal')
        doc.text(`Records: ${data.length}`, margin, yPosition)
        yPosition += 8

        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.3)
        doc.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 8

        if (data.length > 0) {
          const allColumns = Object.keys(data[0])
          const columns = allColumns.filter(col => 
            columnVisibility[moduleId]?.[col] !== false
          )
          
          data.slice(0, 50).forEach((row, rowIndex) => {
            if (yPosition > pageHeight - 30) {
              doc.addPage()
              yPosition = margin
            }

            doc.setFontSize(11)
            doc.setTextColor(59, 130, 246)
            doc.setFont('helvetica', 'bold')
            doc.text(`Record #${rowIndex + 1}`, margin, yPosition)
            yPosition += lineHeight

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

              doc.setFont('helvetica', 'bold')
              doc.text(`${label}:`, margin, yPosition)
              
              doc.setFont('helvetica', 'normal')
              const maxWidth = pageWidth - (margin * 2) - 40
              const splitValue = doc.splitTextToSize(value, maxWidth)
              doc.text(splitValue, margin + 40, yPosition)
              
              yPosition += lineHeight * (splitValue.length > 1 ? splitValue.length : 1)
            })

            yPosition += 5
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

        yPosition += 10
      })

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

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 text-slate-800 antialiased">
      <PublicSidebar />
      
      <main className="flex-1 flex flex-col overflow-y-auto bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200">
        <PublicHeader />
        
        <div className="p-6">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Creative Public Report</h1>
            <p className="text-slate-600">Select and view data from different modules</p>
          </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-800">General Filters</h3>
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
        </div>
        
      </main>
    </div>
  )
}

export default PublicReport
