<?php

namespace App\Services;

use App\Models\Wedding;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class GuestCsvService
{
    public const MAX_IMPORT_ROWS = 500;

    /**
     * Columns accepted on import (Excel / Sheets friendly).
     *
     * @return list<string>
     */
    public function importHeaders(): array
    {
        return [
            'first_name',
            'last_name',
            'email',
            'phone',
            'country_code',
            'relationship',
            'number_of_guests',
            'notes',
            'group',
        ];
    }

    /**
     * @return list<list<string|int>>
     */
    public function sampleRows(): array
    {
        return [
            ['Priya', 'Sharma', 'priya@example.com', '9876543210', '+91', 'Bride side', 2, 'Vegetarian', 'Family'],
            ['Arun', 'Patel', 'arun@example.com', '9123456780', '+91', 'Groom side', 1, '', 'Friends'],
        ];
    }

    /**
     * @return list<string>
     */
    public function guestHeaders(): array
    {
        return [
            'first_name',
            'last_name',
            'email',
            'phone',
            'country_code',
            'relationship',
            'number_of_guests',
            'notes',
            'group',
            'invitation_status',
            'rsvp_status',
            'guest_url',
        ];
    }

    /**
     * @return list<string>
     */
    public function rsvpHeaders(): array
    {
        return [
            'guest_name',
            'email',
            'status',
            'guest_count',
            'meal_preference',
            'dietary_restrictions',
            'message',
            'created_at',
        ];
    }

    /**
     * @return list<string>
     */
    public function cateringHeaders(): array
    {
        return [
            'guest_name',
            'guest_count',
            'meal_preference',
            'dietary_restrictions',
            'email',
            'status',
        ];
    }

    /**
     * Attending / maybe RSVPs for caterers (optional export).
     *
     * @return \Generator<int, list<string|int|null>>
     */
    public function cateringRows(Wedding $wedding): \Generator
    {
        $rows = $wedding->rsvps()
            ->whereIn('status', ['attending', 'maybe'])
            ->orderBy('meal_preference')
            ->orderBy('guest_name')
            ->get();

        foreach ($rows as $rsvp) {
            yield [
                $rsvp->guest_name,
                (int) $rsvp->guest_count,
                $rsvp->meal_preference ?: 'no_preference',
                $rsvp->dietary_restrictions,
                $rsvp->email,
                $rsvp->status->value,
            ];
        }
    }

    /**
     * @return \Generator<int, list<string|int|null>>
     */
    public function guestRows(Wedding $wedding): \Generator
    {
        $wedding->loadMissing(['guests.group']);

        foreach ($wedding->guests as $guest) {
            yield [
                $guest->first_name,
                $guest->last_name,
                $guest->email,
                $guest->phone,
                $guest->country_code,
                $guest->relationship,
                (int) $guest->number_of_guests,
                $guest->notes,
                $guest->group?->name,
                $guest->invitation_status->value,
                $guest->rsvp_status->value,
                \App\Support\InviteHost::guestUrl($wedding->slug, (string) $guest->guest_token),
            ];
        }
    }

    /**
     * @return \Generator<int, list<string|int|null>>
     */
    public function rsvpRows(Wedding $wedding): \Generator
    {
        foreach ($wedding->rsvps()->latest()->get() as $rsvp) {
            yield [
                $rsvp->guest_name,
                $rsvp->email,
                $rsvp->status->value,
                (int) $rsvp->guest_count,
                $rsvp->meal_preference,
                $rsvp->dietary_restrictions,
                $rsvp->message,
                $rsvp->created_at?->toDateTimeString(),
            ];
        }
    }

    /**
     * @return array{created: int, skipped: int, errors: list<string>}
     */
    /**
     * @return array{created: int, skipped: int, errors: list<string>}
     */
    public function import(
        Wedding $wedding,
        UploadedFile $file,
        GuestInvitationService $guests,
        ?int $maxCreate = null,
    ): array {

        $handle = fopen($file->getRealPath(), 'rb');
        if ($handle === false) {
            return ['created' => 0, 'skipped' => 0, 'errors' => ['Could not read the spreadsheet file.']];
        }

        $header = fgetcsv($handle);
        if ($header === false) {
            fclose($handle);

            return ['created' => 0, 'skipped' => 0, 'errors' => ['File is empty. Download the sample and try again.']];
        }

        $header[0] = isset($header[0]) ? $this->stripBom((string) $header[0]) : '';
        $map = $this->headerMap($header);
        if (! isset($map['first_name'])) {
            fclose($handle);

            return [
                'created' => 0,
                'skipped' => 0,
                'errors' => ['Missing required column: first_name. Download the sample spreadsheet and keep the header row.'],
            ];
        }

        $existingEmails = $wedding->guests()
            ->whereNotNull('email')
            ->pluck('email')
            ->map(fn ($email) => Str::lower(trim((string) $email)))
            ->filter()
            ->flip()
            ->all();

        $seenInFile = [];
        $pending = [];
        $errors = [];
        $skipped = 0;
        $line = 1;
        $dataRows = 0;

        while (($row = fgetcsv($handle)) !== false) {
            $line++;
            if ($this->rowEmpty($row)) {
                continue;
            }

            $dataRows++;
            if ($dataRows > self::MAX_IMPORT_ROWS) {
                $errors[] = 'Import limit is '.self::MAX_IMPORT_ROWS.' guests per file. Split the list and try again.';
                break;
            }

            $payload = $this->rowPayload($row, $map);
            if ($this->isSamplePlaceholder($payload)) {
                $skipped++;
                $errors[] = "Line {$line}: left as sample placeholder — replace with a real guest or delete the row.";
                continue;
            }

            $validator = Validator::make($payload, [
                'first_name' => ['required', 'string', 'max:80'],
                'last_name' => ['nullable', 'string', 'max:80'],
                'email' => ['nullable', 'email:filter', 'max:160'],
                'phone' => ['nullable', 'string', 'max:30', 'regex:/^[0-9+()\-\s.]*$/'],
                'country_code' => ['nullable', 'string', 'max:8', 'regex:/^\+?[0-9]{0,7}$/'],
                'relationship' => ['nullable', 'string', 'max:80'],
                'number_of_guests' => ['nullable', 'integer', 'min:1', 'max:20'],
                'notes' => ['nullable', 'string', 'max:1000'],
                'group' => ['nullable', 'string', 'max:80'],
            ], [
                'first_name.required' => 'first name is required',
                'email.email' => 'email is invalid',
                'phone.regex' => 'phone may only include digits and + ( ) - . spaces',
                'country_code.regex' => 'country_code should look like +91',
                'number_of_guests.max' => 'party size must be between 1 and 20',
            ]);

            if ($validator->fails()) {
                $skipped++;
                $errors[] = "Line {$line}: ".$validator->errors()->first();
                continue;
            }

            $email = Str::lower(trim((string) ($payload['email'] ?? '')));
            if ($email !== '') {
                if (isset($seenInFile[$email])) {
                    $skipped++;
                    $errors[] = "Line {$line}: duplicate email in file ({$email}) — already on line {$seenInFile[$email]}.";
                    continue;
                }
                if (isset($existingEmails[$email])) {
                    $skipped++;
                    $errors[] = "Line {$line}: {$email} is already on this guest list.";
                    continue;
                }
                $seenInFile[$email] = $line;
            }

            $pending[] = [
                'line' => $line,
                'data' => [
                    'first_name' => Str::limit(trim((string) $payload['first_name']), 80, ''),
                    'last_name' => filled($payload['last_name'] ?? null)
                        ? Str::limit(trim((string) $payload['last_name']), 80, '')
                        : null,
                    'email' => $email !== '' ? Str::limit($email, 160, '') : null,
                    'phone' => filled($payload['phone'] ?? null)
                        ? Str::limit(preg_replace('/\s+/', ' ', trim((string) $payload['phone'])) ?? '', 30, '')
                        : null,
                    'country_code' => filled($payload['country_code'] ?? null)
                        ? Str::limit(trim((string) $payload['country_code']), 8, '')
                        : null,
                    'relationship' => filled($payload['relationship'] ?? null)
                        ? Str::limit(trim((string) $payload['relationship']), 80, '')
                        : null,
                    'number_of_guests' => max(1, min(20, (int) ($payload['number_of_guests'] ?? 1) ?: 1)),
                    'notes' => filled($payload['notes'] ?? null)
                        ? Str::limit(trim((string) $payload['notes']), 1000, '')
                        : null,
                    'group' => filled($payload['group'] ?? null)
                        ? Str::limit(trim((string) $payload['group']), 80, '')
                        : null,
                ],
            ];
        }

        fclose($handle);

        if ($pending === [] && $errors !== []) {
            return ['created' => 0, 'skipped' => $skipped, 'errors' => array_slice($errors, 0, 12)];
        }

        if ($pending === []) {
            return ['created' => 0, 'skipped' => $skipped, 'errors' => ['No valid guest rows found. Download the sample and fill at least one real guest.']];
        }

        if ($maxCreate !== null) {
            if ($maxCreate < 1) {
                return [
                    'created' => 0,
                    'skipped' => $skipped + count($pending),
                    'errors' => ['Guest limit reached for your plan. Upgrade in Settings → Billing, then import again.'],
                ];
            }

            if (count($pending) > $maxCreate) {
                $overflow = count($pending) - $maxCreate;
                $pending = array_slice($pending, 0, $maxCreate);
                $skipped += $overflow;
                $errors[] = "Plan guest limit: imported {$maxCreate}, skipped {$overflow} extra row(s). Upgrade for a higher limit.";
            }
        }

        $created = 0;
        $groups = $wedding->groups()->get()->keyBy(fn ($group) => Str::lower(trim((string) $group->name)));

        DB::beginTransaction();
        try {
            foreach ($pending as $item) {
                $data = $item['data'];
                $groupId = null;
                $groupName = $data['group'] ?? null;
                unset($data['group']);

                if (is_string($groupName) && $groupName !== '') {
                    $key = Str::lower($groupName);
                    $existing = $groups->get($key);
                    if ($existing) {
                        $groupId = $existing->id;
                    } else {
                        $createdGroup = $wedding->groups()->create(['name' => $groupName]);
                        $groups->put($key, $createdGroup);
                        $groupId = $createdGroup->id;
                    }
                }

                $guests->create($wedding, [
                    ...$data,
                    'guest_group_id' => $groupId,
                ]);
                $created++;
            }
            DB::commit();
        } catch (\Throwable $exception) {
            DB::rollBack();

            return ['created' => 0, 'skipped' => $skipped, 'errors' => ['Import failed: '.$exception->getMessage()]];
        }

        return [
            'created' => $created,
            'skipped' => $skipped,
            'errors' => array_slice($errors, 0, 12),
        ];
    }

    /**
     * @param  list<string|null>  $row
     * @param  array<string, int>  $map
     * @return array<string, mixed>
     */
    private function rowPayload(array $row, array $map): array
    {
        $get = function (string $field) use ($row, $map): ?string {
            if (! isset($map[$field])) {
                return null;
            }

            $value = trim((string) ($row[$map[$field]] ?? ''));

            return $value === '' ? null : $value;
        };

        $partyRaw = $get('number_of_guests');

        return [
            'first_name' => $get('first_name'),
            'last_name' => $get('last_name'),
            'email' => $get('email'),
            'phone' => $get('phone'),
            'country_code' => $get('country_code'),
            'relationship' => $get('relationship'),
            'number_of_guests' => $partyRaw === null ? 1 : $partyRaw,
            'notes' => $get('notes'),
            'group' => $get('group'),
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function isSamplePlaceholder(array $payload): bool
    {
        $email = Str::lower((string) ($payload['email'] ?? ''));
        $first = Str::lower((string) ($payload['first_name'] ?? ''));

        return in_array($email, ['priya@example.com', 'arun@example.com'], true)
            || in_array($first, ['priya', 'arun'], true) && str_contains($email, '@example.com');
    }

    /**
     * @param  list<string|null>  $header
     * @return array<string, int>
     */
    private function headerMap(array $header): array
    {
        $aliases = [
            'first_name' => ['first_name', 'firstname', 'first', 'given_name'],
            'last_name' => ['last_name', 'lastname', 'last', 'surname', 'family_name'],
            'email' => ['email', 'e_mail', 'mail'],
            'phone' => ['phone', 'mobile', 'tel', 'telephone'],
            'country_code' => ['country_code', 'dial_code', 'country'],
            'relationship' => ['relationship', 'relation'],
            'number_of_guests' => ['number_of_guests', 'party_size', 'guests', 'plus_ones'],
            'notes' => ['notes', 'note', 'comments'],
            'group' => ['group', 'table_group', 'guest_group'],
        ];

        $map = [];
        foreach ($header as $index => $label) {
            $key = Str::of($this->stripBom((string) $label))
                ->lower()
                ->replace([' ', '-', '.'], '_')
                ->toString();

            foreach ($aliases as $field => $names) {
                if (in_array($key, $names, true) && ! isset($map[$field])) {
                    $map[$field] = $index;
                }
            }
        }

        return $map;
    }

    private function stripBom(string $value): string
    {
        return preg_replace('/^\xEF\xBB\xBF/', '', $value) ?? $value;
    }

    /**
     * @param  list<string|null>  $row
     */
    private function rowEmpty(array $row): bool
    {
        foreach ($row as $cell) {
            if (trim((string) $cell) !== '') {
                return false;
            }
        }

        return true;
    }
}
