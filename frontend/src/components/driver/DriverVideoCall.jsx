import { useState, useRef, useEffect } from 'react'
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaTimes } from 'react-icons/fa'
import { io } from 'socket.io-client'
import { SOCKET_URL } from '../../config'

const DriverVideoCall = ({ callId, driverId, onClose }) => {
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const socketRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const isProcessingOfferRef = useRef(false)
  
  // Extract driverId from callId if not provided: format is "vkyc-{driverId}-{timestamp}"
  const actualDriverId = driverId || (callId ? callId.split('-')[1] : null)
  const roomId = actualDriverId ? `vkyc-${actualDriverId}` : callId

  useEffect(() => {
    startVideoCall()
    return () => {
      stopVideoCall()
    }
  }, [])

  // Sync local stream to video element
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
        
        // Join room as driver
        socket.emit('driver-join', { roomId })
        
        // Emit initial camera status after a short delay to ensure stream is ready
        setTimeout(() => {
          if (stream) {
            const videoTrack = stream.getVideoTracks()[0]
            if (videoTrack && socketRef.current) {
              socketRef.current.emit('driver-camera-status', {
                roomId,
                cameraEnabled: videoTrack.enabled
              })
            }
          }
        }, 500)
      })

      socket.on('admin-left', () => {
        console.log('Admin left')
        setConnectionStatus('admin-disconnected')
        setRemoteStream(null)
      })

      socket.on('offer', async ({ offer }) => {
        console.log('Received offer from admin')
        
        // Prevent concurrent offer processing
        if (isProcessingOfferRef.current) {
          console.log('Already processing an offer, ignoring duplicate')
          return
        }
        
        isProcessingOfferRef.current = true
        
        try {
          let pc = peerConnectionRef.current
          
          // Create peer connection if it doesn't exist
          if (!pc) {
            setConnectionStatus('connecting')
            createPeerConnection(stream, socket)
            pc = peerConnectionRef.current
          }
          
          if (!pc) {
            console.error('Failed to create peer connection')
            return
          }
          
          // Check if we're in a valid state to handle the offer
          const currentState = pc.signalingState
          console.log('Current signaling state:', currentState)
          
          // Only process offer if we're in stable state
          // If we're in another state, reset the connection (might be renegotiation or error state)
          if (currentState !== 'stable') {
            console.log(`Connection not in stable state (${currentState}), resetting...`)
            pc.close()
            createPeerConnection(stream, socket)
            pc = peerConnectionRef.current
            if (!pc) {
              console.error('Failed to recreate peer connection')
              return
            }
          }
          
          // Set remote description (the offer)
          await pc.setRemoteDescription(new RTCSessionDescription(offer))
          
          // Verify we're in the correct state to create answer
          if (pc.signalingState === 'have-remote-offer') {
            // Create answer
            const answer = await pc.createAnswer()
            
            // Set local description (the answer)
            await pc.setLocalDescription(answer)
            
            // Send answer to admin
            socket.emit('answer', { roomId, answer })
            console.log('Answer created and sent to admin')
          } else {
            console.error('Invalid state for creating answer:', pc.signalingState)
            throw new Error(`Invalid signaling state: ${pc.signalingState}`)
          }
        } catch (err) {
          console.error('Error handling offer:', err)
          // Reset peer connection on error
          if (peerConnectionRef.current) {
            try {
              peerConnectionRef.current.close()
            } catch (closeErr) {
              console.error('Error closing peer connection:', closeErr)
            }
            peerConnectionRef.current = null
          }
        } finally {
          isProcessingOfferRef.current = false
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
        const newVideoState = !isVideoEnabled
        videoTrack.enabled = newVideoState
        setIsVideoEnabled(newVideoState)
        
        // Emit camera status to admin
        if (socketRef.current && roomId) {
          socketRef.current.emit('driver-camera-status', {
            roomId,
            cameraEnabled: newVideoState
          })
        }
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
          <p className="text-xs text-text-secondary mt-1">
            Status: <span className={`font-semibold ${
              connectionStatus === 'connected' ? 'text-success' :
              connectionStatus === 'admin-connected' ? 'text-accent' :
              connectionStatus === 'connecting' ? 'text-warning' : 'text-danger'
            }`}>
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'admin-connected' ? 'Connecting...' :
               connectionStatus === 'connecting' ? 'Connecting...' :
               connectionStatus === 'admin-disconnected' ? 'Admin Disconnected' : 'Disconnected'}
            </span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-danger transition"
        >
          <FaTimes className="text-2xl" />
        </button>
      </div>

      <div className="flex-1 relative bg-secondary flex items-center justify-center">
        {/* Remote Video (Admin) - Main View */}
        <div className="absolute inset-0">
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
                  {connectionStatus === 'connected' && 'Waiting for admin to join...'}
                  {connectionStatus === 'admin-disconnected' && 'Admin disconnected'}
                  {connectionStatus === 'disconnected' && 'Disconnected'}
                </p>
                <p className="text-sm text-text-secondary">
                  {connectionStatus === 'connecting' && 'Connecting to call...'}
                  {connectionStatus === 'connected' && 'Admin will start the call from their dashboard'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Driver) - Picture in Picture */}
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
