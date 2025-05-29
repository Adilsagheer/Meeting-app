// WebRTC utility for peer connections and screen sharing
export async function getMediaStream(videoRef, screen = false) {
  try {
    let stream;
    if (screen) {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    } else {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    }
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    return stream;
  } catch (err) {
    alert("Could not access media devices: " + err.message);
    return null;
  }
}

// Replace video track in peer connection for screen sharing
export function replaceTrack(peerConnection, newTrack) {
  const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === newTrack.kind);
  if (sender) sender.replaceTrack(newTrack);
}

// ...add more WebRTC helpers as needed
