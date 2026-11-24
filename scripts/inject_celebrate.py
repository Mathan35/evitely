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
import_line = "import { PreviewCelebrateBurst } from '@/components/marketing/site-previews/preview-celebrate-burst';\n"

for name in files:
    p = root / name
    text = p.read_text(encoding="utf-8")

    if "PreviewCelebrateBurst" not in text:
        if "preview-music-toggle" in text:
            text = text.replace(
                "from '@/components/marketing/site-previews/preview-music-toggle';\n",
                "from '@/components/marketing/site-previews/preview-music-toggle';\n" + import_line,
                1,
            )
        else:
            text = import_line + text

    if "<PreviewCelebrateBurst" not in text:
        # Insert after PreviewMusicToggle block — handle single-line and multi-line usages
        marker = "<PreviewMusicToggle"
        idx = text.find(marker)
        if idx < 0:
            print(name, "NO_MUSIC")
            continue
        # Find end of this JSX element
        end = text.find("/>", idx)
        if end < 0:
            print(name, "NO_END")
            continue
        end += 2
        # Match className used on music for live mobile offset when present
        chunk = text[idx:end]
        class_arg = ""
        if "bottom-[5.5rem]" in chunk:
            class_arg = ' className={isLive && !desktop ? "bottom-[5.5rem]" : undefined}'
        elif "className={" in chunk:
            # reuse same expression if simple
            import re

            m = re.search(r"className=\{([^}]+)\}", chunk)
            if m:
                class_arg = f" className={{{m.group(1)}}}"

        insert = f"\n\n            <PreviewCelebrateBurst{class_arg} />"
        text = text[:end] + insert + text[end:]

    p.write_text(text, encoding="utf-8")
    print(name, "ok")
