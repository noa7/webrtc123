import logo from './logo.svg';
import './App.css';
import React, { useRef, useEffect } from 'react';
import io from  'socket.io-client'

const socket=io('https://c726-2a02-8109-aa10-4300-d4e-abdf-832a-897d.ngrok-free.app/remote-ctrl');

function App() {
console.log('hi from App.js')
const videoRef=useRef()

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



const handleStream1 = (stream) => 
  {
rtcPeerConnection.current.addStream(stream);

//    remoteVideo.srcObject = stream;
  };

  const getUserMedia = async (constraints) => {
    try {
    //  return;
      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      // rtcPeerConnection.current.addTransceiver('video')
      // rtcPeerConnection.current.getTransceivers().forEach(t => t.direction = 'recvonly')

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
                }
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

        
        getUserMedia({ video: true, audio: false })
      }




      socket.on('offer', offerSDP => {
        console.log('received offer')
        rtcPeerConnection.current.setRemoteDescription(
          new RTCSessionDescription(offerSDP)
        ).then(() => {
          rtcPeerConnection.current.createAnswer().then(sdp => {
            rtcPeerConnection.current.setLocalDescription(sdp)
  
            console.log('sending answer')
            socket.emit('answer', sdp)
          })
        })
      })
  
      socket.on('answer', answerSDP => {
        console.log('received answer')
        rtcPeerConnection.current.setRemoteDescription(
          new RTCSessionDescription(answerSDP)
        )
      })
  
      socket.on('icecandidate', icecandidate => {
        rtcPeerConnection.current.addIceCandidate(
          new RTCIceCandidate(icecandidate)
        )
      })
  
      rtcPeerConnection.current.onicecandidate = (e) => {
        if (e.candidate)
          socket.emit('icecandidate', e.candidate)
      }
  
      rtcPeerConnection.current.oniceconnectionstatechange = (e) => {
        console.log(e)
      }
  
      rtcPeerConnection.current.ontrack = (e) => {
        console.log(e);
        remoteVideo.srcObject = e.streams[0];

        socket.emit('click-position', 'hi1234');
        console.log('out coming...');
      //  sendVideoDimensions();
       // videoRef.current.srcObject = e.streams[0]
        //videoRef.current.onloadedmetadata = (e) => videoRef.current.play()
      }

    },[]);


const getStream=async(screenId)=>
  {
    try
    {
     

    const stream=await navigator.mediaDevices.getUserMedia({
      audio:false,
      video:{
        chromeMedisSource:'desktop',
        chromeMediaSourceId:'window:133914:0'
      }
    })
    videoRef.srcObject=stream;
//handleStream(stream);
  }
  catch(error)
  {
    console.error('Error capturing screen stream:', error);

  }
  };

  const handleStream=(stream)=>
    {
      let {width,height}=stream.getVideoTracks()[0].getSettings();
      window.electronAPI.setSize({width, height});
      console.log('resized to w',width);
      videoRef.srcObject=stream;
    //  videoRef.onloadedmetadata=(e)=>videoRef.play();
    //  videoRef.current.srcObject=stream;
      //videoRef.current.onloadedmetadata=(e)=>videoRef.current.play();
    };


  
/*
  function sendVideoDimensions() {
    const videoElement = document.getElementById('remote-video');
    const width = videoElement.offsetWidth;
    const height = videoElement.offsetHeight;

    console.log(`Sending video dimensions: ${width}px x ${height}px`);

    // Emit the dimensions to the server
    socket.emit('video-dimensions', { width, height });
}
*/
// Send dimensions when the window is loaded and resized
//window.addEventListener('load', sendVideoDimensions);
//window.addEventListener('resize', sendVideoDimensions);


  

    // getStream('hello');
   // getScreenStream();
    /*
  window.electronAPI.getScreenId((customEvent, screenId) => {
    console.log('appjs screenId:', screenId);
    getStream(screenId);
});*/

return null;

/*
return (
  <div className="App">
  
  </div>
);
*/
/*
  return (
    <div className="App">
      <>
      <span>800 x600</span>
      <video ref={videoRef} className="video">video not avail</video>
      </>
    </div>
  );*/
}

export default App;
