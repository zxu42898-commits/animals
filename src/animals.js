// ImageNet labels are grouped so individual breeds become one familiar animal.
const entries = [
['dog','狗','🐕','忠诚的伙伴','嗅觉十分灵敏，能通过气味探索周围的世界。','dog|terrier|retriever|shepherd|spaniel|poodle|hound|collie|husky|malamute|chihuahua|pug|boxer|dalmatian|corgi|pinscher|schnauzer|papillon|pekinese|shih-tzu|bulldog|basenji|samoyed|newfoundland|leonberg|rottweiler|kuvasz|briard|schipperke|groenendael|malinois|kelpie|komondor|vizsla|weimaraner|saluki|whippet'],
['cat','猫','🐈','好奇的探索家','胡须能感知周围环境，帮助它判断狭窄的通道。','tabby|tiger cat|persian cat|siamese cat|egyptian cat'],
['rabbit','兔子','🐇','长耳朵的邻居','长耳朵不仅能听声音，还能帮助身体散热。','rabbit|hare|wood rabbit|angora'],
['hamster','仓鼠','🐹','小小储粮员','颊囊像随身的小口袋，可以暂时储存食物。','hamster'],
['horse','马','🐎','草原上的奔跑者','马是群居动物，会用耳朵和身体姿态传递情绪。','sorrel'],
['cow','牛','🐄','温和的食草动物','牛会反刍，把食物重新咀嚼，帮助消化植物。','ox|oxcart'],
['sheep','绵羊','🐑','穿毛衣的朋友','绵羊的瞳孔呈横向长条形，有助于观察周围环境。','ram'],
['pig','猪','🐖','聪明的农场伙伴','猪有很好的记忆力，也有灵敏的嗅觉。','hog'],
['chicken','鸡','🐔','农场的早起者','鸡会用不同的叫声交流，也会通过沙浴清洁羽毛。','hen|cock'],
['duck','鸭','🦆','水边的游泳家','脚趾之间的蹼让鸭子在水中划行更轻松。','drake'],
['goose','鹅','🪿','警觉的水鸟','鹅常以群体活动，并用响亮的叫声与同伴交流。','goose'],
['panda','大熊猫','🐼','竹林里的朋友','大熊猫主要以竹子为食，每天会花很长时间进食。','giant panda'],
['tiger','老虎','🐅','有条纹的大猫','每只老虎的条纹图案都不一样。','tiger'],
['lion','狮子','🦁','草原上的群居大猫','狮子是少数经常以群体生活的猫科动物。','lion'],
['elephant','大象','🐘','长鼻子的巨人','象鼻由许多肌肉组成，能闻气味、喝水和抓取物体。','elephant|tusker'],
['zebra','斑马','🦓','条纹旅行家','斑马的条纹各不相同，可以帮助同伴识别彼此。','zebra'],
['monkey','猴子','🐒','灵巧的攀爬者','许多猴子会相互梳理毛发，维持群体中的关系。','monkey|macaque|baboon|langur|colobus|marmoset|capuchin|guenon|patas'],
['bear','熊','🐻','森林里的大个子','熊的嗅觉很灵敏，食性随种类和生活环境而变化。','brown bear|american black bear|ice bear|sloth bear'],
['fox','狐狸','🦊','机敏的森林居民','狐狸会利用灵敏的听觉寻找藏在草丛中的猎物。','fox'],
['wolf','狼','🐺','合作的旅行者','狼常在家族群体中生活，通过嚎叫等方式交流。','wolf'],
['crocodile','鳄鱼','🐊','水边的伏击者','鳄鱼的眼睛和鼻孔位于头部上方，方便在水中观察和呼吸。','crocodile|alligator'],
['squirrel','松鼠','🐿️','树上的收藏家','松鼠会把食物藏起来，一部分遗忘的种子可能长成树。','fox squirrel'],
['hedgehog','刺猬','🦔','带刺的小邻居','遇到威胁时，许多刺猬会蜷缩起来保护柔软的腹部。','hedgehog'],
['penguin','企鹅','🐧','穿礼服的游泳家','企鹅不会飞，但翅膀像鳍一样，能帮助它在水下游动。','penguin'],
['parrot','鹦鹉','🦜','多彩的鸟类伙伴','鹦鹉的喙强壮而弯曲，适合处理坚果和种子。','macaw|african grey|cockatoo|lorikeet'],
['owl','猫头鹰','🦉','安静的夜间猎手','许多猫头鹰的羽毛结构有助于减轻飞行时的声音。','owl'],
['turtle','龟','🐢','背着壳的旅行家','龟壳是身体的一部分，与骨骼相连。','turtle|terrapin|tortoise'],
['frog','青蛙','🐸','池塘边的歌手','青蛙属于两栖动物，很多种类从蝌蚪开始成长。','frog'],
['snake','蛇','🐍','无足的爬行者','蛇会用分叉的舌头收集环境中的化学信息。','snake|python|boa|cobra|viper|sidewinder'],
['goldfish','金鱼','🐠','水中的小精灵','金鱼由鲫鱼驯化而来，有许多不同的体形和颜色。','goldfish']
];
export const animals = entries.map(([id,name,emoji,title,fact,pattern])=>({id,name,emoji,title,fact,pattern:new RegExp(`(?:^|\\b)(?:${pattern})(?:\\b|$)`,'i')}));
// Word boundaries keep “tiger shark” and “tiger cat” out of the tiger group.
export function animalForLabel(label) {
 const s=label.toLowerCase().split(',')[0].trim();
 if(s==='fox squirrel') return animals.find(a=>a.id==='squirrel');
 if (s==='tiger cat') return animals.find(a=>a.id==='cat');
 if (s==='tiger') return animals.find(a=>a.id==='tiger');
 if (s.includes('shark') || s==='tiger beetle' || s==='sea lion' || s==='guinea pig' || s==='red panda' || s==='leopard') return null;
 return animals.find(a=> a.id!=='tiger' && a.pattern.test(s)) ?? null;
}
export function rankAnimals(predictions) {
 const scores=new Map();
 for(const p of predictions){const a=animalForLabel(p.label);if(a) scores.set(a.id,(scores.get(a.id)||0)+p.score);}
 return [...scores].map(([id,score])=>({...animals.find(a=>a.id===id),score})).sort((a,b)=>b.score-a.score);
}
