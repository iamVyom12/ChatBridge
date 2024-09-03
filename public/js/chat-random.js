const videoElement = document.getElementById("local-video");
var socket = io("/chat-random");
let localStream;
let conn;
let remoteStream;
let peerConnection;
let uid = String(Math.floor(Math.random() * 1000));
const servers = {
  iceServers: [
    {
      urls: [
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
      ],
    },
  ],
};

const localVideo = document.getElementById("local-video");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const chatWindow = document.getElementById("chat-window");
const remoteVideo = document.getElementById("remote-video");


document.addEventListener("DOMContentLoaded", () => {
  startLocalVideo(localVideo);
  // const urlParams = new URLSearchParams(window.location.search);
  // const peerId = urlParams.get("peerId");
  // const peerIdCon = urlParams.get("peerIdCon");
  const peer = initializeAndConfigurePeer();


  socket.on("matchFound", (peerId) => {
    console.log("match found with peer", peerId);
    makeCall(peerId, peer);
    conn = peer.connect(peerId);
    conn.on("open", () => {
      console.log("connected to peer : ready to chat");
    });
    conn.on("data", (data) => {
      receiveMessage(data,conn.peer);
    });
  });


  document.getElementById("exit").addEventListener("click", () => {
    window.location.href = "/";
  });


  sendButton.addEventListener("click", function () {
    const message = messageInput.value.trim();
    if (message) {
      appendMessage("me", `me: ${message}`);
      // Send the message via PeerJS or Socket.io
      conn.send(message); // Assuming you have a peer connection
      messageInput.value = "";
    }
  });
  messageInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      sendButton.click();
    }
  });


});

window.onbeforeunload = () => {
  peer.disonnect();
};

const appendMessage = (sender, message) => {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("chat-message", sender);
  messageDiv.innerText = message;
  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom
}

const receiveMessage = (message,peerId) => {
  appendMessage('user', `${peerId}: ${message}`);
}

const startLocalVideo = async (localVideo) => {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    localVideo.srcObject = localStream;
    console.log("Local video started");
  } catch (error) {
    console.error("Error accessing the media devices.", error);
  }
}

const makeCall = (peerId, peer) => {
  if (!peer) {
    console.error("Peer is not initialized");
    return;
  }

  if (!localStream) {
    console.error("localStream is not initialized");
    return;
  }

  const call = peer.call(peerId, localStream);

  call.on("error", (error) => {
    console.error("Call failed to connect", error);
  });


  if (!call) {
    console.error("Call failed to initialize");
    return;
  }

  call.on("stream", (stream) => {
    remoteVideo.srcObject = stream;
    console.log("remote stream has been set");
  });

  call.on("close", () => {
    console.log("Call has been closed");
    remoteVideo.srcObject = null;
  });
}

const initializeAndConfigurePeer = () => {
  const peer = new Peer(undefined, {
    host: "/",
    port: 9000,
    path: "/myapp",
    config: servers,
  });

  peer.on("open", (id) => {
    console.log("My peer ID is:", id);
    socket.emit("joinQueue", id);
  });

  /**
 * Event listener for incoming calls.
 * 
 * This event is triggered when a remote peer initiates a call to this peer.
 * The call is answered with the local media stream, and event listeners are set up
 * to handle the remote media stream and call closure.
 * 
 * @param {Object} call - The call object representing the incoming call.
 * 
 * @event
 * @listens Peer#call
 */
  peer.on("call", (call) => {
    call.answer(localStream);

    call.on("stream", (stream) => {
      remoteVideo.srcObject = stream;
    });

    call.on("close", () => {
      remoteVideo.srcObject = null;
    });
  });
  
  peer.on("connection", (conection) => {
    conn = conection;
    conn.on("data", (data) => {
      receiveMessage(data,conn.peer);
    });
  });

  peer.on("disconnected", () => {
  // console.log("disconnected");
    peer.reconnect();
  });

  peer.on("close", () => {
    console.log("close");
  });

  return peer;
};