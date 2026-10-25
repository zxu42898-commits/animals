const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.wasm':'application/wasm','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon'};
const csp = "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' blob: https://cdn.jsdelivr.net; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' data: blob: https://huggingface.co https://*.huggingface.co https://*.hf.co https://cdn.jsdelivr.net; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";
async function startServer(root, preferredPort=0) {
 const resolvedRoot=path.resolve(root);
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Content-Security-Policy',csp);
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Cache-Control','no-cache');
  if(req.headers.host!==`127.0.0.1:${server.address().port}`){res.writeHead(403).end();return;}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'}).end();return;}
  try {
   const pathname=decodeURIComponent(req.url.split('?')[0]);
   const file=path.resolve(resolvedRoot,'.'+(pathname==='/'?'/index.html':pathname));
   if(!file.startsWith(resolvedRoot+path.sep)){res.writeHead(403).end();return;}
   const data=await fs.readFile(file);
   res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});
   res.end(req.method==='HEAD'?undefined:data);
  } catch(error){res.writeHead(error.code==='ENOENT'||error.code==='EISDIR'?404:400).end();}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(preferredPort,'127.0.0.1',resolve);});
 return {server,url:`http://127.0.0.1:${server.address().port}`};
}
module.exports={startServer};
