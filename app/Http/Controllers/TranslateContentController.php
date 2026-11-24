<?php

namespace App\Http\Controllers;

use App\Models\Wedding;
use App\Services\ContentTranslator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class TranslateContentController extends Controller
{
    /**
     * Machine-translate primary invitation copy into the secondary language.
     * Returns JSON so the editor can fill Secondary copy without a full reload.
     */
    public function store(Request $request, Wedding $wedding, ContentTranslator $translator): JsonResponse
    {
        Gate::authorize('update', $wedding);

        $locales = array_keys(config('wedding.locales', []));

        $data = $request->validate([
            'from' => ['required', 'string', Rule::in($locales)],
            'to' => ['required', 'string', Rule::in($locales), 'different:from'],
            'fields' => ['required', 'array'],
            'fields.bride_display_name' => ['nullable', 'string', 'max:80'],
            'fields.groom_display_name' => ['nullable', 'string', 'max:80'],
            'fields.headline' => ['nullable', 'string', 'max:180'],
            'fields.hero_message' => ['nullable', 'string', 'max:2000'],
            'fields.story_eyebrow' => ['nullable', 'string', 'max:80'],
            'fields.story_heading' => ['nullable', 'string', 'max:180'],
            'fields.story' => ['nullable', 'string', 'max:8000'],
            'fields.host_message' => ['nullable', 'string', 'max:280'],
            'fields.gallery_eyebrow' => ['nullable', 'string', 'max:80'],
            'fields.gallery_title' => ['nullable', 'string', 'max:180'],
            'fields.gallery_intro' => ['nullable', 'string', 'max:500'],
            'fields.guests_intro' => ['nullable', 'string', 'max:500'],
            'fields.event_line' => ['nullable', 'string', 'max:180'],
        ]);

        $fields = array_map(
            static fn ($value): string => is_string($value) ? $value : '',
            $data['fields'],
        );

        $nonEmpty = array_filter($fields, static fn (string $value): bool => trim($value) !== '');
        if ($nonEmpty === []) {
            return response()->json([
                'ok' => false,
                'message' => 'Add some primary content first, then translate.',
                'fields' => $fields,
            ], 422);
        }

        $translated = $translator->translateFields($fields, $data['from'], $data['to']);

        return response()->json([
            'ok' => true,
            'message' => 'Translated. Review the secondary copy, then save.',
            'fields' => $translated,
        ]);
    }
}
