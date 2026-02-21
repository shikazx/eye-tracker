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
  const [isLoading, setIsLoading] = useState(false);

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

    const handleKeyUp = async (e) => {
      if (e.key === 'Shift') {
        setIsExplaining(true);
        setIsLoading(true);
        setIsMagicKeyHeld(false);
        webgazer.pause();

        try {
          console.log('Capturing multiple images...');
          const rect = { x: window.innerWidth/2-400, y: gazeY - (areaHeight / 2), width: 1000, height: areaHeight };

          const imageSources = await window.api.captureScreen(rect);

          if (imageSources.length > 0) {
            const imagesPayload = imageSources.map(src => {
              return {
                data: src.split(',')[1], // The raw base64 string
                mimeType: 'image/png'    // The mime type
              };
            });

            const result = await window.api.askAI(
              "I am trying to understand this document. " +
              "I have sent two pictures. One is a cropped picture about the part I am stuck on. " +
              "The other picture is the whole page I am currently on for additional context for you." +
              "Please help me understand the contents of the cropped picture." +
              "Don't ask follow ups as the I cannot respond, just explain to the best you can." +
              "The textbox your text will show up in is 2200 characters in total, 76 characters per line. " +
              "Don't do lists as the text will appear as one big paragraph of text.",
              imagesPayload
            );

            setAiResponse(result);
            setIsLoading(false);
            console.log("setting ai response to: ", result);
          } else {
            console.error('Capture failed. No images were captured.');
          }
        } catch (err) {
          console.error(err);
          console.error('An IPC error or API error occurred.');
        }
      }

      if (e.key === '+') {
        setAreaHeight(prev => prev + 20);
      }
      if (e.key === '_') {
        setAreaHeight(prev => Math.max(50, prev - 20));
      }
    };


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
            <div className="explanation-top-bar">
              <h2>Spotlight</h2>
              <button className="close-btn" onClick={() => setIsExplaining(false)}>×</button>
            </div>
            {isLoading && <div className="loader"></div>}
            {!isLoading && <p>{aiResponse}</p>}
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
