const videoElement = document.getElementById("local-video");
var socket = io();
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

document.addEventListener("DOMContentLoaded", async () => {
  const localVideo = document.getElementById("local-video");
  startLocalVideo(localVideo);
  //for chat
  const messageInput = document.getElementById("message-input");
  const sendButton = document.getElementById("send-button");
  const chatWindow = document.getElementById("chat-window");
  //
  const remoteVideo = document.getElementById("remote-video");
  const urlParams = new URLSearchParams(window.location.search);
  const peerId = urlParams.get("peerId");
  const peerIdCon = urlParams.get("peerIdCon");

  let peer = null;
  peer = new Peer(undefined, {
    host: "/",
    port: 9000,
    path: "/myapp",
    config: servers,
  });

  peer.on("open", (id) => {
    console.log("My peer ID is:", id);
    socket.emit("joinQueue", id);
  });

  socket.on("matchFound", (peerId) => {
    console.log("match found with peer", peerId);
    makeCall(peerId);
    conn = peer.connect(peerId);
    conn.on("open", () => {
      console.log("connected to peer : ready to chat");
    });
    conn.on("data", (data) => {
      receiveMessage(data,conn.peer);
    });
  });

  peer.on("disconnected", () => {
    console.log("disconnected");
  });

  peer.on("close", () => {
    console.log("close");
  });

  peer.on("call", (call) => {
    call.answer(localStream);

    call.on("stream", (stream) => {
      remoteVideo.srcObject = stream;
    });

    call.on("close", () => {
      console.log("Call has been closed");
      remoteVideo.srcObject = null;
    });
  });

  peer.on("connection", (conection) => {
    con = conection;
    con.on("data", (data) => {
      receiveMessage(data,con.peer);
    });
  });

  function makeCall(peerId) {
    if (!peer) {
      console.error("Peer is not initialized");
      return;
    }

    if (!localStream) {
      console.error("localStream is not initialized");
      return;
    }

    const call = peer.call(peerId, localStream);

    if (!call) {
      console.error("Call failed to initialize");
      return;
    }

    call.on("stream", (stream) => {
      remoteVideo.srcObject = stream;
    });

    call.on("close", () => {
      remoteVideo.srcObject = null;
    });
  }

  document.getElementById("exit").addEventListener("click", () => {
    window.location.href = "/";
  });

  function appendMessage(sender, message) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("chat-message", sender);
    messageDiv.innerText = message;
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom
  }

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

  function receiveMessage(message,peerId) {
    appendMessage('user', `${peerId}: ${message}`);
}
});

window.onbeforeunload = () => {
  peer.destroy();
};

async function startLocalVideo(localVideo) {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    localVideo.srcObject = localStream;
  } catch (error) {
    console.error("Error accessing the media devices.", error);
  }
}
