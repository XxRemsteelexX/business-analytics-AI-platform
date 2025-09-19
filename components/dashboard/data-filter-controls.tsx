'use client'

import { useState, useEffect } from 'react'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface DataFilterControlsProps {
  data: any[]
  onDataRangeChange: (start: number, end: number) => void
  onReset: () => void
}

export function DataFilterControls({ data, onDataRangeChange, onReset }: DataFilterControlsProps) {
  const [startIndex, setStartIndex] = useState(0)
  const [endIndex, setEndIndex] = useState(data.length > 0 ? data.length - 1 : 0)
  const [startValue, setStartValue] = useState('')
  const [endValue, setEndValue] = useState('')

  useEffect(() => {
    if (data.length > 0) {
      setEndIndex(data.length - 1)
      setEndValue((data.length - 1).toString())
    }
  }, [data])

  const handleStartIndexChange = (value: number[]) => {
    const newStartIndex = value[0]
    setStartIndex(newStartIndex)
    setStartValue(newStartIndex.toString())
    if (newStartIndex > endIndex) {
      setEndIndex(newStartIndex)
      setEndValue(newStartIndex.toString())
    }
    onDataRangeChange(newStartIndex, endIndex)
  }

  const handleEndIndexChange = (value: number[]) => {
    const newEndIndex = value[0]
    setEndIndex(newEndIndex)
    setEndValue(newEndIndex.toString())
    if (newEndIndex < startIndex) {
      setStartIndex(newEndIndex)
      setStartValue(newEndIndex.toString())
    }
    onDataRangeChange(startIndex, newEndIndex)
  }

  const handleStartValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0
    const clampedValue = Math.max(0, Math.min(value, endIndex))
    setStartIndex(clampedValue)
    setStartValue(e.target.value)
    onDataRangeChange(clampedValue, endIndex)
  }

  const handleEndValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maxValue = data.length > 0 ? data.length - 1 : 0
    const value = parseInt(e.target.value) || 0
    const clampedValue = Math.max(startIndex, Math.min(value, maxValue))
    setEndIndex(clampedValue)
    setEndValue(e.target.value)
    onDataRangeChange(startIndex, clampedValue)
  }

  const handleReset = () => {
    setStartIndex(0)
    setStartValue('0')
    if (data.length > 0) {
      setEndIndex(data.length - 1)
      setEndValue((data.length - 1).toString())
      onReset()
    }
  }

  if (data.length === 0) {
    return null
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Data Range Filter</h3>
        <Button 
          onClick={handleReset}
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reset View
        </Button>
      </div>
      
      <div className="space-y-6">
        <div>
          <div className="flex justify-between mb-2">
            <Label htmlFor="start-range" className="text-sm font-medium text-gray-700">
              Start Index
            </Label>
            <span className="text-sm text-gray-500">
              {startIndex} of {data.length - 1}
            </span>
          </div>
          <Slider
            id="start-range"
            min={0}
            max={data.length > 0 ? data.length - 1 : 0}
            step={1}
            value={[startIndex]}
            onValueChange={handleStartIndexChange}
            className="mb-2"
          />
          <Input
            type="number"
            min={0}
            max={endIndex}
            value={startValue}
            onChange={handleStartValueChange}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <Label htmlFor="end-range" className="text-sm font-medium text-gray-700">
              End Index
            </Label>
            <span className="text-sm text-gray-500">
              {endIndex} of {data.length - 1}
            </span>
          </div>
          <Slider
            id="end-range"
            min={startIndex}
            max={data.length > 0 ? data.length - 1 : 0}
            step={1}
            value={[endIndex]}
            onValueChange={handleEndIndexChange}
            className="mb-2"
          />
          <Input
            type="number"
            min={startIndex}
            max={data.length > 0 ? data.length - 1 : 0}
            value={endValue}
            onChange={handleEndValueChange}
            className="w-full"
          />
        </div>

        <div className="pt-2 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{endIndex - startIndex + 1}</span> of{' '}
            <span className="font-semibold">{data.length}</span> records
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ 
                width: `${data.length > 0 ? ((endIndex - startIndex + 1) / data.length) * 100 : 0}%`,
                marginLeft: `${data.length > 0 ? (startIndex / data.length) * 100 : 0}%`
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}