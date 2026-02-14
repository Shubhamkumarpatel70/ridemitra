import { useState, useRef, useEffect } from 'react'
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaTimes } from 'react-icons/fa'

const DriverVideoCall = ({ callId, onClose }) => {
  const [localStream, setLocalStream] = useState(null)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  
  const localVideoRef = useRef(null)

  useEffect(() => {
    startVideoCall()
    return () => {
      stopVideoCall()
    }
  }, [])

  const startVideoCall = async () => {
    try {
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
    } catch (error) {
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        console.log('No media devices found. Continuing without video/audio.')
        setLocalStream(null)
        setIsVideoEnabled(false)
        setIsAudioEnabled(false)
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        console.log('Media access denied by user.')
        setLocalStream(null)
        setIsVideoEnabled(false)
        setIsAudioEnabled(false)
      } else {
        console.error('Error accessing media devices:', error)
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true
          })
          setLocalStream(audioStream)
          setIsVideoEnabled(false)
        } catch (audioError) {
          console.log('Audio also unavailable. Continuing without media.')
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

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="bg-surface border-b border-border p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-text-primary">VKYC Call</h2>
          <p className="text-sm text-text-secondary">Call ID: {callId}</p>
        </div>
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-danger transition"
        >
          <FaTimes className="text-2xl" />
        </button>
      </div>

      <div className="flex-1 relative bg-secondary flex items-center justify-center">
        {/* Local Video (Driver) */}
        <div className="w-full h-full flex items-center justify-center">
          {localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover max-w-4xl"
            />
          ) : (
            <div className="text-center">
              <FaVideo className="text-6xl text-text-secondary mx-auto mb-4" />
              <p className="text-text-secondary">Waiting for admin to join...</p>
              <p className="text-text-secondary text-sm mt-2">Please wait while the admin connects</p>
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

export default DriverVideoCall

