import { pipeline, env } from '@huggingface/transformers';
import {MODEL_ID,candidates,assessPredictions} from './recognition.js';
env.allowLocalModels = false;
let classifier;
self.onmessage = async ({data}) => {
 try {
  if(!classifier) classifier=await pipeline('zero-shot-image-classification',MODEL_ID,{
   dtype:'q8', device:'wasm', progress_callback:p=>{if(p.status==='progress')self.postMessage({type:'progress',progress:p.progress});}
  });
  self.postMessage({type:'inference'});
  const predictions=await classifier(data.image,candidates.map(c=>c.label),{hypothesis_template:'{}'});
  self.postMessage({type:'result',assessment:assessPredictions(predictions)});
 } catch(error){console.error(error);self.postMessage({type:'error',message:error.message});}
};
