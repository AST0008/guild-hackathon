export interface PaymentQRData {
  id: string
  customerId: string
  customerName: string
  policyNumber: string
  amount: number
  dueDate: string
  description: string
  paymentUrl: string
  expiresAt: string
  status: "active" | "paid" | "expired"
  createdAt: string
}

export interface QRCodeOptions {
  size: number
  backgroundColor: string
  foregroundColor: string
  errorCorrectionLevel: "L" | "M" | "Q" | "H"
}

export const defaultQROptions: QRCodeOptions = {
  size: 256,
  backgroundColor: "#ffffff",
  foregroundColor: "#000000",
  errorCorrectionLevel: "M",
}

export function generatePaymentData(
  customerId: string,
  customerName: string,
  policyNumber: string,
  amount: number,
  description: string,
  dueDate: string,
): PaymentQRData {
  const id = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now

  // In a real app, this would be your actual payment gateway URL
  const paymentUrl = `https://pay.MintLoop.com/payment/${id}?amount=${amount}&customer=${customerId}&policy=${policyNumber}`

  return {
    id,
    customerId,
    customerName,
    policyNumber,
    amount,
    dueDate,
    description,
    paymentUrl,
    expiresAt,
    status: "active",
    createdAt: new Date().toISOString(),
  }
}

export function generateQRCodeDataURL(data: string, options: QRCodeOptions = defaultQROptions): string {
  // In a real app, you would use a QR code library like 'qrcode' or 'qr-code-generator'
  // For this demo, we'll create a placeholder SVG that looks like a QR code
  const { size, backgroundColor, foregroundColor } = options

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
      <!-- QR Code pattern simulation -->
      <g fill="${foregroundColor}">
        <!-- Corner markers -->
        <rect x="0" y="0" width="56" height="56"/>
        <rect x="8" y="8" width="40" height="40" fill="${backgroundColor}"/>
        <rect x="16" y="16" width="24" height="24"/>
        
        <rect x="${size - 56}" y="0" width="56" height="56"/>
        <rect x="${size - 48}" y="8" width="40" height="40" fill="${backgroundColor}"/>
        <rect x="${size - 40}" y="16" width="24" height="24"/>
        
        <rect x="0" y="${size - 56}" width="56" height="56"/>
        <rect x="8" y="${size - 48}" width="40" height="40" fill="${backgroundColor}"/>
        <rect x="16" y="${size - 40}" width="24" height="24"/>
        
        <!-- Data pattern simulation -->
        ${Array.from({ length: 20 }, (_, i) =>
          Array.from({ length: 20 }, (_, j) => {
            const x = 70 + j * 8
            const y = 70 + i * 8
            const shouldFill = (i + j + data.length) % 3 === 0
            return shouldFill ? `<rect x="${x}" y="${y}" width="6" height="6"/>` : ""
          }).join(""),
        ).join("")}
      </g>
      <!-- Data encoding hint -->
      <text x="${size / 2}" y="${size + 20}" text-anchor="middle" font-family="monospace" font-size="10" fill="${foregroundColor}">
        ${data.substring(0, 30)}${data.length > 30 ? "..." : ""}
      </text>
    </svg>
  `

  return `data:image/svg+xml;base64,${btoa(svg)}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function isQRCodeExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date()
}
