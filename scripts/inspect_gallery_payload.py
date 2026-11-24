import json
import re
import urllib.request

html = urllib.request.urlopen("http://127.0.0.1:8002/designs/wedding?tab=links").read().decode("utf-8", "replace")
idx = html.find("wedding-link-glasshouse")
print(html[idx : idx + 700])
print("---")
for pattern in (r'data-page="([^"]+)"', r'<script type="application/json" data-page[^>]*>(.*?)</script>'):
    match = re.search(pattern, html, re.S)
    print("pattern", pattern[:40], bool(match))
