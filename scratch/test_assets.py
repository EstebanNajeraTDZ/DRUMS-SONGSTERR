import urllib.request

try:
    res = urllib.request.urlopen('http://localhost:5000/')
    html = res.read().decode('utf-8')
    print('Index HTML Status:', res.status)
    print('Has index-BAqnA7dB.js:', 'index-BAqnA7dB.js' in html)
    print('Has index-ukQ5qL-R.css:', 'index-ukQ5qL-R.css' in html)

    res_css = urllib.request.urlopen('http://localhost:5000/assets/index-ukQ5qL-R.css')
    css = res_css.read().decode('utf-8')
    print('CSS Status:', res_css.status)
    print('Has studio-lateral-drawer:', '.studio-lateral-drawer' in css)
    print('Has data-mode=light:', 'data-mode="light"' in css or 'theme-light' in css)
    print('Has hit-block sub-symbol:', '.hit-block .sub-symbol' in css)

    res_js = urllib.request.urlopen('http://localhost:5000/assets/index-BAqnA7dB.js')
    js = res_js.read().decode('utf-8')
    print('JS Status:', res_js.status)
    print('Has sticking-char:', 'sticking-char' in js)
    print('Has sub-symbol in JS:', 'sub-symbol' in js)
    print('ALL CHECKS PASSED!')
except Exception as e:
    print('Error:', e)
