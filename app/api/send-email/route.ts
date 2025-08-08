import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('API route /api/send-email called')
  
  try {
    const body = await request.json()
    const { apiKey, from, to, subject, html } = body

    console.log('Email request:', { from, to, subject, hasHtml: !!html, hasApiKey: !!apiKey })

    if (!apiKey) {
      console.log('Missing API key')
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    if (!from || !to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: from, to, subject, html' },
        { status: 400 }
      )
    }

    // Call Resend API from the server
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
      }),
    })

    const responseData = await res.text()
    
    if (!res.ok) {
      console.error('Resend API error:', res.status, responseData)
      return NextResponse.json(
        { error: `Resend API error: ${res.status} - ${responseData}` },
        { status: res.status }
      )
    }

    const emailData = JSON.parse(responseData)
    
    return NextResponse.json({
      success: true,
      data: emailData
    })

  } catch (error) {
    console.error('Email API route error:', error)
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
