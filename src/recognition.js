import {animals} from './animals.js';
export const MODEL_ID='Xenova/clip-vit-base-patch32';
// Every class gets the same two styles, so summing scores does not favor animals.
const otherSubjects=[
 ['person','person'],['car','car'],['house','house'],['furniture','chair'],
 ['food','plate of food'],['plant','plant'],['landscape','landscape'],
 ['text','page of text'],['abstract','abstract pattern'],
 ['giraffe','giraffe'],['dolphin','dolphin'],['whale','whale'],
 ['shark','shark'],['kangaroo','kangaroo'],['koala','koala'],
 ['raccoon','raccoon'],['mouse','mouse'],['leopard','leopard'],
 ['red-panda','red panda'],['dinosaur','dinosaur'],['dragon','fantasy dragon'],
 ['unicorn','unicorn'],['insect','insect'],['butterfly','butterfly'],
];
function prompts(subject){
 const article=/^[aeiou]/i.test(subject)?'an':'a';
 return [`a photo of ${article} ${subject}.`,`a cartoon or 3D animated character of ${article} ${subject}.`];
}
export const candidates=[
 ...animals.flatMap(a=>prompts(a.english).map(label=>({label,id:a.id,supported:true}))),
 ...otherSubjects.flatMap(([id,name])=>prompts(name).map(label=>({label,id:`other:${id}`,supported:false}))),
];
const byLabel=new Map(candidates.map(c=>[c.label,c]));
export function assessPredictions(predictions){
 const sums=new Map();
 for(const p of predictions){
  const c=byLabel.get(p.label);
  if(!c||!Number.isFinite(p.score)||p.score<0)continue;
  sums.set(c.id,(sums.get(c.id)||0)+p.score);
 }
 const ranked=[...sums].map(([id,score])=>({id,score})).sort((a,b)=>b.score-a.score);
 const ranks=ranked.filter(a=>!a.id.startsWith('other:')).map(a=>({...animals.find(b=>b.id===a.id),score:a.score}));
 const first=ranked[0],gap=first?first.score-(ranked[1]?.score||0):0;
 if(!first||first.id.startsWith('other:')||first.score<.35||gap<.1){
  return {outcome:'unknown',ranks,reason:first?.id.startsWith('other:')?'unsupported':'ambiguous'};
 }
 return {outcome:first.score>=.65&&gap>=.25?'recognized':'possible',ranks};
}
