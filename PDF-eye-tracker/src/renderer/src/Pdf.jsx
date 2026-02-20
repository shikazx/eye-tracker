import { useState, useEffect } from 'react'
import './Pdf.css'

function Pdf(props){
    const [isMagicKeyHeld, setIsMagicKeyHeld] = useState(false)
    const [gazeY, setGazeY] = useState(null)
    const [areaHeight, setAreaHeight] = useState(50)
    const [isExplaining, setIsExplaining] = useState(false);
    const [aiResponse, setAiResponse] = useState("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift' && !isMagicKeyHeld) {
        setIsMagicKeyHeld(true)


        setGazeY(500)
        setIsExplaining(false) 
      }
    }

    const handleKeyUp = (e) => {
      if (e.key === 'Shift') {
        setIsMagicKeyHeld(false)
        
        if (gazeY){
            // handle changing to text here

            
            setAiResponse("This is a placeholder")
            setIsExplaining(true);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isMagicKeyHeld, gazeY, areaHeight])


    return (
        <div className={`pdf-screen 
          ${isExplaining ? 'show-explanation' : ''}
        `}>
          {isExplaining && (
            <div className="explanation-container">
                <div className="ai-content">
                <button className="close-btn" onClick={() => setIsExplaining(false)}>×</button>
                <h2>AI Explanation</h2>
                <p>{aiResponse}</p>
                </div>
            </div>
            )}

          <div className="pdf-container">
            <iframe src={`${props.pdf}#toolbar=0&zoom=100`} className="pdf-viewer" />
            {isMagicKeyHeld && (
              <div 
                className="tracker-area"
                style={{ top: `${gazeY - (areaHeight / 2)}px`, height: `${areaHeight}px` }}
              />
            )}
          </div>
        </div>
    )
}

export default Pdf