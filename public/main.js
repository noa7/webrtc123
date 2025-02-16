const { app, BrowserWindow, ipcMain, desktopCapturer } = require('electron');
//const express = require('express');
const fs = require("fs");
const path = require("path");
const https = require("https");  // Ensure we're using HTTPS

const cors=require('cors')
const express= require('express')

const expressApp=new express();

const appPath = process.env.PORTABLE_EXECUTABLE_DIR || __dirname;


const options = {
    key: fs.readFileSync(path.join(__dirname, "key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "cert.pem")),
  };

const{createServer}=require('http')
const {Server}=require('socket.io') 
const dgram = require('dgram');
const udpClient = dgram.createSocket('udp4');



const net = require('net');


expressApp.use(express.static(__dirname));

expressApp.get('/', function(req,res,next) { 
  //  console.log('req path....', requestAnimationFrame.path);
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

expressApp.set('port', 443);
expressApp.use(cors({ origin: '*' }))

//expressApp.commandLine.appendSwitch("ignore-certificate-errors");


expressApp.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
})
app.commandLine.appendSwitch("ignore-certificate-errors");

const httpServer = https.createServer(options, expressApp)
httpServer.listen(443, '0.0.0.0', () => {
    console.log(`✅ HTTPS Server running at https://localhost:443/`);
  }).on('error', (err) => {
    console.error(`❌ Server error: ${err.message}`);
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port 443 is already in use. Try running: npx kill-port 443`);
    } else if (err.code === 'EACCES') {
      console.error(`❌ Permission denied. Try running with admin privileges.`);
    }
  });
  
httpServer.on('error', e => console.log(e.message, e.name))
httpServer.on('listening', () => console.log('listening.....'))
const io = new Server(httpServer, {
    origin: '*',
})

const connections = io.of('/remote-ctrl')

let Socket;

connections.on('connection', socket => {
    console.log('connection established')
    Socket=socket;

    socket.on('send-request', (requestString) => {
        console.log('Received request string from client:', requestString);

        desktopCapturer.getSources({ types: ['screen','window'] }).then(sources => {
            console.log('Desktop Sources:');
            sources.forEach((source, index) => {
              //  console.log(`[${index}] Name: ${source.name}`);
                //console.log(`   ID: ${source.id}`);
                //console.log(`   DISPLAYID: ${source.display_id}`);
if(source.name==="DISPLAY1")
{
    socket.emit('server-response', source.id);
    console.log(`SOURCE MATCH`);
    console.log(`[${index}] Name: ${source.name}`);
    console.log(`   ID: ${source.id}`);
    console.log(`   DISPLAYID: ${source.display_id}`);
    mainWindow.webContents.send('SET_SOURCE_ID', source.id);
    return;
}

            });
        });
        

    });


    socket.on('offer', sdp => {
        console.log('routing offer')
        // send to the electron app
        socket.broadcast.emit('offer', sdp)
    })

    socket.on('answer', sdp => {
        console.log('routing answer')
        // send to the electron app
        socket.broadcast.emit('answer', sdp)
    })

    socket.on('icecandidate', icecandidate => {
        socket.broadcast.emit('icecandidate', icecandidate)
    })

    socket.on('selectedScreen', selectedScreen => {
        clientSelectedScreen = selectedScreen

        socket.broadcast.emit('selectedScreen', clientSelectedScreen)
    })

    socket.on('mouse_move', ({
        clientX, clientY, clientWidth, clientHeight,
    }) => {
       // const { displaySize: { width, height }, } = clientSelectedScreen
       // const ratioX = width / clientWidth
       // const ratioY = height / clientHeight

        //const hostX = clientX * ratioX
        //const hostY = clientY * ratioY

       // robot.moveMouse(hostX, hostY)
    })

    socket.on('mouse_click', ({ button }) => {
       // robot.mouseClick('left', false) // true means double-click
    })

    socket.on('click-position', ( position ) => {
        console.log('in coming...');
        console.log(position);
     })

     socket.on('video-dimensions', (dimensions) => {
        console.log('Received video dimensions:', dimensions);
    });


    socket.on('message', (data) => {
        console.log('REC DATA:', data);


        
        udpClient.send(data, 50001, '127.0.0.1', (err) => {
            if (err) {
                console.error('Error sending UDP message:', err);
            } else {
                console.log('UDP message sent successfully');
            }
        });
    });


    socket.on("start_fired", (data) => {
        console.log(`Start button clicked! Video Dimensions - Width: ${data.width}, Height: ${data.height}`);
        udpClient.send(data, 50001, '127.0.0.1', (err) => {
            if (err) {
                console.error('Error sending UDP message:', err);
            } else {
                console.log('UDP message sent successfully');
            }
        });
    });



})

let clientStatus="unknown";


function intToByteArray(num) {
    const buffer = Buffer.alloc(4); // 4 bytes for a 32-bit integer
    buffer.writeInt32LE(num, 0);    // Write the integer as little-endian
    return buffer;
}



let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),  // Enable communication with renderer
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity:false
        }
    });

    mainWindow.loadURL('https://localhost:443/portal.html');

   
    mainWindow.setTitle("Atlantic Portal");

    mainWindow.once('ready-to-show',()=>
        {
            mainWindow.show();
            mainWindow.setPosition(0,0);
            desktopCapturer.getSources({ types: ['screen','window'] }).then(sources => {
               console.log('Desktop Sources:');
               sources.forEach((source, index) => {
                 //  console.log(`[${index}] Name: ${source.name}`);
                   //console.log(`   ID: ${source.id}`);
                   //console.log(`   DISPLAYID: ${source.display_id}`);
   if(source.name==="DISPLAY1")
   {
       console.log(`SOURCE MATCH`);
       console.log(`[${index}] Name: ${source.name}`);
       console.log(`   ID: ${source.id}`);
       console.log(`   DISPLAYID: ${source.display_id}`);
       mainWindow.webContents.send('SET_SOURCE_ID', source.id);
       return;
   }
   
               });
           });
            
        });




    mainWindow.webContents.openDevTools();
});

// Listen for WebRTC capture request
ipcMain.handle('get-screen-stream', async () => {
    const sources = await desktopCapturer.getSources({ types: ['window', 'screen'] });
    return sources[0].id;  // Return the ID of the first available screen
});



const udpServer = dgram.createSocket("udp4");

const udpPORT = 50006;
const udpHOST = "127.0.0.1";

udpServer.on("message", (msg, rinfo) => {
    console.log(`Received message: ${msg.toString()} from ${rinfo.address}:${rinfo.port}`);
    const message = msg.toString().trim();
   // console.log(`Received message: ${message} from ${rinfo.address}:${rinfo.port}`);

    let wsMessage = null;

    if (message.toLowerCase() === "disconn") {
        Socket.emit("disconn", "");
    } else if (message.toLowerCase() === "reconn") {
        Socket.emit("reconn", "");
    }

});

udpServer.on("listening", () => {
    const address = udpServer.address();
    console.log(`UDP Server listening on ${address.address}:${address.port}`);
});

udpServer.bind(udpPORT, udpHOST);



