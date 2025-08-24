
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, fileData, analysisData, chatHistory } = await request.json()

    // Prepare context for the AI
    let contextInfo = ''
    if (analysisData?.dataInfo) {
      contextInfo = `
DATASET CONTEXT:
- File: ${fileData?.originalName || 'Unknown'}
- Rows: ${analysisData.dataInfo.rowCount}
- Columns: ${analysisData.dataInfo.columnCount}
- Column names: ${analysisData.dataInfo.columns?.join(', ')}
- Numeric columns: ${analysisData.dataInfo.numericColumns?.join(', ')}
- Categorical columns: ${analysisData.dataInfo.categoricalColumns?.join(', ')}
`
    }

    const systemPrompt = `You are an expert business analyst and data visualization specialist for Thompson PMC executives. Your role is to help create professional charts, analyze data trends, and provide executive-level insights.

${contextInfo}

Guidelines:
1. Provide concise, executive-level responses suitable for CEO presentations
2. When creating charts, suggest specific chart types (bar, line, pie, scatter) that would be most effective
3. Focus on business insights and actionable intelligence
4. Use professional, confident language appropriate for executive audiences
5. If the user asks for a specific chart, provide both the analysis and chart recommendation

If the user requests a chart or visualization, respond with JSON in this format:
{
  "content": "Your analysis and explanation here",
  "chartData": {
    "id": "unique_id",
    "title": "Professional Chart Title",
    "type": "bar|line|pie|scatter",
    "data": [{"name": "Category", "value": 100}]
  }
}

Otherwise, provide a regular text response with insights and recommendations.

Current user question: ${message}`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.slice(-5).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY || 'gsk_demo_key_use_your_own'}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: messages,
        max_tokens: 1500,
        temperature: 0.7
      }),
    })

    const result = await response.json()
    const aiResponse = result.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.'

    // Try to parse as JSON for chart data
    let finalResult
    try {
      const jsonResult = JSON.parse(aiResponse)
      finalResult = {
        content: jsonResult.content || aiResponse,
        chartData: jsonResult.chartData || null
      }
    } catch (e) {
      finalResult = {
        content: aiResponse,
        chartData: null
      }
    }

    return NextResponse.json({
      status: 'completed',
      result: finalResult
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}
