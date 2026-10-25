import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import http from 'node:http';
const {startServer}=createRequire(import.meta.url)('../desktop/server.cjs');
test('desktop serves the built app and WASM locally with restricted access',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'animal-desktop-'));
 await writeFile(path.join(root,'index.html'),'<html>Animal Lens</html>');
 await writeFile(path.join(root,'model.wasm'),new Uint8Array([0,97,115,109]));
 const {server,url}=await startServer(root);
 try{
  const page=await fetch(url);assert.equal(page.status,200);assert.match(await page.text(),/Animal Lens/);
  assert.match(page.headers.get('content-security-policy'),/frame-ancestors 'none'/);
  const wasm=await fetch(url+'/model.wasm');assert.equal(wasm.headers.get('content-type'),'application/wasm');assert.equal((await wasm.arrayBuffer()).byteLength,4);
  assert.equal((await fetch(url+'/missing.js')).status,404);
  assert.equal((await fetch(url,{method:'POST'})).status,405);
  assert.equal((await fetch(url+'/%2e%2e%2fpackage.json')).status,403);
  const foreignHostStatus=await new Promise((resolve,reject)=>{http.get(url,{headers:{Host:'attacker.example'}},res=>{res.resume();resolve(res.statusCode);}).on('error',reject);});
  assert.equal(foreignHostStatus,403);
 }finally{await new Promise(resolve=>server.close(resolve));await rm(root,{recursive:true,force:true});}
});
