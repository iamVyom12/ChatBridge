let videoIdCounter = 0;
let peer;
let con = [];
let localStream;
let socket = io();
// let remoteStreams = {};
const urlParams = new URLSearchParams(window.location.search);
const roomID = urlParams.get("roomID");

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

async function startLocalVideo() {
  try {
    let localVideo = document.getElementsByClassName("local-video")[0];
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideo.srcObject = localStream;
  } catch (error) {
    console.error("Error accessing the media devices.", error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log(roomID);

  checkIfPeerIsActive(roomID).then(async (isActive) => {
    if (isActive) {
      console.log("Peer is active");
      await startLocalVideo();
      peer = new Peer(undefined, {
        host: "/",
        port: 9000,
        path: "/myapp",
      });

      peer.on("open", async (id) => {
        console.log("Peer ID: " + id);
        console.log("Fetching room ID");
        const response = await fetch(`/join-room/${roomID}/${id}`, {
          method: 'POST',
        });
        const data = await response.json();
        console.log("making call to peers");
        console.log(data);
        data.peers.forEach(peerId => {
          makeCall(peerId);
          makeConnection(peerId);
        });
        console.log("successfully made calls to peers");
      
      });
      
    } else {
      console.log("Peer is not active");
      await startLocalVideo();
      peer = new Peer(roomID, {
        host: "/",
        port: 9000,
        path: "/myapp",
        config: servers
      });


      peer.on("open", (id) => {
        console.log("Peer ID: " + id);
        fetch(`/join-room/${roomID}/${id}`, {
          method: 'POST',
        });
      });


    }


    peer.on("call", (call) => {
      call.answer(localStream);
      let streamAdded = false;

      call.on("stream", (stream) => {
        console.log("user 1");
        if (!streamAdded) {
          addRemoteVideoTag(stream, call.peer);
          streamAdded = true;
        }
      });
        call.on("close", () => {
          console.log("closing call");
          removePeerVideoElement(call.peer);
        });

        call.on("error", (error) => {
          console.error("Error with call:", error);
        });
    });

    peer.on("connection", (connection) => {
      connection.on("open", () => {
        con.push(connection);
      });

      connection.on("data", (data) => {
        addMessageToChatBox(data, "other");
      });
    });

    peer.on("disconnected", () => {
      console.log("Peer disconnected (peer disconnected event)");
    });

    peer.on("close", () => {
      console.log("Peer closed (peer close event)");
    });

    peer.on("error", (err) => {
      console.error("Peer error: ", err);
    });
    


  });

  document.getElementById('send-button').addEventListener('click', () => {
    const message = document.getElementById('message-input').value;
    if (message) {
      addMessageToChatBox(`me: `+ message, 'self');
      sendMessage(`${peer.id} :`+message);
      document.getElementById('message-input').value = '';
    }
  });

});


addRemoteVideoTag = (stream, peerId) => {
  const gridContainer = document.querySelector(".grid-container");
  const card = document.createElement("div");
  card.className = "card";
  card.classList.add(`card-${peerId}`);
  card.innerHTML = `
    <div class="name">User ${peerId}</div>
    <video class="remote-video  ${peerId}" id="video-${videoIdCounter++}" autoplay></video>
    <button class="card-button" id="video-${peerId}"><i class="fas fa-video"></i></button>
    <button class="card-button2" id="audio-${peerId}"><i class="fas fa-volume-up"></i></button>
  `;

  gridContainer.appendChild(card);
  console.log("addRemoteVideoTag success");
  document.getElementById(`video-${videoIdCounter - 1}`).srcObject = stream;
  addPeerToList(peerId);
  let videoButton = document.getElementById(`video-${peerId}`);
  let audioButton = document.getElementById(`audio-${peerId}`);

if(videoButton && audioButton) {
videoButton.addEventListener('click', function() {
    toggleVideo(stream, peerId);
});

audioButton.addEventListener('click', function() {
    toggleMute(stream, peerId);
});
}
};

makeCall = (id) => {
  if (!peer) {
    console.log("Peer is not defined");
    return;
  }
  if (!localStream) {
    startLocalVideo();
    console.log("Local stream is not defined");
    // return;
  }
  const call = peer.call(id, localStream);

  if (!call) {
    console.log("Call is not defined");
    return;
  }

  let streamAdded = false;

  call.on("stream", (stream) => {
    if (!streamAdded) {
      addRemoteVideoTag(stream, call.peer);          
      
      streamAdded = true;
    }
  });

  call.on("close", () => {
    console.log("Peer disconnected: " + call.peer);
    removePeerVideoElement(call.peer); // Remove the video tag when the peer disconnects
  });

  call.on("error", (error) => {
    console.error("Error with call:", error);
  });

};

makeConnection = (peerId) => {
  let conn = peer.connect(peerId);
  conn.on("open", () => {
    con.push(conn);
  });
  conn.on("data", (data) => {
    console.log("Received data: ", data);
    addMessageToChatBox(data, "other");
  });
};


async function checkIfPeerIsActive(peerId) {
  console.log("Checking if peer is active");
  const response = (await fetch(`/check-peer/${peerId}`));
  const data = await response.json();
  console.log( "data " +data.active);
  return data.active;
}

// connectToPeer = (peerId,Streams) => {
//   con = peer.connect(peerId);
//   con.on("open", () => {
//     console.log("Connected to peer");
//     con.send(Streams);
//   });
// };

function toggleMute(stream, peerId) {
  const audioTrack = stream.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled = !audioTrack.enabled;
    const button = document.getElementById(peerId ? `audio-${peerId}` : 'muteButton');
    if (button) {
      button.innerHTML = audioTrack.enabled 
      ? '<i class="fas fa-volume-up"></i>' 
      : '<i class="fas fa-volume-mute"></i>';
    }
    console.log(`Audio track is now ${audioTrack.enabled ? 'enabled' : 'disabled'}`);
  }
}

