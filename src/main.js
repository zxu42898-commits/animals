import './style.css';
import {animals} from './animals.js';
import {setupCamera} from './camera.js';
const $=s=>document.querySelector(s);
document.querySelector('#app').innerHTML=`
<header><a class="brand" href="./"><span class="brand-icon">❋</span> 森野识物<span class="brand-en">ANIMAL LENS</span></a><span class="privacy">◉ 照片仅在本机处理</span></header>
<main><section class="intro"><div class="eyebrow"><span></span> 和自然，重新认识一下</div><h1>遇见它，<br>认识<span>它。</span></h1><p>真实照片或卡通形象，都可以试试。<br>让每一次好奇，都有一个小小的答案。</p><div class="intro-tags"><span>✦ 30 种动物 · 支持卡通</span><span>↗ 无需注册</span></div><div class="nature-art" aria-hidden="true"><span class="orbit"></span><span class="art-leaf">🌿</span><span class="art-animal">🦊</span><span class="art-small">✦</span><span class="art-label">HELLO, WILD FRIEND.</span></div></section>
<section class="workbench"><div class="section-heading"><div><span class="step">01 / EXPLORE</span><h2>今天遇见了谁？</h2></div><span class="mini-mark">✳</span></div>
<div id="drop" class="drop-zone" tabindex="0" role="button" aria-label="选择动物照片"><div id="upload-placeholder"><span class="upload-icon">＋</span><h3>放一张动物照片或卡通图片到这里</h3><p>拖拽图片，或点击选择照片</p><span class="file-note">JPG / PNG / WEBP · 最大 15 MB</span></div><img id="preview" alt="待识别的动物照片" hidden><span id="replace" hidden>点击更换照片</span></div>
<input id="file" type="file" accept="image/jpeg,image/png,image/webp" hidden>
<div class="actions"><button id="identify" class="primary" disabled>开始识别 <span>↗</span></button><button id="take-photo" class="secondary">◉ 实时拍照</button></div>
<p id="status" role="status" aria-live="polite">支持真实动物、卡通插画和 3D 动物形象，单一主体效果更好。</p><div class="progress" hidden><div id="progress-bar"></div></div>
<div id="result" hidden></div><div class="model-note">✧ 首次识别需联网下载 AI 模型，之后可使用浏览器缓存。<br>识别结果仅供参考，请勿据此判断动物是否安全。</div></section>
<section class="catalog"><div class="catalog-header"><div><span class="step">02 / DISCOVER</span><h2>认识这些自然朋友</h2></div><span class="count">30 SPECIES</span></div><div class="filters" role="group" aria-label="动物类别"><button class="active" data-filter="all">全部动物</button><button data-filter="home">身边伙伴</button><button data-filter="wild">野外邻居</button><button data-filter="other">飞羽与水岸</button></div><div id="animal-grid"></div><p class="catalog-note">支持识别真实动物和卡通形象对应的动物类别，不识别角色姓名；夸张、混合或多主体形象可能无法确定。</p></section>
</main><footer><span>❋ 森野识物</span><p>保持好奇，温柔地认识自然。</p><span>MADE FOR THE CURIOUS</span></footer>
<dialog id="camera-dialog" class="camera-dialog" aria-labelledby="camera-title">
<div class="camera-heading"><h2 id="camera-title">实时拍照</h2><button id="close-camera" class="camera-close" aria-label="关闭摄像头">×</button></div>
<div class="camera-view"><video id="camera-video" autoplay muted playsinline aria-label="摄像头实时预览"></video><span class="camera-live" hidden>● 实时预览</span></div>
<p id="camera-status" role="status" aria-live="polite"></p>
<div class="camera-controls"><button id="switch-camera" class="secondary" hidden>切换摄像头</button><button id="retry-camera" class="secondary" hidden>重试</button><button id="capture-photo" class="primary" disabled>拍照并识别</button></div>
<button id="camera-upload" class="camera-upload">改用上传图片</button>
</dialog>
<dialog id="detail"><button id="close-detail" aria-label="关闭">×</button><div id="detail-content"></div></dialog>`;
const groups={home:['dog','cat','rabbit','hamster','horse','cow','sheep','pig','chicken','duck','goose'],other:['penguin','parrot','owl','turtle','frog','snake','goldfish']};
function render(filter='all'){
 const items=animals.filter(a=>filter==='all'||(filter==='wild'?![...groups.home,...groups.other].includes(a.id):groups[filter].includes(a.id)));
 $('#animal-grid').innerHTML=items.map(a=>`<button class="animal-card" data-id="${a.id}"><span>${a.emoji}</span><strong>${a.name}</strong><small>${a.title}</small></button>`).join('');
}
render();
$('.filters').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$('.filters .active').classList.remove('active');b.classList.add('active');render(b.dataset.filter);});
$('#animal-grid').onclick=e=>{const b=e.target.closest('[data-id]');if(!b)return;const a=animals.find(a=>a.id===b.dataset.id);$('#detail-content').innerHTML=`<span class="detail-emoji">${a.emoji}</span><h2>${a.name}</h2><p class="subtitle">${a.title}</p><p>${a.fact}</p>`;$('#detail').showModal();};
$('#close-detail').onclick=()=>$('#detail').close();
$('#detail').onclick=e=>{if(e.target===$('#detail'))$('#detail').close();};
let image=null,busy=false,worker;
const status=text=>$('#status').textContent=text;
function setImage(dataUrl){
 image=dataUrl;$('#preview').src=image;$('#preview').hidden=false;$('#upload-placeholder').hidden=true;$('#replace').hidden=false;$('#identify').disabled=false;$('#result').hidden=true;status('照片已准备好，点击「开始识别」认识它。');
}
const camera=setupCamera({onCapture(dataUrl){setImage(dataUrl);$('#identify').click();},onUpload(){if(!busy)$('#file').click();}});
function loadFile(file){
 if(busy)return;
 if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)){status('暂不支持此格式，请选择 JPG、PNG 或 WEBP 图片。');return;}
 if(file.size>15*1024*1024){status('图片超过 15 MB，请压缩后再试。');return;}
 const reader=new FileReader();reader.onerror=()=>status('图片读取失败，请重新选择。');reader.onload=()=>{
  const img=new Image();img.onerror=()=>status('这张图片无法打开，请换一张试试。');img.onload=()=>{
   // Resize locally to bound inference memory and strip image metadata.
   const canvas=document.createElement('canvas'),scale=Math.min(1,1024/Math.max(img.width,img.height));canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);setImage(canvas.toDataURL('image/jpeg',.9));
  };img.src=reader.result;
 };reader.readAsDataURL(file);
}
$('#drop').onclick=()=>{if(!busy)$('#file').click();};$('#drop').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('#drop').click();}};
$('#file').onchange=e=>{loadFile(e.target.files[0]);e.target.value='';};
$('#take-photo').onclick=()=>{if(!busy)camera.open();};
for(const type of ['dragover','dragleave','drop'])$('#drop').addEventListener(type,e=>{e.preventDefault();$('#drop').classList.toggle('dragging',type==='dragover');if(type==='drop')loadFile(e.dataTransfer.files[0]);});
function finish(){busy=false;$('#identify').disabled=!image;$('#take-photo').disabled=false;$('#identify').innerHTML='重新识别 <span>↗</span>';$('.progress').hidden=true;}
$('#identify').onclick=()=>{
 if(!image||busy)return;busy=true;$('#identify').disabled=true;$('#take-photo').disabled=true;$('#identify').textContent='正在认识它…';$('#result').hidden=true;status('正在加载识别模型，首次使用可能需要几分钟…');$('.progress').hidden=false;$('#progress-bar').style.width='4%';
 if(!worker){worker=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});
 worker.onmessage=({data})=>{
  if(data.type==='progress'){$('#progress-bar').style.width=`${Math.max(4,Math.min(100,data.progress||0))}%`;status('正在下载模型文件，请稍候…');return;}
  if(data.type==='inference'){status('正在比较真实动物与卡通形象，请稍候…');return;}
  finish();
  if(data.type==='error'){status('模型加载或识别失败，请重试。错误详情：'+data.message);console.error(data.message);worker.terminate();worker=null;return;}
  const {ranks,outcome,reason}=data.assessment,top=ranks[0];
  if(outcome==='unknown'){status(reason==='unsupported'?'图片可能是人物、物品或范围外的动物，暂时无法确定。':'多个类别比较接近，暂时无法确定。请换一张主体更清晰的图片。');return;}
  status(outcome==='possible'?'这个结果不太确定，建议换张图片再试。':'识别完成，一起认识这位朋友。');
  $('#result').hidden=false;$('#result').innerHTML=`<div class="result-top"><span class="result-emoji">${top.emoji}</span><div><span class="step">${outcome==='possible'?'可能是':'识别结果'}</span><h2>${top.name}</h2></div><span class="score">${Math.round(top.score*100)}%<small>相对匹配分数</small></span></div><p>${top.fact}</p><div class="alternatives">其他可能：${ranks.slice(1,3).filter(a=>a.score>.01).map(a=>`${a.name} ${Math.round(a.score*100)}%`).join(' · ')||'暂无较接近的类别'}</div><small>分数仅表示候选描述间的相对匹配程度，不代表识别正确率。</small>`;
 };
 worker.onerror=e=>{finish();status('识别进程启动失败，请刷新页面重试。');worker.terminate();worker=null;};}
 worker.postMessage({image});
};
