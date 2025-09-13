'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Table, CheckCircle } from 'lucide-react'

interface RawDataSelectorProps {
  rawData: any[][]
  sheetName: string
  onDataStructureSelected: (selection: {
    headerRow: number
    dataStartRow: number
    dataEndRow: number
    selectedColumns: number[]
    processedData: any[]
  }) => void
}

export function RawDataSelector({ rawData, sheetName, onDataStructureSelected }: RawDataSelectorProps) {
  const [headerRow, setHeaderRow] = useState<number>(0)
  const [dataStartRow, setDataStartRow] = useState<number>(1)
  const [dataEndRow, setDataEndRow] = useState<number>(Math.min(rawData.length - 1, 10))
  const [selectedColumns, setSelectedColumns] = useState<number[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const maxCols = Math.max(...rawData.map(row => row?.length || 0))
  
  const getPreviewData = () => {
    if (headerRow >= rawData.length) return []
    
    const headers = rawData[headerRow] || []
    const dataRows = rawData.slice(dataStartRow, dataEndRow + 1)
    
    // Convert to objects using selected columns
    return dataRows.map(row => {
      const obj: any = {}
      selectedColumns.forEach(colIndex => {
        const header = headers[colIndex] || `Column_${colIndex + 1}`
        const value = row?.[colIndex] || ''
        obj[header] = value
      })
      return obj
    })
  }

  const handleColumnToggle = (colIndex: number) => {
    setSelectedColumns(prev => 
      prev.includes(colIndex) 
        ? prev.filter(c => c !== colIndex)
        : [...prev, colIndex].sort((a, b) => a - b)
    )
  }

  const handleConfirm = () => {
    const processedData = getPreviewData()
    onDataStructureSelected({
      headerRow,
      dataStartRow,
      dataEndRow,
      selectedColumns,
      processedData
    })
  }

  const canConfirm = selectedColumns.length > 0 && dataStartRow <= dataEndRow

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
        <h3 className="text-lg font-semibold text-orange-900 mb-2 flex items-center">
          <Table className="w-5 h-5 mr-2" />
          Define Your Data Structure
        </h3>
        <p className="text-sm text-orange-700">
          This file needs manual setup. Please tell us which row contains headers and which rows contain your data.
        </p>
      </div>

      {/* Row Selection Controls */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Header Row (contains column names)
          </label>
          <select
            value={headerRow}
            onChange={(e) => setHeaderRow(parseInt(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          >
            {rawData.map((_, index) => (
              <option key={index} value={index}>
                Row {index + 1}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Starts (first data row)
          </label>
          <select
            value={dataStartRow}
            onChange={(e) => setDataStartRow(parseInt(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          >
            {rawData.map((_, index) => (
              <option key={index} value={index}>
                Row {index + 1}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Ends (last data row)
          </label>
          <select
            value={dataEndRow}
            onChange={(e) => setDataEndRow(parseInt(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          >
            {rawData.map((_, index) => (
              <option key={index} value={index}>
                Row {index + 1}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Raw Data Preview */}
      <div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800 mb-2"
        >
          {showPreview ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
          {showPreview ? 'Hide' : 'Show'} Raw Data ({rawData.length} rows × {maxCols} cols)
        </button>
        
        {showPreview && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="min-w-full text-xs">
                <tbody>
                  {rawData.slice(0, 15).map((row, rowIndex) => (
                    <tr key={rowIndex} className={`border-b border-gray-100 ${
                      rowIndex === headerRow ? 'bg-blue-50' : 
                      rowIndex >= dataStartRow && rowIndex <= dataEndRow ? 'bg-green-50' : 
                      'bg-white'
                    }`}>
                      <td className="px-2 py-1 font-mono text-gray-500 border-r bg-gray-50">
                        {rowIndex + 1}
                      </td>
                      {Array.from({ length: maxCols }, (_, colIndex) => (
                        <td key={colIndex} className="px-2 py-1 border-r border-gray-200 max-w-32 truncate">
                          {row?.[colIndex]?.toString() || ''}
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

      {/* Column Selection */}
      {headerRow < rawData.length && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Columns to Include ({selectedColumns.length} selected)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {(rawData[headerRow] || []).map((header, colIndex) => {
              const isSelected = selectedColumns.includes(colIndex)
              return (
                <label
                  key={colIndex}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-300 text-blue-900' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleColumnToggle(colIndex)}
                    className="mr-2"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {header?.toString() || `Column ${colIndex + 1}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      Col {colIndex + 1}
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Processed Data Preview */}
      {selectedColumns.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Preview of Processed Data ({getPreviewData().length} rows)
          </h4>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {selectedColumns.map(colIndex => {
                      const header = (rawData[headerRow] || [])[colIndex] || `Column_${colIndex + 1}`
                      return (
                        <th key={colIndex} className="px-3 py-2 text-left font-medium text-gray-900 border-r border-gray-200 last:border-r-0">
                          {header?.toString()}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {getPreviewData().slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="border-t border-gray-200">
                      {selectedColumns.map(colIndex => {
                        const header = (rawData[headerRow] || [])[colIndex] || `Column_${colIndex + 1}`
                        return (
                          <td key={colIndex} className="px-3 py-2 text-gray-700 border-r border-gray-200 last:border-r-0">
                            {String(row[header?.toString()] || '').substring(0, 30)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Button */}
      <button
        onClick={handleConfirm}
        disabled={!canConfirm}
        className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors ${
          canConfirm
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        <CheckCircle className="w-4 h-4" />
        <span>Use This Data Structure</span>
      </button>
    </div>
  )
}