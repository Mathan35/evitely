from pathlib import Path

files = [
    "wedding-website-preview.tsx",
    "birthday-website-preview.tsx",
    "corporate-website-preview.tsx",
    "baby-shower-website-preview.tsx",
    "party-website-preview.tsx",
    "graduation-website-preview.tsx",
    "bridal-shower-website-preview.tsx",
    "housewarming-website-preview.tsx",
    "custom-website-preview.tsx",
]
root = Path(r"C:\Users\Abcom\Sites\wedding-invitation\resources\js\components\marketing\site-previews")
import_line = "import { CoreSiteSections } from '@/components/marketing/site-previews/core-site-sections';\n"

for name in files:
    p = root / name
    text = p.read_text(encoding="utf-8")
    if "CoreSiteSections" not in text:
        if "from '@/lib/utils';" in text:
            text = text.replace("from '@/lib/utils';\n", "from '@/lib/utils';\n" + import_line, 1)
        else:
            # insert after first import cluster
            first = text.find("import ")
            nl = text.find("\n", first)
            text = text[: nl + 1] + import_line + text[nl + 1 :]

    inserted = False
    for needle in ['<section id="gh-rsvp"', '<section id="hw-rsvp"', '<section id="cu-rsvp"']:
        if needle in text and "<CoreSiteSections desktop={desktop} />" not in text.split(needle)[0][-200:]:
            text = text.replace(
                needle,
                "                <CoreSiteSections desktop={desktop} />\n\n                " + needle,
                1,
            )
            inserted = True
            break

    p.write_text(text, encoding="utf-8")
    print(name, "ok" if inserted or "CoreSiteSections desktop" in text else "MISS")
