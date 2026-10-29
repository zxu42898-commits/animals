import {chromium} from 'playwright';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const {startServer}=createRequire(import.meta.url)('../desktop/server.cjs');
const {server,url}=await startServer(path.resolve('dist'));
const reports=[];
let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.ANIMAL_TEST_CHROMIUM?{executablePath:process.env.ANIMAL_TEST_CHROMIUM}:{})});
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 await page.addInitScript(()=>{
  const NativeWorker=window.Worker;
  window.Worker=class extends NativeWorker{
   constructor(...args){super(...args);this.addEventListener('message',({data})=>{if(['result','error'].includes(data.type))window.__recognitionResult=data;});}
  };
 });
 page.on('console',m=>{if(m.type()==='error')console.error('Browser:',m.text());});
 await page.goto(url);
 assert.equal(await page.locator('.animal-card').count(),30);
 const fixtures=[['real-cats.png','cat'],['cartoon-rabbit.png','rabbit'],['cartoon-dog.png','dog'],['cartoon-fox.png','fox'],['cartoon-car.png',null],['cartoon-giraffe.png',null]];
 await mkdir('test-results',{recursive:true});
 for(const [file,expected] of fixtures){
  const old=await page.locator('#preview').getAttribute('src');
  await page.evaluate(()=>{window.__recognitionResult=null;});
  await page.locator('#file').setInputFiles(path.resolve('tests/fixtures',file));
  await page.waitForFunction(previous=>{const p=document.querySelector('#preview');return p.src&&p.getAttribute('src')!==previous;},old);
  await page.locator('#identify').click();
  await page.waitForFunction(()=>window.__recognitionResult!==null,null,{timeout:300000});
  const result=await page.evaluate(()=>window.__recognitionResult);
  reports.push({file,expected,result});
  await writeFile('test-results/recognition.json',JSON.stringify(reports,null,2));
  if(result.type==='error')throw new Error(`${file}: ${result.message}`);
  console.log(file,JSON.stringify({outcome:result.assessment.outcome,top:result.assessment.ranks.slice(0,3).map(a=>({id:a.id,score:a.score}))}));
  await page.screenshot({path:`test-results/${file}`});
  if(expected){assert.notEqual(result.assessment.outcome,'unknown',file);assert.equal(result.assessment.ranks[0].id,expected,file);}
  else assert.equal(result.assessment.outcome,'unknown',file);
 }
 console.log('PASS: real photo, 3 cartoon animals, object rejection and unsupported animal rejection');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
