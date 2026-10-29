import {test} from 'node:test';
import assert from 'node:assert/strict';
import {animals} from '../src/animals.js';
import {candidates,assessPredictions} from '../src/recognition.js';
const prediction=(id,score,cartoon=false)=>({label:candidates.filter(c=>c.id===id)[cartoon?1:0].label,score});
test('30 animal classes have balanced real-photo and cartoon prompts',()=>{
 assert.equal(animals.length,30);
 assert.equal(new Set(candidates.map(c=>c.label)).size,candidates.length);
 for(const a of animals){
  const prompts=candidates.filter(c=>c.id===a.id);assert.equal(prompts.length,2);
  assert.match(prompts[0].label,/photo/);assert.match(prompts[1].label,/cartoon/);
 }
});
test('photo and cartoon evidence combine without discarding unsupported scores',()=>{
 const result=assessPredictions([prediction('rabbit',.3),prediction('rabbit',.4,true),prediction('other:car',.3)]);
 assert.equal(result.outcome,'recognized');assert.equal(result.ranks[0].id,'rabbit');assert.equal(result.ranks[0].score,.7);
});
test('non-animals and unsupported animals win over a weak animal match',()=>{
 for(const id of ['other:car','other:person','other:giraffe']){
  assert.equal(assessPredictions([prediction(id,.7),prediction('rabbit',.3)]).outcome,'unknown');
 }
});
test('close, weak and missing results are rejected; moderate matches remain tentative',()=>{
 assert.equal(assessPredictions([prediction('rabbit',.43),prediction('cat',.4)]).outcome,'unknown');
 assert.equal(assessPredictions([prediction('rabbit',.2)]).outcome,'unknown');
 assert.equal(assessPredictions([]).outcome,'unknown');
 assert.equal(assessPredictions([{label:'unknown prompt',score:1}]).outcome,'unknown');
 assert.equal(assessPredictions([prediction('rabbit',NaN)]).outcome,'unknown');
 assert.equal(assessPredictions([prediction('rabbit',.52),prediction('cat',.24)]).outcome,'possible');
});
