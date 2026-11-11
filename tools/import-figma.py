"""Split the downloaded Figma SVG into original, independently animated layers.
No path, paint, raster pixel, or character geometry is redrawn.
Source: Figma pij0xgYkvf8JLM6A3j1ZLa, node 2171:2861 (Group 311).
"""
import base64, copy, json, re
from pathlib import Path
import xml.etree.ElementTree as ET
ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'reference/figma-banner-2171-2861.svg'
OUT = ROOT / 'public/assets/figma'
OUT.mkdir(parents=True, exist_ok=True)
ET.register_namespace('', 'http://www.w3.org/2000/svg')
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')
r = ET.parse(SOURCE).getroot()
ns = '{http://www.w3.org/2000/svg}'
children = list(r[0]); defs = list(r[1])
lookup = {x.attrib.get('id'): x for x in defs}
manifest = []
def export(name, indexes, box):
    svg = ET.Element(ns+'svg', {'viewBox': ' '.join(map(str,box)), 'width':str(box[2]), 'height':str(box[3]), 'fill':'none'})
    for i in indexes: svg.append(copy.deepcopy(children[i]))
    needed = set(re.findall(r'(?:url\(#|href="#)([^)"\s]+)',ET.tostring(svg,encoding='unicode')))
    picked = set()
    while needed - picked:
        for ident in list(needed - picked):
            picked.add(ident)
            if ident in lookup:
                needed.update(re.findall(r'(?:url\(#|href="#)([^)"\s]+)',ET.tostring(lookup[ident],encoding='unicode')))
    d = ET.SubElement(svg,ns+'defs')
    for original in defs:
        if original.attrib.get('id') in picked: d.append(copy.deepcopy(original))
    ET.ElementTree(svg).write(OUT/f'{name}.svg',encoding='unicode')
    manifest.append({'asset':f'{name}.svg','sourceNode': '2161:62599' if name=='phone-frame' else '2171:2861','childIndexes':list(indexes),'viewBox':box})
export('map-landscape',[0],[0,0,2364,1144])
export('bubble-main',range(79,94),[1376,134,879,879])
export('bubble-small',range(2,16),[1275,77,181,170])
export('bubble-scene',range(1,79),[0,0,2364,1144])
export('emotion-angry',range(94,104),[1852,680,230,235])
export('emotion-discouraged',range(104,111),[1574,685,230,235])
export('emotion-irritated',range(111,119),[1711,247,230,235])
export('emotion-frustrated',range(119,125),[1463,404,230,235])
export('emotion-exhausted',[125],[1955,409,236,241])
img=next(x for x in r.iter() if x.tag==ns+'image')
uri=img.attrib['{http://www.w3.org/1999/xlink}href']
(OUT/'map-original.png').write_bytes(base64.b64decode(uri.split(',',1)[1]))
(OUT/'provenance.json').write_text(json.dumps({'fileKey':'pij0xgYkvf8JLM6A3j1ZLa','source':'Figma UI SVG export, Group 311','assets':manifest},ensure_ascii=False,indent=2)+'\n')
print('Exported',len(manifest),'original SVG layers and embedded map PNG')
# Physical phone frame: exact exported bezel and side-button paths.
r=ET.parse(ROOT/'reference/figma-phone-2161-62599.svg').getroot()
children=list(r); defs=list(r[-1]); lookup={x.attrib.get('id'):x for x in defs}
# Exclude child 6: the outer blur is cropped by this viewBox into a gray rectangle.
export('phone-frame',[2,3,4,5,7,8,9,10,11],[96,410,1024,2116])
manifest[-1]['excludedChildIndexes'] = [6]
manifest[-1]['exclusionReason'] = 'Omit the exported outer blur shadow, which is clipped to a visible rectangle by the phone viewBox. Original bezel and side-button paths are unchanged.'
(OUT/'provenance.json').write_text(json.dumps({'fileKey':'pij0xgYkvf8JLM6A3j1ZLa','source':'Figma UI SVG exports: Group 311 (2171:2861), phone (2161:62599)','assets':manifest},ensure_ascii=False,indent=2)+'\n')
