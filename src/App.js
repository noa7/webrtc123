import logo from './logo.svg';
import './App.css';
import React, { useRef, useEffect } from 'react';
import io from  'socket.io-client'


let sessionValue = ""; // Variable to store session value



const socket=io('https://localhost:443/remote-ctrl');





function App() {


console.log('hi from App.js')
//const videoRef=useRef()

socket.emit('hib', 'hello123');

//const videoRef = document.getElementById('remote-video');
const remoteVideo = document.getElementById('remote-video');

if (remoteVideo) {
  console.log('Element found:', remoteVideo);
} else {
  console.log('Element with ID "remote-video" not found.');
}

const rtcPeerConnection = useRef(new RTCPeerConnection({
  'iceServers': [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
}));


function setRtcPeerConnection()
{
  rtcPeerConnection.current=null;

  rtcPeerConnection.current =new RTCPeerConnection({
    'iceServers': [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  });

  rtcPeerConnection.current.onicecandidate = (e) => {
    console.log('--onicecandidate')
    if (e.candidate)
      socket.emit('icecandidate', e.candidate)
  }

  rtcPeerConnection.current.oniceconnectionstatechange = (e) => {
   console.log(rtcPeerConnection.current.connectionState)
  };

  rtcPeerConnection.current.ontrack = (e) => {
    console.log("ON TRACK");

    console.log(e);
    remoteVideo.srcObject = e.streams[0];
    //console.log(new Date().toLocaleTimeString());

remoteVideo.onloadedmetadata=(e)=> remoteVideo.play();
    socket.emit('click-position', 'hi1234');
    console.log('out coming...');
  //  sendVideoDimensions();
   // videoRef.current.srcObject = e.streams[0]
    //videoRef.current.onloadedmetadata = (e) => videoRef.current.play()
  }





}



const handleStream1 = (stream) => 
  {
rtcPeerConnection.current.addStream(stream);
console.log("Track Added");
//    remoteVideo.srcObject = stream;
  };

  const getUserMedia = async (constraints) => {
    try {
    //  return;
 //  const stream = await navigator.mediaDevices.getUserMedia(constraints)

      // rtcPeerConnection.current.addTransceiver('video')
       //rtcPeerConnection.current.getTransceivers().forEach(t => t.direction = 'recvonly')

      rtcPeerConnection.current.createOffer({
        offerToReceiveVideo: 1
      }).then(sdp => {
        rtcPeerConnection.current.setLocalDescription(sdp)
        console.log('sending offer')
        socket.emit('offer', sdp)
      })
    } catch (e) { console.log(e) }
  }


  useEffect(() => 
    {


      /*
      const timer = setTimeout(() => {
        disconnectRTC();
    }, 10000);


    const timer2 = setTimeout(() => {
      console.log("Recon connection...");
      setRtcPeerConnection();
      getUserMedia({ video: true, audio: false });
  }, 15000);

*/
    function disconnectRTC() {
      if (rtcPeerConnection.current) {
          console.log("Closing WebRTC connection...");
          console.log(new Date().toLocaleTimeString());

          // Close the connection
          rtcPeerConnection.current.close();
          rtcPeerConnection.current = null;
          remoteVideo.srcObject = null; 
      }
  }


  function reconnectRTC() {
    disconnectRTC();
    setRtcPeerConnection();
      getUserMedia({ video: true, audio: false });
}


      async function getScreenStream(sourceId) {
        try {
            // Get screen source ID from the main process
          // const sourceId = await window.electronAPI.getScreenSource();
            //console.log('Received screen source ID:', sourceId);
      
            // Capture the screen stream
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sourceId,
                        maxWidth: 1920,
                        maxHeight: 1080,
                        maxFrameRate: 30
                    }
                },
                cursor: "never"
            });
            handleStream1(stream);
            return stream;
        } catch (error) {
            console.error('Error capturing screen stream:', error);
        }
      }

      if(window.electronAPI) {
       console.log('Renderer...');
        socket.emit('send-request', 'request_base_hello');

        // Handle server responses (optional)
        socket.on('server-response', (data) => {
            console.log('Received response from server:', data);
           getScreenStream(data);
        });

       
      }
      else{ 

       setRtcPeerConnection();
        getUserMedia({ video: true, audio: false })
      }







      socket.on('offer', offerSDP => {
        console.log('--received offer')
        rtcPeerConnection.current.setRemoteDescription(
          new RTCSessionDescription(offerSDP)
        ).then(() => {
          rtcPeerConnection.current.createAnswer().then(sdp => {
            rtcPeerConnection.current.setLocalDescription(sdp)
  
            console.log('--sending answer')
            socket.emit('answer', sdp)
          })
        })
      })
  
      socket.on('answer', answerSDP => {
        console.log('==received answer')
        rtcPeerConnection.current.setRemoteDescription(
          new RTCSessionDescription(answerSDP)
        )
      })
  
      socket.on('icecandidate', icecandidate => {
        console.log('--on   icecandidate')
        rtcPeerConnection.current.addIceCandidate(
          new RTCIceCandidate(icecandidate)
        )
      })


      socket.on('disconn', ()=>{
        console.log("disc");
        disconnectRTC();
      });

      socket.on('reconn', ()=>{
        console.log("RECON");
        reconnectRTC();
      });




      socket.onopen = function () {
        console.log("WebSocket connection established.");
      };
    
      socket.onerror = function (error) {
        console.error("WebSocket Error: ", error);
      };
    
      socket.onclose = function () {
        console.log("WebSocket connection closed.");
      };



    
      function sendEventData(wParam, lParam) {
  
        if(window.electronAPI){console.log("sendEventData.....RETURN"); return;}
        console.log("sendEventData.....");
    const videoElement = document.getElementById("remote-video");
  
    if (socket.readyState === socket.OPEN) {
      const message = JSON.stringify({
        wParam,
        lParam,
        height: videoElement ? videoElement.offsetHeight : 0,
        width: videoElement ? videoElement.offsetWidth : 0
      });
      socket.send(message);
     console.log("sendEventData.....to socket..")
    } else {
      console.warn("WebSocket is not open. Unable to send message.");
    }
  };


     


      function handleMouseEvent(event, wParam) {

        const rect = remoteVideo.getBoundingClientRect();
        const lParam = {
          pt: { x: event.clientX - rect.left, y: event.clientY - rect.top },
          mouseData: 0,
          flags: 0,
          time: Date.now(),
          dwExtraInfo: null
        };
        sendEventData(wParam, lParam);
      }
    
      function handleMouseDown(event) {
        const wParam = getMouseButtonEvent(event, "DOWN");
        handleMouseEvent(event, wParam);
      }
    
      function handleMouseUp(event) {
        const wParam = getMouseButtonEvent(event, "UP");
        handleMouseEvent(event, wParam);
      }
    
      function handleMouseWheel(event) {
        const wParam = "WM_MOUSEWHEEL";
        const lParam = {
          pt: { x: event.clientX, y: event.clientY },
          mouseData: event.deltaY,
          flags: 0,
          time: Date.now(),
          dwExtraInfo: null
        };
        sendEventData(wParam, lParam);
      }
    
      function getMouseButtonEvent(event, action) {
        switch (event.button) {
          case 0: return action === "DOWN" ? "WM_LBUTTONDOWN" : "WM_LBUTTONUP";
          case 1: return action === "DOWN" ? "WM_MBUTTONDOWN" : "WM_MBUTTONUP";
          case 2: return action === "DOWN" ? "WM_RBUTTONDOWN" : "WM_RBUTTONUP";
          default: return action === "DOWN" ? "WM_XBUTTONDOWN" : "WM_XBUTTONUP";
        }
      }
    
     
      function handleKeyboardEvent(event, wParam) {
        const lParam = {
          vkCode: event.code,
          scanCode: event.keyCode,
          flags: getKeyEventFlags(event),
          time: Date.now(),
          dwExtraInfo: null
        };
        sendEventData(wParam, lParam);
      }
    
      function getKeyEventFlags(event) {
        let flags = 0;
        if (event.altKey) flags |= 0x01; // Example flag for Alt key, adjust flags as needed
        if (event.ctrlKey) flags |= 0x02; // Example flag for Ctrl key
        return flags;
      }
    
      // Standard keys list (for documentation or further use)
      const standardKeys = [
        'KeyA', 'KeyB', 'KeyC', 'KeyD', 'KeyE', 'KeyF', 'KeyG', 'KeyH', 'KeyI', 'KeyJ', 'KeyK', 'KeyL', 'KeyM', 'KeyN',
        'KeyO', 'KeyP', 'KeyQ', 'KeyR', 'KeyS', 'KeyT', 'KeyU', 'KeyV', 'KeyW', 'KeyX', 'KeyY', 'KeyZ',
        'Digit0', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9',
        'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
        'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight', 'CapsLock',
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown',
        'Insert', 'Delete', 'Backspace', 'Enter', 'Escape', 'Tab', 'Space',
        'Numpad0', 'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4', 'Numpad5', 'Numpad6', 'Numpad7', 'Numpad8', 'Numpad9',
        'NumpadAdd', 'NumpadSubtract', 'NumpadMultiply', 'NumpadDivide', 'NumpadDecimal', 'NumpadEnter',
        'Backquote', 'Minus', 'Equal', 'BracketLeft', 'BracketRight', 'Backslash', 'Semicolon', 'Quote', 'Comma', 'Period', 'Slash'
      ];


      remoteVideo.addEventListener("mousemove", (event) => handleMouseEvent(event, "WM_MOUSEMOVE"));
      remoteVideo.addEventListener("mousedown", handleMouseDown);
      remoteVideo.addEventListener("mouseup", handleMouseUp);
      remoteVideo.addEventListener("wheel", handleMouseWheel);
      window.addEventListener("keydown", (event) => handleKeyboardEvent(event, "WM_KEYDOWN"));
      window.addEventListener("keyup", (event) => handleKeyboardEvent(event, "WM_KEYUP"));

      //#region INSERT STARTBUTTON

      document.addEventListener("DOMContentLoaded", ()=>{
        LoadStartbutton();
      });
    
  
      //#endregion

      function sendSizeEvent() {
       

        if (!remoteVideo) {
            console.warn("Video element not found.");
            return;
        }

        remoteVideo.style.width = window.innerWidth + "px";
        remoteVideo.style.height = window.innerHeight + "px";

        const lParam = {
            windowHeight: remoteVideo.offsetHeight,
            windowWidth: remoteVideo.offsetWidth
        };

        sendEventData("DS_SIZE", lParam);
    }


    function LoadStartbutton()
    {
      const videoElement = document.querySelector("video");
      if (!videoElement) {
          console.error("Video element not found!");
          return;
      }
  
      // Create the START button
      const startButton = document.createElement("button");
      startButton.innerText = "START";
      startButton.style.position = "absolute";
      startButton.style.top = "50%";
      startButton.style.left = "50%";
      startButton.style.transform = "translate(-50%, -50%)";
      startButton.style.fontSize = "24px";
      startButton.style.fontWeight = "bold";
      startButton.style.padding = "15px 30px";
      startButton.style.border = "none";
      startButton.style.cursor = "pointer";
      startButton.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      startButton.style.color = "white";
      startButton.style.zIndex = "10";
  
      // Positioning container for button inside video element
      const buttonContainer = document.createElement("div");
      buttonContainer.style.position = "absolute";
      buttonContainer.style.width = "100%";
      buttonContainer.style.height = "100%";
      buttonContainer.style.top = "0";
      buttonContainer.style.left = "0";
      buttonContainer.style.display = "flex";
      buttonContainer.style.justifyContent = "center";
      buttonContainer.style.alignItems = "center";
      buttonContainer.style.pointerEvents = "none"; // Prevent interfering with video clicks
  
      // Enable button interaction inside the container
      startButton.style.pointerEvents = "auto";
  
      buttonContainer.appendChild(startButton);
      videoElement.style.position = "relative"; // Ensure video is a positioned element
      videoElement.parentElement.insertBefore(buttonContainer, videoElement.nextSibling);
  
      // Setup Socket.io connection
      
  
      // Button click event
      startButton.addEventListener("click", () => {
        const videoWidth = videoElement.clientWidth;
        const videoHeight = videoElement.clientHeight;

        socket.emit("start_fired", { width: videoWidth, height: videoHeight });

        buttonContainer.remove(); // Remove button after emitting
      });
  }


   

    // Call on window load
    sendSizeEvent();

    // Call on window resize
    window.addEventListener("resize", sendSizeEvent);

    document.addEventListener("contextmenu", function (event) {
      event.preventDefault();

      document.addEventListener("keydown", function (event) {
        if (event.key === "F2") {
            toggleDisconnectButton();
        }
    });
    
    function toggleDisconnectButton() {
        let videoElement = document.getElementById("remote-video");
        let existingButton = document.getElementById("disconnect-button");
    
        if (existingButton) {
            existingButton.remove();
        } else {
            let button = document.createElement("button");
            button.id = "disconnect-button";
            button.innerText = "Disconnect";
            button.style.position = "absolute";
            button.style.top = "10px";
            button.style.right = "10px";
            button.style.padding = "10px";
            button.style.backgroundColor = "red";
            button.style.color = "white";
            button.style.border = "none";
            button.style.cursor = "pointer";
            button.style.zIndex = "1000";
    
            button.addEventListener("click", disconnectVideo);
    
            videoElement.parentElement.appendChild(button);
        }
    }
    
    function disconnectVideo() {
        let videoElement = document.getElementById("remote-video");
        videoElement.srcObject = null; // Stop the video stream
        alert("Disconnected");
    }


  });

  return () => {
    if (socket) {
        socket.close();
        console.log("WebSocket closed");
    }
};

    },[]);

   
  
   
  

   


return null;


}

export default App;
