'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { io } from 'socket.io-client'
import '../../public/css/chat-random.css'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
const BACKEND_HOST = new URL(BACKEND_URL).hostname
const BACKEND_PORT = new URL(BACKEND_URL).port || 3001


export default function ChatRandom() {
  const router = useRouter()
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [activeUserCount, setActiveUserCount] = useState(0)
  const [pairedUserId, setPairedUserId] = useState('')
  const [isReady, setIsReady] = useState(false)
  
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const chatWindowRef = useRef(null)
  const peerRef = useRef(null)
  const connectionRef = useRef(null)
  const callRef = useRef(null)
  const localStreamRef = useRef(null)
  const socketRef = useRef(null)
  const cleanupRef = useRef(false)

  const servers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ]
  }

  const makeCall = useCallback((peerId) => {
    if (!peerRef.current || !localStreamRef.current) return

    const call = peerRef.current.call(peerId, localStreamRef.current)
    callRef.current = call

    call.on('error', (error) => {
      console.error('Call failed to connect', error)
    })

    call.on('stream', (stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream
      }
      console.log('remote stream has been set')
    })

    call.on('close', () => {
      console.log('Call has been closed')
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null
      }
    })
  }, [])

  const receiveMessage = useCallback((message, peerId) => {
    setMessages((prev) => [...prev, { sender: 'user', message: `${peerId}: ${message}`, id: Date.now() }])
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Reset cleanup flag on mount
    cleanupRef.current = false
    
    let socketInstance = null
    let peerInstance = null
    let localStream = null

    const startLocalVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
        
        // Check if component was unmounted during async operation
        if (cleanupRef.current) {
          stream.getTracks().forEach(track => track.stop())
          return null
        }
        
        localStream = stream
        localStreamRef.current = stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
        console.log('Local video started')
        return stream
      } catch (error) {
        console.error('Error accessing the media devices.', error)
        return null
      }
    }

    const initializePeer = async () => {
      // Wait for PeerJS to load
      let attempts = 0
      while (!window.Peer && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }
      
      if (!window.Peer) {
        console.error('PeerJS failed to load')
        return
      }
      
      if (cleanupRef.current) return

      // Initialize socket - use polling only to avoid WebSocket conflicts with PeerJS
      socketInstance = io(`${BACKEND_URL}/chat-random`, {
        transports: ['polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      })
      socketRef.current = socketInstance

      socketInstance.on('connect', () => {
        console.log('Socket connected to chat-random namespace, id:', socketInstance.id)
      })

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
      })

      socketInstance.on('matchFound', (peerId) => {
        console.log('Match found with peer:', peerId)
        setPairedUserId(peerId.substring(0, 7))
        makeCall(peerId)
        if (peerRef.current) {
          const conn = peerRef.current.connect(peerId)
          connectionRef.current = conn
          conn.on('open', () => {
            console.log('connected to peer : ready to chat')
          })
          conn.on('data', (data) => {
            receiveMessage(data, conn.peer)
          })
        }
      })

      socketInstance.on('peerCount', (count) => {
        console.log('Peer count received:', count)
        setActiveUserCount(count)
      })

      // Generate a unique peer ID
      const uniqueId = `peer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      
      peerInstance = new window.Peer(uniqueId, {
        host: BACKEND_HOST,
        port: BACKEND_PORT,
        path: '/peerjs',
        config: servers,
        secure: BACKEND_URL.startsWith('https'),
        debug: 1
      })
      peerRef.current = peerInstance

      peerInstance.on('open', (id) => {
        console.log('My peer ID is:', id)
        if (socketInstance && socketInstance.connected) {
          console.log('Emitting joinQueue')
          socketInstance.emit('joinQueue', id)
        } else {
          // Wait for socket to connect, then emit
          socketInstance.once('connect', () => {
            console.log('Socket now connected, emitting joinQueue')
            socketInstance.emit('joinQueue', id)
          })
        }
        setIsReady(true)
      })

      peerInstance.on('error', (error) => {
        console.error('Peer error:', error)
      })

      peerInstance.on('call', (call1) => {
        console.log('Receiving call from:', call1.peer)
        callRef.current = call1
        call1.answer(localStreamRef.current)
        call1.on('stream', (stream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream
          }
          setPairedUserId(call1.peer.substring(0, 7))
        })
        call1.on('close', () => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null
          }
          setPairedUserId('')
          if (socketInstance && peerInstance) {
            socketInstance.emit('joinQueue', peerInstance.id)
          }
        })
      })

      peerInstance.on('connection', (conn) => {
        connectionRef.current = conn
        conn.on('data', (data) => {
          receiveMessage(data, conn.peer)
        })
        conn.on('close', () => {
          setMessages([])
        })
      })

      peerInstance.on('disconnected', () => {
        console.log('Peer disconnected, attempting reconnect...')
        if (!cleanupRef.current) {
          peerInstance.reconnect()
        }
      })

      peerInstance.on('close', () => {
        console.log('Peer closed');
        peerInstance.destroy();
      })

      peerInstance.on('error', (error) => {
        console.error('Peer error:', error)
      })
    }

    const init = async () => {
      await startLocalVideo()
      if (!cleanupRef.current) {
        await initializePeer()
      }
    }

    init()

    return () => {
      console.log('Cleaning up chat-random...')
      cleanupRef.current = true
      
      if (socketInstance) {
        socketInstance.disconnect()
      }
      if (connectionRef.current) {
        connectionRef.current.close()
        connectionRef.current = null
      }
      if (callRef.current) {
        callRef.current.close()
        callRef.current = null
      }
      if (peerInstance) {
        peerInstance.destroy()
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
      
      socketRef.current = null
      peerRef.current = null
      localStreamRef.current = null
    }
  }, [makeCall, receiveMessage])

  const appendMessage = (sender, message) => {
    setMessages((prev) => [...prev, { sender, message, id: Date.now() }])
  }

  const sendMessage = () => {
    const message = messageInput.trim()
    if (message && connectionRef.current) {
      appendMessage('me', `me: ${message}`)
      connectionRef.current.send(message)
      setMessageInput('')
    }
  }

  const skip = () => {
    if (callRef.current) callRef.current.close()
    if (connectionRef.current) connectionRef.current.close()
    setPairedUserId('')
    setMessages([])
    if (socketRef.current && peerRef.current) {
      socketRef.current.emit('joinQueue', peerRef.current.id)
    }
  }

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight
    }
  }, [messages])

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage()
    }
  }

  return (
    <>
      <Script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js" strategy="beforeInteractive" />
      <header>
        <h1 style={{ position: 'relative', left: '40%', bottom: '5%' }}>ChatBridge</h1>
        <button onClick={() => router.push('/')}>Exit</button>
      </header>
      <div id="main-container">
        <div id="video-container">
          <div id="local-vid">
            <div className="name">User</div>
            <video ref={localVideoRef} id="local-video" muted autoPlay></video>
          </div>
          <div id="remote-vid">
            <div className="name">User2</div>
            <video ref={remoteVideoRef} id="remote-video" muted autoPlay></video>
          </div>
        </div>
        <div id="chat-container">
          <div className="utilbar">
            <div className="card">
              <div className="title">
                <span> </span>
                <p className="title-text">online</p>
              </div>
              <div className="data online-count">
                <p>{activeUserCount}</p>
              </div>
            </div>
            <div className="card">
              <div className="title">
                <p className="title-text">
                  You&apos;re paired with : <span className="title-text">{pairedUserId}</span>
                </p>
              </div>
            </div>
            <button className="animated-button" onClick={skip}>
              <svg xmlns="http://www.w3.org/2000/svg" className="arr-2" viewBox="0 0 24 24">
                <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
              </svg>
              <span className="text">Skip</span>
              <span className="circle"></span>
              <svg xmlns="http://www.w3.org/2000/svg" className="arr-1" viewBox="0 0 24 24">
                <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
              </svg>
            </button>
          </div>
          <div className="chat-window" ref={chatWindowRef}>
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.sender}`}>
                {msg.message}
              </div>
            ))}
          </div>
          <div className="input-area">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      </div>
    </>
  )
}
