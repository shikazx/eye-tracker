import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [pdfUrl, setPdfUrl] = useState(null)
  const [isMagicKeyHeld, setIsMagicKeyHeld] = useState(false)
  const [gazeY, setGazeY] = useState(500) 
  const [glowHeight, setGlowHeight] = useState(100) 

  // --- NEW: Handle the file upload ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file && file.type === 'application/pdf') {
      // Creates a temporary, secure URL that the browser/Electron can read instantly
      const url = URL.createObjectURL(file)
      setPdfUrl(url)
    }
  }

  // Listen for the Magic Key and Scroll Wheel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Alt' && !isMagicKeyHeld) setIsMagicKeyHeld(true)
    }

    const handleKeyUp = (e) => {
      if (e.key === 'Alt') {
        setIsMagicKeyHeld(false)
        console.log("Key released! Triggering AI with height:", glowHeight, "at Y:", gazeY)
      }
    }

    const handleScroll = (e) => {
      if (isMagicKeyHeld) {
        e.preventDefault() 
        setGlowHeight(prev => Math.min(Math.max(prev + (e.deltaY * 0.5), 20), 400))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('wheel', handleScroll, { passive: false })

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('wheel', handleScroll)
    }
  }, [isMagicKeyHeld, glowHeight, gazeY])

  return (
    <div className="app-container">
      {/* Conditionally render the upload screen OR the PDF viewer */}
      {!pdfUrl ? (
        <div className="upload-screen">
          <h1>Gaze Prompting AI</h1>
          <p>Select a research paper or dense code PDF to begin.</p>
          <label className="custom-file-upload">
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={handleFileUpload} 
            />
            Open PDF
          </label>
        </div>
      ) : (
        <>
          <embed 
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
            type="application/pdf" 
            className="pdf-viewer"
          />

          {isMagicKeyHeld && (
            <div 
              className="gaze-highlighter"
              style={{
                top: `${gazeY - (glowHeight / 2)}px`,
                height: `${glowHeight}px`
              }}
            />
          )}
        </>
      )}
    </div>
  )
}

export default App