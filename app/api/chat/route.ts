
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {

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

IMPORTANT: If the user requests a chart or visualization, you MUST respond with ONLY valid JSON in this exact format:
{
  "content": "Your analysis and explanation here",
  "chartData": {
    "id": "unique_id",
    "title": "Professional Chart Title", 
    "type": "bar|line|pie|scatter",
    "data": [{"name": "Category", "value": 100}]
  }
}

Do not include any text before or after the JSON. Start your response with { and end with }.

Otherwise, provide a regular text response with insights and recommendations.

Current user question: ${message}`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(chatHistory || []).slice(-5).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    // Use Azure OpenAI if available, otherwise fallback to OpenAI
    const useAzure = process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY
    const apiUrl = useAzure
      ? `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_DEPLOYMENT_NAME || 'gpt-35-turbo'}/chat/completions?api-version=${process.env.AZURE_OPENAI_VERSION || '2024-02-01'}`
      : 'https://api.openai.com/v1/chat/completions'

    const headers = useAzure
      ? {
          'Content-Type': 'application/json',
          'api-key': process.env.AZURE_OPENAI_API_KEY!
        }
      : {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: messages,
        max_tokens: 1500,
        temperature: 0.3,
        response_format: { type: "text" }
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
