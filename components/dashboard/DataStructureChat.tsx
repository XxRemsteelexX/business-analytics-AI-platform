'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, Send, Bot, User, CheckCircle, Loader2 } from 'lucide-react'

interface Message {
  type: 'ai' | 'user'
  content: string
  timestamp: Date
}

interface DataStructureChatProps {
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

export function DataStructureChat({ rawData, sheetName, onDataStructureIdentified }: DataStructureChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [dataStructure, setDataStructure] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Start the conversation
    startConversation()
  }, [])

  const startConversation = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'system',
            content: `You are a smart data assistant. FIRST analyze the data structure thoroughly, then ask informed questions.

ANALYZE THIS DATA CAREFULLY:

Sheet: ${sheetName}
Total rows: ${rawData.length}

Full data structure:
${rawData.slice(0, 15).map((row, i) => `Row ${i+1}: ${row.map(cell => String(cell || '').substring(0, 40)).join(' | ')}`).join('\\n')}

YOUR ANALYSIS PROCESS:
1. EXAMINE the data patterns - look for titles, headers, actual data, empty rows
2. IDENTIFY potential header rows (rows with column names)
3. FIND where actual data starts and ends
4. NOTICE data types in each column

THEN ask the user simple, specific questions using examples from their actual data:
- "I can see Row X has: 'Name | Date | Amount' - are these your column headers?"
- "It looks like your data starts at Row Y with: 'John | 2024-01-01 | 100' - is this correct?"

Be conversational and show them exactly what you see in their data.`
          }]
        })
      })

      if (response.ok) {
        const data = await response.json()
        addMessage('ai', data.content)
      } else {
        addMessage('ai', "Hi! I'm here to help you understand your data structure. Looking at your file, I can see it has multiple rows. Can you tell me which row contains your column headers (the names of your data columns)?")
      }
    } catch (error) {
      addMessage('ai', "Hi! I'm here to help you understand your data structure. Looking at your file, I can see it has multiple rows. Can you tell me which row contains your column headers (the names of your data columns)?")
    }
    
    setIsLoading(false)
  }

  const addMessage = (type: 'ai' | 'user', content: string) => {
    setMessages(prev => [...prev, {
      type,
      content,
      timestamp: new Date()
    }])
  }

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return

    const message = userInput.trim()
    setUserInput('')
    addMessage('user', message)
    setIsLoading(true)

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.type === 'ai' ? 'assistant' : 'user',
        content: msg.content
      }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are helping identify data structure for this file data:
              
Sheet: ${sheetName}
Total rows: ${rawData.length}

Data preview:
${rawData.slice(0, 10).map((row, i) => `Row ${i+1}: ${row.map(cell => String(cell || '').substring(0, 20)).join(' | ')}`).join('\\n')}

Continue the conversation to identify:
1. Header row number (which row has column names)
2. Data start row (first row with actual data)  
3. Data end row (last row with data to include)
4. Which columns to include

When you have enough information, respond with "STRUCTURE_IDENTIFIED:" followed by JSON:
{
  "headerRow": number,
  "dataStartRow": number, 
  "dataEndRow": number,
  "columnIndexes": [array of column numbers to include],
  "summary": "explanation of the structure"
}

Otherwise, ask follow-up questions to clarify the structure.`
            },
            ...conversationHistory,
            {
              role: 'user',
              content: message
            }
          ]
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Check if AI has identified the structure
        if (data.content.includes('STRUCTURE_IDENTIFIED:')) {
          const jsonPart = data.content.split('STRUCTURE_IDENTIFIED:')[1]
          try {
            const structure = JSON.parse(jsonPart.trim())
            processDataStructure(structure)
            addMessage('ai', structure.summary + "\\n\\nPerfect! I'll process your data with this structure now.")
          } catch (e) {
            addMessage('ai', data.content)
          }
        } else {
          addMessage('ai', data.content)
        }
      } else {
        addMessage('ai', "I'm having trouble processing that. Can you please clarify which row contains your column headers?")
      }
    } catch (error) {
      addMessage('ai', "Sorry, I'm having trouble understanding. Could you tell me which row number contains your column headers?")
    }
    
    setIsLoading(false)
  }

  const processDataStructure = (structure: any) => {
    const { headerRow, dataStartRow, dataEndRow, columnIndexes } = structure
    
    // Convert raw data to structured data
    const headers = rawData[headerRow] || []
    const dataRows = rawData.slice(dataStartRow, dataEndRow + 1)
    
    const processedData = dataRows.map(row => {
      const obj: any = {}
      columnIndexes.forEach((colIndex: number) => {
        const header = headers[colIndex] || `Column_${colIndex + 1}`
        const value = row?.[colIndex] || ''
        obj[header] = value
      })
      return obj
    })

    onDataStructureIdentified({
      headerRow,
      dataStartRow, 
      dataEndRow,
      selectedColumns: columnIndexes,
      processedData
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
          <MessageCircle className="w-5 h-5 mr-2" />
          Data Structure Assistant
        </h3>
        <p className="text-sm text-blue-700">
          I'll help you identify the structure of your data by asking a few questions.
        </p>
      </div>

      {/* Chat Messages */}
      <div className="bg-white border border-gray-200 rounded-lg h-96 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <div className="flex items-start space-x-2">
                  {message.type === 'ai' && <Bot className="w-4 h-4 mt-1 flex-shrink-0" />}
                  {message.type === 'user' && <User className="w-4 h-4 mt-1 flex-shrink-0" />}
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4" />
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your response..."
              className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={1}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!userInput.trim() || isLoading}
              size="sm"
              className="px-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}