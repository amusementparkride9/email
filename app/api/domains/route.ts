import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiKey } = body

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    // Call Resend API from the server
    const res = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    const responseData = await res.text()
    
    if (!res.ok) {
      console.error('Resend domains API error:', res.status, responseData)
      return NextResponse.json(
        { error: `Resend API error: ${res.status} - ${responseData}` },
        { status: res.status }
      )
    }

    const domainsData = JSON.parse(responseData)
    
    return NextResponse.json({
      success: true,
      data: domainsData
    })

  } catch (error) {
    console.error('Domains API route error:', error)
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
