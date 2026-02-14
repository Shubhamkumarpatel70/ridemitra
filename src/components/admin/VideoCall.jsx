import { useState, useRef, useEffect } from 'react'
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaCamera, FaTimes } from 'react-icons/fa'
import html2canvas from 'html2canvas'

const VideoCall = ({ driverId, driverName, onCapture, onClose }) => {
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isCapturing, setIsCapturing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0) // 0: Profile Image, 1: Aadhar Card, 2: PAN Card
  const [capturedSteps, setCapturedSteps] = useState([]) // Track which steps are completed
  
  const steps = [
    { id: 0, name: 'Profile Image', label: 'Capture Profile Image' },
    { id: 1, name: 'Aadhar Card', label: 'Capture Aadhar Card' },
    { id: 2, name: 'PAN Card', label: 'Capture PAN Card' }
  ]
  
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const captureRef = useRef(null)

  useEffect(() => {
    startVideoCall()
    return () => {
      stopVideoCall()
    }
  }, [])

  const startVideoCall = async () => {
    try {
      // Try to get video and audio, but make video optional
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      })
      setLocalStream(stream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      
      // Simulate remote stream (in real app, this would come from WebRTC)
      // For now, we'll create a placeholder
      setTimeout(() => {
        // In production, this would be the actual remote stream from WebRTC
        setRemoteStream(stream) // Placeholder - replace with actual remote stream
      }, 1000)
    } catch (error) {
      // Handle different error types gracefully
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        // No camera/microphone found - continue without media
        console.log('No media devices found. Continuing without video/audio.')
        setLocalStream(null)
        setIsVideoEnabled(false)
        setIsAudioEnabled(false)
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        // User denied permission
        console.log('Media access denied by user.')
        setLocalStream(null)
        setIsVideoEnabled(false)
        setIsAudioEnabled(false)
      } else {
        // Other errors - try with audio only
        console.error('Error accessing media devices:', error)
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true
          })
          setLocalStream(audioStream)
          setIsVideoEnabled(false)
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = null
          }
        } catch (audioError) {
          console.log('Audio also unavailable. Continuing without media.')
          // If both fail, continue without media - user can still use the interface
          setLocalStream(null)
          setIsVideoEnabled(false)
          setIsAudioEnabled(false)
        }
      }
    }
  }

  const stopVideoCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop())
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled
        setIsVideoEnabled(!isVideoEnabled)
      }
    }
  }

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled
        setIsAudioEnabled(!isAudioEnabled)
      }
    }
  }

  const captureScreen = async () => {
    if (currentStep >= steps.length) {
      alert('All documents have been captured!')
      return
    }

    setIsCapturing(true)
    try {
      const element = captureRef.current || document.body
      const canvas = await html2canvas(element, {
        useCORS: true,
        logging: false
      })
      
      canvas.toBlob((blob) => {
        if (blob && onCapture) {
          const stepName = steps[currentStep].name
          onCapture(blob, stepName)
          
          // Mark step as captured
          setCapturedSteps(prev => [...prev, currentStep])
          
          // Move to next step
          if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
          } else {
            // All steps completed
            alert('All documents captured successfully!')
          }
        }
        setIsCapturing(false)
      }, 'image/png')
    } catch (error) {
      console.error('Error capturing screen:', error)
      setIsCapturing(false)
      alert('Failed to capture screen')
    }
  }

  const goToStep = (stepIndex) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex)
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="bg-surface border-b border-border p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary">VKYC Call with {driverName}</h2>
            <p className="text-sm text-text-secondary">Driver ID: {driverId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-danger transition"
          >
            <FaTimes className="text-2xl" />
          </button>
        </div>
        
        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => goToStep(index)}
                className={`px-4 py-2 rounded-button text-sm font-semibold transition ${
                  currentStep === index
                    ? 'bg-accent text-text-light'
                    : capturedSteps.includes(index)
                    ? 'bg-success/20 text-success border border-success'
                    : 'bg-secondary text-text-secondary border border-border'
                }`}
              >
                {step.name}
                {capturedSteps.includes(index) && ' ✓'}
              </button>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${
                  capturedSteps.includes(index) ? 'bg-success' : 'bg-border'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 relative" ref={captureRef}>
        {/* Remote Video (Driver) */}
        <div className="absolute inset-0 bg-secondary">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <FaVideo className="text-6xl text-text-secondary mx-auto mb-4" />
                <p className="text-text-secondary">Waiting for driver to join...</p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Admin) - Picture in Picture */}
        <div className="absolute bottom-4 right-4 w-64 h-48 bg-surface border-2 border-accent rounded-button overflow-hidden">
          {localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
              <FaVideo className="text-3xl text-text-secondary" />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-surface border-t border-border p-4">
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition ${
              isVideoEnabled
                ? 'bg-accent text-text-light hover:bg-accent-hover'
                : 'bg-danger text-text-light hover:bg-danger/90'
            }`}
          >
            {isVideoEnabled ? <FaVideo className="text-xl" /> : <FaVideoSlash className="text-xl" />}
          </button>
          
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full transition ${
              isAudioEnabled
                ? 'bg-accent text-text-light hover:bg-accent-hover'
                : 'bg-danger text-text-light hover:bg-danger/90'
            }`}
          >
            {isAudioEnabled ? <FaMicrophone className="text-xl" /> : <FaMicrophoneSlash className="text-xl" />}
          </button>

          <button
            onClick={captureScreen}
            disabled={isCapturing || currentStep >= steps.length}
            className="bg-warning text-text-light px-6 py-3 rounded-button font-semibold hover:bg-warning/90 transition disabled:opacity-50 flex items-center"
          >
            <FaCamera className="mr-2" />
            {isCapturing ? 'Capturing...' : currentStep < steps.length ? `Capture ${steps[currentStep].label}` : 'All Captured'}
          </button>

          <button
            onClick={onClose}
            className="bg-danger text-text-light px-6 py-3 rounded-button font-semibold hover:bg-danger/90 transition"
          >
            End Call
          </button>
        </div>
      </div>
    </div>
  )
}

export default VideoCall

