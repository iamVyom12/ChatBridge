'use client'

import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import Script from 'next/script'
import '../../public/css/chat-only.css'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
const BACKEND_HOST = new URL(BACKEND_URL).hostname
const BACKEND_PORT = new URL(BACKEND_URL).port || 3001

export default function ChatOnly() {
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [peer, setPeer] = useState(null)
  const [connection, setConnection] = useState(null)
  const [socket, setSocket] = useState(null)
  const chatWindowRef = useRef(null)
  const messageInputRef = useRef(null)
  const initializedRef = useRef(false)

  const servers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ]
  }

  useEffect(() => {
    if (typeof window === 'undefined' || !window.Peer) return
    
    // Prevent double initialization in React StrictMode
    if (initializedRef.current) return
    initializedRef.current = true

    // Initialize Socket.IO
    const socketInstance = io(`${BACKEND_URL}/chat-only`, {
      transports: ['websocket', 'polling']
    })
    setSocket(socketInstance)

    // Initialize PeerJS
    const peerInstance = new window.Peer(undefined, {
      host: BACKEND_HOST,
      port: BACKEND_PORT,
      path: '/peerjs',
      config: servers,
      secure: BACKEND_URL.startsWith('https'),
      debug: 3
    })

    peerInstance.on('open', (id) => {
      console.log('My peer ID is: ' + id)
      socketInstance.emit('joinChatQueue', id)
    })

    peerInstance.on('connection', (conn) => {
      setConnection(conn)
      conn.on('data', (data) => {
        receiveMessage(data)
      })
    })

    socketInstance.on('chatMatchFound', (peerId) => {
      console.log('Chat match found: ' + peerId)
      const conn = peerInstance.connect(peerId)
      setConnection(conn)
      conn.on('data', (data) => {
        receiveMessage(data)
      })
    })

    setPeer(peerInstance)

    return () => {
      socketInstance.disconnect()
      if (peerInstance) peerInstance.destroy()
    }
  }, [])

  const sendMessage = () => {
    const message = messageInput.trim()
    if (message && connection) {
      displayMessage(message, 'self')
      connection.send(message)
      setMessageInput('')
      if (chatWindowRef.current) {
        chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight
      }
    }
  }

  const displayMessage = (message, sender) => {
    setMessages((prev) => [...prev, { message, sender, id: Date.now() }])
  }

  const receiveMessage = (message) => {
    displayMessage(message, 'other')
    setTimeout(() => {
      if (chatWindowRef.current) {
        chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight
      }
    }, 0)
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
      <header>
        <h1>ChatBridge</h1>
      </header>
      <div className="chat-container">
        <div className="chat-window" ref={chatWindowRef}>
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.sender}`}>
              {msg.message}
            </div>
          ))}
        </div>
        <div className="input-area">
          <input
            type="text"
            ref={messageInputRef}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
      <Script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js" strategy="beforeInteractive" />
    </>
  )
}
