import { useState, useEffect } from 'react'
import './App.css'
import Pdf from './Pdf.jsx'

function App() {
  const [pdfFile, setPdfFile] = useState(null)


  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPdfFile(url)
    }
  }


  return (
    <div className="app-container">
      {!pdfFile ? (
        <div className="upload-screen">
          <h1>Eye Tracker PDF</h1>
          <p>Select an 8.5 X 11 in PDF to begin.</p>
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
        <Pdf pdf ={pdfFile}/>
      )}
    </div>
  )
}

export default App
