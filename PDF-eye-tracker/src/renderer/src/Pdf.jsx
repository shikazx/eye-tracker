import { useState, useEffect, useRef } from 'react'
import webgazer from 'webgazer';
import './Pdf.css'

function Pdf(props) {
  const [isMagicKeyHeld, setIsMagicKeyHeld] = useState(false)
  const [isAppReady, setIsAppReady] = useState(false);
  const [gazeY, setGazeY] = useState(null) 
  const [areaHeight, setAreaHeight] = useState(50)
  const [isExplaining, setIsExplaining] = useState(false);
  const [aiResponse, setAiResponse] = useState("");

  const [calibrationClicks, setCalibrationClicks] = useState(0);
  const [isCalibrated, setIsCalibrated] = useState(false);

  useEffect(() => {
    setIsAppReady(true);
  }, []);


  useEffect(() => {
    if (!isAppReady) return;

    webgazer.setGazeListener((data) => {
      if (data == null) return;
      
      if (!isCalibrated || isMagicKeyHeld) {
        setGazeY(prevY => {
          if (prevY === null) return data.y;
          return (prevY * 0.95) + (data.y * 0.05);
        });
      }
    }).begin().then(() => {
      webgazer.resume(); 
    });

    return () => webgazer.end();
  }, [isAppReady, isCalibrated, isMagicKeyHeld]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift') {
        setIsMagicKeyHeld(true);
        setIsExplaining(false);
        webgazer.showPredictionPoints(true);
        webgazer.resume();
      }

      if (e.key === 'Escape') {
        console.log("Escape let go");
        setIsExplaining(false);
      }
    }
    

    const handleKeyUp = (e) => {
      if (e.key === 'Shift') {
        setIsMagicKeyHeld(false);
        webgazer.pause();

        // process stuff here

        setAiResponse("This is a placeholder");
        setIsExplaining(true);
      }

      if (e.key === '+') {
        console.log("plus let go")
        setAreaHeight(areaHeight + 20)
      }
      if (e.key === '_') {
        const thing = Math.max(50, areaHeight - 20)
        setAreaHeight(thing)
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isMagicKeyHeld, gazeY, areaHeight]);


  const handleCalibrationClick = () => {
    webgazer.showPredictionPoints(false);
    webgazer.resume();

    setCalibrationClicks(prev => prev + 1);
    if (calibrationClicks >= 4) { // After 5 clicks
      setIsCalibrated(true);
      webgazer.pause();
    }
};

  if (!isCalibrated) {
    return (
      <div className="calibration-overlay" onClick={handleCalibrationClick}>
        <div className="calibration-dot1"></div>
        <div className="calibration-dot2"></div>
        <div className="calibration-dot3"></div>
        <div className="calibration-dot4"></div>
        <div className="calibration-dot5"></div>
        <p className="text">Look at your cursor and click the dots to calibrate the AI eyes.</p>
      </div>
    )
  }


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
        <iframe
          src={`${props.pdf}#toolbar=0`}
          className="pdf-viewer"
        />
        {isMagicKeyHeld && (
          <div
            className="tracker-area"

            style={{
              top: `${gazeY - (areaHeight / 2)}px`,
              height: `${areaHeight}px`,
              width: `${800}px`,
              marginLeft: `${-8}px`
            }}
          />
        )}
      </div>
    </div>
  )
}

export default Pdf;
