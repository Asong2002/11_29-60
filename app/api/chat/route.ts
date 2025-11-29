import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'No message provided' },
        { status: 400 }
      );
    }

    // 从环境变量获取API配置
    const API_KEY = process.env.VOLCANO_API_KEY;
    const VOLCANO_API_URL = process.env.VOLCANO_API_URL || 'https://ark.cn-beijing.volces.com/api/v3/bots/chat/completions';
    const MODEL_ID = process.env.VOLCANO_MODEL_ID || 'bot-20251031115408-jz6th';

    if (!API_KEY) {
      console.error('VOLCANO_API_KEY is not set');
      return NextResponse.json(
        { success: false, error: 'API key not configured' },
        { status: 500 }
      );
    }

    // 构建发送到火山引擎API的请求
    const payload = {
      model: MODEL_ID,
      stream: false,
      messages: [
        { role: 'system', content: '你是一个友好、乐于助人的AI助手Arin。' },
        { role: 'user', content: message }
      ]
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    };

    // 发送请求到火山引擎API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    let response: Response;
    try {
      response = await fetch(VOLCANO_API_URL, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { success: false, error: 'Request timeout' },
          { status: 504 }
        );
      }
      throw fetchError;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Volcano API error:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: `API request failed with status ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Volcano API response:', data);

    // 提取AI回复
    const reply = data.choices?.[0]?.message?.content || '抱歉，我无法生成回复。';

    return NextResponse.json({ success: true, response: reply });

  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// 健康检查端点
export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Chat API is running' });
}

