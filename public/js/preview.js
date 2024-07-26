let previewStream;

async function startPreviewVideo() {
  try {
    const previewVideo = document.getElementById('previewVideo');
    previewStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    previewVideo.srcObject = previewStream;
  } catch (error) {
    console.error("Error accessing the media devices.", error);
  }
}

function togglePreviewMute() {
  const audioTrack = previewStream.getAudioTracks()[0];
  audioTrack.enabled = !audioTrack.enabled;
  document.getElementById('previewMuteButton').innerText = audioTrack.enabled ? 'Mute' : 'Unmute';
}

function togglePreviewVideo() {
  const videoTrack = previewStream.getVideoTracks()[0];
  videoTrack.enabled = !videoTrack.enabled;
  document.getElementById('previewVideoButton').innerText = videoTrack.enabled ? 'Stop Video' : 'Start Video';
}

document.getElementById('userInfoForm').addEventListener('submit', function(event) {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const gender = document.getElementById('gender').value;

  // Stop the preview stream before navigating to the chat room
  previewStream.getTracks().forEach(track => track.stop());

  // Redirect to chat-room.html with user info as query parameters
  window.location.href = `chat-room.html?username=${encodeURIComponent(username)}&gender=${encodeURIComponent(gender)}`;
});

// Start the preview video when the page loads
startPreviewVideo();

window.onload = function() {
  var select = document.getElementById('gender');
  for (var i = 0; i < select.options.length; i++) {
    var option = select.options[i];
    var icon = option.getAttribute('data-icon');
    if (icon) {
      option.textContent = icon + ' ' + option.textContent;
    }
  }
};
