const errors={
 NotAllowedError:'摄像头权限被拒绝。请在浏览器或 Windows 隐私设置中允许摄像头访问，再点击重试。',
 NotFoundError:'未检测到摄像头。请连接摄像头，或改用上传图片。',
 NotReadableError:'摄像头无法启动，可能被其他程序占用。请关闭占用它的程序后重试。',
 OverconstrainedError:'当前摄像头不支持所选设置，请重试或换一个摄像头。',
 SecurityError:'当前页面不允许使用摄像头，请使用 HTTPS、localhost 或桌面程序。',
};
export function setupCamera({onCapture,onUpload}){
 const dialog=document.querySelector('#camera-dialog');
 const video=document.querySelector('#camera-video');
 const message=document.querySelector('#camera-status');
 const capture=document.querySelector('#capture-photo');
 const switchCamera=document.querySelector('#switch-camera');
 const retry=document.querySelector('#retry-camera');
 let stream=null,devices=[],currentDevice='',generation=0,opening=false;
 function stopStream(){
  if(stream)for(const track of stream.getTracks())track.stop();
  stream=null;video.srcObject=null;capture.disabled=true;document.querySelector('.camera-live').hidden=true;
 }
 function close(){generation++;opening=false;stopStream();if(dialog.open)dialog.close();}
 function fail(text){message.textContent=text;capture.disabled=true;retry.hidden=false;switchCamera.disabled=true;}
 async function start(deviceId){
  const request=++generation;opening=true;stopStream();capture.disabled=true;switchCamera.disabled=true;retry.hidden=true;
  message.textContent='正在打开摄像头，请允许摄像头访问…';
  let stage='request camera';
  try{
   if(!window.isSecureContext)throw Object.assign(new Error(),{name:'SecurityError'});
   if(!navigator.mediaDevices?.getUserMedia){fail('当前浏览器不支持实时摄像头，请改用上传图片。');return;}
   const next=await navigator.mediaDevices.getUserMedia({audio:false,video:{width:{ideal:1280},height:{ideal:720},...(deviceId?{deviceId:{exact:deviceId}}:{facingMode:{ideal:'environment'}})}});
   if(request!==generation||!dialog.open){for(const track of next.getTracks())track.stop();return;}
   stage='attach preview';stream=next;video.srcObject=next;
   const track=next.getVideoTracks()[0];
   const settings=track.getSettings();currentDevice=settings.deviceId||deviceId||'';
   video.classList.toggle('mirrored',settings.facingMode==='user');
   track.addEventListener('ended',()=>{if(request===generation&&dialog.open){stopStream();fail('摄像头已断开，请检查连接后重试。');}});
   stage='play preview';await video.play();
   if(request!==generation||!dialog.open)return;
   // Some browsers cannot enumerate cameras; the active preview can still be used.
   try{devices=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput');}catch{devices=[];}
   if(request!==generation||!dialog.open)return;
   switchCamera.hidden=devices.length<2;switchCamera.disabled=devices.length<2;
   capture.disabled=!(video.videoWidth&&video.videoHeight);document.querySelector('.camera-live').hidden=capture.disabled;
   message.textContent='将动物放入画面，点击「拍照并识别」。画面仅在本机处理，不录音。';
  }catch(error){console.error('Camera access failed:',stage,error.name,error.message);if(request===generation&&dialog.open){stopStream();fail(errors[error.name]||'摄像头启动失败，请重试或改用上传图片。');}}
  finally{if(request===generation)opening=false;}
 }
 document.querySelector('#close-camera').onclick=close;
 document.querySelector('#camera-upload').onclick=()=>{close();onUpload();};
 retry.onclick=()=>start();
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 dialog.addEventListener('close',()=>{if(dialog.open)return;generation++;opening=false;stopStream();});
 dialog.addEventListener('click',event=>{if(event.target===dialog)close();});
 switchCamera.onclick=()=>{
  if(opening||devices.length<2)return;
  const index=devices.findIndex(d=>d.deviceId===currentDevice);
  start(devices[(index+1)%devices.length].deviceId);
 };
 capture.onclick=()=>{
  if(opening||!stream||!video.videoWidth||!video.videoHeight)return;
  try{
   const canvas=document.createElement('canvas');
   const scale=Math.min(1,1024/Math.max(video.videoWidth,video.videoHeight));
   canvas.width=Math.max(1,Math.round(video.videoWidth*scale));canvas.height=Math.max(1,Math.round(video.videoHeight*scale));
   // Capture the original frame; the optional selfie mirroring is preview-only.
   canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);
   const image=canvas.toDataURL('image/jpeg',.9);close();onCapture(image);
  }catch{fail('拍照失败，请等待画面稳定后重试。');}
 };
 const onDeviceChange=()=>{if(dialog.open&&!opening&&stream)navigator.mediaDevices.enumerateDevices().then(list=>{if(!dialog.open||opening||!stream)return;devices=list.filter(d=>d.kind==='videoinput');switchCamera.hidden=devices.length<2;switchCamera.disabled=devices.length<2;}).catch(()=>{});};
 navigator.mediaDevices?.addEventListener?.('devicechange',onDeviceChange);
 window.addEventListener('pagehide',close);
 return {open(){if(dialog.open)return;dialog.showModal();switchCamera.hidden=true;start();},close};
}
