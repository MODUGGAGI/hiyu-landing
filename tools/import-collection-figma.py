"""Extract artwork from SVGs downloaded with Figma's UI. No remote image URLs."""
import base64, copy, concurrent.futures, json, re, shutil, subprocess
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'reference/figma-collection-2026-10-29'
PUBLIC = ROOT / 'public/assets/collection-figma'
DOWNLOADS = Path.home() / 'Downloads'
NS = 'http://www.w3.org/2000/svg'
XLINK = '{http://www.w3.org/1999/xlink}href'
ET.register_namespace('', NS)
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')
SOURCES = [
 ('characters', '감정-캐릭터-80종-360x230-투명-규격통일 1 (1).svg', None),
 *[('stamps', f'{i:02d}-{ko}-전체16쌍-규격통일.svg', emotion) for i,ko,emotion in [
 (1,'지침','exhausted'),(2,'답답','frustrated'),(3,'짜증','irritated'),(4,'좌절','discouraged'),(5,'분노','angry')]]
]
EMOTIONS = ['exhausted','frustrated','irritated','discouraged','angry']
jobs=[]
for kind, name, emotion in SOURCES:
 source=DOWNLOADS/name
 shutil.copy2(source, OUT/name)
 root=ET.parse(source).getroot()
 by_id={e.get('id'):e for e in root.iter() if e.get('id')}
 paths=[e for e in root.iter() if e.get('fill','').startswith('url(#pattern')]
 if kind=='characters':
  paths=paths[1:] # app icon is not one of the 80 characters
  # Layer order differs from the board's five rows: use the exported placement.
  paths.sort(key=lambda p: tuple(float(v) for v in re.findall(r'-?\d+(?:\.\d+)?',p.get('d'))[1::-1]))
 assert len(paths)==(80 if kind=='characters' else 32), (name,len(paths))
 for i,path in enumerate(paths):
  family='characters' if kind=='characters' else ('stamps-round' if i%2==0 else 'stamps-straight')
  category=EMOTIONS[i//16] if kind=='characters' else emotion
  number=i%16+1 if kind=='characters' else i//2+1
  # Figma exports each placed bitmap as a rectangular path with its exact crop pattern.
  values=list(map(float,re.findall(r'-?\d+(?:\.\d+)?',path.get('d'))))
  assert len(values)==6, path.get('d')
  right,top,left,bottom,right2,top2=values
  width,height=right-left,bottom-top
  pattern=by_id[path.get('fill')[5:-1]]
  use=next(iter(pattern))
  image=by_id[use.get(XLINK)[1:]]
  svg=ET.Element('{'+NS+'}svg',{'width':str(width),'height':str(height),'viewBox':f'{left} {top} {width} {height}','fill':'none'})
  svg.append(copy.deepcopy(path))
  defs=ET.SubElement(svg,'{'+NS+'}defs');defs.append(copy.deepcopy(pattern));defs.append(copy.deepcopy(image))
  stem=Path(family)/category/f'{number:02d}'
  dest=OUT/'artwork'/stem.with_suffix('.png');dest.parent.mkdir(parents=True,exist_ok=True)
  title=path.get('id','')
  try:title=title.encode('latin1').decode('utf8')
  except UnicodeError:pass
  jobs.append((ET.tostring(svg),dest,stem,{'source':name,'pattern':pattern.get('id'),'title':title,'sourceImagePixels':[int(image.get('width')),int(image.get('height'))],'crop':[left,top,width,height],'file':str(dest.relative_to(ROOT))}))

def render(job):
 svg,dest,stem,meta=job
 subprocess.run(['rsvg-convert','--zoom','3','--output',str(dest)],input=svg,check=True)
 if int(stem.name)<=4:
  web=PUBLIC/stem.with_suffix('.webp');web.parent.mkdir(parents=True,exist_ok=True)
  subprocess.run(['cwebp','-quiet','-lossless',str(dest),'-o',str(web)],check=True)
  meta['webFile']=str(web.relative_to(ROOT))
 return meta
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 results=list(pool.map(render,jobs))
(OUT/'manifest.json').write_text(json.dumps({'figmaFile':'pij0xgYkvf8JLM6A3j1ZLa','downloadMethod':'Figma UI SVG export','characterNode':'3184:2850','assets':results},ensure_ascii=False,indent=2))
print(f'Extracted {len(results)} original artwork PNGs; bundled {sum("webFile" in a for a in results)} lossless WebPs.')
