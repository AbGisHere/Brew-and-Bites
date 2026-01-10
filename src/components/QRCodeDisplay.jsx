import React, { useState, useEffect } from 'react'

export default function QRCodeDisplay({ url, tableName, tableCode }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [displayUrl, setDisplayUrl] = useState('') // New state to hold the "fixed" URL
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Basic validation
    if (!url) {
        setLoading(false);
        return;
    }

    // --- FIX START: Replace localhost with current domain ---
    let finalUrl = url;
    
    // If the database has a localhost link (e.g. http://localhost:5000/menu/...)
    // We replace the "http://localhost:5000" part with the current browser URL (e.g. https://your-site.com)
    if (url.includes('localhost')) {
        // window.location.origin gives you "https://your-website.com"
        finalUrl = url.replace(/https?:\/\/localhost:\d+/, window.location.origin);
    }
    
    // Save the fixed URL so we can display it in the text below
    setDisplayUrl(finalUrl);
    // --- FIX END ---

    // Use external API to generate visual QR using the FINAL URL
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(finalUrl)}`
    setQrCodeUrl(qrApiUrl)
    setLoading(false)
  }, [url])

  // FIX: Fetch the image as a blob to force download
  const downloadQRCode = async () => {
    try {
        const response = await fetch(qrCodeUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${tableName.replace(/\s+/g, '_')}_QR.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up memory
        URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error("Download failed:", error);
        alert("Could not download automatically. Please right-click the image and 'Save As'.");
    }
  }

  if (!url) {
    return (
      <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg border-2 border-dashed">
        <p>No QR code data available</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      {loading ? (
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      ) : (
        <>
          <div className="relative group cursor-pointer" onClick={downloadQRCode}>
            <img 
              src={qrCodeUrl} 
              alt={`QR Code for ${tableName}`}
              className="w-48 h-48 border-4 border-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            />
            {/* Overlay for hover effect */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-3 py-1 rounded-full text-xs font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all">
                Click to Download
              </span>
            </div>
          </div>
          
          <div className="text-center space-y-1">
            <h3 className="font-bold text-gray-900 text-lg">{tableName}</h3>
            
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Table Code</span>
              <code className="px-2 py-0.5 text-sm font-mono bg-blue-100 text-blue-800 rounded border border-blue-200">
                {tableCode}
              </code>
            </div>
            
            {/* Display the FIXED URL here, not the old 'url' prop */}
            <p className="text-[10px] text-gray-400 max-w-[200px] truncate mx-auto mt-2 select-all">
                {displayUrl}
            </p>
          </div>
        </>
      )}
    </div>
  )
}