import { router, useForm } from '@inertiajs/react';
import {
    Check,
    Copy,
    Download,
    FolderOpen,
    Link2,
    Mail,
    MoreHorizontal,
    Pencil,
    Phone,
    Plus,
    Search,
    Send,
    Trash2,
    Upload,
    Users,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SmsIcon, WhatsAppIcon } from '@/components/icons/brand-icons';
import { StudioFilterSelect } from '@/components/studio/studio-filter-select';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { copyToClipboard } from '@/lib/clipboard';
import { cn } from '@/lib/utils';
import type { WeddingGuestRow } from '@/types/wedding';

function GuestSelectToggle({
    checked,
    indeterminate = false,
    onCheckedChange,
    label,
    count,
    'aria-label': ariaLabel,
    className,
}: {
    checked: boolean;
    indeterminate?: boolean;
    onCheckedChange: (next: boolean) => void;
    label?: string;
    count?: string;
    'aria-label'?: string;
    className?: string;
}) {
    const active = checked || indeterminate;

    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={indeterminate ? 'mixed' : checked}
            aria-label={ariaLabel || label || 'Select'}
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                'group inline-flex items-center gap-2.5 rounded-full px-2.5 py-1.5 text-left transition duration-200',
                'ring-1 ring-transparent hover:bg-white/90 hover:ring-zinc-950/8',
                active && 'bg-white shadow-[0_1px_0_rgba(24,24,27,0.04)] ring-emerald-200/90',
                className,
            )}
        >
            <span
                className={cn(
                    'relative grid size-5 shrink-0 place-items-center rounded-[7px] border transition duration-200',
                    active
                        ? 'border-emerald-600 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-[0_0_0_4px_rgba(16,185,129,0.16)]'
                        : 'border-zinc-300/90 bg-white text-transparent group-hover:border-zinc-400 group-hover:shadow-sm',
                )}
            >
                {indeterminate && !checked ? (
                    <span className="block h-0.5 w-2.5 rounded-full bg-white" />
                ) : (
                    <Check
                        className={cn(
                            'size-3 stroke-[3] transition duration-200',
                            checked ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
                        )}
                    />
                )}
            </span>
            {label ? (
                <span className="min-w-0 pr-0.5">
                    <span className="block text-[12px] font-semibold tracking-tight text-zinc-800">
                        {label}
                    </span>
                    {count ? (
                        <span className="block text-[10px] font-medium tracking-[0.12em] text-zinc-400 uppercase">
                            {count}
                        </span>
                    ) : null}
                </span>
            ) : null}
        </button>
    );
}

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return '?';
    }
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function pretty(status: string): string {
    return status.replaceAll('_', ' ');
}

function statusChip(status: string): string {
    switch (status) {
        case 'attending':
            return 'bg-emerald-50 text-emerald-800 ring-emerald-200/80';
        case 'maybe':
            return 'bg-amber-50 text-amber-800 ring-amber-200/80';
        case 'not_attending':
        case 'declined':
            return 'bg-rose-50 text-rose-800 ring-rose-200/80';
        default:
            return 'bg-zinc-100 text-zinc-700 ring-zinc-200/80';
    }
}

function guestHasDeliveryFailure(guest: WeddingGuestRow): boolean {
    return Boolean(
        guest.email_last_error ||
            guest.whatsapp_last_error ||
            guest.sms_last_error ||
            guest.invitation_last_error,
    );
}

function deliveryChip(status: string, hasError?: boolean): string {
    if (hasError) {
        return 'bg-rose-50 text-rose-800 ring-rose-200/80';
    }
    switch (status) {
        case 'responded':
            return 'bg-emerald-50 text-emerald-800 ring-emerald-200/80';
        case 'viewed':
            return 'bg-sky-50 text-sky-800 ring-sky-200/80';
        case 'sent':
            return 'bg-indigo-50 text-indigo-800 ring-indigo-200/80';
        default:
            return 'bg-zinc-100 text-zinc-700 ring-zinc-200/80';
    }
}

function deliveryLabel(guest: WeddingGuestRow): string {
    if (guestHasDeliveryFailure(guest)) {
        return 'send failed';
    }
    return pretty(guest.invitation_status);
}

function channelTone(sentAt?: string | null, error?: string | null): string {
    if (error) {
        return 'bg-rose-50 text-rose-800 ring-rose-200/70';
    }
    if (sentAt) {
        return 'bg-emerald-50 text-emerald-800 ring-emerald-200/70';
    }
    return 'bg-zinc-100 text-zinc-500 ring-zinc-200/70';
}

