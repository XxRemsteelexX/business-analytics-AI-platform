'use client'
import React, { useState, useEffect } from 'react'
import { CheckSquare, Square, Play, Filter, Database } from 'lucide-react'
import { SmartDataSelector } from './SmartDataSelector'

interface DataSelectorProps {
  fileData: any
  onDataSelected: (selectedData: {
    sheetName: string
    xColumns: string[]
    yColumns: string[]
    rowRange: { start: number, end: number }
    data: any[]
  }) => void
}

export function DataSelector({ fileData, onDataSelected }: DataSelectorProps) {
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [xColumns, setXColumns] = useState<string[]>([])
  const [yColumns, setYColumns] = useState<string[]>([])
  const [availableColumns, setAvailableColumns] = useState<string[]>([])
  const [sampleData, setSampleData] = useState<any[]>([])
  const [allData, setAllData] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [needsAIHelp, setNeedsAIHelp] = useState(false)
  const [rawData, setRawData] = useState<any[][]>([])

  useEffect(() => {
    if (fileData && fileData.id) {
      console.log('FileData received:', fileData)
      
      // Parse the file using our new parse endpoint
      if (fileData.sheetNames && fileData.sheetNames.length > 0) {
        const firstSheet = fileData.sheetNames[0]
        setSelectedSheet(firstSheet)
        parseFileData(fileData.id, firstSheet)
      } else {
        // Try parsing without specifying sheet name
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
        console.log('Parsed data:', result)
        
        if (result.needsAIHelp) {
          // Always show AI chat interface - let GPT-3.5 Turbo analyze
          setNeedsAIHelp(true)
          setRawData(result.rawData)
          setSelectedSheet(result.sheetName)
        }
      } else {
        console.error('Failed to parse file data')
      }
    } catch (error) {
      console.error('Error parsing file:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSheetData = (sheetName: string) => {
    // This function is now replaced by parseFileData
    parseFileData(fileData.id, sheetName)
  }

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName)
    parseFileData(fileData.id, sheetName)
  }


  const getColumnType = (column: string): 'numeric' | 'categorical' | 'date' => {
    const sample = sampleData.slice(0, 10).map(row => row[column]).filter(val => val != null)
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

  const handleGenerate = () => {
    if (!selectedSheet || xColumns.length === 0 || yColumns.length === 0) return

    // Use all available data
    const selectedColumns = [...xColumns, ...yColumns]
    const filteredData = allData.map((row: any) => {
      const filteredRow: any = {}
      selectedColumns.forEach(col => {
        filteredRow[col] = row[col]
      })
      return filteredRow
    })

    onDataSelected({
      sheetName: selectedSheet,
      xColumns,
      yColumns,
      rowRange: { start: 1, end: allData.length },
      data: filteredData
    })
  }

  // Auto-select smart X and Y columns
  const autoSelectColumns = () => {
    const dateColumns = availableColumns.filter(col => getColumnType(col) === 'date')
    const numericColumns = availableColumns.filter(col => getColumnType(col) === 'numeric')
    const categoricalColumns = availableColumns.filter(col => getColumnType(col) === 'categorical')
    
    // Smart X selection (categories or dates)
    if (dateColumns.length > 0) {
      setXColumns([dateColumns[0]])
    } else if (categoricalColumns.length > 0) {
      setXColumns([categoricalColumns[0]])
    }
    
    // Smart Y selection (numeric values)
    if (numericColumns.length > 0) {
      setYColumns([numericColumns[0]])
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

  const handleDataStructureIdentified = (structure: {
    headerRow: number
    dataStartRow: number
    dataEndRow: number
    selectedColumns: number[]
    processedData: any[]
  }) => {
    // Set the processed data from AI
    const columns = structure.processedData.length > 0 ? Object.keys(structure.processedData[0]) : []
    setAvailableColumns(columns)
    setSampleData(structure.processedData.slice(0, 5))
    setAllData(structure.processedData)
    setNeedsAIHelp(false) // Hide chat interface
    
    // Auto-select smart columns if data is available
    if (structure.processedData.length > 0) {
      setTimeout(() => autoSelectColumns(), 100)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></div>
        Parsing file data...
      </div>
    )
  }

  // Show smart AI selector when data needs analysis
  if (needsAIHelp && rawData.length > 0) {
    return (
      <SmartDataSelector
        rawData={rawData}
        sheetName={selectedSheet}
        onDataStructureIdentified={handleDataStructureIdentified}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Select Your Data
        </h3>
        <p className="text-sm text-blue-700">
          Choose which data you want to analyze. Select the sheet, then pick the columns that contain your key business metrics.
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

      {/* Row Count Display */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Data Size
          </label>
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-blue-600">{allData.length}</span> rows × <span className="font-semibold text-blue-600">{availableColumns.length}</span> columns
          </div>
        </div>
      </div>

      {/* Simple Row and Column Selection */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Chart Axes
          </label>
          <button
            onClick={autoSelectColumns}
            className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 transition-colors"
          >
            Smart Select
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Row Labels (X-axis) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Row Labels (X-axis)
            </label>
            <select
              value={xColumns[0] || ''}
              onChange={(e) => setXColumns(e.target.value ? [e.target.value] : [])}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select row label column...</option>
              {availableColumns.map((col) => (
                <option key={col} value={col}>
                  {getColumnIcon(getColumnType(col))} {col}
                </option>
              ))}
            </select>
          </div>

          {/* Column Values (Y-axis) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Values (Y-axis)
            </label>
            <select
              value={yColumns[0] || ''}
              onChange={(e) => setYColumns(e.target.value ? [e.target.value] : [])}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select value column...</option>
              {availableColumns.map((col) => (
                <option key={col} value={col}>
                  {getColumnIcon(getColumnType(col))} {col}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Data Preview */}
      {(xColumns.length > 0 || yColumns.length > 0) && (
        <div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-blue-600 hover:text-blue-800 mb-2"
          >
            {showPreview ? 'Hide' : 'Show'} Data Preview
          </button>
          
          {showPreview && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {xColumns.concat(yColumns).map(col => (
                        <th key={col} className="px-3 py-2 text-left font-medium text-gray-900 border-r border-gray-200 last:border-r-0">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sampleData.slice(0, 3).map((row, idx) => (
                      <tr key={idx} className="border-t border-gray-200">
                        {xColumns.concat(yColumns).map(col => (
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
            </div>
          )}
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={xColumns.length === 0 || yColumns.length === 0}
        className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors ${
          xColumns.length > 0 && yColumns.length > 0
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        <Play className="w-4 h-4" />
        <span>Generate Charts</span>
      </button>
    </div>
  )
}