import { EditorField, EditorNotice, EditorTextArea, EditorTextInput } from '@/components/studio/editor-fields';

export function SeoPanel({
    title,
    description,
    fallbackTitle,
    fallbackDescription,
    onTitle,
    onDescription,
}: {
    title: string;
    description: string;
    fallbackTitle: string;
    fallbackDescription: string;
    onTitle: (value: string) => void;
    onDescription: (value: string) => void;
}) {
    const previewTitle = (title || fallbackTitle || 'Your invitation').trim();
    const previewDescription = (description || fallbackDescription || '').trim();

    return (
        <div className="mt-4 space-y-4">
            <EditorNotice>
                Controls how your invite appears in WhatsApp, iMessage, and search. Leave blank to use the
                invitation title and city.
            </EditorNotice>

            <EditorField label="Share title" hint={`${title.length}/70`}>
                <EditorTextInput
                    value={title}
                    maxLength={70}
                    onChange={(event) => onTitle(event.target.value)}
                    placeholder={fallbackTitle || 'Priya & Arun · Wedding'}
                />
            </EditorField>

            <EditorField label="Share description" hint={`${description.length}/180`}>
                <EditorTextArea
                    value={description}
                    maxLength={180}
                    rows={3}
                    onChange={(event) => onDescription(event.target.value)}
                    placeholder={fallbackDescription || 'Join us for our celebration.'}
                />
            </EditorField>

            <div className="rounded-2xl border border-zinc-950/8 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                    Link preview
                </p>
                <p className="mt-2 truncate text-[15px] font-semibold text-sky-700">{previewTitle}</p>
                <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-zinc-500">
                    {previewDescription || 'Description will appear here after you add one.'}
                </p>
            </div>
        </div>
    );
}
