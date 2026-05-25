'use client'

import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface ScannerProps {
  onScan: (value: string) => void
  onClose: () => void
}

export default function Scanner({ onScan, onClose }: ScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    let isMounted = true
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Success callback
            onScan(decodedText)
            scanner.stop().catch(err => console.error("Failed to stop scanner", err))
          },
          undefined
        )
        
        // If unmounted while starting, stop it now
        if (!isMounted) {
          await scanner.stop()
        }
      } catch (err) {
        console.error("Scanner start error:", err)
      }
    }

    startScanner()

    return () => {
      isMounted = false
      try {
        scanner.stop().catch(() => {})
      } catch (e) {}
    }
  }, [onScan])

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-4">
        <p className="text-white text-sm font-medium">Scan QR code on the book</p>
        <button
          onClick={onClose}
          className="text-white text-sm border border-white/30 px-3 py-1.5 rounded-lg"
        >
          Cancel
        </button>
      </div>
      <div id="qr-reader" className="flex-1" />
      <div className="px-4 py-6">
        <p className="text-white/50 text-xs text-center">
          Point at the QR code sticker on the book
        </p>
      </div>
    </div>
  )
}
