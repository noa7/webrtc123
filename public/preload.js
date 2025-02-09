const{ipcRenderer, contextBridge}=require("electron")
let screenId;



    contextBridge.exposeInMainWorld('electronAPI', { 
        getScreenId:(callback)=>
            {
                console.log(`prelaod callback`);
                ipcRenderer.on('SET_SOURCE_ID',callback);
               
            },
            setSize:(size)=>ipcRenderer.send('set-size', size)
    });
