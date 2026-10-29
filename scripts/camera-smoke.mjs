import {chromium} from 'playwright';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const {startServer}=createRequire(import.meta.url)('../desktop/server.cjs');
const {server,url}=await startServer(path.resolve('dist'));
let browser;
const results=[];
try{
 browser=await chromium.launch({headless:true,args:['--use-fake-device-for-media-stream=device-count=2'],...(process.env.ANIMAL_TEST_CHROMIUM?{executablePath:process.env.ANIMAL_TEST_CHROMIUM}:{})});
 const context=await browser.newContext({permissions:['camera']});
 await context.addInitScript(()=>{
  window.__cameraStreams=[];
  const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia=async options=>{
   const stream=await original(options);window.__cameraStreams.push(stream);
   if(window.__delayCamera)await new Promise(resolve=>window.__releaseCamera=resolve);
   return stream;
  };
  // Recognition is checked separately with the real model. Here verify its captured-image input.
  window.Worker=class{
   postMessage(data){window.__capturedImage=data.image;setTimeout(()=>this.onmessage?.({data:{type:'result',assessment:{outcome:'unknown',ranks:[],reason:'unsupported'}}}),0);}
   terminate(){}
  };
 });
 const page=await context.newPage();await page.goto(url);
 await page.locator('#take-photo').click();
 await page.waitForFunction(()=>!document.querySelector('#capture-photo').disabled);
 assert.equal(await page.evaluate(()=>document.querySelector('#camera-video').srcObject.getAudioTracks().length),0);
 assert.equal(await page.evaluate(()=>document.querySelector('#camera-video').videoWidth>0),true);
 await mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/camera-preview.png'});
 results.push('real getUserMedia fake-device preview without audio');
 const before=await page.evaluate(()=>document.querySelector('#camera-video').srcObject.getVideoTracks()[0].getSettings().deviceId);
 assert.equal(await page.locator('#switch-camera').isVisible(),true);
 await page.locator('#switch-camera').click();
 await page.waitForFunction(previous=>{const v=document.querySelector('#camera-video');return !document.querySelector('#capture-photo').disabled&&v.srcObject?.getVideoTracks()[0].getSettings().deviceId!==previous;},before);
 assert.equal(await page.evaluate(()=>window.__cameraStreams[0].getVideoTracks()[0].readyState),'ended');results.push('switch camera and release prior stream');
 await page.locator('#capture-photo').click();
 await page.waitForFunction(()=>!!window.__capturedImage);
 assert.equal(await page.locator('#camera-dialog').isVisible(),false);
 assert.equal(await page.locator('#preview').isVisible(),true);
 assert.equal(await page.evaluate(()=>window.__capturedImage.startsWith('data:image/jpeg;base64,')),true);
 assert.equal(await page.evaluate(()=>window.__cameraStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))),true);
 results.push('capture JPEG, send it for recognition and release camera');
 await page.locator('#take-photo').click();await page.waitForFunction(()=>!document.querySelector('#capture-photo').disabled);
 await page.keyboard.press('Escape');
 await page.waitForFunction(()=>window.__cameraStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended')));
 results.push('Escape releases all camera tracks');
 await page.evaluate(()=>window.__delayCamera=true);
 await page.locator('#take-photo').click();await page.waitForFunction(()=>!!window.__releaseCamera);
 await page.locator('#close-camera').click();await page.evaluate(()=>{window.__delayCamera=false;window.__releaseCamera();});
 await page.waitForFunction(()=>window.__cameraStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended')));
 assert.equal(await page.locator('#camera-dialog').isVisible(),false);results.push('closing while permission request is pending releases eventual stream');
 await page.setViewportSize({width:390,height:844});await page.locator('#take-photo').click();await page.waitForFunction(()=>!document.querySelector('#capture-photo').disabled);
 await page.screenshot({path:'test-results/camera-mobile.png'});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.locator('#close-camera').click();results.push('mobile camera layout');
 await context.close();
 for(const [name,message] of [['NotAllowedError','权限被拒绝'],['NotFoundError','未检测到摄像头'],['NotReadableError','被其他程序占用']]){
  const errorContext=await browser.newContext();await errorContext.addInitScript(errorName=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('test camera failure',errorName);};},name);
  const errorPage=await errorContext.newPage();await errorPage.goto(url);await errorPage.locator('#take-photo').click();
  await errorPage.waitForFunction(expected=>document.querySelector('#camera-status').textContent.includes(expected),message);
  assert.equal(await errorPage.locator('#capture-photo').isDisabled(),true);
  assert.equal(await errorPage.locator('#retry-camera').isVisible(),true);
  await errorPage.locator('#camera-upload').click();assert.equal(await errorPage.locator('#camera-dialog').isVisible(),false);
  results.push(`injected ${name}: actionable error and upload fallback`);await errorContext.close();
 }
 await writeFile('test-results/camera.json',JSON.stringify({passed:results},null,2));console.log('PASS:',results.join('; '));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
