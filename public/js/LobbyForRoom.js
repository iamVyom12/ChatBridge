//creat random like google meet
let roomID = Math.random().toString(36).substring(2, 8);

function Redirect() {
    window.location.href = `/html/chat-room.html?roomID=${roomID}`;
}

async function JoinRoom() {
    let roomID = document.getElementById('meetingId').value;
    if (!roomID || isWhitespaceString(roomID)) {
        showErrorMessage(true);
        return;
    }

    try {
        let response = await fetch(`/check-peer/${roomID}`);
        let data = await response.json();

        if (data.active === false) {
            showErrorMessage(true);
        } else {
            showErrorMessage(false);
            window.location.href = `/html/chat-room.html?roomID=${roomID}`;
        }
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage(true);
    }
}

function showErrorMessage(isInvalid) {
    var errorMessage = document.querySelector('.error-message');
    if (isInvalid) {
        errorMessage.style.display = 'flex';
    } else {
        errorMessage.style.display = 'none';
    }
}

