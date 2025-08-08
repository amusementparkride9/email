export type ResendEmailInput = {
  from: string
  to: string
  subject: string
  html: string
}

export async function sendWithResend(apiKey: string, input: ResendEmailInput) {
  console.log('sendWithResend called - using API route /api/send-email')
  
  // Use our Next.js API route instead of calling Resend directly
  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey,
      ...input,
    }),
  })
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `API error ${res.status}`)
  }
  
  const result = await res.json()
  return result.data
}

export async function listResendDomains(apiKey: string) {
  // Use our Next.js API route instead of calling Resend directly
  const res = await fetch('/api/domains', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ apiKey }),
  })
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `API error ${res.status}`)
  }
  
  const result = await res.json()
  return result.data as { data: { id: string; name: string; status: string }[] }
}
