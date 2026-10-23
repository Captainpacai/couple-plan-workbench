# -*- coding: utf-8 -*-
"""拼接 parts -> output.html，并抽出 JS 供 node --check 语法校验"""
import io, os, sys

BASE = os.path.dirname(os.path.abspath(__file__))
PD = os.path.join(BASE, 'parts')
HTML_PARTS = ['01_head.html', '02_body.html', '03_js_a.js', '04_js_b.js', '05_js_c.js']
JS_PARTS = ['03_js_a.js', '04_js_b.js', '05_js_c.js']


def rd(name):
    with io.open(os.path.join(PD, name), encoding='utf-8-sig') as f:
        return f.read()


html = ''.join(rd(p) for p in HTML_PARTS)
with io.open(os.path.join(BASE, 'output.html'), 'w', encoding='utf-8') as f:
    f.write(html)

js = '\n'.join(
    rd(p).replace('<script>', '').replace('</script>', '')
         .replace('</body>', '').replace('</html>', '')
    for p in JS_PARTS)
with io.open(os.path.join(BASE, 'bundle_check.js'), 'w', encoding='utf-8') as f:
    f.write(js)

print('html=%d bytes, js=%d bytes' % (len(html), len(js)))
print('maskWx in html:', 'maskWx' in html)
print('maskA2hs in html:', 'maskA2hs' in html)
print('wx-pending in html:', 'wx-pending' in html)
print('needWxGuide in js:', 'needWxGuide' in js)
print('needA2hsGuide in js:', 'needA2hsGuide' in js)
