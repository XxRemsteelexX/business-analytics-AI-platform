
'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { 
  Upload, 
  FileSpreadsheet, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Sheet
} from 'lucide-react'
import { motion } from 'framer-motion'

interface FileUploadProps {
  onFileUploaded: (fileData: any) => void
}

export function FileUpload({ onFileUploaded }: FileUploadProps) {
  const { data: session } = useSession()
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<any>(null)
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const { toast } = useToast()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        setUploadedFile(result)
        
        // If it's an Excel file with multiple sheets, don't trigger analysis yet
        if (result.hasMultipleSheets) {
          setSelectedSheet(result.sheetNames[0]) // Default to first sheet
          toast({
            title: 'File Uploaded Successfully',
            description: `${file.name} has multiple sheets. Please select which sheet to analyze.`,
          })
        } else {
          onFileUploaded(result)
          toast({
            title: 'File Uploaded Successfully',
            description: `${file.name} has been uploaded and is ready for analysis.`,
          })
        }
      } else {
        const error = await response.json()
        toast({
          title: 'Upload Failed',
          description: error.error || 'Failed to upload file',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Upload Error',
        description: 'An unexpected error occurred during upload.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }, [onFileUploaded, toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: false,
    disabled: uploading
  })

  const handleSelectFileClick = () => {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fileInput?.click()
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-thompson-navy mb-4">
          Upload Your Data Files
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload Excel, CSV, PDF, Word, or text files to generate professional analytics 
          and insights for your executive presentations.
        </p>
      </div>

      {/* File Drop Zone */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
            transition-all duration-200 ease-in-out
            ${isDragActive 
              ? 'border-thompson-lime bg-green-50' 
              : 'border-gray-300 hover:border-thompson-blue hover:bg-blue-50'
            }
            ${uploading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-4">
            {uploading ? (
              <>
                <Loader2 className="w-16 h-16 mx-auto text-thompson-blue animate-spin" />
                <h3 className="text-lg font-semibold text-thompson-navy">
                  Processing Your File...
                </h3>
                <p className="text-gray-500">
                  Please wait while we upload and prepare your data
                </p>
              </>
            ) : uploadedFile ? (
              <>
                <CheckCircle className="w-16 h-16 mx-auto text-green-600" />
                <h3 className="text-lg font-semibold text-thompson-navy">
                  File Ready for Analysis
                </h3>
                <p className="text-gray-500">
                  {uploadedFile.originalName} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                </p>
              </>
            ) : (
              <>
                <Upload className="w-16 h-16 mx-auto text-gray-400" />
                <h3 className="text-lg font-semibold text-thompson-navy">
                  {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
                </h3>
                <p className="text-gray-500">
                  or click to browse your computer
                </p>
              </>
            )}
          </div>

          {!uploading && !uploadedFile && (
            <Button 
              className="mt-6 ceo-button-primary"
              onClick={handleSelectFileClick}
            >
              <FileSpreadsheet className="w-5 h-5 mr-2" />
              Select File
            </Button>
          )}
        </div>
      </motion.div>

      {/* Sheet Selector - Only show for Excel files with multiple sheets */}
      {uploadedFile && uploadedFile.hasMultipleSheets && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 rounded-lg p-6 border border-blue-200"
        >
          <div className="flex items-center mb-4">
            <Sheet className="w-5 h-5 text-thompson-blue mr-2" />
            <h4 className="font-semibold text-thompson-navy">
              Select Worksheet to Analyze
            </h4>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Your Excel file contains multiple worksheets. Please select which one you'd like to analyze.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="sheet-select" className="text-sm font-medium text-gray-700">
                Worksheet
              </Label>
              <Select value={selectedSheet} onValueChange={setSelectedSheet}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a worksheet" />
                </SelectTrigger>
                <SelectContent>
                  {uploadedFile.sheetNames?.map((sheetName: string) => (
                    <SelectItem key={sheetName} value={sheetName}>
                      <div className="flex items-center gap-2">
                        <Sheet className="w-4 h-4" />
                        {sheetName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => {
                const fileWithSheet = { ...uploadedFile, selectedSheet }
                onFileUploaded(fileWithSheet)
                toast({
                  title: 'Ready for Analysis',
                  description: `Selected worksheet "${selectedSheet}" from ${uploadedFile.originalName}`,
                })
              }}
              disabled={!selectedSheet}
              className="ceo-button-primary mt-6"
            >
              <Sheet className="w-4 h-4 mr-2" />
              Analyze Sheet
            </Button>
          </div>
        </motion.div>
      )}

      {/* Supported Formats */}
      <div className="bg-slate-100 rounded-lg p-6">
        <h4 className="font-semibold text-thompson-navy mb-3">
          Supported File Formats
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { ext: '.xlsx', desc: 'Excel Spreadsheets' },
            { ext: '.csv', desc: 'CSV Data Files' },
            { ext: '.pdf', desc: 'PDF Documents' },
            { ext: '.docx', desc: 'Word Documents' },
            { ext: '.txt', desc: 'Text Files' },
            { ext: '.xls', desc: 'Legacy Excel' }
          ].map((format) => (
            <div key={format.ext} className="flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-thompson-blue" />
              <span className="text-sm">
                <span className="font-mono font-semibold">{format.ext}</span> - {format.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
        <AlertCircle className="w-5 h-5 text-thompson-blue mt-0.5" />
        <div>
          <h5 className="font-medium text-thompson-navy">Secure Processing</h5>
          <p className="text-sm text-gray-600">
            Your files are processed securely and are only accessible by your account. 
            We use enterprise-grade encryption to protect your sensitive business data.
          </p>
        </div>
      </div>
    </div>
  )
}
