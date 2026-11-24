from pathlib import Path
import re

p = Path(r"C:\Users\Abcom\Sites\wedding-invitation\resources\js\components\studio\editor-template-panels.tsx")
text = p.read_text(encoding="utf-8")
marker = "export { syncDetailsFromModel } from '@/lib/template-preview-model';"
idx = text.find(marker)
if idx < 0:
    raise SystemExit("marker missing")
new = text[: idx + len(marker)] + "\n"
new = re.sub(
    r"\nimport \{\n    CORE_SITE_SECTION_KEYS,\n    CORE_SITE_SECTION_META,\n    coreExtrasFromDetails,\n    sampleCoreSiteExtras,\n    type CoreSiteSectionKey,\n    type ExploreItem,\n    type FaqItem,\n    type GiftLink,\n    type LineupPerson,\n    type StayItem,\n\} from '@/lib/core-site-sections';\n",
    "\n",
    new,
    count=1,
)
p.write_text(new, encoding="utf-8")
print("ok", len(new))
