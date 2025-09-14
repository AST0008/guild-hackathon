import { NextResponse } from 'next/server'
import htmlPdf from 'html-pdf'

export async function POST(request: Request): Promise<Response> {
  const { html } = await request.json()
  console.log('html', html);
  

  return new Promise<Response>((resolve) => {
    htmlPdf.create(html).toBuffer((err, buffer) => {
      if (err) {
        return resolve(
          NextResponse.json({ message: 'PDF generation failed' }, { status: 500 })
        )
      }

      return resolve(
        new NextResponse(buffer as any, {
          headers: { 'Content-Type': 'application/pdf' }
        })
      )
    })
  })
}