function formatSentAt(value?: string | null): string | null {
    if (!value) {
        return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function guestShareText(guest: WeddingGuestRow, eventTitle?: string | null): string {
    const title = (eventTitle || 'our celebration').trim();
    return [`You're invited to ${title}.`, `Open your personal invite:`, guest.guest_url].join('\n');
}

function guestPhoneDigits(guest: WeddingGuestRow): string {
    return `${guest.country_code || ''}${guest.phone || ''}`.replace(/\D+/g, '');
}

function guestPhoneLabel(guest: WeddingGuestRow): string {
    return [guest.country_code, guest.phone].filter(Boolean).join(' ');
}

/** sms: deep links only work on phones — desktop Windows shows “Pick an app?”. */
function canOpenNativeSms(): boolean {
    if (typeof navigator === 'undefined') {
        return false;
    }
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
}

function whatsappShareUrl(guest: WeddingGuestRow, eventTitle?: string | null): string {
    const text = guestShareText(guest, eventTitle);
    const digits = guestPhoneDigits(guest);
    if (digits.length >= 8) {
        return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
    }
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function smsShareUrl(guest: WeddingGuestRow, eventTitle?: string | null): string {
    const text = guestShareText(guest, eventTitle);
    const digits = guestPhoneDigits(guest);
    // iOS prefers sms:number&body= ; Android often accepts ?body=
    if (digits.length >= 8) {
        return `sms:${digits}?body=${encodeURIComponent(text)}`;
    }
    return `sms:?body=${encodeURIComponent(text)}`;
}

function openNativeSmsIfPossible(guest: WeddingGuestRow, eventTitle?: string | null): boolean {
    if (!canOpenNativeSms()) {
        return false;
    }
    window.location.href = smsShareUrl(guest, eventTitle);
    return true;
}

type GuestGroupOption = { id: number; name: string; description: string | null };

const NONE_GROUP = '__none__';

const GROUP_ACCENTS = [
    'from-violet-500/15 to-fuchsia-400/10 text-violet-800 ring-violet-200/70',
    'from-sky-500/15 to-cyan-400/10 text-sky-800 ring-sky-200/70',
    'from-amber-500/15 to-orange-400/10 text-amber-900 ring-amber-200/70',
    'from-emerald-500/15 to-teal-400/10 text-emerald-800 ring-emerald-200/70',
    'from-rose-500/15 to-pink-400/10 text-rose-800 ring-rose-200/70',
    'from-indigo-500/15 to-blue-400/10 text-indigo-800 ring-indigo-200/70',
] as const;

function groupAccent(id: number | string): string {
    const numeric = typeof id === 'number' ? id : Number.parseInt(String(id), 10) || 0;
    return GROUP_ACCENTS[Math.abs(numeric) % GROUP_ACCENTS.length];
}

function GuestGroupSelect({
    groups,
    value,
    onChange,
    placeholder = 'Choose a group',
    allowNone = true,
    noneLabel = 'No group',
    size = 'default',
    className,
}: {
    groups: GuestGroupOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    allowNone?: boolean;
    noneLabel?: string;
    size?: 'default' | 'compact';
    className?: string;
}) {
    const selected = groups.find((group) => String(group.id) === value);
    const compact = size === 'compact';

    return (
        <Select
            value={value || (allowNone ? NONE_GROUP : undefined)}
            onValueChange={(next) => onChange(next === NONE_GROUP ? '' : next)}
        >
            <SelectTrigger
                className={cn(
                    '!h-auto !w-full min-w-0 justify-between gap-3 rounded-2xl border-0 bg-zinc-100/90 px-3.5 py-2.5 text-left shadow-none',
                    'ring-1 ring-zinc-950/5 transition-all duration-200',
                    'hover:bg-zinc-100 hover:ring-zinc-950/10',
                    'focus:ring-2 focus:ring-zinc-900/15 data-[state=open]:bg-white data-[state=open]:ring-2 data-[state=open]:ring-zinc-900/15',
                    '*:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:line-clamp-none *:data-[slot=select-value]:flex',
                    compact && 'rounded-full px-3 py-1.5',
                    className,
                )}
            >
                {selected ? (
                    <span className="flex min-w-0 flex-1 items-center gap-2.5">
                        <span
                            className={cn(
                                'flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1',
                                compact && 'size-6 rounded-lg',
                                groupAccent(selected.id),
                            )}
                        >
                            <Users className={cn('size-3.5', compact && 'size-3')} />
                        </span>
                        <span className="min-w-0">
                            <span
                                className={cn(
                                    'block truncate font-semibold text-zinc-900',
                                    compact ? 'text-[12px]' : 'text-[13px]',
                                )}
                            >
                                {selected.name}
                            </span>
                            {!compact && selected.description ? (
                                <span className="mt-0.5 block truncate text-[11px] text-zinc-500">
                                    {selected.description}
                                </span>
                            ) : null}
                        </span>
                    </span>
                ) : (
                    <span className="flex min-w-0 flex-1 items-center gap-2.5">
                        <span
                            className={cn(
                                'flex size-8 shrink-0 items-center justify-center rounded-xl bg-zinc-200/80 text-zinc-500 ring-1 ring-zinc-300/60',
                                compact && 'size-6 rounded-lg',
                            )}
                        >
                            <FolderOpen className={cn('size-3.5', compact && 'size-3')} />
                        </span>
                        <span
                            className={cn(
                                'truncate font-medium text-zinc-500',
                                compact ? 'text-[12px]' : 'text-[13px]',
                            )}
                        >
                            {allowNone ? noneLabel : placeholder}
                        </span>
                        <SelectValue className="sr-only" placeholder={placeholder} />
                    </span>
                )}
            </SelectTrigger>
            <SelectContent className="z-[80] max-h-72 rounded-2xl border-zinc-200/80 p-1.5 shadow-xl shadow-zinc-950/10">
                {allowNone ? (
                    <SelectItem
                        value={NONE_GROUP}
                        className="cursor-pointer rounded-xl py-2.5 pr-8 pl-2 text-[13px] focus:bg-zinc-100"
                    >
                        <span className="flex items-center gap-2.5">
                            <span className="flex size-8 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 ring-1 ring-zinc-200/80">
                                <FolderOpen className="size-3.5" />
                            </span>
                            <span>
                                <span className="block font-medium text-zinc-700">{noneLabel}</span>
                                <span className="block text-[11px] text-zinc-400">Leave ungrouped</span>
                            </span>
                        </span>
                    </SelectItem>
                ) : null}
                {groups.map((group) => (
                    <SelectItem
                        key={group.id}
                        value={String(group.id)}
                        className="cursor-pointer rounded-xl py-2.5 pr-8 pl-2 text-[13px] focus:bg-zinc-100"
                    >
                        <span className="flex items-center gap-2.5">
                            <span
                                className={cn(
                                    'flex size-8 items-center justify-center rounded-xl bg-gradient-to-br ring-1',
                                    groupAccent(group.id),
                                )}
                            >
                                <Users className="size-3.5" />
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate font-semibold text-zinc-900">{group.name}</span>
                                {group.description ? (
                                    <span className="block truncate text-[11px] text-zinc-500">
                                        {group.description}
                                    </span>
                                ) : (
                                    <span className="block text-[11px] text-zinc-400">Guest group</span>
                                )}
                            </span>
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

function EditGuestDialog({
    eventId,
    guest,
    groups,
    open,
    onOpenChange,
}: {
    eventId: number;
    guest: WeddingGuestRow | null;
    groups: GuestGroupOption[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [saving, setSaving] = useState(false);
    const form = useForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        country_code: '+91',
        number_of_guests: 1,
        notes: '',
        guest_group_id: '' as string,
    });

    useEffect(() => {
        if (!guest || !open) {
            return;
        }
        form.setData({
            first_name: guest.first_name || '',
            last_name: guest.last_name || '',
            email: guest.email || '',
            phone: guest.phone || '',
            country_code: guest.country_code || '+91',
            number_of_guests: guest.number_of_guests || 1,
            notes: guest.notes || '',
            guest_group_id: guest.guest_group_id ? String(guest.guest_group_id) : '',
        });
        form.clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sync only when dialog opens for a guest
    }, [guest?.id, open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-2xl sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit guest</DialogTitle>
                    <DialogDescription>
                        Update contact details so you can email or message their personal invite.
                    </DialogDescription>
                </DialogHeader>
                <form
                    className="space-y-3"
                    noValidate
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (!guest) {
                            return;
                        }
                        if (!form.data.first_name.trim()) {
                            form.setError('first_name', 'Please enter a first name.');
                            return;
                        }
                        setSaving(true);
                        router.put(
                            `/events/${eventId}/guests/${guest.id}`,
                            {
                                first_name: form.data.first_name,
                                last_name: form.data.last_name,
                                email: form.data.email,
                                phone: form.data.phone,
                                country_code: form.data.country_code || null,
                                number_of_guests: form.data.number_of_guests,
                                notes: form.data.notes,
                                guest_group_id: form.data.guest_group_id
                                    ? Number(form.data.guest_group_id)
                                    : null,
                            },
                            {
                                preserveScroll: true,
                                onSuccess: () => onOpenChange(false),
                                onError: (errors) => {
                                    Object.entries(errors).forEach(([key, message]) => {
                                        form.setError(key as keyof typeof form.data, String(message));
                                    });
                                },
                                onFinish: () => setSaving(false),
                            },
                        );
                    }}
                >
                    <div className="grid gap-2.5 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                            <label className="mb-1 block text-[11px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">
                                First name
                            </label>
                            <Input
                                className={cn('h-11 rounded-xl', form.errors.first_name && 'ring-1 ring-rose-300')}
                                value={form.data.first_name}
                                onChange={(event) => {
                                    form.setData('first_name', event.target.value);
                                    form.clearErrors('first_name');
                                }}
                                aria-invalid={form.errors.first_name ? true : undefined}
                            />
                            {form.errors.first_name ? (
                                <p className="mt-1 text-[12px] text-rose-600">{form.errors.first_name}</p>
                            ) : null}
                        </div>
                        <div>
                            <label className="mb-1 block text-[11px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">
                                Last name
                            </label>
                            <Input
                                className="h-11 rounded-xl"
                                value={form.data.last_name}
                                onChange={(event) => form.setData('last_name', event.target.value)}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-[11px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">
                                Email
                            </label>
                            <Input
                                type="email"
                                className={cn('h-11 rounded-xl', form.errors.email && 'ring-1 ring-rose-300')}
                                value={form.data.email}
                                onChange={(event) => {
                                    form.setData('email', event.target.value);
                                    form.clearErrors('email');
                                }}
                                placeholder="guest@email.com"
                                aria-invalid={form.errors.email ? true : undefined}
                            />
                            {form.errors.email ? (
                                <p className="mt-1 text-[12px] text-rose-600">{form.errors.email}</p>
                            ) : null}
                        </div>
                        <div>
                            <label className="mb-1 block text-[11px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">
                                Country code
                            </label>
                            <Input
                                className="h-11 rounded-xl"
                                value={form.data.country_code}
                                onChange={(event) => form.setData('country_code', event.target.value)}
                                placeholder="+91"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-[11px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">
                                Phone
                            </label>
                            <Input
                                className="h-11 rounded-xl"
                                value={form.data.phone}
                                onChange={(event) => form.setData('phone', event.target.value)}
                                placeholder="For WhatsApp / SMS"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">
                                Group
                            </label>
                            <GuestGroupSelect
                                groups={groups}
                                value={form.data.guest_group_id}
                                onChange={(next) => form.setData('guest_group_id', next)}
                                noneLabel="No group"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="mb-1 block text-[11px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">
                                Notes
                            </label>
                            <Input
                                className="h-11 rounded-xl"
                                value={form.data.notes}
                                onChange={(event) => form.setData('notes', event.target.value)}
                                placeholder="Optional host note"
                            />
                        </div>
                    </div>
                    {form.hasErrors && !form.errors.first_name && !form.errors.email ? (
                        <p className="text-[12px] text-rose-600">
                            {Object.values(form.errors)[0] || 'Please check the guest details.'}
                        </p>
                    ) : null}
                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving}
                            className="rounded-full bg-zinc-950 text-white hover:bg-zinc-800"
                        >
                            {saving ? 'Saving…' : 'Save guest'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

type DeliveryMode = 'manual' | 'automated';

type MessagingOptions = {
    delivery_mode?: DeliveryMode | string;
    twilio?: {
        configured: boolean;
        email?: boolean;
        sms: boolean;
        whatsapp: boolean;
        hints?: { email?: string; sms?: string; whatsapp?: string };
    };
    billing?: {
        plan: string;
        is_pro: boolean;
        automated_messaging: boolean;
        message_credits: number;
        guest_limit: number;
        guest_used: number;
        guest_remaining: number;
        at_guest_limit: boolean;
        upgrade_url: string;
    };
};

/** Private invitee list for one event — send, share, and manage personal links. */
export function EventGuestBook({
    eventId,
    guests = [],
    groups = [],
    eventTitle,
    messaging,
}: {
    eventId: number;
    guests?: WeddingGuestRow[] | null;
    groups?: GuestGroupOption[] | null;
    eventTitle?: string | null;
    messaging?: MessagingOptions | null;
}) {
    const rows = Array.isArray(guests) ? guests : [];
    const groupRows = Array.isArray(groups) ? groups : [];
    const twilio = messaging?.twilio ?? {
        configured: false,
        email: false,
        sms: false,
        whatsapp: false,
    };
    const planBilling = messaging?.billing;
    const canAutomated = Boolean(planBilling?.automated_messaging);
    const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>(
        messaging?.delivery_mode === 'automated' && canAutomated ? 'automated' : 'manual',
    );
    const automated = deliveryMode === 'automated' && canAutomated;
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [selected, setSelected] = useState<number[]>([]);
    const [sendingIds, setSendingIds] = useState<number[]>([]);
    const [pendingDelete, setPendingDelete] = useState<WeddingGuestRow | null>(null);
    const [editingGuest, setEditingGuest] = useState<WeddingGuestRow | null>(null);
    const [bulkConfirm, setBulkConfirm] = useState(false);
    const [bulkTwilioConfirm, setBulkTwilioConfirm] = useState<'sms' | 'whatsapp' | null>(null);
    const [waQueue, setWaQueue] = useState<WeddingGuestRow[]>([]);
    const [waIndex, setWaIndex] = useState(0);
    const [waBusy, setWaBusy] = useState(false);
    const [assignGroupId, setAssignGroupId] = useState('');
    const [newGroupName, setNewGroupName] = useState('');
    const [adding, setAdding] = useState(false);
    const [deliveryFilter, setDeliveryFilter] = useState<
        'all' | 'pending' | 'sent' | 'viewed' | 'responded' | 'failed' | 'email' | 'phone'
    >('all');
    const [importing, setImporting] = useState(false);
    const [query, setQuery] = useState('');
    const [groupFilter, setGroupFilter] = useState<'all' | 'none' | string>('all');
    const [smsQueue, setSmsQueue] = useState<WeddingGuestRow[]>([]);
    const [smsIndex, setSmsIndex] = useState(0);
    const [smsBusy, setSmsBusy] = useState(false);
    const [shareCopied, setShareCopied] = useState<'message' | 'number' | 'link' | null>(null);
    const nativeSms = useMemo(() => canOpenNativeSms(), []);
    const fileRef = useRef<HTMLInputElement>(null);
    const form = useForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        country_code: '+91',
        number_of_guests: 1,
        notes: '',
        guest_group_id: '',
    });

    const visibleRows = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return rows.filter((guest) => {
            if (groupFilter === 'none' && guest.guest_group_id) {
                return false;
            }
            if (groupFilter !== 'all' && groupFilter !== 'none' && String(guest.guest_group_id) !== groupFilter) {
                return false;
            }
            if (needle) {
                const haystack = [
                    guest.name,
                    guest.email,
                    guest.phone,
                    guest.country_code,
                    guest.group,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                if (!haystack.includes(needle)) {
                    return false;
                }
            }
            switch (deliveryFilter) {
                case 'email':
                    return Boolean(guest.email?.trim());
                case 'phone':
                    return Boolean(guest.phone?.trim());
                case 'failed':
                    return guestHasDeliveryFailure(guest);
                case 'pending':
                    return guest.invitation_status === 'pending' && !guestHasDeliveryFailure(guest);
                case 'sent':
                    return guest.invitation_status === 'sent';
                case 'viewed':
                    return guest.invitation_status === 'viewed';
                case 'responded':
                    return guest.invitation_status === 'responded';
                default:
                    return true;
            }
        });
    }, [deliveryFilter, groupFilter, query, rows]);

    const selectedRows = useMemo(
        () => visibleRows.filter((guest) => selected.includes(guest.id)),
        [visibleRows, selected],
    );
    const emailableSelected = selectedRows.filter((guest) => Boolean(guest.email?.trim()));
    const shareableSelected = selectedRows.filter(
        (guest) => Boolean(guest.phone?.trim()) || Boolean(guest.guest_url),
    );
    const smsSelected = selectedRows.filter((guest) => Boolean(guest.phone?.trim()));
    const failedSelected = selectedRows.filter((guest) => guestHasDeliveryFailure(guest));
    const allSelected = visibleRows.length > 0 && selected.length === visibleRows.length;
    const someSelected = selected.length > 0 && !allSelected;

    const delivery = useMemo(() => {
        const report = {
            total: rows.length,
            withEmail: 0,
            withPhone: 0,
            pending: 0,
            sent: 0,
            viewed: 0,
            responded: 0,
            failed: 0,
        };
        for (const guest of rows) {
            if (guest.email?.trim()) {
                report.withEmail += 1;
            }
            if (guest.phone?.trim()) {
                report.withPhone += 1;
            }
            if (guestHasDeliveryFailure(guest)) {
                report.failed += 1;
            }
            switch (guest.invitation_status) {
                case 'responded':
                    report.responded += 1;
                    break;
                case 'viewed':
                    report.viewed += 1;
                    break;
                case 'sent':
                    report.sent += 1;
                    break;
                default:
                    report.pending += 1;
                    break;
            }
        }
        return report;
    }, [rows]);

    async function copyLink(guest: WeddingGuestRow): Promise<void> {
        const ok = await copyToClipboard(guest.guest_url);
        if (!ok) {
            return;
        }
        setCopiedId(guest.id);
        window.setTimeout(() => {
            setCopiedId((current) => (current === guest.id ? null : current));
        }, 1600);
    }

    function toggleOne(id: number): void {
        setSelected((current) =>
            current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
        );
    }

    function toggleAll(): void {
        setSelected(allSelected ? [] : visibleRows.map((guest) => guest.id));
    }

    function importCsv(file: File): void {
        const body = new FormData();
        body.append('file', file);
        setImporting(true);
        router.post(`/events/${eventId}/guests/import`, body, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => {
                setImporting(false);
                if (fileRef.current) {
                    fileRef.current.value = '';
                }
            },
        });
    }

    function setInviteDeliveryMode(mode: DeliveryMode): void {
        if (mode === 'automated' && !canAutomated) {
            window.location.href = planBilling?.upgrade_url || '/settings/billing';
            return;
        }
        setDeliveryMode(mode);
        router.put(
            `/events/${eventId}/invite-delivery-mode`,
            { mode },
            { preserveScroll: true, preserveState: true },
        );
    }

    function queueTwilioChannel(channel: 'sms' | 'whatsapp', guestIds: number[]): void {
        if (guestIds.length === 0) {
            return;
        }
        setSendingIds(guestIds);
        router.post(
            `/events/${eventId}/guests/bulk`,
            {
                action: channel === 'sms' ? 'send_sms' : 'send_whatsapp',
                guest_ids: guestIds,
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setSendingIds([]);
                    setSelected((current) => current.filter((id) => !guestIds.includes(id)));
                    setBulkTwilioConfirm(null);
                },
            },
        );
    }

    function bulkWhatsApp(): void {
        if (automated) {
            if (!twilio.whatsapp || shareableSelected.length === 0) {
                return;
            }
            setBulkTwilioConfirm('whatsapp');
            return;
        }
        const queue = shareableSelected;
        if (queue.length === 0) {
            return;
        }
        setShareCopied(null);
        setWaQueue(queue);
        setWaIndex(0);
        window.open(whatsappShareUrl(queue[0], eventTitle), '_blank', 'noopener,noreferrer');
    }

    function bulkSms(): void {
        if (automated) {
            if (!twilio.sms || smsSelected.length === 0) {
                return;
            }
            setBulkTwilioConfirm('sms');
            return;
        }
        const queue = smsSelected;
        if (queue.length === 0) {
            return;
        }
        setShareCopied(null);
        setSmsQueue(queue);
        setSmsIndex(0);
        // Only auto-open Messages on phones — desktop sms: triggers “Pick an app?”.
        openNativeSmsIfPossible(queue[0], eventTitle);
    }

    async function copyShareField(
        source: 'wa' | 'sms',
        kind: 'message' | 'number' | 'link',
    ): Promise<void> {
        const guest = source === 'wa' ? waQueue[waIndex] : smsQueue[smsIndex];
        if (!guest) {
            return;
        }
        const value =
            kind === 'message'
                ? guestShareText(guest, eventTitle)
                : kind === 'link'
                  ? guest.guest_url
                  : guestPhoneLabel(guest) || guestPhoneDigits(guest);
        const ok = await copyToClipboard(value);
        if (!ok) {
            return;
        }
        setShareCopied(kind);
        window.setTimeout(() => {
            setShareCopied((current) => (current === kind ? null : current));
        }, 1600);
    }

    function advanceShareQueue(
        kind: 'wa' | 'sms',
        markShared: boolean,
    ): void {
        const queue = kind === 'wa' ? waQueue : smsQueue;
        const index = kind === 'wa' ? waIndex : smsIndex;
        const current = queue[index];

        const finish = (nextIndex: number): void => {
            if (nextIndex >= queue.length) {
                if (kind === 'wa') {
                    setWaQueue([]);
                    setWaIndex(0);
                    setWaBusy(false);
                } else {
                    setSmsQueue([]);
                    setSmsIndex(0);
                    setSmsBusy(false);
                    setShareCopied(null);
                }
                setSelected((ids) => ids.filter((id) => !queue.some((guest) => guest.id === id)));
                return;
            }
            if (kind === 'wa') {
                setWaIndex(nextIndex);
                setWaBusy(false);
                setShareCopied(null);
                window.open(whatsappShareUrl(queue[nextIndex], eventTitle), '_blank', 'noopener,noreferrer');
            } else {
                setSmsIndex(nextIndex);
                setSmsBusy(false);
                setShareCopied(null);
                openNativeSmsIfPossible(queue[nextIndex], eventTitle);
            }
        };

        if (!current) {
            if (kind === 'wa') {
                setWaQueue([]);
            } else {
                setSmsQueue([]);
            }
            return;
        }

        if (!markShared) {
            finish(index + 1);
            return;
        }

        if (kind === 'wa') {
            setWaBusy(true);
        } else {
            setSmsBusy(true);
        }
        router.post(
            `/events/${eventId}/guests/bulk`,
            {
                action: 'mark_shared',
                guest_ids: [current.id],
                channel: kind === 'wa' ? 'whatsapp' : 'sms',
            },
            {
                preserveScroll: true,
                onFinish: () => finish(index + 1),
            },
        );
    }

    function retryFailed(guestIds: number[]): void {
        if (guestIds.length === 0) {
            return;
        }
        setSendingIds(guestIds);
        router.post(
            `/events/${eventId}/guests/bulk`,
            { action: 'retry_failed', guest_ids: guestIds },
            {
                preserveScroll: true,
                onFinish: () => setSendingIds([]),
            },
        );
    }

    function advanceWhatsAppQueue(markShared: boolean): void {
        advanceShareQueue('wa', markShared);
    }

    function advanceSmsQueue(markShared: boolean): void {
        advanceShareQueue('sms', markShared);
    }

    function markSent(guestIds: number[]): void {
        if (guestIds.length === 0) {
            return;
        }
        setSendingIds(guestIds);
        router.post(
            `/events/${eventId}/guests/bulk`,
            {
                action: 'mark_sent',
                guest_ids: guestIds,
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setSendingIds([]);
                    setSelected((current) => current.filter((id) => !guestIds.includes(id)));
                    setBulkConfirm(false);
                },
            },
        );
    }

    function assignGroup(guestIds: number[], groupId: string): void {
        if (guestIds.length === 0 || !groupId) {
            return;
        }
        router.post(
            `/events/${eventId}/guests/bulk`,
            {
                action: 'assign_group',
                guest_ids: guestIds,
                guest_group_id: Number(groupId),
            },
            {
                preserveScroll: true,
                onFinish: () => setSelected([]),
            },
        );
    }

    function createGroup(): void {
        const name = newGroupName.trim();
        if (!name) {
            return;
        }
        router.post(
            `/events/${eventId}/groups`,
            { name },
            {
                preserveScroll: true,
                onSuccess: () => setNewGroupName(''),
            },
        );
    }

    function openShare(url: string, guestId: number, channel: 'whatsapp' | 'sms' = 'whatsapp'): void {
        window.open(url, '_blank', 'noopener,noreferrer');
        // Record outreach for WhatsApp/SMS without requiring email.
        router.post(
            `/events/${eventId}/guests/bulk`,
            {
                action: 'mark_shared',
                guest_ids: [guestId],
                channel,
            },
            { preserveScroll: true },
        );
    }

    return (
        <section id="guests" className="space-y-5">
            <div className="overflow-hidden rounded-[1.6rem] bg-white shadow-[0_1px_0_rgba(24,24,27,0.04)] ring-1 ring-zinc-950/[0.06]">
                <div className="relative border-b border-zinc-950/6 px-5 py-5 sm:px-6">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(480px_180px_at_100%_0%,rgba(24,24,27,0.06),transparent_55%)]"
                    />
                    <div className="relative">
                        <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                            Invite list
                        </p>
                        <h2 className="mt-1 font-serif text-3xl tracking-tight text-zinc-950">Guests</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
                            Collect email and mobile, then choose how to notify — free from your phone, or
                            automated bulk via Twilio.
                        </p>

                        {planBilling ? (
                            <div className="mt-3 space-y-2">
                                <div className="flex flex-wrap items-center gap-2 text-[12px]">
                                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-semibold text-zinc-700">
                                        {planBilling.is_pro ? 'Pro' : 'Free'} · {planBilling.guest_used}/
                                        {planBilling.guest_limit} guests
                                    </span>
                                    {planBilling.is_pro ? (
                                        <span
                                            className={cn(
                                                'rounded-full px-2.5 py-1 font-semibold ring-1',
                                                planBilling.message_credits < 10
                                                    ? 'bg-amber-50 text-amber-900 ring-amber-100'
                                                    : 'bg-emerald-50 text-emerald-800 ring-emerald-100',
                                            )}
                                        >
                                            {planBilling.message_credits} message credits
                                        </span>
                                    ) : (
                                        <a
                                            href={planBilling.upgrade_url}
                                            className="rounded-full bg-zinc-950 px-2.5 py-1 font-semibold text-white"
                                        >
                                            Buy Pro · unlock Twilio
                                        </a>
                                    )}
                                    {planBilling.at_guest_limit ? (
                                        <a
                                            href={planBilling.upgrade_url}
                                            className="rounded-full bg-rose-50 px-2.5 py-1 font-semibold text-rose-800 ring-1 ring-rose-100"
                                        >
                                            Guest limit reached · upgrade
                                        </a>
                                    ) : null}
                                    {planBilling.is_pro && planBilling.message_credits < 10 ? (
                                        <a
                                            href={planBilling.upgrade_url}
                                            className="rounded-full bg-zinc-950 px-2.5 py-1 font-semibold text-white"
                                        >
                                            Buy credit pack
                                        </a>
                                    ) : null}
                                </div>
                                {!planBilling.is_pro ? (
                                    <p className="max-w-2xl text-[12px] leading-relaxed text-zinc-500">
                                        Free keeps phone sharing. Pro adds automated WhatsApp/SMS via
                                        Twilio and up to {planBilling.guest_limit < 500 ? '500' : planBilling.guest_limit}{' '}
                                        guests — pay once with Razorpay (UPI / cards).
                                    </p>
                                ) : null}
                            </div>
                        ) : null}

                        <div className="mt-4 space-y-2">
                            <div className="relative grid grid-cols-2 gap-1 rounded-2xl bg-zinc-100/90 p-1.5 ring-1 ring-zinc-950/5">
                                <span
                                    aria-hidden
                                    className={cn(
                                        'pointer-events-none absolute top-1.5 bottom-1.5 w-[calc(50%-0.25rem)] rounded-xl bg-white shadow-[0_1px_0_rgba(24,24,27,0.04),0_8px_24px_-12px_rgba(24,24,27,0.35)] ring-1 ring-zinc-950/8 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                                        deliveryMode === 'automated' && canAutomated
                                            ? 'translate-x-[calc(100%+0.25rem)]'
                                            : 'translate-x-0',
                                    )}
                                    style={{ left: '0.375rem' }}
                                />
                                {(
                                    [
                                        {
                                            id: 'manual' as const,
                                            title: 'Free · your phone',
                                            detail: 'WhatsApp & SMS from your device. Email still sends from the app.',
                                        },
                                        {
                                            id: 'automated' as const,
                                            title: canAutomated
                                                ? 'Automated · Twilio'
                                                : 'Automated · Pro',
                                            detail: canAutomated
                                                ? 'Email, WhatsApp, and SMS sent in bulk from the app.'
                                                : 'Upgrade to Pro to send WhatsApp & SMS from the app.',
                                        },
                                    ] as const
                                ).map((option) => {
                                    const active = deliveryMode === option.id && (option.id !== 'automated' || canAutomated);
                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            data-ripple=""
                                            aria-pressed={active}
                                            onClick={() => setInviteDeliveryMode(option.id)}
                                            className={cn(
                                                'ui-ripple-host relative z-[1] overflow-hidden rounded-xl px-3.5 py-3 text-left transition-colors duration-300',
                                                active ? 'text-zinc-950' : 'text-zinc-500 hover:text-zinc-800',
                                            )}
                                        >
                                            <span className="relative z-[3] block">
                                                <span className="flex items-center gap-2">
                                                    <span
                                                        className={cn(
                                                            'size-2 shrink-0 rounded-full transition duration-300',
                                                            active
                                                                ? 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.18)]'
                                                                : 'bg-zinc-300',
                                                        )}
                                                    />
                                                    <span className="text-[13px] font-semibold tracking-tight">
                                                        {option.title}
                                                    </span>
                                                </span>
                                                <span
                                                    className={cn(
                                                        'mt-1 block text-[11px] leading-snug transition-colors duration-300',
                                                        active ? 'text-zinc-500' : 'text-zinc-400',
                                                    )}
                                                >
                                                    {option.detail}
                                                </span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            {automated && (!twilio.sms || !twilio.whatsapp) ? (
                                <p className="px-1 text-[12px] leading-relaxed text-zinc-500">
                                    {!twilio.whatsapp
                                        ? twilio.hints?.whatsapp ||
                                          'WhatsApp needs TWILIO_WHATSAPP_FROM (sandbox or approved Business sender).'
                                        : null}
                                    {!twilio.whatsapp && !twilio.sms ? ' ' : null}
                                    {!twilio.sms
                                        ? twilio.hints?.sms ||
                                          'SMS needs TWILIO_ACCOUNT_SID, AUTH_TOKEN, and SMS_FROM.'
                                        : null}{' '}
                                    Email still works, or switch to Free · your phone.
                                </p>
                            ) : null}
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                            <div className="flex items-start gap-2.5 rounded-2xl bg-zinc-950 px-3.5 py-3 text-white">
                                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-white/10">
                                    <Mail className="size-3.5 opacity-90" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[13px] font-semibold">Email</p>
                                    <p className="mt-0.5 text-[11px] leading-snug opacity-75">
                                        Sent by the app · needs email
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5 rounded-2xl bg-[#25D366]/12 px-3.5 py-3 text-[#075E54] ring-1 ring-[#25D366]/35">
                                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-[#25D366] text-white shadow-sm">
                                    <WhatsAppIcon className="size-3.5" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[13px] font-semibold">WhatsApp</p>
                                    <p className="mt-0.5 text-[11px] leading-snug opacity-75">
                                        {automated
                                            ? twilio.whatsapp
                                                ? 'Bulk send from the app · needs mobile'
                                                : 'Not available yet · use Free mode'
                                            : 'Opens chat on your phone · needs mobile'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5 rounded-2xl bg-sky-50 px-3.5 py-3 text-sky-950 ring-1 ring-sky-200/80">
                                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-sky-500 text-white shadow-sm">
                                    <SmsIcon className="size-3.5" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[13px] font-semibold">SMS</p>
                                    <p className="mt-0.5 text-[11px] leading-snug opacity-75">
                                        {automated
                                            ? twilio.sms
                                                ? 'Bulk send from the app · needs mobile'
                                                : 'Not available yet · use Free mode'
                                            : 'Your phone / copy on desktop · needs mobile'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 border-b border-zinc-950/6 px-5 py-5 sm:px-6">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                                Guest groups
                            </p>
                            <p className="mt-1 text-[13px] text-zinc-500">
                                Tag family, friends, or tables — then assign in bulk.
                            </p>
                        </div>
                        <form
                            className="flex flex-wrap items-center gap-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                createGroup();
                            }}
                        >
                            <Input
                                className="h-10 w-44 rounded-full"
                                placeholder="New group name"
                                value={newGroupName}
                                onChange={(event) => setNewGroupName(event.target.value)}
                            />
                            <Button
                                type="submit"
                                disabled={!newGroupName.trim()}
                                className="h-10 rounded-full bg-zinc-950 px-4 text-white hover:bg-zinc-800"
                            >
                                <Plus className="mr-1 size-3.5" />
                                Add group
                            </Button>
                        </form>
                    </div>
                    {groupRows.length === 0 ? (
                        <p className="text-[12px] text-zinc-400">No groups yet.</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {groupRows.map((group) => (
                                <span
                                    key={group.id}
                                    className={cn(
                                        'inline-flex items-center gap-2 rounded-full bg-gradient-to-br px-3 py-1.5 text-[12px] font-semibold ring-1',
                                        groupAccent(group.id),
                                    )}
                                >
                                    <Users className="size-3.5 opacity-80" />
                                    {group.name}
                                    <button
                                        type="button"
                                        className="rounded-full p-0.5 text-current/50 transition hover:bg-white/50 hover:text-rose-600"
                                        aria-label={`Delete ${group.name}`}
                                        onClick={() =>
                                            router.delete(`/events/${eventId}/groups/${group.id}`, {
                                                preserveScroll: true,
                                            })
                                        }
                                    >
                                        <Trash2 className="size-3.5" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <form
                    className="space-y-3 border-b border-zinc-950/6 px-5 py-5 sm:px-6"
                    noValidate
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (!form.data.first_name.trim()) {
                            form.setError('first_name', 'Please enter a first name.');
                            return;
                        }
                        setAdding(true);
                        router.post(
                            `/events/${eventId}/guests`,
                            {
                                first_name: form.data.first_name,
                                last_name: form.data.last_name,
                                email: form.data.email,
                                phone: form.data.phone,
                                country_code: form.data.country_code || null,
                                number_of_guests: form.data.number_of_guests,
                                notes: form.data.notes,
                                guest_group_id: form.data.guest_group_id
                                    ? Number(form.data.guest_group_id)
                                    : null,
                            },
                            {
                                preserveScroll: true,
                                onSuccess: () =>
                                    form.reset('first_name', 'last_name', 'email', 'phone', 'notes', 'guest_group_id'),
                                onError: (errors) => {
                                    Object.entries(errors).forEach(([key, message]) => {
                                        form.setError(key as keyof typeof form.data, String(message));
                                    });
                                },
                                onFinish: () => setAdding(false),
                            },
                        );
                    }}
                >
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">Add guest</p>
                    <div className="grid gap-2.5 sm:grid-cols-6">
                        <div className="sm:col-span-2">
                            <Input
                                className={cn('h-11 rounded-xl', form.errors.first_name && 'ring-1 ring-rose-300')}
                                placeholder="First name"
                                value={form.data.first_name}
                                onChange={(event) => {
                                    form.setData('first_name', event.target.value);
                                    form.clearErrors('first_name');
                                }}
                                aria-invalid={form.errors.first_name ? true : undefined}
                            />
                            {form.errors.first_name ? (
                                <p className="mt-1 text-[12px] text-rose-600">{form.errors.first_name}</p>
                            ) : null}
                        </div>
                        <Input
                            className="h-11 rounded-xl sm:col-span-2"
                            placeholder="Last name"
                            value={form.data.last_name}
                            onChange={(event) => form.setData('last_name', event.target.value)}
                        />
                        <Input
                            type="email"
                            className="h-11 rounded-xl sm:col-span-2"
                            placeholder="Email"
                            value={form.data.email}
                            onChange={(event) => form.setData('email', event.target.value)}
                        />
                        <Input
                            className="h-11 rounded-xl sm:col-span-1"
                            placeholder="+91"
                            value={form.data.country_code}
                            onChange={(event) => form.setData('country_code', event.target.value)}
                            aria-label="Country code"
                        />
                        <Input
                            className="h-11 rounded-xl sm:col-span-2"
                            placeholder="Mobile number"
                            value={form.data.phone}
                            onChange={(event) => form.setData('phone', event.target.value)}
                        />
                        {groupRows.length > 0 ? (
                            <div className="sm:col-span-3">
                                <GuestGroupSelect
                                    groups={groupRows}
                                    value={form.data.guest_group_id}
                                    onChange={(next) => form.setData('guest_group_id', next)}
                                    noneLabel="No group"
                                    placeholder="Assign to a group"
                                />
                            </div>
                        ) : null}
                    </div>
                    {form.hasErrors && !form.errors.first_name ? (
                        <p className="text-[12px] text-rose-600">
                            {Object.values(form.errors)[0] || 'Please check the guest details.'}
                        </p>
                    ) : null}
                    <Button
                        type="submit"
                        disabled={adding || !form.data.first_name.trim()}
                        className="h-10 rounded-full bg-zinc-950 px-5 text-white hover:bg-zinc-800"
                    >
                        <Plus className="mr-1.5 size-3.5" />
                        {adding ? 'Adding…' : 'Add guest'}
                    </Button>
                </form>

                {rows.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <Users className="mx-auto size-8 text-zinc-300" />
                        <p className="mt-4 font-serif text-3xl text-zinc-950">No invitees yet</p>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
                            Add a name above to create their personal invitation link.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="border-b border-zinc-950/6 px-5 py-4 sm:px-6">
                            <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                                Delivery report
                            </p>
                            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                                {(
                                    [
                                        { id: 'all' as const, label: 'Guests', value: delivery.total },
                                        { id: 'email' as const, label: 'Email', value: delivery.withEmail },
                                        { id: 'phone' as const, label: 'Mobile', value: delivery.withPhone },
                                        { id: 'pending' as const, label: 'Pending', value: delivery.pending },
                                        { id: 'sent' as const, label: 'Sent', value: delivery.sent },
                                        { id: 'viewed' as const, label: 'Opened', value: delivery.viewed },
                                        { id: 'responded' as const, label: 'Replied', value: delivery.responded },
                                    ] as const
                                ).map((item) => (
                                    <button
                                        key={item.label}
                                        type="button"
                                        onClick={() => {
                                            setDeliveryFilter(item.id);
                                            setSelected([]);
                                        }}
                                        className={cn(
                                            'rounded-2xl px-3 py-2.5 text-left ring-1 transition',
                                            deliveryFilter === item.id
                                                ? 'bg-white ring-2 ring-zinc-900'
                                                : 'bg-zinc-50 ring-zinc-950/5 hover:bg-white',
                                        )}
                                    >
                                        <p className="text-[11px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
                                            {item.label}
                                        </p>
                                        <p className="mt-1 font-serif text-2xl tabular-nums text-zinc-950">
                                            {item.value}
                                        </p>
                                    </button>
                                ))}
                            </div>
                            {delivery.failed > 0 ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDeliveryFilter('failed');
                                        setSelected([]);
                                    }}
                                    className="mt-3 text-left text-[12px] font-medium text-rose-600 hover:underline"
                                >
                                    {delivery.failed} invite{delivery.failed === 1 ? '' : 's'} failed — tap to filter
                                    and retry.
                                </button>
                            ) : null}
                        </div>

                        <div className="space-y-3 border-b border-zinc-950/6 px-5 py-4 sm:px-6">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                                <div className="relative min-w-0 flex-1">
                                    <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                                        Search
                                    </span>
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                                        <input
                                            value={query}
                                            onChange={(event) => setQuery(event.target.value)}
                                            placeholder="Name, email, or mobile"
                                            className="h-11 w-full rounded-2xl border border-zinc-200/90 bg-white pr-4 pl-10 text-sm outline-none ring-emerald-500/25 focus:ring-2"
                                        />
                                    </div>
                                </div>
                                <StudioFilterSelect
                                    label="Group"
                                    value={groupFilter}
                                    onValueChange={setGroupFilter}
                                    options={[
                                        { value: 'all', label: 'All groups', badge: String(rows.length) },
                                        { value: 'none', label: 'Ungrouped' },
                                        ...groupRows.map((group) => ({
                                            value: String(group.id),
                                            label: group.name,
                                            badge: String(
                                                rows.filter((guest) => guest.guest_group_id === group.id).length,
                                            ),
                                        })),
                                    ]}
                                    className="w-full lg:w-56"
                                    triggerClassName="rounded-2xl"
                                />
                                <div className="flex flex-wrap items-center gap-2 lg:pb-0.5">
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept=".csv,text/csv,.txt"
                                        className="hidden"
                                        onChange={(event) => {
                                            const file = event.target.files?.[0];
                                            if (file) {
                                                importCsv(file);
                                            }
                                        }}
                                    />
                                    <a
                                        href={`/events/${eventId}/guests/import-sample`}
                                        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-50"
                                    >
                                        <Download className="size-3.5" />
                                        Sample
                                    </a>
                                    <a
                                        href={`/events/${eventId}/guests/export`}
                                        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-50"
                                    >
                                        <Download className="size-3.5" />
                                        Export
                                    </a>
                                    <button
                                        type="button"
                                        disabled={importing}
                                        onClick={() => fileRef.current?.click()}
                                        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-40"
                                    >
                                        <Upload className="size-3.5" />
                                        {importing ? 'Importing…' : 'Import'}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-gradient-to-r from-zinc-50 via-white to-emerald-50/40 px-3 py-2.5 ring-1 ring-zinc-950/5">
                                <GuestSelectToggle
                                    checked={allSelected}
                                    indeterminate={someSelected}
                                    onCheckedChange={() => toggleAll()}
                                    label={allSelected ? 'All selected' : someSelected ? 'Partial' : 'Select all'}
                                    count={
                                        selected.length > 0
                                            ? `${selected.length} of ${visibleRows.length}`
                                            : `${visibleRows.length} shown`
                                    }
                                />
                                <div className="ml-auto flex flex-wrap items-center gap-2">
                                    {groupRows.length > 0 && selected.length > 0 ? (
                                        <div className="w-[200px]">
                                            <GuestGroupSelect
                                                groups={groupRows}
                                                value={assignGroupId}
                                                onChange={(next) => {
                                                    setAssignGroupId(next);
                                                    if (next) {
                                                        assignGroup(selected, next);
                                                        setAssignGroupId('');
                                                    }
                                                }}
                                                allowNone
                                                noneLabel="Assign group…"
                                                placeholder="Assign group…"
                                                size="compact"
                                            />
                                        </div>
                                    ) : null}
                                    <button
                                        type="button"
                                        disabled={emailableSelected.length === 0 || sendingIds.length > 0}
                                        onClick={() => setBulkConfirm(true)}
                                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-zinc-950 px-3 text-[12px] font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-40"
                                    >
                                        <Mail className="size-3.5" />
                                        Email ({emailableSelected.length})
                                    </button>
                                    <button
                                        type="button"
                                        disabled={
                                            shareableSelected.length === 0 ||
                                            sendingIds.length > 0 ||
                                            (automated && !twilio.whatsapp)
                                        }
                                        onClick={bulkWhatsApp}
                                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#25D366]/40 bg-[#25D366]/12 px-3 text-[12px] font-semibold text-[#075E54] transition hover:bg-[#25D366]/20 disabled:opacity-40"
                                    >
                                        <WhatsAppIcon className="size-3.5" />
                                        {automated ? 'Send WhatsApp' : 'WhatsApp'} ({shareableSelected.length})
                                    </button>
                                    <button
                                        type="button"
                                        disabled={
                                            smsSelected.length === 0 ||
                                            sendingIds.length > 0 ||
                                            (automated && !twilio.sms)
                                        }
                                        onClick={bulkSms}
                                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-sky-300/70 bg-sky-50 px-3 text-[12px] font-semibold text-sky-900 transition hover:bg-sky-100 disabled:opacity-40"
                                    >
                                        <SmsIcon className="size-3.5" />
                                        {automated ? 'Send SMS' : 'SMS'} ({smsSelected.length})
                                    </button>
                                    {failedSelected.length > 0 || delivery.failed > 0 ? (
                                        <button
                                            type="button"
                                            disabled={
                                                (failedSelected.length === 0 &&
                                                    deliveryFilter !== 'failed') ||
                                                sendingIds.length > 0
                                            }
                                            onClick={() => {
                                                const ids =
                                                    failedSelected.length > 0
                                                        ? failedSelected.map((guest) => guest.id)
                                                        : visibleRows
                                                              .filter((guest) =>
                                                                  guestHasDeliveryFailure(guest),
                                                              )
                                                              .map((guest) => guest.id);
                                                retryFailed(ids);
                                            }}
                                            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 text-[12px] font-semibold text-rose-800 transition hover:bg-rose-100 disabled:opacity-40"
                                        >
                                            <Send className="size-3.5" />
                                            Retry failed
                                            {failedSelected.length > 0
                                                ? ` (${failedSelected.length})`
                                                : ''}
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        {visibleRows.length === 0 ? (
                            <div className="px-6 py-10 text-center">
                                <Search className="mx-auto size-7 text-zinc-300" />
                                <p className="mt-3 font-serif text-2xl text-zinc-950">No matching guests</p>
                                <p className="mt-1 text-sm text-zinc-500">Try another search or clear filters.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-zinc-950/6">
                                {visibleRows.map((guest) => {
                                    const busy = sendingIds.includes(guest.id);
                                    const checked = selected.includes(guest.id);
                                    const hasEmail = Boolean(guest.email?.trim());
                                    const hasPhone = Boolean(guest.phone?.trim());
                                    const phoneLabel = [guest.country_code, guest.phone]
                                        .filter(Boolean)
                                        .join(' ');

                                    return (
                                        <li
                                            key={guest.id}
                                            className={cn(
                                                'grid gap-3 px-5 py-4 transition duration-200 sm:px-6',
                                                'sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center',
                                                checked
                                                    ? 'bg-gradient-to-r from-emerald-50/80 via-emerald-50/30 to-transparent'
                                                    : 'hover:bg-zinc-50/60',
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <GuestSelectToggle
                                                    checked={checked}
                                                    onCheckedChange={() => toggleOne(guest.id)}
                                                    aria-label={`Select ${guest.name}`}
                                                />
                                                <div
                                                    className={cn(
                                                        'flex size-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold text-white shadow-md transition duration-200',
                                                        checked
                                                            ? 'bg-gradient-to-br from-emerald-600 to-teal-700 ring-2 ring-emerald-200/80'
                                                            : 'bg-gradient-to-br from-zinc-900 to-zinc-700',
                                                    )}
                                                >
                                                    {initials(guest.name)}
                                                </div>
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="truncate text-[15px] font-semibold text-zinc-950">
                                                        {guest.name}
                                                    </p>
                                                    <span
                                                        className={cn(
                                                            'rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1',
                                                            statusChip(guest.rsvp_status),
                                                        )}
                                                    >
                                                        {pretty(guest.rsvp_status)}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 capitalize',
                                                            deliveryChip(
                                                                guest.invitation_status,
                                                                guestHasDeliveryFailure(guest),
                                                            ),
                                                        )}
                                                    >
                                                        {deliveryLabel(guest)}
                                                    </span>
                                                    {guest.group ? (
                                                        <span
                                                            className={cn(
                                                                'inline-flex items-center gap-1 rounded-full bg-gradient-to-br px-2 py-0.5 text-[11px] font-semibold ring-1',
                                                                groupAccent(guest.guest_group_id ?? guest.group),
                                                            )}
                                                        >
                                                            <Users className="size-3" />
                                                            {guest.group}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-zinc-500">
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center gap-1',
                                                            !hasEmail && 'text-zinc-400',
                                                        )}
                                                    >
                                                        <Mail className="size-3" />
                                                        {guest.email || 'No email'}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center gap-1',
                                                            !hasPhone && 'text-zinc-400',
                                                        )}
                                                    >
                                                        <SmsIcon className="size-3" />
                                                        {phoneLabel || 'No mobile'}
                                                    </span>
                                                    {formatSentAt(guest.invitation_sent_at) ? (
                                                        <span className="inline-flex items-center gap-1">
                                                            <Send className="size-3" />
                                                            {formatSentAt(guest.invitation_sent_at)}
                                                            {(guest.invitation_send_count ?? 0) > 1
                                                                ? ` · ${guest.invitation_send_count}×`
                                                                : ''}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-zinc-400">
                                                            <Link2 className="size-3" />
                                                            Not notified yet
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-1.5 flex flex-wrap gap-1">
                                                    {guest.email?.trim() ? (
                                                        <span
                                                            className={cn(
                                                                'rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1',
                                                                channelTone(
                                                                    guest.email_sent_at,
                                                                    guest.email_last_error,
                                                                ),
                                                            )}
                                                            title={
                                                                guest.email_last_error ||
                                                                (guest.email_sent_at
                                                                    ? `Email · ${formatSentAt(guest.email_sent_at)}`
                                                                    : 'Email not sent')
                                                            }
                                                        >
                                                            Email
                                                            {guest.email_last_error
                                                                ? ' ✕'
                                                                : guest.email_sent_at
                                                                  ? ' ✓'
                                                                  : ''}
                                                        </span>
                                                    ) : null}
                                                    {guest.phone?.trim() ? (
                                                        <>
                                                            <span
                                                                className={cn(
                                                                    'rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1',
                                                                    channelTone(
                                                                        guest.whatsapp_sent_at,
                                                                        guest.whatsapp_last_error,
                                                                    ),
                                                                )}
                                                                title={
                                                                    guest.whatsapp_last_error ||
                                                                    (guest.whatsapp_sent_at
                                                                        ? `WhatsApp · ${formatSentAt(guest.whatsapp_sent_at)}`
                                                                        : 'WhatsApp not sent')
                                                                }
                                                            >
                                                                WA
                                                                {guest.whatsapp_last_error
                                                                    ? ' ✕'
                                                                    : guest.whatsapp_sent_at
                                                                      ? ' ✓'
                                                                      : ''}
                                                            </span>
                                                            <span
                                                                className={cn(
                                                                    'rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1',
                                                                    channelTone(
                                                                        guest.sms_sent_at,
                                                                        guest.sms_last_error,
                                                                    ),
                                                                )}
                                                                title={
                                                                    guest.sms_last_error ||
                                                                    (guest.sms_sent_at
                                                                        ? `SMS · ${formatSentAt(guest.sms_sent_at)}`
                                                                        : 'SMS not sent')
                                                                }
                                                            >
                                                                SMS
                                                                {guest.sms_last_error
                                                                    ? ' ✕'
                                                                    : guest.sms_sent_at
                                                                      ? ' ✓'
                                                                      : ''}
                                                            </span>
                                                        </>
                                                    ) : null}
                                                </div>
                                                {guest.email_last_error ||
                                                guest.whatsapp_last_error ||
                                                guest.sms_last_error ||
                                                guest.invitation_last_error ? (
                                                    <p className="mt-1 text-[11px] text-rose-600">
                                                        {guest.email_last_error ||
                                                            guest.whatsapp_last_error ||
                                                            guest.sms_last_error ||
                                                            guest.invitation_last_error}
                                                    </p>
                                                ) : null}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                                                <div className="inline-flex items-center gap-0.5 rounded-full bg-white p-1 shadow-sm ring-1 ring-zinc-950/8">
                                                    <button
                                                        type="button"
                                                        disabled={busy || !hasEmail}
                                                        title={hasEmail ? 'Email invite' : 'Add an email first'}
                                                        onClick={() =>
                                                            hasEmail
                                                                ? markSent([guest.id])
                                                                : setEditingGuest(guest)
                                                        }
                                                        className={cn(
                                                            'inline-flex size-9 items-center justify-center rounded-full transition',
                                                            hasEmail
                                                                ? 'bg-zinc-950 text-white hover:bg-zinc-800'
                                                                : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700',
                                                        )}
                                                    >
                                                        {busy ? (
                                                            <Send className="size-3.5 animate-pulse" />
                                                        ) : (
                                                            <Mail className="size-3.5" />
                                                        )}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        title={
                                                            !hasPhone
                                                                ? 'Add a mobile number'
                                                                : automated
                                                                  ? twilio.whatsapp
                                                                      ? 'Send WhatsApp'
                                                                      : 'WhatsApp not available yet'
                                                                  : 'WhatsApp invite'
                                                        }
                                                        disabled={
                                                            !hasPhone ||
                                                            busy ||
                                                            (automated && !twilio.whatsapp)
                                                        }
                                                        onClick={() => {
                                                            if (!hasPhone) {
                                                                setEditingGuest(guest);
                                                                return;
                                                            }
                                                            if (automated) {
                                                                queueTwilioChannel('whatsapp', [guest.id]);
                                                                return;
                                                            }
                                                            openShare(
                                                                whatsappShareUrl(guest, eventTitle),
                                                                guest.id,
                                                            );
                                                        }}
                                                        className={cn(
                                                            'inline-flex size-9 items-center justify-center rounded-full transition',
                                                            hasPhone && (!automated || twilio.whatsapp)
                                                                ? 'text-[#075E54] hover:bg-[#25D366]/15'
                                                                : 'text-zinc-300',
                                                        )}
                                                    >
                                                        <WhatsAppIcon className="size-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        title={
                                                            !hasPhone
                                                                ? 'Add a mobile number'
                                                                : automated
                                                                  ? twilio.sms
                                                                      ? 'Send SMS'
                                                                      : 'SMS not available yet'
                                                                  : nativeSms
                                                                    ? 'SMS invite'
                                                                    : 'Prepare SMS (copy on desktop)'
                                                        }
                                                        disabled={
                                                            !hasPhone ||
                                                            busy ||
                                                            (automated && !twilio.sms)
                                                        }
                                                        onClick={() => {
                                                            if (!hasPhone) {
                                                                setEditingGuest(guest);
                                                                return;
                                                            }
                                                            if (automated) {
                                                                queueTwilioChannel('sms', [guest.id]);
                                                                return;
                                                            }
                                                            if (nativeSms) {
                                                                openNativeSmsIfPossible(guest, eventTitle);
                                                                router.post(
                                                                    `/events/${eventId}/guests/bulk`,
                                                                    {
                                                                        action: 'mark_shared',
                                                                        guest_ids: [guest.id],
                                                                        channel: 'sms',
                                                                    },
                                                                    { preserveScroll: true },
                                                                );
                                                                return;
                                                            }
                                                            setShareCopied(null);
                                                            setSmsQueue([guest]);
                                                            setSmsIndex(0);
                                                        }}
                                                        className={cn(
                                                            'inline-flex size-9 items-center justify-center rounded-full transition',
                                                            hasPhone && (!automated || twilio.sms)
                                                                ? 'text-sky-700 hover:bg-sky-50'
                                                                : 'text-zinc-300',
                                                        )}
                                                    >
                                                        <SmsIcon className="size-3.5" />
                                                    </button>
                                                </div>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className="inline-flex size-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50"
                                                            aria-label={`More actions for ${guest.name}`}
                                                        >
                                                            <MoreHorizontal className="size-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44 rounded-xl">
                                                        <DropdownMenuItem
                                                            onClick={() => void copyLink(guest)}
                                                            className="gap-2"
                                                        >
                                                            {copiedId === guest.id ? (
                                                                <Check className="size-3.5 text-emerald-600" />
                                                            ) : (
                                                                <Copy className="size-3.5" />
                                                            )}
                                                            {copiedId === guest.id ? 'Copied link' : 'Copy link'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => setEditingGuest(guest)}
                                                            className="gap-2"
                                                        >
                                                            <Pencil className="size-3.5" />
                                                            Edit guest
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => setPendingDelete(guest)}
                                                            className="gap-2 text-rose-600 focus:text-rose-700"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                            Remove guest
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </>
                )}
            </div>

            <ConfirmDialog
                open={pendingDelete != null}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingDelete(null);
                    }
                }}
                title="Remove this guest?"
                description={
                    pendingDelete
                        ? `“${pendingDelete.name}” will be removed from this invite list. Their personal link will stop working.`
                        : undefined
                }
                confirmLabel="Remove guest"
                tone="danger"
                onConfirm={() => {
                    if (!pendingDelete) {
                        return;
                    }
                    router.delete(`/events/${eventId}/guests/${pendingDelete.id}`, {
                        preserveScroll: true,
                        onFinish: () => setPendingDelete(null),
                    });
                }}
            />

            <Dialog
                open={waQueue.length > 0}
                onOpenChange={(open) => {
                    if (!open) {
                        setWaQueue([]);
                        setWaIndex(0);
                        setWaBusy(false);
                        setShareCopied(null);
                    }
                }}
            >
                <DialogContent className="max-w-md rounded-3xl">
                    <DialogHeader>
                        <DialogTitle>WhatsApp queue</DialogTitle>
                        <DialogDescription>
                            Opens one chat at a time so your browser doesn’t block pop-ups. You can also copy
                            the number or message if the chat doesn’t open.
                        </DialogDescription>
                    </DialogHeader>
                    {waQueue[waIndex] ? (
                        <div className="space-y-3">
                            <div className="rounded-2xl bg-emerald-50/80 px-4 py-3.5 ring-1 ring-emerald-200/70">
                                <p className="text-[11px] font-semibold tracking-[0.14em] text-emerald-800/70 uppercase">
                                    {waIndex + 1} of {waQueue.length}
                                </p>
                                <p className="mt-1 font-serif text-xl text-zinc-950">
                                    {waQueue[waIndex].name}
                                </p>
                                <p className="mt-1 text-[12px] text-zinc-500">
                                    {guestPhoneLabel(waQueue[waIndex]) ||
                                        'No phone — opens WhatsApp with invite text only'}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-950/5">
                                <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                                    Message
                                </p>
                                <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-700">
                                    {guestShareText(waQueue[waIndex], eventTitle)}
                                </p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-full"
                                    onPointerDown={(event) => event.preventDefault()}
                                    onClick={() => void copyShareField('wa', 'number')}
                                >
                                    {shareCopied === 'number' ? (
                                        <Check className="mr-1 size-3.5 text-emerald-600" />
                                    ) : (
                                        <Copy className="mr-1 size-3.5" />
                                    )}
                                    {shareCopied === 'number' ? 'Copied' : 'Number'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-full"
                                    onPointerDown={(event) => event.preventDefault()}
                                    onClick={() => void copyShareField('wa', 'message')}
                                >
                                    {shareCopied === 'message' ? (
                                        <Check className="mr-1 size-3.5 text-emerald-600" />
                                    ) : (
                                        <Copy className="mr-1 size-3.5" />
                                    )}
                                    {shareCopied === 'message' ? 'Copied' : 'Message'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-full"
                                    onPointerDown={(event) => event.preventDefault()}
                                    onClick={() => void copyShareField('wa', 'link')}
                                >
                                    {shareCopied === 'link' ? (
                                        <Check className="mr-1 size-3.5 text-emerald-600" />
                                    ) : (
                                        <Copy className="mr-1 size-3.5" />
                                    )}
                                    {shareCopied === 'link' ? 'Copied' : 'Link'}
                                </Button>
                            </div>
                        </div>
                    ) : null}
                    <DialogFooter className="flex-col gap-2 sm:flex-col">
                        <Button
                            type="button"
                            disabled={waBusy}
                            className="w-full rounded-full bg-emerald-600 text-white hover:bg-emerald-500"
                            onClick={() => advanceWhatsAppQueue(true)}
                        >
                            {waIndex + 1 >= waQueue.length
                                ? waBusy
                                    ? 'Finishing…'
                                    : 'Mark shared & done'
                                : waBusy
                                  ? 'Saving…'
                                  : 'Mark shared & next'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={waBusy}
                            className="w-full rounded-full"
                            onClick={() => advanceWhatsAppQueue(false)}
                        >
                            {waIndex + 1 >= waQueue.length ? 'Skip & finish' : 'Skip guest'}
                        </Button>
                        <button
                            type="button"
                            disabled={waBusy || !waQueue[waIndex]}
                            className="text-[12px] font-semibold text-zinc-500 hover:text-zinc-800"
                            onClick={() => {
                                if (waQueue[waIndex]) {
                                    window.open(
                                        whatsappShareUrl(waQueue[waIndex], eventTitle),
                                        '_blank',
                                        'noopener,noreferrer',
                                    );
                                }
                            }}
                        >
                            Re-open WhatsApp for this guest
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={smsQueue.length > 0}
                onOpenChange={(open) => {
                    if (!open) {
                        setSmsQueue([]);
                        setSmsIndex(0);
                        setSmsBusy(false);
                        setShareCopied(null);
                    }
                }}
            >
                <DialogContent className="max-w-md rounded-3xl">
                    <DialogHeader>
                        <DialogTitle>SMS queue</DialogTitle>
                        <DialogDescription>
                            {nativeSms
                                ? 'Opens Messages one guest at a time. Send the text, then continue.'
                                : 'Desktop browsers can’t open SMS apps. Copy the number and message, paste into your phone or messaging app, then continue.'}
                        </DialogDescription>
                    </DialogHeader>
                    {smsQueue[smsIndex] ? (
                        <div className="space-y-3">
                            <div className="rounded-2xl bg-sky-50/80 px-4 py-3.5 ring-1 ring-sky-200/70">
                                <p className="text-[11px] font-semibold tracking-[0.14em] text-sky-800/70 uppercase">
                                    {smsIndex + 1} of {smsQueue.length}
                                </p>
                                <p className="mt-1 font-serif text-xl text-zinc-950">
                                    {smsQueue[smsIndex].name}
                                </p>
                                <p className="mt-1 text-[12px] text-zinc-500">
                                    {guestPhoneLabel(smsQueue[smsIndex])}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-950/5">
                                <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                                    Message
                                </p>
                                <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-700">
                                    {guestShareText(smsQueue[smsIndex], eventTitle)}
                                </p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-full"
                                    onPointerDown={(event) => event.preventDefault()}
                                    onClick={() => void copyShareField('sms', 'number')}
                                >
                                    {shareCopied === 'number' ? (
                                        <Check className="mr-1 size-3.5 text-emerald-600" />
                                    ) : (
                                        <Copy className="mr-1 size-3.5" />
                                    )}
                                    {shareCopied === 'number' ? 'Copied' : 'Number'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-full"
                                    onPointerDown={(event) => event.preventDefault()}
                                    onClick={() => void copyShareField('sms', 'message')}
                                >
                                    {shareCopied === 'message' ? (
                                        <Check className="mr-1 size-3.5 text-emerald-600" />
                                    ) : (
                                        <Copy className="mr-1 size-3.5" />
                                    )}
                                    {shareCopied === 'message' ? 'Copied' : 'Message'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-full"
                                    onPointerDown={(event) => event.preventDefault()}
                                    onClick={() => void copyShareField('sms', 'link')}
                                >
                                    {shareCopied === 'link' ? (
                                        <Check className="mr-1 size-3.5 text-emerald-600" />
                                    ) : (
                                        <Copy className="mr-1 size-3.5" />
                                    )}
                                    {shareCopied === 'link' ? 'Copied' : 'Link'}
                                </Button>
                            </div>
                        </div>
                    ) : null}
                    <DialogFooter className="flex-col gap-2 sm:flex-col">
                        <Button
                            type="button"
                            disabled={smsBusy}
                            className="w-full rounded-full bg-sky-600 text-white hover:bg-sky-500"
                            onClick={() => advanceSmsQueue(true)}
                        >
                            {smsIndex + 1 >= smsQueue.length
                                ? smsBusy
                                    ? 'Finishing…'
                                    : 'Mark shared & done'
                                : smsBusy
                                  ? 'Saving…'
                                  : 'Mark shared & next'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={smsBusy}
                            className="w-full rounded-full"
                            onClick={() => advanceSmsQueue(false)}
                        >
                            {smsIndex + 1 >= smsQueue.length ? 'Skip & finish' : 'Skip guest'}
                        </Button>
                        {nativeSms ? (
                            <button
                                type="button"
                                disabled={smsBusy || !smsQueue[smsIndex]}
                                className="text-[12px] font-semibold text-zinc-500 hover:text-zinc-800"
                                onClick={() => {
                                    if (smsQueue[smsIndex]) {
                                        openNativeSmsIfPossible(smsQueue[smsIndex], eventTitle);
                                    }
                                }}
                            >
                                Re-open Messages for this guest
                            </button>
                        ) : (
                            <p className="text-center text-[11px] leading-relaxed text-zinc-400">
                                Tip: on desktop, prefer bulk WhatsApp (opens WhatsApp Web) or Email.
                                SMS works best from your phone.
                            </p>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={bulkConfirm}
                onOpenChange={setBulkConfirm}
                title="Email selected invites?"
                description={
                    emailableSelected.length > 0
                        ? `Send personal invite emails to ${emailableSelected.length} guest${emailableSelected.length === 1 ? '' : 's'} with an email address. Guests without email are skipped.`
                        : 'None of the selected guests have an email address.'
                }
                confirmLabel="Send emails"
                onConfirm={() => markSent(emailableSelected.map((guest) => guest.id))}
            />

            <ConfirmDialog
                open={bulkTwilioConfirm != null}
                onOpenChange={(open) => {
                    if (!open) {
                        setBulkTwilioConfirm(null);
                    }
                }}
                title={
                    bulkTwilioConfirm === 'whatsapp'
                        ? 'Send WhatsApp via Twilio?'
                        : 'Send SMS via Twilio?'
                }
                description={
                    bulkTwilioConfirm === 'whatsapp'
                        ? `Queue automated WhatsApp invites for ${shareableSelected.length} selected guest${shareableSelected.length === 1 ? '' : 's'} with a mobile number. Messages send from your Twilio WhatsApp sender.`
                        : `Queue automated SMS invites for ${smsSelected.length} selected guest${smsSelected.length === 1 ? '' : 's'} with a mobile number. Messages send from your Twilio SMS number.`
                }
                confirmLabel={bulkTwilioConfirm === 'whatsapp' ? 'Send WhatsApp' : 'Send SMS'}
                onConfirm={() => {
                    if (bulkTwilioConfirm === 'whatsapp') {
                        queueTwilioChannel(
                            'whatsapp',
                            shareableSelected.map((guest) => guest.id),
                        );
                        return;
                    }
                    if (bulkTwilioConfirm === 'sms') {
                        queueTwilioChannel(
                            'sms',
                            smsSelected.map((guest) => guest.id),
                        );
                    }
                }}
            />

            <EditGuestDialog
                eventId={eventId}
                guest={editingGuest}
                groups={groupRows}
                open={editingGuest != null}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingGuest(null);
                    }
                }}
            />
        </section>
    );
}
