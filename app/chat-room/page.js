'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { io } from 'socket.io-client'
import '../../public/css/chat-room.css'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
const BACKEND_HOST = new URL(BACKEND_URL).hostname
const BACKEND_PORT = new URL(BACKEND_URL).port || 3001

export default function ChatRoom() {
  const searchParams = useSearchParams()
  const roomID = searchParams.get('roomID')
  
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [peers, setPeers] = useState([])
  const [peerList, setPeerList] = useState(['Me'])
  
  const localVideoRef = useRef(null)
  const chatWindowRef = useRef(null)
  const peerRef = useRef(null)
  const connectionsRef = useRef([])
  const callsRef = useRef([])
  const localStreamRef = useRef(null)
  const videoIdCounterRef = useRef(0)
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
    if (typeof window === 'undefined' || !window.Peer || !roomID) return
    
    // Prevent double initialization in React StrictMode
    if (initializedRef.current) return
    initializedRef.current = true

    const startLocalVideo = async () => {
      try {
        const localVideo = localVideoRef.current
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
        localStreamRef.current = stream
        if (localVideo) {
          localVideo.srcObject = stream
        }
      } catch (error) {
        console.error('Error accessing the media devices.', error)
      }
    }

    const checkIfPeerIsActive = async (peerId) => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/check-peer/${peerId}`)
        const data = await response.json()
        return data.active
      } catch (error) {
        console.error('Error checking peer:', error)
        return false
      }
    }

    const initializePeer = async () => {
      await startLocalVideo()
      const isActive = await checkIfPeerIsActive(roomID)

      let peerInstance
      if (isActive) {
        console.log('Peer is active')
        peerInstance = new window.Peer(undefined, {
          host: BACKEND_HOST,
          port: BACKEND_PORT,
          path: '/peerjs',
          config: servers,
          secure: BACKEND_URL.startsWith('https'),
          debug: 3
        })

        peerInstance.on('open', async (id) => {
          console.log('Peer ID: ' + id)
          try {
            const response = await fetch(`${BACKEND_URL}/api/join-room/${roomID}/${id}`, {
              method: 'POST',
            })
            const data = await response.json()
            console.log('making call to peers')
            data.peers.forEach(peerId => {
              makeCall(peerId)
              makeConnection(peerId)
            })
            console.log('successfully made calls to peers')
          } catch (error) {
            console.error('Error joining room:', error)
          }
        })
      } else {
        console.log('Peer is not active')
        peerInstance = new window.Peer(roomID, {
          host: BACKEND_HOST,
          port: BACKEND_PORT,
          path: '/peerjs',
          secure: BACKEND_URL.startsWith('https'),
          config: servers,
          debug: 3
        })

        peerInstance.on('open', (id) => {
          console.log('Peer ID: ' + id)
          fetch(`${BACKEND_URL}/api/join-room/${roomID}/${id}`, {
            method: 'POST',
          })
        })
      }

      peerInstance.on('call', (call) => {
        call.answer(localStreamRef.current)
        let streamAdded = false

        call.on('stream', (stream) => {
          console.log('user 1')
          if (!streamAdded) {
            addRemoteVideoTag(stream, call.peer)
            streamAdded = true
          }
        })

        call.on('close', () => {
          console.log('closing call')
          removePeerVideoElement(call.peer)
        })

        call.on('error', (error) => {
          console.error('Error with call:', error)
        })
      })

      peerInstance.on('connection', (connection) => {
        connection.on('open', () => {
          connectionsRef.current.push(connection)
        })

        connection.on('data', (data) => {
          addMessageToChatBox(data, 'other')
        })
      })

      peerInstance.on('disconnected', () => {
        console.log('Peer disconnected (peer disconnected event)')
      })

      peerInstance.on('close', () => {
        console.log('Peer closed (peer close event)')
      })

      peerInstance.on('error', (err) => {
        console.error('Peer error: ', err)
      })

      peerRef.current = peerInstance
    }

    initializePeer()

    return () => {
      if (peerRef.current) peerRef.current.destroy()
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
      callsRef.current.forEach(call => call.close())
      connectionsRef.current.forEach(conn => conn.close())
    }
  }, [roomID])

  const makeCall = (id) => {
    if (!peerRef.current || !localStreamRef.current) return

    const call = peerRef.current.call(id, localStreamRef.current)
    callsRef.current.push(call)

    let streamAdded = false

    call.on('stream', (stream) => {
      if (!streamAdded) {
        addRemoteVideoTag(stream, call.peer)
        streamAdded = true
      }
    })

    call.on('close', () => {
      console.log('Peer disconnected: ' + call.peer)
      removePeerVideoElement(call.peer)
    })

    call.on('error', (error) => {
      console.error('Error with call:', error)
    })
  }

  const makeConnection = (peerId) => {
    const conn = peerRef.current.connect(peerId)
    conn.on('open', () => {
      connectionsRef.current.push(conn)
    })
    conn.on('data', (data) => {
      console.log('Received data: ', data)
      addMessageToChatBox(data, 'other')
    })
  }

  const addRemoteVideoTag = (stream, peerId) => {
    const videoId = `video-${videoIdCounterRef.current++}`
    const newPeer = {
      id: peerId,
      stream,
      videoId,
      videoEnabled: true,
      audioEnabled: true
    }
    setPeers((prev) => [...prev, newPeer])
    addPeerToList(peerId)
  }

  const addPeerToList = (peerId) => {
    setPeerList((prev) => [...prev, `Peer: ${peerId}`])
  }

  const removePeerVideoElement = (peerId) => {
    setPeers((prev) => prev.filter(p => p.id !== peerId))
    removePeerFromList(peerId)
  }

  const removePeerFromList = (peerId) => {
    setPeerList((prev) => prev.filter(item => !item.includes(peerId)))
  }

  const toggleMute = (stream, peerId) => {
    const audioTrack = stream.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      setPeers((prev) => prev.map(p => 
        p.id === peerId ? { ...p, audioEnabled: audioTrack.enabled } : p
      ))
    }
  }

  const toggleVideo = (stream, peerId) => {
    const videoTrack = stream.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled
      setPeers((prev) => prev.map(p => 
        p.id === peerId ? { ...p, videoEnabled: videoTrack.enabled } : p
      ))
    }
  }

  const toggleLocalAudio = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
    }
  }

  const toggleLocalVideo = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled
    }
  }

  const addMessageToChatBox = (message, type) => {
    setMessages((prev) => [...prev, { message, type, id: Date.now() }])
  }

  const sendMessage = () => {
    const message = messageInput.trim()
    if (message && peerRef.current) {
      addMessageToChatBox(`me: ${message}`, 'self')
      const messageToSend = `${peerRef.current.id} :${message}`
      connectionsRef.current.forEach(conn => {
        conn.send(messageToSend)
      })
      setMessageInput('')
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
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
      />
      <div className="flex-container">
        <div className="grid-container">
          <div className="card">
            <div className="name">User</div>
            <video ref={localVideoRef} className="local-video" autoPlay></video>
            <button className="card-button" onClick={toggleLocalVideo}>
              <i className="fas fa-video"></i>
            </button>
            <button className="card-button2" onClick={toggleLocalAudio}>
              <i className="fas fa-microphone"></i>
            </button>
          </div>
          {peers.map((peer) => (
            <div key={peer.id} className={`card card-${peer.id}`}>
              <div className="name">User {peer.id}</div>
              <video
                className={`remote-video ${peer.id}`}
                id={peer.videoId}
                autoPlay
                ref={(el) => {
                  if (el && peer.stream) {
                    el.srcObject = peer.stream
                  }
                }}
              ></video>
              <button
                className="card-button"
                onClick={() => toggleVideo(peer.stream, peer.id)}
              >
                <i className={`fas fa-${peer.videoEnabled ? 'video' : 'video-slash'}`}></i>
              </button>
              <button
                className="card-button2"
                onClick={() => toggleMute(peer.stream, peer.id)}
              >
                <i className={`fas fa-${peer.audioEnabled ? 'volume-up' : 'volume-mute'}`}></i>
              </button>
            </div>
          ))}
        </div>
        <div className="flex-container2">
          <div className="peerList">
            {peerList.map((item, index) => (
              <div key={index} className="peer-item">
                {item}
              </div>
            ))}
          </div>
          <div className="message-box">
            <div className="chat-window" ref={chatWindowRef}>
              {messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.type}`}>
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
      </div>
    </>
  )
}
