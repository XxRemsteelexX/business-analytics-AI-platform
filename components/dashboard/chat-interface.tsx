
'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { 
  Send, 
  MessageSquare, 
  Bot,
  User,
  BarChart3,
  Loader2,
  Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'

// Dynamic import for charts
const ProfessionalCharts = dynamic(() => import('./professional-charts'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
})

interface ChatInterfaceProps {
  fileData: any
  analysisData: any
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  chartData?: any
  isGenerating?: boolean
}

export function ChatInterface({ fileData, analysisData }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Add welcome message
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Hello! I'm your AI analytics assistant. I can help you generate custom visualizations and insights from your data. ${fileData ? `I see you've uploaded "${fileData.originalName}".` : ''} What would you like to explore?`,
        timestamp: new Date()
      }])
    }
  }, [fileData])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsGenerating(true)

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'Analyzing your request...',
      timestamp: new Date(),
      isGenerating: true
    }

    setMessages(prev => [...prev, loadingMessage])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue.trim(),
          fileData,
          analysisData,
          chatHistory: messages
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No reader available')
      }
      
      const decoder = new TextDecoder()
      let aiResponseContent = ''
      let buffer = ''
      let partialRead = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        partialRead += decoder.decode(value, { stream: true })
        let lines = partialRead.split('\n')
        partialRead = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              // Stream finished
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === loadingMessage.id 
                    ? { ...msg, content: aiResponseContent, isGenerating: false }
                    : msg
                )
              )
              return
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.status === 'processing') {
                // Update loading message
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === loadingMessage.id 
                      ? { ...msg, content: parsed.message || 'Generating response...' }
                      : msg
                  )
                )
              } else if (parsed.status === 'completed') {
                // Final response received
                const finalMessage: ChatMessage = {
                  id: loadingMessage.id,
                  role: 'assistant',
                  content: parsed.result.content || 'Analysis complete.',
                  timestamp: new Date(),
                  chartData: parsed.result.chartData,
                  isGenerating: false
                }

                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === loadingMessage.id ? finalMessage : msg
                  )
                )
                return
              } else if (parsed.status === 'error') {
                throw new Error(parsed.message || 'AI generation failed')
              }
            } catch (e) {
              // Skip invalid JSON
              continue
            }
          }
        }
      }

    } catch (error) {
      console.error('Chat error:', error)
      
      // Remove loading message and add error message
      setMessages(prev => 
        prev.filter(msg => msg.id !== loadingMessage.id).concat([{
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: 'I apologize, but I encountered an error while processing your request. Please try again or rephrase your question.',
          timestamp: new Date()
        }])
      )

      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileSelectClick = () => {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fileInput?.click()
  }

  const suggestedQuestions = [
    'Create a trend analysis chart',
    'Show me the top 5 categories',
    'Generate a comparison chart',
    'What are the key patterns?',
    'Create a summary dashboard'
  ]

  if (!fileData) {
    return (
      <div className="text-center py-12">
        <Bot className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          AI Assistant Ready
        </h3>
        <p className="text-gray-500 mb-6">
          Upload a file first to start generating custom insights and visualizations.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px]">
      {/* Chat Header */}
      <div className="flex items-center p-4 border-b bg-slate-50 rounded-t-lg">
        <Bot className="w-6 h-6 text-thompson-blue mr-3" />
        <div>
          <h3 className="font-semibold text-thompson-navy">AI Analytics Assistant</h3>
          <p className="text-sm text-gray-600">
            Ask me to create custom charts and insights from "{fileData.originalName}"
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                max-w-[80%] rounded-lg p-4 
                ${message.role === 'user' 
                  ? 'bg-thompson-gradient text-white' 
                  : 'bg-white border border-gray-200'
                }
              `}>
                <div className="flex items-start space-x-2">
                  {message.role === 'assistant' && (
                    <Bot className="w-5 h-5 text-thompson-blue mt-0.5 flex-shrink-0" />
                  )}
                  {message.role === 'user' && (
                    <User className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm ${message.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                      {message.content}
                      {message.isGenerating && (
                        <Loader2 className="w-4 h-4 inline-block ml-2 animate-spin" />
                      )}
                    </p>
                    <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                    
                    {/* Render chart if present */}
                    {message.chartData && (
                      <div className="mt-4 bg-white rounded-lg p-4">
                        <ProfessionalCharts charts={[message.chartData]} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <div className="p-4 border-t bg-slate-50">
          <p className="text-sm text-gray-600 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question) => (
              <button
                key={question}
                onClick={() => setInputValue(question)}
                className="text-xs px-3 py-1 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
              >
                <Sparkles className="w-3 h-3 inline-block mr-1" />
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t bg-white rounded-b-lg">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to create charts, analyze trends, or generate insights..."
            disabled={isGenerating}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isGenerating}
            className="ceo-button-accent px-4"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