function toggleLocalAudio() {
  const audioTrack = localStream.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled = !audioTrack.enabled;
    const button = document.getElementById('muteButton');
    if (button) {
      button.innerHTML = audioTrack.enabled 
        ? '<i class="fas fa-microphone"></i>' 
        : '<i class="fas fa-microphone-slash"></i>';
    }
  }
}


// Function to toggle video on/off for both local and remote streams
function toggleVideo(stream, peerId) {
  const videoTrack = stream.getVideoTracks()[0];
  if (videoTrack) {
    videoTrack.enabled = !videoTrack.enabled;
    const button = document.getElementById(peerId ? `video-${peerId}` : 'videoButton');
    if (button) {
      button.innerHTML = videoTrack.enabled 
        ? '<i class="fas fa-video"></i>' 
        : '<i class="fas fa-video-slash"></i>';
    }
  }
}



document.getElementById('muteButton').addEventListener('click', () => toggleLocalAudio());
document.getElementById('videoButton').addEventListener('click', 
() => toggleVideo(localStream));

function addPeerToList(peerId) {
  const peerList = document.getElementsByClassName('peerList')[0];
  const peerItem = document.createElement('div');
  peerItem.className = 'peer-item';
  peerItem.classList.add(`peer-item-${peerId}`);
  peerItem.textContent = `Peer: ${peerId}`;
  peerList.appendChild(peerItem);
}


function addMessageToChatBox(message, type) {
  const chatBox = document.getElementById('chat-window');
  const messageElem = document.createElement('div');
  messageElem.className = `message ${type}`;
  messageElem.textContent = message;
  chatBox.appendChild(messageElem);
  chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the bottom
}

function sendMessage(message) {
   con.forEach(conn => {
    conn.send(message);
   });
}


function removePeerVideoElement(peerId) {
  const videoElement = document.querySelector(`.card-${peerId}`);
  if (videoElement) {
    videoElement.remove();
  }
  removePeerFromList(peerId); // Remove the peer from the list
}

window.onbeforeunload = () => {
  peer.destroy();
};

function removePeerFromList(peerId) {
  const peerItem = document.querySelector(`.peer-item-${peerId}`);
  if (peerItem) {
    peerItem.remove();
    console.log(`Removed peer item for peer: ${peerId}`);
  } else {
    console.log(`No peer item found for peer: ${peerId}`);
  }
}