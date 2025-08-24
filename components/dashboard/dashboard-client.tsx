
'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { DashboardHeader } from './dashboard-header'
import { FileUpload } from './file-upload'
import { AnalysisResults } from './analysis-results'
import { ChatInterface } from './chat-interface'
import { 
  Upload, 
  BarChart3, 
  MessageSquare,
  FileText,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'

export function DashboardClient() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'upload' | 'analysis' | 'chat'>('upload')
  const [currentFile, setCurrentFile] = useState<any>(null)
  const [analysisData, setAnalysisData] = useState<any>(null)

  const user = session?.user as any

  const handleFileUploaded = (fileData: any) => {
    setCurrentFile(fileData)
    setActiveTab('analysis')
  }

  const handleAnalysisComplete = (data: any) => {
    setAnalysisData(data)
  }

  const tabItems = [
    {
      id: 'upload' as const,
      label: 'Upload Data',
      icon: Upload,
      description: 'Upload Excel or CSV files for analysis'
    },
    {
      id: 'analysis' as const,
      label: 'Analytics',
      icon: BarChart3,
      description: 'View charts and insights'
    },
    {
      id: 'chat' as const,
      label: 'AI Assistant',
      icon: MessageSquare,
      description: 'Generate custom visualizations'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="ceo-card p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-thompson-navy">
                  Welcome back, {user?.firstName || 'Executive'}
                </h1>
                <p className="text-gray-600 mt-2">
                  Transform your data into executive-ready insights
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Current Role</div>
                  <div className="font-semibold text-thompson-navy">
                    {user?.jobTitle || 'Executive'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Organization</div>
                  <div className="font-semibold text-thompson-navy">
                    {user?.companyName || 'Thompson PMC'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="ceo-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-thompson-blue" />
                <div className="ml-4">
                  <div className="text-2xl font-bold text-thompson-navy">0</div>
                  <div className="text-sm text-gray-600">Files Analyzed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="ceo-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-thompson-lime" />
                <div className="ml-4">
                  <div className="text-2xl font-bold text-thompson-navy">0</div>
                  <div className="text-sm text-gray-600">Charts Generated</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="ceo-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-thompson-blue" />
                <div className="ml-4">
                  <div className="text-2xl font-bold text-thompson-navy">0</div>
                  <div className="text-sm text-gray-600">Insights Generated</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center p-4 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'thompson-gradient text-white shadow-lg'
                    : 'bg-white hover:bg-slate-50 text-gray-700 border-2 border-gray-200'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">{tab.label}</div>
                  <div className="text-sm opacity-80">{tab.description}</div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="ceo-card p-8"
        >
          {activeTab === 'upload' && (
            <FileUpload onFileUploaded={handleFileUploaded} />
          )}
          
          {activeTab === 'analysis' && (
            <AnalysisResults 
              fileData={currentFile}
              onAnalysisComplete={handleAnalysisComplete}
            />
          )}
          
          {activeTab === 'chat' && (
            <ChatInterface 
              fileData={currentFile}
              analysisData={analysisData}
            />
          )}
        </motion.div>
      </div>
    </div>
  )
}
