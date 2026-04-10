import { Html5QrcodeScanner } from 'html5-qrcode'
import { useEffect } from 'react'
import api from '../../lib/api'
import { useState } from 'react'

export default function ScanQR () {
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: 250 },
      false
    )

    scanner.render(async decodedText => {
      try {
        console.log("TOKEN:", decodedText)
        
        const token = decodedText

        await api.post('/peminjaman/scan', {
          token
        })

        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          scanner.clear()
        }, 2000)
      } catch (err) {
        alert(err.response?.data?.message || 'QR tidak valid')
      }
    })

    return () => {
      scanner.clear().catch(() => {})
    }
  }, [])


  return (
    <>
      {success && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
          <div className='bg-white rounded-2xl p-6 text-center animate-scale-in'>
            <div className='text-green-500 text-4xl mb-2'>✔</div>
            <p className='text-sm font-semibold'>Berhasil Scan</p>
          </div>
        </div>
      )}
      <div className='flex flex-col items-center mt-10'>
        <h1 className='text-lg font-bold mb-4'>📷 Scan QR Pengambilan</h1>
        <div id='reader' style={{ width: '300px' }}></div>
      </div>
    </>
  )
}
