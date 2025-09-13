'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, Bot, ArrowRight, Table } from 'lucide-react'

interface SmartDataSelectorProps {
  rawData: any[][]
  sheetName: string
  onDataStructureIdentified: (structure: {
    headerRow: number
    dataStartRow: number
    dataEndRow: number
    selectedColumns: number[]
    processedData: any[]
  }) => void
}

export function SmartDataSelector({ rawData, sheetName, onDataStructureIdentified }: SmartDataSelectorProps) {
  const [step, setStep] = useState<'analyzing' | 'header' | 'columns' | 'done'>('analyzing')
  const [aiSuggestion, setAiSuggestion] = useState<string>('')
  const [headerOptions, setHeaderOptions] = useState<number[]>([])
  const [selectedHeaderRow, setSelectedHeaderRow] = useState<number>(-1)
  const [columnOptions, setColumnOptions] = useState<{index: number, name: string, type: string}[]>([])
  const [selectedColumns, setSelectedColumns] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    analyzeDataWithAI()
  }, [])

  const analyzeDataWithAI = async () => {
    setIsLoading(true)
    setStep('analyzing')
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `You are a data analyst. Analyze this spreadsheet data and provide suggestions.

Data preview (first 15 rows):
${rawData.slice(0, 15).map((row, i) => `Row ${i+1}: ${row.map(cell => String(cell || '').substring(0, 30)).join(' | ')}`).join('\n')}

TASK: Identify potential header rows and suggest which columns to analyze.

Respond with JSON only:
{
  "suggestion": "Brief explanation of what you found",
  "headerOptions": [list of row numbers that could be headers, 0-indexed],
  "bestHeaderRow": number,
  "columnSuggestions": [
    {"index": 0, "name": "column name", "type": "numeric|categorical|date", "reason": "why this column is useful"}
  ]
}

Focus on business-relevant columns with data that can be visualized.`,
          chatHistory: []
        })
      })

      if (response.ok) {
        const data = await response.json()
        try {
          // Try to parse the AI response content as JSON
          const aiResponse = data.result?.content || data.content || ''
          const analysis = JSON.parse(aiResponse)
          
          setAiSuggestion(analysis.suggestion)
          setHeaderOptions(analysis.headerOptions || [])
          setSelectedHeaderRow(analysis.bestHeaderRow || 0)
          setColumnOptions(analysis.columnSuggestions || [])
          
          setStep('header')
        } catch (e) {
          console.error('AI response parsing error:', e, data)
          fallbackAnalysis()
        }
      } else {
        fallbackAnalysis()
      }
    } catch (error) {
      console.error('AI analysis error:', error)
      fallbackAnalysis()
    }
    
    setIsLoading(false)
  }

  const fallbackAnalysis = () => {
    // Simple fallback analysis
    const possibleHeaders = []
    for (let i = 0; i < Math.min(5, rawData.length); i++) {
      const row = rawData[i] || []
      const nonEmptyCount = row.filter(cell => cell && String(cell).trim()).length
      if (nonEmptyCount >= 2) {
        possibleHeaders.push(i)
      }
    }
    
    setHeaderOptions(possibleHeaders)
    setSelectedHeaderRow(possibleHeaders[0] || 0)
    
    // Generate column options from selected header row
    const headerRow = rawData[possibleHeaders[0] || 0] || []
    const columns = headerRow.map((header, index) => ({
      index,
      name: String(header || `Column ${index + 1}`),
      type: 'unknown' as const,
      reason: 'Available for analysis'
    }))
    
    setColumnOptions(columns)
    setAiSuggestion("I found your data structure. Please confirm the header row and select columns to analyze.")
    setStep('header')
  }

  const handleHeaderSelection = (rowIndex: number) => {
    setSelectedHeaderRow(rowIndex)
    
    // Update column options based on selected header
    const headerRow = rawData[rowIndex] || []
    const updatedColumns = headerRow.map((header, index) => ({
      index,
      name: String(header || `Column ${index + 1}`),
      type: columnOptions.find(col => col.index === index)?.type || 'unknown',
      reason: columnOptions.find(col => col.index === index)?.reason || 'Available for analysis'
    }))
    
    setColumnOptions(updatedColumns)
    setStep('columns')
  }

  const handleColumnToggle = (colIndex: number) => {
    setSelectedColumns(prev => 
      prev.includes(colIndex)
        ? prev.filter(c => c !== colIndex)
        : [...prev, colIndex]
    )
  }

  const handleFinish = () => {
    const headerRow = rawData[selectedHeaderRow] || []
    const dataStartRow = selectedHeaderRow + 1
    const dataEndRow = rawData.length - 1
    
    // Create processed data
    const dataRows = rawData.slice(dataStartRow)
    const processedData = dataRows.map(row => {
      const obj: any = {}
      selectedColumns.forEach(colIndex => {
        const header = String(headerRow[colIndex] || `Column_${colIndex + 1}`)
        const value = row?.[colIndex] || ''
        obj[header] = value
      })
      return obj
    }).filter(row => Object.values(row).some(val => val))

    onDataStructureIdentified({
      headerRow: selectedHeaderRow,
      dataStartRow,
      dataEndRow,
      selectedColumns,
      processedData
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'numeric': return '🔢'
      case 'date': return '📅'
      case 'categorical': return '📝'
      default: return '📊'
    }
  }

  if (step === 'analyzing' || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Bot className="w-8 h-8 text-blue-600 animate-pulse" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">AI is analyzing your data...</h3>
          <p className="text-sm text-gray-600">Finding headers and identifying useful columns</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* AI Suggestion */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Bot className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">AI Analysis</h3>
            <p className="text-sm text-blue-800 mt-1">{aiSuggestion}</p>
          </div>
        </div>
      </div>

      {step === 'header' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📋 Select Header Row
          </h3>
          <p className="text-sm text-gray-600 mb-4">Which row contains your column names?</p>
          
          <div className="space-y-2">
            {headerOptions.map(rowIndex => (
              <button
                key={rowIndex}
                onClick={() => handleHeaderSelection(rowIndex)}
                className={`w-full p-4 text-left border rounded-lg transition-colors ${
                  selectedHeaderRow === rowIndex
                    ? 'bg-blue-50 border-blue-300 text-blue-900'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Row {rowIndex + 1}</div>
                    <div className="text-sm text-gray-600 truncate">
                      {(rawData[rowIndex] || []).slice(0, 4).map(cell => 
                        String(cell || '').substring(0, 15)
                      ).join(' | ')}
                      {(rawData[rowIndex] || []).length > 4 && '...'}
                    </div>
                  </div>
                  {selectedHeaderRow === rowIndex && (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'columns' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📊 Select Columns to Analyze
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Choose the columns you want to visualize ({selectedColumns.length} selected)
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {columnOptions.map(col => (
              <button
                key={col.index}
                onClick={() => handleColumnToggle(col.index)}
                className={`p-4 text-left border rounded-lg transition-colors ${
                  selectedColumns.includes(col.index)
                    ? 'bg-green-50 border-green-300 text-green-900'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium flex items-center">
                      {getTypeIcon(col.type)} {col.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Column {col.index + 1} • {col.type}
                    </div>
                    {col.reason && (
                      <div className="text-xs text-gray-600 mt-1 italic">
                        {col.reason}
                      </div>
                    )}
                  </div>
                  {selectedColumns.includes(col.index) && (
                    <CheckCircle className="w-5 h-5 text-green-600 ml-2" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={() => setStep('header')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to header selection
            </button>
            
            <Button
              onClick={handleFinish}
              disabled={selectedColumns.length === 0}
              className="flex items-center space-x-2"
            >
              <span>Generate Charts</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}