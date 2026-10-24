import {test} from 'node:test';
import assert from 'node:assert/strict';
import {animals,animalForLabel,rankAnimals} from '../src/animals.js';
test('30 supported animals and common ImageNet classes',()=>{
 assert.equal(animals.length,30);
 for(const [label,id] of [['golden retriever','dog'],['Egyptian cat','cat'],['fox squirrel','squirrel'],['red fox','fox'],['ox','cow'],['tiger','tiger'],['tiger cat','cat'],['African elephant','elephant'],['great grey owl','owl']]) assert.equal(animalForLabel(label)?.id,id,label);
});
test('objects and unsupported species are not forced into supported animals',()=>{
 for(const label of ['tiger shark','sea lion','guinea pig','red panda','leopard','carton','box','oxford']) assert.equal(animalForLabel(label),null,label);
});
test('breed scores aggregate without renormalizing away unsupported predictions',()=>{
 const result=rankAnimals([{label:'golden retriever',score:.3},{label:'Labrador retriever',score:.2},{label:'tabby',score:.1},{label:'car',score:.4}]);
 assert.equal(result[0].id,'dog');assert.equal(result[0].score,.5);assert.equal(result[1].score,.1);
});
