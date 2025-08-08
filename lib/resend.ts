export type ResendEmailInput = {
  from: string
  to: string
  subject: string
  html: string
}

export async function sendWithResend(apiKey: string, input: ResendEmailInput) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Resend error ${res.status}: ${text}`)
  }
  return res.json()
}

export async function listResendDomains(apiKey: string) {
  const res = await fetch('https://api.resend.com/domains', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Resend error ${res.status}: ${text}`)
  }
  return res.json() as Promise<{ data: { id: string; name: string; status: string }[] }>
}
