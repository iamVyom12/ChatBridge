function createLobby() {
  const peerId = document.getElementById("peerId").value;

  window.location.href = `/html/main.html?peerId=${peerId}`;
}

function connectToPeer() {
  const peerIdCon = document.getElementById("peerIdToConnect").value;

  checkIfPeerIsActive(peerIdCon).then(isActive => {
    if (isActive) {
        console.log('Peer is active');
        window.location.href = `/html/main.html?peerIdCon=${peerIdCon}`;
        // Proceed with connecting to the peer
    } else {
        console.log('Peer is not active');
        
        // Handle the case where the peer is not available
    }
  });

  // const peer = new Peer(undefined, {
  //   host: "/",
  //   port: 9000,
  //   path: "/myapp",
  // });

  // peer.on("open", function (id) {
  //   console.log("My peer ID is: " + id);
  //   establishConnection(peer,peerIdCon);
  // });

  // function establishConnection(peer,peerId) {
  //   console.log("Connecting to: " + peerId);
  //   const conn = peer.connect(peerId);
  //   conn.on("open", function () {
  //     // connection to the peer is successful
  //     console.log("Connected to: " + conn.peer);
  //     window.location.href = `/html/main.html?peerIdCon=${peerId}`;
  //   });
  // }

  //   peer.on("error", function (err) {
  //       if (err.type === "peer-unavailable") {
  //         alert(`The peer ID ${err.peer} does not exist.`);
  //       }
  //     });
 
}

// peer.on('connection', conn => {
//     conn.on('data', data => {
//         console.log('Received', data);
//     });
// });

async function checkIfPeerIsActive(peerId) {
  const response = await fetch(`/check-peer/${peerId}`);
  const data = await response.json();
  return data.active;
}



