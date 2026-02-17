import { useState, useRef, useEffect } from 'react'
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaCamera, FaTimes } from 'react-icons/fa'
import { io } from 'socket.io-client'
import html2canvas from 'html2canvas'
import { SOCKET_URL } from '../../config'

const VideoCall = ({ driverId, driverName, onCapture, onClose }) => {
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isCapturing, setIsCapturing] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [driverCameraEnabled, setDriverCameraEnabled] = useState(true) // Track driver's camera status
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
  const socketRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const isProcessingAnswerRef = useRef(false)
  const roomId = `vkyc-${driverId}`

  useEffect(() => {
    startVideoCall()
    return () => {
      stopVideoCall()
    }
  }, [])

  // Sync local stream to local video element
  useEffect(() => {
    if (!localVideoRef.current || !localStream) return
    localVideoRef.current.srcObject = localStream
    return () => {
      if (localVideoRef.current) localVideoRef.current.srcObject = null
    }
  }, [localStream])

  // Sync remote stream to remote video element
  useEffect(() => {
    if (!remoteVideoRef.current || !remoteStream) return
    remoteVideoRef.current.srcObject = remoteStream
    return () => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    }
  }, [remoteStream])

  const startVideoCall = async () => {
    try {
      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      })
      setLocalStream(stream)

      // Connect to Socket.io
      const socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling']
      })
      socketRef.current = socket

      socket.on('connect', () => {
        console.log('Socket connected')
        setConnectionStatus('connected')
        
        // Join room as admin
        socket.emit('admin-join', { roomId, driverId })
      })

      socket.on('driver-joined', () => {
        console.log('Driver joined, starting WebRTC')
        setConnectionStatus('driver-connected')
        // Only create peer connection if it doesn't exist or is closed
        const pc = peerConnectionRef.current
        if (!pc || pc.signalingState === 'closed') {
          createPeerConnection(stream, socket)
        } else {
          console.log('Peer connection already exists, state:', pc.signalingState)
        }
      })

      socket.on('driver-left', () => {
        console.log('Driver left')
        setConnectionStatus('driver-disconnected')
        setRemoteStream(null)
        // Reset peer connection when driver leaves
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close()
          peerConnectionRef.current = null
        }
      })

      // Admin should NOT receive offers - admin creates offers
      // This handler is kept for safety but should log a warning
      socket.on('offer', async ({ offer, from }) => {
        console.warn('Admin received unexpected offer from driver - ignoring')
        // Admin creates offers, not receives them
        // This might happen due to signaling issues, so we ignore it
      })

      socket.on('answer', async ({ answer }) => {
        console.log('Received answer from driver')
        
        // Prevent concurrent answer processing
        if (isProcessingAnswerRef.current) {
          console.log('Already processing an answer, ignoring duplicate')
          return
        }
        
        isProcessingAnswerRef.current = true
        
        try {
          const pc = peerConnectionRef.current
          if (!pc) {
            console.error('No peer connection when receiving answer')
            return
          }
          
          const currentState = pc.signalingState
          console.log('Current signaling state:', currentState)
          
          // Answer should only be processed when we're in have-local-offer state
          if (currentState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(answer))
            console.log('Answer processed successfully')
          } else {
            console.warn(`Cannot process answer in state: ${currentState}`)
            // If we're in stable state, the offer might have been lost or connection reset
            // In this case, we should recreate the connection
            if (currentState === 'stable') {
              console.log('Connection in stable state, recreating offer...')
              pc.close()
              createPeerConnection(stream, socket)
            }
          }
        } catch (err) {
          console.error('Error handling answer:', err)
        } finally {
          isProcessingAnswerRef.current = false
        }
      })

      socket.on('ice-candidate', async ({ candidate }) => {
        if (peerConnectionRef.current && candidate) {
          try {
            const pc = peerConnectionRef.current
            // WebRTC automatically queues candidates if remote description isn't set yet
            await pc.addIceCandidate(new RTCIceCandidate(candidate))
          } catch (err) {
            // Ignore errors for invalid candidates or wrong state
            if (err.name !== 'OperationError' && err.name !== 'InvalidStateError') {
              console.error('Error adding ICE candidate:', err)
            }
          }
        }
      })

      socket.on('driver-camera-status', ({ cameraEnabled }) => {
        console.log('Driver camera status:', cameraEnabled ? 'enabled' : 'disabled')
        setDriverCameraEnabled(cameraEnabled)
      })

      socket.on('disconnect', () => {
        console.log('Socket disconnected')
        setConnectionStatus('disconnected')
      })

    } catch (error) {
      console.error('Error starting video call:', error)
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setLocalStream(null)
        setIsVideoEnabled(false)
        setIsAudioEnabled(false)
        alert('No camera/microphone found. Please connect a device and try again.')
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setLocalStream(null)
        setIsVideoEnabled(false)
        setIsAudioEnabled(false)
        alert('Camera/microphone permission denied. Please allow access and try again.')
      } else {
        alert('Failed to start video call. Please try again.')
      }
    }
  }

  const createPeerConnection = (localStream, socket) => {
    // Close existing connection if any
    if (peerConnectionRef.current) {
      console.log('Closing existing peer connection')
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    }

    const peerConnection = new RTCPeerConnection(configuration)
    peerConnectionRef.current = peerConnection

    // Add local stream tracks
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream)
    })

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote stream')
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0])
        setConnectionStatus('connected')
      }
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { roomId, candidate: event.candidate })
      }
    }

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState)
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        setConnectionStatus('disconnected')
      } else if (peerConnection.connectionState === 'connected') {
        setConnectionStatus('connected')
      }
    }

    // Handle signaling state changes
    peerConnection.onsignalingstatechange = () => {
      console.log('Signaling state:', peerConnection.signalingState)
    }

    // Create offer (admin initiates)
    // Only create offer if connection is in stable state
    if (peerConnection.signalingState === 'stable') {
      peerConnection.createOffer()
        .then(offer => {
          // Verify we're still in stable state before setting local description
          if (peerConnection.signalingState === 'stable') {
            return peerConnection.setLocalDescription(offer)
          } else {
            throw new Error(`Cannot set local description, signaling state is: ${peerConnection.signalingState}`)
          }
        })
        .then(() => {
          // Verify we're in have-local-offer state before sending
          if (peerConnection.signalingState === 'have-local-offer' && peerConnection.localDescription) {
            socket.emit('offer', { roomId, offer: peerConnection.localDescription })
            console.log('Offer created and sent to driver')
          } else {
            console.error('Invalid state after setting local description:', peerConnection.signalingState)
          }
        })
        .catch(error => {
          console.error('Error creating offer:', error)
          // Reset connection on error
          if (peerConnectionRef.current) {
            try {
              peerConnectionRef.current.close()
            } catch (closeErr) {
              console.error('Error closing peer connection:', closeErr)
            }
            peerConnectionRef.current = null
          }
        })
    } else {
      console.error('Cannot create offer, connection not in stable state:', peerConnection.signalingState)
    }
  }

  const stopVideoCall = () => {
    // Stop media tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop())
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
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
            <p className="text-xs text-text-secondary mt-1">
              Status: <span className={`font-semibold ${
                remoteStream ? 'text-success' :
                connectionStatus === 'connected' || connectionStatus === 'driver-connected' ? 'text-accent' :
                connectionStatus === 'connecting' ? 'text-warning' : 'text-danger'
              }`}>
                {remoteStream ? 'Connected' :
                 connectionStatus === 'connecting' ? 'Connecting...' :
                 connectionStatus === 'connected' ? 'Waiting for driver to join...' :
                 connectionStatus === 'driver-connected' ? 'Connecting...' :
                 connectionStatus === 'driver-disconnected' ? 'Driver Disconnected' :
                 connectionStatus === 'disconnected' ? 'Disconnected' : 'Waiting for driver to join...'}
              </span>
            </p>
            {remoteStream && (
              <p className="text-xs text-text-secondary mt-1">
                Driver Camera: <span className={`font-semibold ${
                  driverCameraEnabled ? 'text-success' : 'text-danger'
                }`}>
                  {driverCameraEnabled ? 'On' : 'Camera Turned Off'}
                </span>
              </p>
            )}
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
                <p className="text-text-primary font-medium mb-1">
                  {connectionStatus === 'connecting' && 'Connecting...'}
                  {(connectionStatus === 'connected' || connectionStatus === 'driver-connected') && 'Waiting for driver to join...'}
                  {connectionStatus === 'driver-disconnected' && 'Driver disconnected'}
                  {connectionStatus === 'disconnected' && 'Disconnected'}
                </p>
                <p className="text-sm text-text-secondary">
                  {connectionStatus === 'connecting' && 'Connecting to call...'}
                  {(connectionStatus === 'connected' || connectionStatus === 'driver-connected') && 'Ask the driver to join the call from their app'}
                </p>
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
            {isCapturing ? 'Capturing...' : currentStep < steps.length ? steps[currentStep].label : 'All Captured'}
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
