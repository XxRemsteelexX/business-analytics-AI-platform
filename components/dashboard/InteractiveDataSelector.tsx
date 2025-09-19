'use client'
import React, { useState, useEffect, useMemo } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Play,
  Filter,
  Database,
  Check,
  X,
  Search,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { SmartDataSelector } from './SmartDataSelector'

interface InteractiveDataSelectorProps {
  fileData: any
  onDataSelected: (selectedData: {
    sheetName: string
    xColumns: string[]
    yColumns: string[]
    rowRange: { start: number, end: number }
    data: any[]
  }) => void
}

interface ColumnFilter {
  column: string
  selectedValues: Set<string>
  allValues: string[]
}

export function InteractiveDataSelector({ fileData, onDataSelected }: InteractiveDataSelectorProps) {
  console.log('InteractiveDataSelector loaded!')
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [availableColumns, setAvailableColumns] = useState<string[]>([])
  const [sampleData, setSampleData] = useState<any[]>([])
  const [allData, setAllData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [needsAIHelp, setNeedsAIHelp] = useState(false)
  const [rawData, setRawData] = useState<any[][]>([])

  // Row selection state
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [rowSectionExpanded, setRowSectionExpanded] = useState(true)
  const [rowSearchTerm, setRowSearchTerm] = useState('')

  // Data range state (for slider)
  const [startIndex, setStartIndex] = useState(0)
  const [endIndex, setEndIndex] = useState(0)
  const [rangeSectionExpanded, setRangeSectionExpanded] = useState(true)

  // Column selection state
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set())
  const [columnSectionExpanded, setColumnSectionExpanded] = useState(true)
  const [columnFilters, setColumnFilters] = useState<Map<string, ColumnFilter>>(new Map())
  const [columnSearchTerm, setColumnSearchTerm] = useState('')
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set())

  // Preview state
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (fileData && fileData.id) {
      if (fileData.sheetNames && fileData.sheetNames.length > 0) {
        const firstSheet = fileData.sheetNames[0]
        setSelectedSheet(firstSheet)
        parseFileData(fileData.id, firstSheet)
      } else {
        parseFileData(fileData.id)
      }
    }
  }, [fileData])

  const parseFileData = async (fileId: string, sheetName?: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, sheetName })
      })

      if (response.ok) {
        const result = await response.json()

        if (result.needsAIHelp) {
          setNeedsAIHelp(true)
          setRawData(result.rawData)
          setSelectedSheet(result.sheetName)
        }
      }
    } catch (error) {
      console.error('Error parsing file:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName)
    parseFileData(fileData.id, sheetName)
  }

  const handleDataStructureIdentified = (structure: {
    headerRow: number
    dataStartRow: number
    dataEndRow: number
    selectedColumns: number[]
    processedData: any[]
  }) => {
    console.log('handleDataStructureIdentified called with:', structure)
    const columns = structure.processedData.length > 0 ? Object.keys(structure.processedData[0]) : []
    setAvailableColumns(columns)
    setSampleData(structure.processedData.slice(0, 5))
    setAllData(structure.processedData)
    setNeedsAIHelp(false)  // This will hide SmartDataSelector and show our new interface
    console.log('needsAIHelp set to false, should show new interface now')

    // Initialize all rows and columns as selected
    if (structure.processedData.length > 0) {
      const allRowIndices = new Set(structure.processedData.map((_, idx) => idx))
      setSelectedRows(allRowIndices)
      setSelectedColumns(new Set(columns))
      setStartIndex(0)
      setEndIndex(structure.processedData.length - 1)

      // Initialize column filters with all values selected
      const filters = new Map<string, ColumnFilter>()
      columns.forEach(col => {
        const uniqueValues = Array.from(new Set(structure.processedData.map(row => String(row[col] || ''))))
        filters.set(col, {
          column: col,
          selectedValues: new Set(uniqueValues),
          allValues: uniqueValues
        })
      })
      setColumnFilters(filters)
    }
  }

  const toggleRowSelection = (rowIndex: number) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(rowIndex)) {
        newSet.delete(rowIndex)
      } else {
        newSet.add(rowIndex)
      }
      return newSet
    })
  }

  const toggleAllRows = () => {
    if (selectedRows.size === allData.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(allData.map((_, idx) => idx)))
    }
  }

  const toggleColumnSelection = (column: string) => {
    setSelectedColumns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(column)) {
        newSet.delete(column)
      } else {
        newSet.add(column)
      }
      return newSet
    })
  }

  const toggleAllColumns = () => {
    if (selectedColumns.size === availableColumns.length) {
      setSelectedColumns(new Set())
    } else {
      setSelectedColumns(new Set(availableColumns))
    }
  }

  const toggleColumnValue = (column: string, value: string) => {
    setColumnFilters(prev => {
      const newFilters = new Map(prev)
      const filter = newFilters.get(column)
      if (filter) {
        const newSelectedValues = new Set(filter.selectedValues)
        if (newSelectedValues.has(value)) {
          newSelectedValues.delete(value)
        } else {
          newSelectedValues.add(value)
        }
        newFilters.set(column, { ...filter, selectedValues: newSelectedValues })
      }
      return newFilters
    })
  }

  const toggleAllColumnValues = (column: string) => {
    setColumnFilters(prev => {
      const newFilters = new Map(prev)
      const filter = newFilters.get(column)
      if (filter) {
        if (filter.selectedValues.size === filter.allValues.length) {
          newFilters.set(column, { ...filter, selectedValues: new Set() })
        } else {
          newFilters.set(column, { ...filter, selectedValues: new Set(filter.allValues) })
        }
      }
      return newFilters
    })
  }

  // Filter data based on selections
  const filteredData = useMemo(() => {
    return allData
      .filter((row, idx) => selectedRows.has(idx))
      .filter(row => {
        // Apply column value filters
        for (const [col, filter] of columnFilters) {
          if (selectedColumns.has(col)) {
            const rowValue = String(row[col] || '')
            if (!filter.selectedValues.has(rowValue)) {
              return false
            }
          }
        }
        return true
      })
      .map(row => {
        const filteredRow: any = {}
        selectedColumns.forEach(col => {
          filteredRow[col] = row[col]
        })
        return filteredRow
      })
  }, [allData, selectedRows, selectedColumns, columnFilters])

  const handleGenerate = () => {
    if (!selectedSheet || selectedColumns.size === 0 || selectedRows.size === 0) return

    const xColumns = Array.from(selectedColumns).slice(0, 1) // First selected column as X
    const yColumns = Array.from(selectedColumns).slice(1) // Rest as Y

    onDataSelected({
      sheetName: selectedSheet,
      xColumns,
      yColumns,
      rowRange: { start: 0, end: filteredData.length },
      data: filteredData
    })
  }

  const getColumnType = (column: string): 'numeric' | 'categorical' | 'date' => {
    const sample = allData.slice(0, 10).map(row => row[column]).filter(val => val != null)
    const numericCount = sample.filter(val => !isNaN(Number(val))).length
    const dateCount = sample.filter(val => {
      const str = String(val).toLowerCase()
      return str.includes('date') || str.includes('2024') || str.includes('2023') ||
             str.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/) || str.match(/\d{4}-\d{2}-\d{2}/)
    }).length

    if (dateCount > sample.length * 0.3) return 'date'
    if (numericCount > sample.length * 0.7) return 'numeric'
    return 'categorical'
  }

  const getColumnIcon = (type: string) => {
    switch (type) {
      case 'numeric': return '🔢'
      case 'date': return '📅'
      default: return '📝'
    }
  }

  if (!fileData) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <Database className="w-8 h-8 mr-2" />
        Upload a file to select data
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></div>
        Parsing file data...
      </div>
    )
  }

  console.log('InteractiveDataSelector render: needsAIHelp=', needsAIHelp, 'rawData.length=', rawData.length, 'allData.length=', allData.length)

  // TEMPORARILY BYPASS SmartDataSelector - go straight to new interface
  if (needsAIHelp && rawData.length > 0) {
    console.log('Bypassing SmartDataSelector, processing data directly')
    // Process raw data directly without AI help
    const headers = rawData[0] || []
    const dataRows = rawData.slice(1)
    const processedData = dataRows.map(row => {
      const obj: any = {}
      headers.forEach((header, idx) => {
        obj[header || `Column ${idx + 1}`] = row[idx]
      })
      return obj
    }).filter(row => Object.values(row).some(val => val))

    // Set the data directly
    if (processedData.length > 0 && allData.length === 0) {
      const columns = Object.keys(processedData[0])
      setAvailableColumns(columns)
      setSampleData(processedData.slice(0, 5))
      setAllData(processedData)
      setNeedsAIHelp(false)

      // Initialize selections
      const allRowIndices = new Set(processedData.map((_, idx) => idx))
      setSelectedRows(allRowIndices)
      setSelectedColumns(new Set(columns))
      setStartIndex(0)
      setEndIndex(processedData.length - 1)

      // Initialize column filters
      const filters = new Map<string, ColumnFilter>()
      columns.forEach(col => {
        const uniqueValues = Array.from(new Set(processedData.map(row => String(row[col] || ''))))
        filters.set(col, {
          column: col,
          selectedValues: new Set(uniqueValues),
          allValues: uniqueValues
        })
      })
      setColumnFilters(filters)
    }
  }

  console.log('Showing NEW interactive interface')
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-400">
        <h3 className="text-xl font-bold text-green-900 mb-2 flex items-center">
          <Filter className="w-6 h-6 mr-2" />
          🆕 INTERACTIVE DATA SELECTION (NEW VERSION)
        </h3>
        <p className="text-sm text-green-700 font-semibold">
          ✅ Checkbox-based selection | ✅ Row filters | ✅ Column value filters | ✅ Real-time updates
        </p>
      </div>

      {/* Sheet Selection */}
      {fileData.sheetNames && fileData.sheetNames.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Sheet
          </label>
          <select
            value={selectedSheet}
            onChange={(e) => handleSheetChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {fileData.sheetNames.map((sheet: string) => (
              <option key={sheet} value={sheet}>{sheet}</option>
            ))}
          </select>
        </div>
      )}

      {/* Data Range Slider */}
      {allData.length > 0 && (
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => setRangeSectionExpanded(!rangeSectionExpanded)}
            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">Data Range Filter</span>
              <span className="text-sm text-gray-500">
                (Showing {endIndex - startIndex + 1} of {allData.length} records)
              </span>
            </div>
            {rangeSectionExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {rangeSectionExpanded && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex justify-end mb-4">
                <Button
                  onClick={() => {
                    setStartIndex(0)
                    setEndIndex(allData.length - 1)
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset Range
                </Button>
              </div>

              <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700">
                  Start Index
                </Label>
                <span className="text-sm text-gray-500">
                  {startIndex} of {allData.length - 1}
                </span>
              </div>
              <Slider
                min={0}
                max={allData.length > 0 ? allData.length - 1 : 0}
                step={1}
                value={[startIndex]}
                onValueChange={([value]) => {
                  setStartIndex(value)
                  if (value > endIndex) {
                    setEndIndex(value)
                  }
                }}
                className="mb-2"
              />
              <Input
                type="number"
                min={0}
                max={endIndex}
                value={startIndex}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  const clampedValue = Math.max(0, Math.min(value, endIndex))
                  setStartIndex(clampedValue)
                }}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700">
                  End Index
                </Label>
                <span className="text-sm text-gray-500">
                  {endIndex} of {allData.length - 1}
                </span>
              </div>
              <Slider
                min={startIndex}
                max={allData.length > 0 ? allData.length - 1 : 0}
                step={1}
                value={[endIndex]}
                onValueChange={([value]) => setEndIndex(value)}
                className="mb-2"
              />
              <Input
                type="number"
                min={startIndex}
                max={allData.length > 0 ? allData.length - 1 : 0}
                value={endIndex}
                onChange={(e) => {
                  const maxValue = allData.length > 0 ? allData.length - 1 : 0
                  const value = parseInt(e.target.value) || 0
                  const clampedValue = Math.max(startIndex, Math.min(value, maxValue))
                  setEndIndex(clampedValue)
                }}
                className="w-full"
              />
            </div>

            <div className="pt-2 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">{endIndex - startIndex + 1}</span> of{' '}
                <span className="font-semibold">{allData.length}</span> records
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${allData.length > 0 ? ((endIndex - startIndex + 1) / allData.length) * 100 : 0}%`,
                    marginLeft: `${allData.length > 0 ? (startIndex / allData.length) * 100 : 0}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
            </div>
          )}
        </div>
      )}

      {/* Row Selection */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => setRowSectionExpanded(!rowSectionExpanded)}
          className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">Row Selection</span>
            <span className="text-sm text-gray-500">
              ({selectedRows.size} of {allData.length} selected)
            </span>
          </div>
          {rowSectionExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {rowSectionExpanded && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="relative flex-1 mr-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search rows..."
                  value={rowSearchTerm}
                  onChange={(e) => setRowSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={toggleAllRows}
                className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                {selectedRows.size === allData.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1">
              {allData
                .filter((_, idx) =>
                  rowSearchTerm === '' ||
                  Object.values(allData[idx]).some(val =>
                    String(val).toLowerCase().includes(rowSearchTerm.toLowerCase())
                  )
                )
                .slice(0, 100)
                .map((row, idx) => (
                <label
                  key={idx}
                  className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedRows.has(idx)}
                    onChange={() => toggleRowSelection(idx)}
                    className="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Row {idx + 1}: {Object.values(row).slice(0, 3).join(', ')}
                    {Object.values(row).length > 3 && '...'}
                  </span>
                </label>
              ))}
              {allData.length > 100 && (
                <div className="text-sm text-gray-500 text-center py-2">
                  Showing first 100 rows. Use search to find specific rows.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Column Selection with Value Filters */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => setColumnSectionExpanded(!columnSectionExpanded)}
          className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">Column Selection & Filters</span>
            <span className="text-sm text-gray-500">
              ({selectedColumns.size} of {availableColumns.length} selected)
            </span>
          </div>
          {columnSectionExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {columnSectionExpanded && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="relative flex-1 mr-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search columns..."
                  value={columnSearchTerm}
                  onChange={(e) => setColumnSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={toggleAllColumns}
                className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                {selectedColumns.size === availableColumns.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableColumns
                .filter(col =>
                  columnSearchTerm === '' ||
                  col.toLowerCase().includes(columnSearchTerm.toLowerCase())
                )
                .map(col => {
                  const filter = columnFilters.get(col)
                  const isExpanded = expandedColumns.has(col)
                  const columnType = getColumnType(col)

                  return (
                    <div key={col} className="border border-gray-200 rounded-lg">
                      <div className="p-3 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center flex-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedColumns.has(col)}
                              onChange={() => toggleColumnSelection(col)}
                              className="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-900">
                              {getColumnIcon(columnType)} {col}
                            </span>
                          </label>
                          {selectedColumns.has(col) && filter && (
                            <button
                              onClick={() => setExpandedColumns(prev => {
                                const newSet = new Set(prev)
                                if (newSet.has(col)) {
                                  newSet.delete(col)
                                } else {
                                  newSet.add(col)
                                }
                                return newSet
                              })}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                            >
                              {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                        {selectedColumns.has(col) && filter && (
                          <div className="mt-2 text-xs text-gray-600">
                            {filter.selectedValues.size} of {filter.allValues.length} values selected
                          </div>
                        )}
                      </div>

                      {selectedColumns.has(col) && isExpanded && filter && (
                        <div className="p-3 border-t border-gray-200 bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-700">Filter Values</span>
                            <button
                              onClick={() => toggleAllColumnValues(col)}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                            >
                              {filter.selectedValues.size === filter.allValues.length ? 'Clear' : 'All'}
                            </button>
                          </div>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {filter.allValues.slice(0, 50).map(value => (
                              <label
                                key={value}
                                className="flex items-center p-1 hover:bg-gray-50 rounded cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={filter.selectedValues.has(value)}
                                  onChange={() => toggleColumnValue(col, value)}
                                  className="mr-2 h-3 w-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-xs text-gray-700 truncate" title={value}>
                                  {value || '(empty)'}
                                </span>
                              </label>
                            ))}
                            {filter.allValues.length > 50 && (
                              <div className="text-xs text-gray-500 text-center py-1">
                                Showing first 50 values
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>

      {/* Data Preview */}
      {selectedColumns.size > 0 && selectedRows.size > 0 && (
        <div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-blue-600 hover:text-blue-800 mb-2 flex items-center"
          >
            {showPreview ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {showPreview ? 'Hide' : 'Show'} Filtered Data Preview ({filteredData.length} rows)
          </button>

          {showPreview && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {Array.from(selectedColumns).map(col => (
                        <th key={col} className="px-3 py-2 text-left font-medium text-gray-900 border-r border-gray-200 last:border-r-0">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="border-t border-gray-200">
                        {Array.from(selectedColumns).map(col => (
                          <td key={col} className="px-3 py-2 text-gray-700 border-r border-gray-200 last:border-r-0">
                            {String(row[col] || '').substring(0, 30)}
                            {String(row[col] || '').length > 30 ? '...' : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredData.length > 5 && (
                <div className="px-3 py-2 bg-gray-50 text-xs text-gray-600 text-center border-t border-gray-200">
                  Showing 5 of {filteredData.length} filtered rows
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{selectedRows.size}</div>
            <div className="text-sm text-gray-600">Rows Selected</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{selectedColumns.size}</div>
            <div className="text-sm text-gray-600">Columns Selected</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{filteredData.length}</div>
            <div className="text-sm text-gray-600">Filtered Records</div>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={selectedColumns.size === 0 || filteredData.length === 0}
        className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors ${
          selectedColumns.size > 0 && filteredData.length > 0
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        <Play className="w-4 h-4" />
        <span>Generate Charts with Filtered Data</span>
      </button>
    </div>
  )
}