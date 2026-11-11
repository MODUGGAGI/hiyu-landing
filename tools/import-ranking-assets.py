"""Port only the new main navigation/ranking VectorDrawables, preserving paths."""
import sys
from pathlib import Path
import xml.etree.ElementTree as ET

source = Path(sys.argv[1])
output = Path(__file__).resolve().parents[1] / 'public/assets'
android = '{http://schemas.android.com/apk/res/android}'
aapt = '{http://schemas.android.com/aapt}'

def attr(element, name, default=None):
    return element.get(android + name, default)

def rgba(value):
    if len(value) == 9 and value.startswith('#'):
        return '#' + value[3:], int(value[1:3], 16) / 255
    return value, 1

for name in ['nav_press', 'hiyu_nav_face', 'hiyu_nav_ticket', 'weekly_ranking_crown', 'press_all_emotions']:
    original = ET.parse(source / (name + '.xml')).getroot()
    svg = ET.Element('svg', {
        'xmlns': 'http://www.w3.org/2000/svg',
        'width': attr(original, 'width').removesuffix('dp'),
        'height': attr(original, 'height').removesuffix('dp'),
        'viewBox': f"0 0 {attr(original, 'viewportWidth')} {attr(original, 'viewportHeight')}",
    })
    defs = ET.SubElement(svg, 'defs')

    def identifier():
        return f'{name}-{len(defs)}'

    def children(element, parent):
        current = parent
        for child in element:
            if child.tag == 'clip-path':
                clip_id = identifier()
                clip = ET.SubElement(defs, 'clipPath', {'id': clip_id})
                ET.SubElement(clip, 'path', {'d': attr(child, 'pathData')})
                current = ET.SubElement(current, 'g', {'clip-path': f'url(#{clip_id})'})
            elif child.tag == 'group':
                tx, ty = attr(child, 'translateX', '0'), attr(child, 'translateY', '0')
                px, py = float(attr(child, 'pivotX', '0')), float(attr(child, 'pivotY', '0'))
                sx, sy = attr(child, 'scaleX', '1'), attr(child, 'scaleY', '1')
                rotation = attr(child, 'rotation', '0')
                group = ET.SubElement(current, 'g', {'transform': f'translate({tx} {ty}) translate({px} {py}) rotate({rotation}) scale({sx} {sy}) translate({-px} {-py})'})
                children(child, group)
            elif child.tag == 'path':
                node = ET.SubElement(current, 'path', {'d': attr(child, 'pathData'), 'fill': 'none'})
                for origin, target in [('strokeWidth', 'stroke-width'), ('strokeLineCap', 'stroke-linecap'), ('strokeLineJoin', 'stroke-linejoin'), ('strokeMiterLimit', 'stroke-miterlimit')]:
                    if attr(child, origin) is not None:
                        node.set(target, attr(child, origin))
                if attr(child, 'fillType') == 'evenOdd':
                    node.set('fill-rule', 'evenodd')
                for paint in ['fill', 'stroke']:
                    value = attr(child, paint + 'Color')
                    alpha = float(attr(child, paint + 'Alpha', '1'))
                    if value:
                        color, opacity = rgba(value)
                        node.set(paint, color)
                        alpha *= opacity
                    if alpha != 1:
                        node.set(paint + '-opacity', str(alpha))
                for value in child.findall(aapt + 'attr'):
                    gradient = value.find('gradient')
                    if gradient is None:
                        raise ValueError('Unsupported paint')
                    gradient_id = identifier()
                    radial = attr(gradient, 'type') == 'radial'
                    keys = [('centerX', 'cx'), ('centerY', 'cy'), ('gradientRadius', 'r')] if radial else [('startX', 'x1'), ('startY', 'y1'), ('endX', 'x2'), ('endY', 'y2')]
                    attributes = {'id': gradient_id, 'gradientUnits': 'userSpaceOnUse'}
                    attributes.update({target: attr(gradient, origin) for origin, target in keys})
                    definition = ET.SubElement(defs, 'radialGradient' if radial else 'linearGradient', attributes)
                    for stop in gradient:
                        color, alpha = rgba(attr(stop, 'color'))
                        ET.SubElement(definition, 'stop', {'offset': attr(stop, 'offset'), 'stop-color': color, 'stop-opacity': str(alpha)})
                    node.set('fill' if value.get('name') == 'android:fillColor' else 'stroke', f'url(#{gradient_id})')
            else:
                raise ValueError('Unsupported vector element: ' + child.tag)

    children(original, svg)
    # A port must never silently omit any native path or clip contour.
    original_paths = [attr(p, 'pathData') for p in original.iter() if p.tag in ('path', 'clip-path')]
    assert sorted(original_paths) == sorted(p.get('d') for p in svg.iter('path'))
    ET.ElementTree(svg).write(output / (name + '.svg'), encoding='unicode')
    print(f'{name}: {len(original_paths)} original paths preserved')
