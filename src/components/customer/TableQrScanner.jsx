
import { useEffect, useRef, useState } from 'react'
import { BrowserQRCodeReader } from '@zxing/browser'
import { FiCamera, FiX } from 'react-icons/fi'
import { customerMenuRouteFromQr } from '../../services/customerQrScanner.js'
import './TableQrScanner.css'

export default function TableQrScanner({ onDetected, onClose }) {
  const videoRef = useRef(null)
  const detectedRef = useRef(onDetected)
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)

  detectedRef.current = onDetected

  useEffect(() => {
    let disposed = false
    let controls = null
    let detected = false

    const video = videoRef.current
    const previousFocus = document.activeElement

    const start = async () => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setError(
          'A câmera exige HTTPS ou localhost. ' +
          'Você também pode usar a câmera do celular.'
        )
        return
      }

      try {
        const reader = new BrowserQRCodeReader()

        const scannerControls = await reader.decodeFromVideoDevice(
          undefined,
          video,
          (result, _scanError, scanControls) => {
            if (disposed || detected || !result) return

            const route = customerMenuRouteFromQr(
              result.getText(),
              window.location.origin
            )

            if (!route) {
              setError(
                'Este QR Code não pertence a uma mesa deste TableHub.'
              )
              return
            }

            detected = true
            scanControls.stop()
            detectedRef.current(route)
          }
        )

        controls = scannerControls

        if (disposed) {
          controls.stop()
          return
        }

        setRunning(true)
      } catch (failure) {
        if (disposed) return

        if (failure?.name === 'NotAllowedError') {
          setError('Permissão da câmera negada. Autorize no navegador.')
        } else if (failure?.name === 'NotFoundError') {
          setError('Nenhuma câmera foi encontrada neste dispositivo.')
        } else {
          setError('Não foi possível iniciar a câmera.')
        }
      }
    }

    start()

    return () => {
      disposed = true
      controls?.stop()
      video?.srcObject?.getTracks()?.forEach(track => track.stop())
      previousFocus?.focus?.()
    }
  }, [])

  return (
    <div
      className="customer-qr-scanner__backdrop"
      onClick={onClose}
    >
      <section
        className="customer-qr-scanner"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-qr-scanner-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="customer-qr-scanner__close"
          type="button"
          onClick={onClose}
          aria-label="Fechar leitor de QR Code"
          autoFocus
        >
          <FiX />
        </button>

        <div className="customer-qr-scanner__eyebrow">
          <FiCamera /> LEITURA DA MESA
        </div>

        <h2 id="customer-qr-scanner-title">
          Escaneie o QR Code
        </h2>

        <p>
          Aponte a câmera para o código disponível
          na mesa do restaurante.
        </p>

        <div className="customer-qr-scanner__preview">
          <video
            ref={videoRef}
            muted
            autoPlay
            playsInline
            aria-label="Câmera para leitura do QR Code"
          />
          <span
            className="customer-qr-scanner__target"
            aria-hidden="true"
          />
        </div>

        {!running && !error && (
          <p role="status">Iniciando câmera...</p>
        )}

        {error && (
          <p className="customer-qr-scanner__error" role="alert">
            {error}
          </p>
        )}

        {running && !error && (
          <p className="customer-qr-scanner__hint">
            Aponte a câmera para o QR Code gerado em Mesas.
          </p>
        )}

        <button
          className="th-btn th-btn--glass th-btn--block"
          type="button"
          onClick={onClose}
        >
          Voltar
        </button>
      </section>
    </div>
  )
}
