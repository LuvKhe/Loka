'use client'

import { useEffect, useRef } from 'react'

interface Props {
  value: string
  size?: number
}

// Minimal QR code display using canvas + a pure-JS encoder.
// We avoid a heavy library dependency by using the browser's built-in
// canvas. The actual QR encoding is done via the qrcode package which
// is a zero-dependency pure-JS implementation.
export default function QRCodeDisplay({ value, size = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Dynamically import to keep the bundle lean and avoid SSR issues
    import('qrcode').then((QRCode) => {
      QRCode.toCanvas(canvasRef.current!, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#111827',  // gray-900
          light: '#FFFFFF',
        },
      })
    })
  }, [value, size])

  return (
    <div className="bg-white p-3 rounded-xl border border-gray-100 inline-block">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        role="img"
        aria-label={`QR code for Loka ID ${value}`}
      >
        {`QR code for Loka ID ${value}`}
      </canvas>
    </div>
  )
}
