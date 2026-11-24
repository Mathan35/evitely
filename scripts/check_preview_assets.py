import re
import urllib.request

html = urllib.request.urlopen("http://127.0.0.1:8002/designs/wedding?tab=links").read().decode("utf-8", "replace")
print("new gallery js", "event-gallery-CtxuGsfp.js" in html)
print("new css", "app-BaLQ9g7t.css" in html)
print("scripts", re.findall(r"assets/(event-gallery-[^\"']+|app-[^\"']+\.css)", html)[:6])
