'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import '../../public/css/LobbyForRoom.css'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

export default function Lobby() {
  const router = useRouter()
  const [meetingId, setMeetingId] = useState('')
  const [showError, setShowError] = useState(false)

  const createRoom = () => {
    const roomID = Math.random().toString(36).substring(2, 8)
    router.push(`/chat-room?roomID=${roomID}`)
  }

  const isWhitespaceString = (str) => {
    return !str || str.trim().length === 0
  }

  const joinRoom = async () => {
    if (!meetingId || isWhitespaceString(meetingId)) {
      setShowError(true)
      return
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/check-peer/${meetingId}`)
      const data = await response.json()

      if (data.active === false) {
        setShowError(true)
      } else {
        setShowError(false)
        router.push(`/chat-room?roomID=${meetingId}`)
      }
    } catch (error) {
      console.error('Error:', error)
      setShowError(true)
    }
  }

  return (
    <>
      <header>
        <h1>ChatBridge</h1>
      </header>
      <div className="container">
        <button id="creatRoomButton" onClick={createRoom}>
          Create Room
        </button>
        <div className="input-group">
          <input
            type="text"
            id="meetingId"
            value={meetingId}
            onChange={(e) => setMeetingId(e.target.value)}
            placeholder="Enter Room ID"
          />
          <button id="joinRoomButton" onClick={joinRoom}>
            Join Room
          </button>
        </div>

        <div className="error-message" style={{ display: showError ? 'flex' : 'none' }}>
          <div className="error-message__icon">
            <svg height="32" style={{ overflow: 'visible', enableBackground: 'new 0 0 32 32' }} viewBox="0 0 32 32" width="32" xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg">
              <g>
                <g id="Error_1_">
                  <g id="Error">
                    <circle cx="16" cy="16" id="BG" r="16" style={{ fill: '#D72828' }} />
                    <path d="M14.5,25h3v-3h-3V25z M14.5,6v13h3V6H14.5z" id="Exclamatory_x5F_Sign" style={{ fill: '#E6E6E6' }} />
                  </g>
                </g>
              </g>
            </svg>
          </div>
          <div className="error-message__text">
            The room ID you entered is invalid. Please enter a valid room ID.
          </div>
        </div>
      </div>
    </>
  )
}
