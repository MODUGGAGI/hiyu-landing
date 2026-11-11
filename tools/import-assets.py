"""Convert the app's VectorDrawable files to SVG without redrawing their paths."""
import json, shutil, sys
from pathlib import Path
import xml.etree.ElementTree as ET
source = Path(sys.argv[1])
root = Path(__file__).resolve().parents[1]
out = root / 'public/assets'
ns = '{http://schemas.android.com/apk/res/android}'
def attr(e, name, default=None): return e.get(ns + name, default)
def color(c):
    if len(c) == 9: return '#' + c[3:], str(int(c[1:3],16)/255)
    return c, None
mapping = {'pathData':'d','strokeWidth':'stroke-width','strokeLineCap':'stroke-linecap','strokeLineJoin':'stroke-linejoin','fillAlpha':'fill-opacity','strokeAlpha':'stroke-opacity','strokeMiterLimit':'stroke-miterlimit'}
def convert(e):
    if e.tag == 'group':
        g = ET.Element('g', {'transform': f"translate({attr(e,'translateX','0')} {attr(e,'translateY','0')})"})
        for child in e: g.append(convert(child))
        return g
    if e.tag != 'path': raise ValueError(f'Unsupported element: {e.tag}')
    p = ET.Element('path', {'fill':'none'})
    for k,v in mapping.items():
        if attr(e,k) is not None: p.set(v,attr(e,k))
    for k,v in [('fillColor','fill'),('strokeColor','stroke')]:
        if attr(e,k):
            c,a=color(attr(e,k)); p.set(v,c)
            if a is not None: p.set(v+'-opacity',a)
    if attr(e,'fillType') == 'evenOdd': p.set('fill-rule','evenodd')
    return p
files = sorted(source.glob('group_stamp_*.xml')) + sorted(source.glob('ic_emotion_*.xml')) + [source/'group_emotion_button_base.xml']
extra_icons = ['ic_mic', 'ic_menu', 'ic_settings_outline', 'ic_settings', 'ic_my_location', 'ic_refresh', 'ic_close', 'record_stamp_drag_guide']
files += [source/f'{name}.xml' for name in extra_icons]
for f in files:
    e=ET.parse(f).getroot()
    svg=ET.Element('svg',{'xmlns':'http://www.w3.org/2000/svg','width':attr(e,'width').replace('dp',''),'height':attr(e,'height').replace('dp',''),'viewBox':f"0 0 {attr(e,'viewportWidth')} {attr(e,'viewportHeight')}"})
    for child in e: svg.append(convert(child))
    ET.ElementTree(svg).write(out/(f.stem+'.svg'),encoding='unicode')
shutil.copyfile(source/'logo_pheeeew.png',out/'logo.png')
print(f'Converted {len(files)} original vector assets')
