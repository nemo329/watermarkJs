const {
  contextBridge,
  ipcRenderer
} = require("electron");

contextBridge.exposeInMainWorld("api", {
  sendToA: function(path,msg){
    var argsTo = {
      filePath: path, 
      message: msg
    };
    ipcRenderer.invoke('modify', argsTo).then((result) => {
    })
  } ,
    receiveFromD: function(func){
        ipcRenderer.on("D", (event, ...args) => func(event, ...args));       
    }
});