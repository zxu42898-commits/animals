import {chromium} from 'playwright';
import {spawn,execFileSync} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdir,mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const portServer=createServer();
await new Promise(resolve=>portServer.listen(0,'127.0.0.1',resolve));
const port=portServer.address().port;await new Promise(resolve=>portServer.close(resolve));
const profile=await mkdtemp(path.join(tmpdir(),'animal-desktop-camera-'));
const child=spawn(path.resolve('release/win-unpacked/AnimalLens.exe'),[`--remote-debugging-port=${port}`,'--use-fake-device-for-media-stream=device-count=2',`--user-data-dir=${profile}`],{stdio:['ignore','pipe','pipe']});
child.stderr.on('data',chunk=>process.stderr.write(chunk));
let browser;
let processError=null;child.on('error',error=>processError=error);
try{
 const deadline=Date.now()+45000;
 while(Date.now()<deadline){
  if(processError)throw processError;
  if(child.exitCode!==null)throw new Error(`Desktop exited before camera check: ${child.exitCode}`);
  try{browser=await chromium.connectOverCDP(`http://127.0.0.1:${port}`,{timeout:1000});break;}catch{await new Promise(resolve=>setTimeout(resolve,300));}
 }
 assert.ok(browser,'Electron debugger did not become ready');
 const context=browser.contexts()[0];
 await context.addInitScript(()=>{
  window.__desktopCameraStreams=[];
  const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia=async options=>{const stream=await original(options);window.__desktopCameraStreams.push(stream);return stream;};
 });
 const page=context.pages()[0];
 await page.waitForURL('http://127.0.0.1:*/');await page.reload();
 await page.locator('#take-photo').click();
 await page.waitForFunction(()=>!document.querySelector('#capture-photo').disabled,null,{timeout:30000});
 assert.equal(await page.evaluate(()=>document.querySelector('#camera-video').srcObject.getAudioTracks().length),0);
 await mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/desktop-camera.png'});
 await page.locator('#close-camera').click();
 await page.waitForFunction(()=>window.__desktopCameraStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended')));
 await writeFile('test-results/desktop-camera.json',JSON.stringify({passed:'Packaged Windows Electron app grants its own video-only camera request, shows live frames and releases the stream',device:'Chromium virtual camera, not physical hardware'},null,2));
 console.log('PASS: packaged Windows Electron camera permission, preview and cleanup');
}finally{
 await browser?.close();
 if(child.pid&&child.exitCode===null){try{execFileSync('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore'});}catch{}}
 await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}
