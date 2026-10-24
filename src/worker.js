import { pipeline, env } from '@huggingface/transformers';
env.allowLocalModels = false;
let classifier;
self.onmessage = async ({data}) => {
 try {
  if(!classifier) classifier=await pipeline('image-classification','Xenova/mobilenetv2-1.0-imagenet-224',{
   dtype:'q8', device:'wasm', progress_callback:p=>{ if(p.status==='progress') self.postMessage({type:'progress',progress:p.progress}); }
  });
  const predictions=await classifier(data.image,{top_k:1000});
  self.postMessage({type:'result',predictions});
 } catch(error){self.postMessage({type:'error',message:error.message});}
};
