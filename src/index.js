const {app, BrowserWindow, Menu, MenuItem, ipcMain, shell} = require('electron');
const fs = require('fs');
const $ = require('jquery');

let mainWindow;
const config = JSON.parse(fs.readFileSync('./src/environment/config/config.json','utf8'));
let inputWindow;
//window creation
function createWindow(){
    mainWindow = new BrowserWindow({ minWidth:600, minHeight:600,width:1066, height:700, resizable:true, webPreferences: {
        plugins: true
      }});
      // inputWindow = new BrowserWindow({ parent:mainWindow, modal:true, width:400 , height:200,
      // fullscreen:config.fullscreen, webPreferences: { plugins: true }})
      // inputWindow.loadFile('./src/app/inputModal/inputModal.html');
      // inputWindow.setMenuBarVisibility(false);
      // global.input = {totalElements:null,sampleSize:null,sample:null};
      // inputWindow.on('closed',()=>{
      // if(global.input.totalElements != null & global.input.sampleSize != null 
      //             & global.input.sample != null){
          if(config.fullscreen == false)mainWindow.maximize();
              mainWindow.show();
              mainWindow.loadFile('./src/index.html');
              mainWindow.setMenuBarVisibility(false);
              //  mainWindow.setAutoHideMenuBar(true);
              mainWindow.maximize();
              mainWindow.on('closed', () => {
              mainWindow = null;
              });
      //  }else{
      //    mainWindow.close();
      //    mainWindow = null;
      //  }
    //  });
     global.shared = {index:0,images:undefined,workerid:undefined};
     global.mainWindow = mainWindow;
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
        mainWindow.removeAllListeners('close');
      }
});
//context menu set up
const menu = new Menu()
if(!config.onBPO){
  menu.append(new MenuItem({ id:'reset', label: 'Reset', role:'reload'}));
}else{
  menu.append(new MenuItem({ id:'gde', label: 'QA-GDE' }));
}

app.on('browser-window-created', (event, win) => {
  win.webContents.on('context-menu', (e, params) => {
    menu.popup(win, params.x, params.y)
  })
});

ipcMain.on('show-context-menu', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  menu.popup(win)
});