<?php

namespace App\Services;

use App\Enums\RsvpStatus;
use App\Models\Wedding;
use Illuminate\Support\Facades\DB;

class SeatingAutoAssignService
{
    /**
     * Greedy first-fit decreasing: largest parties first into tables with room.
     * Keeps already-seated guests unless $reset is true.
     *
     * @return array{assigned: int, skipped: int, remaining: int}
     */
    public function assign(Wedding $wedding, bool $reset = false): array
    {
        return DB::transaction(function () use ($wedding, $reset): array {
            $tables = $wedding->tables()->orderBy('sort_order')->orderBy('id')->get();
            if ($tables->isEmpty()) {
                return ['assigned' => 0, 'skipped' => 0, 'remaining' => 0];
            }

            $guests = $wedding->guests()
                ->whereIn('rsvp_status', [RsvpStatus::Attending, RsvpStatus::Pending])
                ->orderByDesc('number_of_guests')
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->get();

            if ($reset) {
                $wedding->guests()->whereNotNull('table_id')->update(['table_id' => null]);
                $guests->each(fn ($guest) => $guest->table_id = null);
            }

            $used = [];
            foreach ($tables as $table) {
                $used[$table->id] = 0;
            }

            foreach ($guests as $guest) {
                if ($guest->table_id && isset($used[$guest->table_id])) {
                    $used[$guest->table_id] += max(1, (int) $guest->number_of_guests);
                }
            }

            // Prefer keeping parties from the same guest group together when possible.
            $byGroup = $guests
                ->filter(fn ($guest) => $guest->table_id === null)
                ->groupBy(fn ($guest) => $guest->guest_group_id ?: 'ungrouped-'.$guest->id);

            $assigned = 0;
            $skipped = 0;

            foreach ($byGroup as $party) {
                $partySize = $party->sum(fn ($guest) => max(1, (int) $guest->number_of_guests));
                $tableId = $this->findTable($tables, $used, $partySize);
                if ($tableId === null && $party->count() > 1) {
                    // Fall back to seating each guest individually if the whole group won't fit.
                    foreach ($party as $guest) {
                        $size = max(1, (int) $guest->number_of_guests);
                        $soloTable = $this->findTable($tables, $used, $size);
                        if ($soloTable === null) {
                            $skipped++;

                            continue;
                        }
                        $guest->forceFill(['table_id' => $soloTable])->save();
                        $used[$soloTable] += $size;
                        $assigned++;
                    }

                    continue;
                }

                if ($tableId === null) {
                    $skipped += $party->count();

                    continue;
                }

                foreach ($party as $guest) {
                    $size = max(1, (int) $guest->number_of_guests);
                    $guest->forceFill(['table_id' => $tableId])->save();
                    $used[$tableId] += $size;
                    $assigned++;
                }
            }

            $remaining = $wedding->guests()
                ->whereIn('rsvp_status', [RsvpStatus::Attending, RsvpStatus::Pending])
                ->whereNull('table_id')
                ->count();

            return [
                'assigned' => $assigned,
                'skipped' => $skipped,
                'remaining' => $remaining,
            ];
        });
    }

    /**
     * @param  \Illuminate\Support\Collection<int, \App\Models\EventTable>  $tables
     * @param  array<int, int>  $used
     */
    private function findTable($tables, array $used, int $partySize): ?int
    {
        $bestId = null;
        $bestSlack = PHP_INT_MAX;

        foreach ($tables as $table) {
            $capacity = max(1, (int) $table->capacity);
            $occupied = $used[$table->id] ?? 0;
            $slack = $capacity - $occupied - $partySize;
            if ($slack < 0) {
                continue;
            }
            // Tightest fit first so large tables stay available for bigger parties.
            if ($slack < $bestSlack) {
                $bestSlack = $slack;
                $bestId = (int) $table->id;
            }
        }

        return $bestId;
    }
}
