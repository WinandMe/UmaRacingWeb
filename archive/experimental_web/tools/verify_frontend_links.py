import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / 'frontend'

patterns = [
    re.compile(r'<a\s+[^>]*href=["\\\']([^"\\\']+)["\\\']', re.IGNORECASE),
    re.compile(r'navigateTo\(\s*["\\\']([^"\\\']+)["\\\']\s*\)', re.IGNORECASE),
    re.compile(r'location\.href\s*=\s*["\\\']([^"\\\']+)["\\\']', re.IGNORECASE),
    re.compile(r'window\.location\.href\s*=\s*["\\\']([^"\\\']+)["\\\']', re.IGNORECASE),
    re.compile(r'navigate\(\s*["\\\']([^"\\\']+)["\\\']\s*\)', re.IGNORECASE),
]

missing = []
checked = []

for html_path in FRONTEND.glob('**/*.html'):
    text = html_path.read_text(encoding='utf-8', errors='ignore')
    refs = []
    for pat in patterns:
        refs += pat.findall(text)
    for href in refs:
        # Skip external links
        if href.startswith('http://') or href.startswith('https://'):
            continue
        # Normalize path
        if href.startswith('/'):
            target = FRONTEND / href.lstrip('/')
        else:
            # relative to the file location
            target = html_path.parent / href
        # Sometimes anchors link to sections or query strings
        target_no_hash = str(target).split('#')[0]
        target_no_q = target_no_hash.split('?')[0]
        p = Path(target_no_q)
        checked.append((html_path.relative_to(FRONTEND), href, p.relative_to(FRONTEND) if p.is_relative_to(FRONTEND) else p))
        if not p.exists():
            # Only flag .html files or assets we expect
            if any(href.lower().endswith(ext) for ext in ['.html', '.css', '.js']):
                missing.append((html_path.relative_to(FRONTEND), href))

# Check transitions assets presence across pages
needs_assets = []
for html_path in FRONTEND.glob('**/*.html'):
    text = html_path.read_text(encoding='utf-8', errors='ignore')
    has_css = 'assets/page-transitions.css' in text
    has_js = 'assets/page-transitions.js' in text
    if not (has_css and has_js):
        needs_assets.append(html_path.relative_to(FRONTEND))

print('Checked links:', len(checked))
if missing:
    print('Missing targets found:')
    for src, href in sorted(set(missing)):
        print(f' - {src}: {href}')
else:
    print('No missing link targets detected.')

print('\nPages missing transition assets (css+js):')
for p in needs_assets:
    print(f' - {p}')

# Verify vercel.json exists
vercel = ROOT / 'vercel.json'
print('\nvercel.json present:', vercel.exists())
