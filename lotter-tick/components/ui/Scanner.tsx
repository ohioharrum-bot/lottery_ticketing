'use client'

import { useEffect, useRef } from 'react'
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library'

interface ScannerProps {
  onScan: (value: string) => void
  onClose: () => void
}

export default function Scanner({ onScan, onClose }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)

  useEffect(() => {
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.EAN_13,
      BarcodeFormat.UPC_A,
      BarcodeFormat.ITF,
      BarcodeFormat.CODE_93,
    ])
    hints.set(DecodeHintType.TRY_HARDER, true)

    const reader = new BrowserMultiFormatReader(hints)
    readerRef.current = reader

    reader.decodeFromConstraints(
      {
        audio: false,
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      videoRef.current!,
      (result, error) => {
        if (result) {
          onScan(result.getText())
          reader.reset()
        }
      }
    ).catch(err => console.error(err))

    return () => {
      reader.reset()
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-4">
        <p className="text-white text-sm font-medium">Point at barcode lines</p>
        <button
          onClick={onClose}
          className="text-white text-sm border border-white/30 px-3 py-1.5 rounded-lg"
        >
          Cancel
        </button>
      </div>

      <div className="flex-1 relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-72 h-24 border-2 border-white rounded-lg" />
        </div>
      </div>

      <div className="px-4 py-6">
        <p className="text-white/50 text-xs text-center">
          Align the barcode inside the box — hold steady
        </p>
      </div>
    </div>
  )
}