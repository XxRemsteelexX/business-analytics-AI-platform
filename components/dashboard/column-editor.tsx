
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Edit, Save, X, Settings } from 'lucide-react'
import { friendlyLabel } from '@/lib/chart-utils'

interface ColumnMapping {
  original: string
  friendly: string
  edited: boolean
}

interface ColumnEditorProps {
  columns: string[]
  onMappingChange?: (mapping: Record<string, string>) => void
}

export function ColumnEditor({ columns, onMappingChange }: ColumnEditorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mappings, setMappings] = useState<ColumnMapping[]>(
    columns.map(col => ({
      original: col,
      friendly: friendlyLabel(col),
      edited: false
    }))
  )
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleEdit = (index: number) => {
    setEditingIndex(index)
    setEditValue(mappings[index].friendly)
  }

  const handleSave = (index: number) => {
    const newMappings = [...mappings]
    newMappings[index] = {
      ...newMappings[index],
      friendly: editValue,
      edited: true
    }
    setMappings(newMappings)
    setEditingIndex(null)

    // Notify parent of mapping changes
    const mappingDict = newMappings.reduce((acc, mapping) => {
      if (mapping.edited) {
        acc[mapping.original] = mapping.friendly
      }
      return acc
    }, {} as Record<string, string>)
    
    onMappingChange?.(mappingDict)
  }

  const handleCancel = () => {
    setEditingIndex(null)
    setEditValue('')
  }

  const resetToDefaults = () => {
    const defaultMappings = columns.map(col => ({
      original: col,
      friendly: friendlyLabel(col),
      edited: false
    }))
    setMappings(defaultMappings)
    onMappingChange?.({})
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Edit Column Names
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-h2">Column Name Editor</DialogTitle>
          <p className="text-sm text-gray-600">
            Customize how column names appear in charts and reports. Changes will be saved for future uploads.
          </p>
        </DialogHeader>
        
        <div className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">
              {mappings.filter(m => m.edited).length} of {mappings.length} columns customized
            </p>
            <Button variant="outline" size="sm" onClick={resetToDefaults}>
              Reset to Defaults
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Original Column Name</TableHead>
                  <TableHead className="w-1/3">Display Name</TableHead>
                  <TableHead className="w-1/6">Status</TableHead>
                  <TableHead className="w-1/6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping, index) => (
                  <TableRow key={mapping.original}>
                    <TableCell>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {mapping.original}
                      </code>
                    </TableCell>
                    <TableCell>
                      {editingIndex === index ? (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave(index)
                            if (e.key === 'Escape') handleCancel()
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className={mapping.edited ? 'font-medium text-thompson-navy' : ''}>
                          {mapping.friendly}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded ${
                        mapping.edited 
                          ? 'bg-thompson-lime text-thompson-navy' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {mapping.edited ? 'Custom' : 'Default'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {editingIndex === index ? (
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleSave(index)}
                          >
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={handleCancel}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleEdit(index)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
            <Button className="ceo-button-primary" onClick={() => setIsOpen(false)}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
