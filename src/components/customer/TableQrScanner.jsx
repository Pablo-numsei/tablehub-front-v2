import { useEffect, useRef, useState } from 'react'
import { FiCamera, FiX } from 'react-icons/fi'
import { customerMenuRouteFromQr } from '../../services/customerQrScanner.js'
import './TableQrScanner.css'

// A leitura não concede acesso à mesa: o menu troca o QR por um token validado no backend.
export default function TableQrScanner({ onDetected, onClose }) {
  const videoRef = useRef(null)
  const detectedRef = useRef(onDetected)
  detectedRef.current = onDetected
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)

  useEffect(() => {
    let disposed = false
    let stream = null
    let scanTimer = null
    const previousFocus = document.activeElement
    const video = videoRef.current

    const stop = () => {
      disposed = true
      window.clearTimeout(scanTimer)
      video?.pause()
      if (video) video.srcObject = null
      stream?.getTracks().forEach((track) => track.stop())
    }

    const start = async () => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setError('Para usar a câmera no site, acesse o TableHub por HTTPS. Você também pode escanear o QR Code com a câmera do celular.')
        return
      }
      if (typeof window.BarcodeDetector !== 'function') {
        setError('Seu navegador não oferece leitura de QR Code integrada. Abra a câmera do celular e escaneie o QR Code da mesa.')
        return
      }

      try {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' } },
        })
        if (disposed) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        video.srcObject = stream
        await video.play()
        if (disposed) return
        setRunning(true)

        const scan = async () => {
          if (disposed) return
          try {
            if (video.readyState >= 2) {
              const codes = await detector.detect(video)
              if (disposed) return
              for (const code of codes) {
                const route = customerMenuRouteFromQr(code.rawValue, window.location.origin)
                if (route) {
                  stop()
                  detectedRef.current(route)
                  return
                }
              }
              if (codes.length) {
                setError('Este código não corresponde a uma mesa deste TableHub. Aponte para o QR Code gerado em Mesas.')
              }
            }
          } catch {
            // Algumas imagens não podem ser decodificadas; tente o próximo frame.
          }
          if (!disposed) scanTimer = window.setTimeout(scan, 250)
        }
        scan()
      } catch (failure) {
        if (disposed) return
        setError(failure?.name === 'NotAllowedError'
          ? 'A permissão de câmera foi negada. Autorize o acesso à câmera no navegador ou use o aplicativo de câmera do celular.'
          : 'Não foi possível iniciar a câmera. Verifique as permissões e tente novamente.')
      }
    }

    start()
    return () => {
      stop()
      previousFocus?.focus?.()
    }
  }, [])

  return (
    <div className="customer-qr-scanner__backdrop" onClick={onClose}>
      <section className="customer-qr-scanner" role="dialog" aria-modal="true"
        aria-labelledby="customer-qr-scanner-title" onClick={(event) => event.stopPropagation()}>
        <button className="customer-qr-scanner__close" type="button" onClick={onClose}
          aria-label="Fechar leitor de QR Code" autoFocus><FiX /></button>
        <div className="customer-qr-scanner__eyebrow"><FiCamera /> LEITURA DA MESA</div>
        <h2 id="customer-qr-scanner-title">Escaneie o QR Code</h2>
        <p>Aponte a câmera para o código disponível na mesa do restaurante.</p>
        <div className="customer-qr-scanner__preview">
          <video ref={videoRef} muted autoPlay playsInline aria-label="Visualização da câmera para leitura do QR Code" />
          <span className="customer-qr-scanner__target" aria-hidden="true" />
        </div>
        {!running && !error && <p role="status">Iniciando câmera...</p>}
        {error && <p className="customer-qr-scanner__error" role="alert">{error}</p>}
        {running && <p className="customer-qr-scanner__hint">A leitura abre o cardápio da mesa identificada. O servidor valida o código antes de liberar pedidos.</p>}
        <button className="th-btn th-btn--glass th-btn--block" type="button" onClick={onClose}>Voltar</button>
      </section>
    </div>
  )
}
