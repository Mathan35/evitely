import {
    EditorCheckbox,
    EditorField,
    EditorNotice,
    EditorTextArea,
    EditorTextInput,
} from '@/components/studio/editor-fields';
import {
    SECTION_TOGGLE_META,
    type SectionNote,
    type ToggleableSiteSection,
} from '@/lib/site-section-visibility';
import { cn } from '@/lib/utils';

/** Enable/disable a main site block, with optional title + note when off. */
export function SectionEnableControl({
    sectionKey,
    enabled,
    note,
    onEnabledChange,
    onNoteChange,
    className,
}: {
    sectionKey: ToggleableSiteSection;
    enabled: boolean;
    note: SectionNote;
    onEnabledChange: (enabled: boolean) => void;
    onNoteChange: (next: SectionNote) => void;
    className?: string;
}) {
    const meta = SECTION_TOGGLE_META[sectionKey];
    const hasNote = Boolean(note.title.trim() || note.body.trim());

    return (
        <div className={cn('space-y-3', className)}>
            <div
                className={cn(
                    'rounded-2xl border p-1 transition',
                    enabled ? 'border-zinc-900/12 bg-white shadow-sm' : 'border-zinc-950/8 bg-zinc-50/90',
                )}
            >
                <EditorCheckbox
                    label={meta.label}
                    description={meta.hint}
                    checked={enabled}
                    onCheckedChange={onEnabledChange}
                />
            </div>

            {!enabled ? (
                <div className="space-y-3 rounded-2xl border border-dashed border-zinc-950/10 bg-white/80 p-3.5">
                    <div>
                        <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                            Optional note
                        </p>
                        <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">{meta.noteHint}</p>
                    </div>
                    <EditorField label="Title" hint="Optional">
                        <EditorTextInput
                            value={note.title}
                            placeholder="e.g. Photos coming soon"
                            onChange={(event) => onNoteChange({ ...note, title: event.target.value })}
                        />
                    </EditorField>
                    <EditorField label="Note" hint="Optional">
                        <EditorTextArea
                            rows={2}
                            value={note.body}
                            placeholder="A short line guests can read instead of this section…"
                            onChange={(event) => onNoteChange({ ...note, body: event.target.value })}
                        />
                    </EditorField>
                    {hasNote ? (
                        <EditorNotice>
                            Guests will see this note in place of the full section.
                        </EditorNotice>
                    ) : (
                        <EditorNotice>
                            Leave blank to hide the section completely — nothing shows on the site.
                        </EditorNotice>
                    )}
                </div>
            ) : null}
        </div>
    );
}
