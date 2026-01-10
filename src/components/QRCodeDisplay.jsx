import { useState, useEffect } from 'react'

export default function QRCodeDisplay({ url, tableName, tableCode }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        // Using QR Server API to generate QR code
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
        setQrCodeUrl(qrApiUrl)
      } catch (error) {
        console.error('Error generating QR code:', error)
      } finally {
        setLoading(false)
      }
    }

    if (url) {
      generateQRCode()
    }
  }, [url])

  const downloadQRCode = () => {
    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = `${tableName.replace(/\s+/g, '_')}_QR.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!url) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No QR code available</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {loading ? (
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      ) : (
        <>
          <div className="relative group">
            <img 
              src={qrCodeUrl} 
              alt={`QR Code for ${tableName}`}
              className="w-48 h-48 border-2 border-gray-200 rounded-lg shadow-sm"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
              <button
                onClick={downloadQRCode}
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-700 px-3 py-1 rounded-md text-sm font-medium shadow-lg"
              >
                Download
              </button>
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <p className="font-semibold text-gray-900">{tableName}</p>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm text-gray-600">Code:</span>
              <code className="px-2 py-1 text-sm font-mono bg-blue-100 text-blue-800 rounded">
                {tableCode}
              </code>
            </div>
            <p className="text-xs text-gray-500 max-w-xs break-all">{url}</p>
          </div>
        </>
      )}
    </div>
  )
}
