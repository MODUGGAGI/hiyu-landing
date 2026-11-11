// Regenerate exam/job previews, or fill missing love previews (--season=love).
// HIYU_CANVAS_MODULE may point to an existing @napi-rs/canvas installation.
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { createCanvas, loadImage, GlobalFonts } = require(process.env.HIYU_CANVAS_MODULE || '@napi-rs/canvas');
const root = fileURLToPath(new URL('../site/pain-test/', import.meta.url));
const source = await readFile(path.join(root, 'assets/app.js'), 'utf8');
const seasonKey = process.argv.find(arg => arg.startsWith('--season='))?.split('=')[1] || 'suneung';
if (!['suneung','company','love','job'].includes(seasonKey)) throw new Error('Unknown season');
const missingOnly = process.argv.includes('--missing') || seasonKey === 'love';
const imageDirectory = ['love','company'].includes(seasonKey) ? 'results-v3' : seasonKey === 'job' ? 'results-v1-job' : 'results-v4-exam';
const context = { matchMedia: () => ({matches:true}), document:{getElementById:()=>null} };
vm.runInNewContext(source.split('/* ---------- 이펙트 ---------- */')[0] + `;globalThis.copy={seasons:SEASONS,emotions:EMO,images:IMG,calculate:(key,choices)=>{season=key;answers=choices;return compute();}};`, context);
const { seasons, emotions, images, calculate } = context.copy;
const selected = seasons[seasonKey];
if (!GlobalFonts.registerFromPath(process.env.HIYU_CARD_FONT || '/System/Library/Fonts/AppleSDGothicNeo.ttc', 'HiyuCard')) throw new Error('Korean font unavailable');
const plain = value => value.replace(/<\/?em>/g, '');
const escape = value => value.replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const band = score => score >= 80 ? 3 : score >= 60 ? 2 : score >= 35 ? 1 : 0;
const bubble = await loadImage(path.join(root, 'assets/bubble-main.svg'));
const faces = Object.fromEntries(await Promise.all(Object.keys(emotions).map(async key => [key, await loadImage(path.join(root, images[key].replace('/pain-test/', '')))])));
const canvas = createCanvas(1200,630), x = canvas.getContext('2d');
const font = (size, weight = 800) => { x.font = `${weight} ${size}px HiyuCard`; };
const fit = (text, width, size, weight = 800) => {
  do { font(size,weight); if (x.measureText(text).width <= width) return; size--; } while (size > 18);
  if (x.measureText(text).width > width) throw new Error(`Text overflow: ${text}`);
};
const box = (left,top,width,height,radius,color) => { x.beginPath(); x.roundRect(left,top,width,height,radius); x.fillStyle=color; x.fill(); };
function base(emotion) {
  x.fillStyle='#FFFDF7';x.fillRect(0,0,1200,630);
  x.drawImage(bubble,30,58,450,450);
  const face=faces[emotion], scale=300/Math.max(face.width,face.height);
  x.drawImage(face,255-face.width*scale/2,283-face.height*scale/2,face.width*scale,face.height*scale);
  x.strokeStyle='#E6EAE4';x.lineWidth=2;x.beginPath();x.moveTo(48,550);x.lineTo(1152,550);x.stroke();
  x.fillStyle='#242526';font(25);x.fillText('히유 · 스트레스 지도',48,594);
  x.fillStyle='#5C625C';font(23,500);x.fillText('pheeeew.com/pain-test',887,594);
}
function result(emotion,score) {
  base(emotion);
  box(512,46,150,50,25,'#FFE164');x.fillStyle='#242526';font(29);x.fillText(selected.label,548,81);
  font(24,500);x.fillText(`대표 감정 · ${emotions[emotion].name}`,690,80);
  font(27);x.fillText('나의 고통 지수',512,143);
  font(155,900);x.fillText(String(score),504,285);
  x.fillStyle='#5C625C';font(38);x.fillText('/ 100',825,287);
  const [title,description]=selected.titles[emotion][band(score)];
  box(512,330,640,104,24,'#FFF0A4');x.fillStyle='#242526';
  fit(plain(title),592,45);x.fillText(plain(title),536,395);
  x.fillStyle='#5C625C';fit(description,635,25,500);x.fillText(description,514,486);
}
const out = path.join(root,'og',imageDirectory);await mkdir(out,{recursive:true});
const outcomes = new Map();
if (missingOnly || seasonKey === 'job') {
  function visit(choices=[]) {
    if (choices.length === selected.qs.length) {
      const result = calculate(seasonKey,choices);
      outcomes.set(`${result.e}/${result.s}`,result);
      return;
    }
    selected.qs[choices.length].a.forEach((_,index)=>visit([...choices,index]));
  }
  visit();
} else {
  for (const emotion of Object.keys(emotions)) {
    for (const entry of await readdir(path.join(root,'r',seasonKey,emotion),{withFileTypes:true})) {
      if (entry.isDirectory() && /^\d+$/.test(entry.name)) outcomes.set(`${emotion}/${entry.name}`,{e:emotion,s:Number(entry.name)});
    }
  }
}
const template = await readFile(path.join(root,'index.html'),'utf8');
let count=0;
for (const {e:emotion,s:score} of outcomes.values()) {
  const directory=path.join(root,'r',seasonKey,emotion,String(score));
  const imageName=`${seasonKey}-${emotion}-${score}.jpg`;
  if (missingOnly && existsSync(path.join(directory,'index.html')) && existsSync(path.join(out,imageName))) continue;
  await mkdir(directory,{recursive:true});
  result(emotion,score);
  await writeFile(path.join(out,imageName),canvas.toBuffer('image/jpeg',90));
  const title=`${plain(selected.titles[emotion][band(score)][0])} — 고통 지수 ${score}점`;
  const description=selected.titles[emotion][band(score)][1]+' '+selected.brag;
  let html=template.replace(/<title>.*?<\/title>/,`<title>${escape(title)}</title>`);
  for (const name of ['og:title','twitter:title','og:image:alt']) html=html.replace(new RegExp(`(<meta (?:property|name)="${name}" content=")[^"]*(">)`),`$1${escape(title)}$2`);
  for (const name of ['description','og:description','twitter:description']) html=html.replace(new RegExp(`(<meta (?:property|name)="${name}" content=")[^"]*(">)`),`$1${escape(description)}$2`);
  for (const name of ['og:image','twitter:image']) html=html.replace(new RegExp(`(<meta (?:property|name)="${name}" content=")[^"]*(">)`),`$1https://pheeeew.com/pain-test/og/${imageDirectory}/${imageName}$2`);
  html=html.replace(/(<meta property="og:url" content=")[^"]*(">)/,`$1https://pheeeew.com/pain-test/r/${seasonKey}/${emotion}/${score}$2`);
  html=html.replace('</head>','<meta name="robots" content="noindex,follow">\n</head>');
  await writeFile(path.join(directory,'index.html'),html);count++;
}
if (missingOnly) {
  console.log(`Generated ${count} missing ${seasonKey} previews; existing result links preserved.`);
} else {
base('dapdap');box(512,90,265,65,32,'#FFE164');x.fillStyle='#242526';font(36);x.fillText('5문항 · 40초',544,135);
font(65,900);x.fillText('고통 지수 테스트',512,260);
font(43);x.fillText(Object.values(seasons).map(s=>s.label.replace('판','')).join(' · '),514,350);
x.fillStyle='#5C625C';font(37);x.fillText('내 고통은 몇 점일까?',514,430);
await writeFile(path.join(root,'og/share-v4.png'),canvas.toBuffer('image/png'));
const main=path.join(root,'index.html');let html=await readFile(main,'utf8');
html=html.replace(/(?:수능|시험)·회사·연애(?:·취업)?/g,'시험·회사·연애·취업').replaceAll('60가지','80가지').replace(/og\/share-v[23]\.png/g,'og/share-v4.png');
await writeFile(main,html);
console.log(`Generated ${count} ${seasonKey} previews and one main preview; HTML metadata synchronized.`);
}
