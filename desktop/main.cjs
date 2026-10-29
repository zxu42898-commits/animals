const {app,BrowserWindow,dialog}=require('electron');
const path=require('node:path');
const fs=require('node:fs/promises');
const {startServer}=require('./server.cjs');
const {isAppOrigin,canRequestCamera}=require('./permissions.cjs');
let mainWindow,webServer;
if(!app.requestSingleInstanceLock()) app.quit();
else {
 app.on('second-instance',()=>{if(mainWindow){if(mainWindow.isMinimized())mainWindow.restore();mainWindow.show();mainWindow.focus();}});
 app.whenReady().then(async()=>{
  try {
   // Reuse a stable local origin so the browser can retain its model cache.
   const portFile=path.join(app.getPath('userData'),'local-port.json');
   let preferredPort=0;
   try{const saved=JSON.parse(await fs.readFile(portFile,'utf8'));if(Number.isInteger(saved.port)&&saved.port>=1024&&saved.port<=65535)preferredPort=saved.port;}catch{}
   const root=path.join(__dirname,'../dist');
   let local;
   try{local=await startServer(root,preferredPort);}catch(error){if(error.code!=='EADDRINUSE')throw error;local=await startServer(root);}
   const {server,url}=local;webServer=server;
   await fs.mkdir(path.dirname(portFile),{recursive:true});
   await fs.writeFile(portFile,JSON.stringify({port:server.address().port}));
   mainWindow=new BrowserWindow({width:1200,height:900,minWidth:390,minHeight:600,title:'森野识物 · 动物识别',backgroundColor:'#f7f8f2',autoHideMenuBar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
   mainWindow.setMenu(null);
   mainWindow.webContents.setWindowOpenHandler(()=>({action:'deny'}));
   mainWindow.webContents.on('will-navigate',(event,target)=>{if(new URL(target).origin!==url)event.preventDefault();});
   mainWindow.webContents.session.setPermissionCheckHandler((wc,permission,origin,details)=>wc===mainWindow.webContents&&permission==='media'&&details.mediaType==='video'&&isAppOrigin(origin,url));
   mainWindow.webContents.session.setPermissionRequestHandler((wc,permission,callback,details)=>callback(wc===mainWindow.webContents&&details.isMainFrame!==false&&canRequestCamera(permission,details.requestingUrl,url,details.mediaTypes)));
   await mainWindow.loadURL(url);
  } catch(error){dialog.showErrorBox('无法启动森野识物',error.message);app.quit();}
 });
 app.on('window-all-closed',()=>app.quit());
 app.on('before-quit',()=>webServer?.close());
}
