let socket = io();
const servers = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
      ]
  };
let con;

let peer = new Peer(undefined, {
    host: window.location.hostname,
    port: window.location.port || (window.location.protocol === 'https:' ? 443 : 80),
    path: "/myapp",
    config: servers,
    debug: 3
  });


document.addEventListener('DOMContentLoaded', function () {
    const chatWindow = document.getElementById('chat-window');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');

    sendButton.addEventListener('click', function () {
        sendMessage('self');
    });

    messageInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendMessage('self');
        }
    });

    function sendMessage(sender) {
        const message = messageInput.value.trim();
        if (message !== '') {
            displayMessage(message, sender);
            messageInput.value = '';
            chatWindow.scrollTop = chatWindow.scrollHeight;
            con.send(message);
            // setTimeout(() => receiveMessage(message), 1000); // Simulate receiving a message for demo
        }
    }

    function displayMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}`;
        messageElement.textContent = message;
        chatWindow.appendChild(messageElement);
    }

    // Simulate receiving a message
    function receiveMessage(message) {
        displayMessage(message, 'other');
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    peer.on("open", (id) => {
        console.log("My peer ID is: " + id);
        socket.emit("joinChatQueue", id);
    });
    
    peer.on('connection', (conection) => {
        con = conection;
        con.on('data', (data) => {
            receiveMessage(data);
        });
    });

    socket.on("chatMatchFound", (peerId) => {
        console.log("Chat match found: " + peerId);
        con = peer.connect(peerId);
        con.on('data', (data) => {
            receiveMessage(data);
        });
    });
});
