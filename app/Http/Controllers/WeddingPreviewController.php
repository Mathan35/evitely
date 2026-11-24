<?php

namespace App\Http\Controllers;

use App\Data\WeddingPageData;
use App\Models\Wedding;
use App\Support\WeddingGalleryPresentation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class WeddingPreviewController extends Controller
{
    public function show(Request $request, Wedding $wedding, WeddingPageData $pages): Response
    {
        Gate::authorize('view', $wedding);

        $template = WeddingGalleryPresentation::linkTemplate($wedding);
        $userCard = WeddingGalleryPresentation::selectedUserCard($wedding);

        $from = $request->query('from');
        $editorHref = match ($from) {
            'card' => route('weddings.card.edit', $wedding, absolute: false),
            'edit' => route('weddings.edit', $wedding, absolute: false),
            default => $wedding->invitation_mode === 'card'
                ? route('weddings.card.edit', $wedding, absolute: false)
                : route('weddings.edit', $wedding, absolute: false),
        };

        // Card-face preview when editing a card, or when the invitation is card-only.
        $previewKind = $from === 'card' || $wedding->invitation_mode === 'card' ? 'card' : 'site';

        return Inertia::render('weddings/preview', [
            'wedding' => $pages->public($wedding),
            'preview' => true,
            'gallerySlug' => $template['slug'],
            'galleryDesign' => $template['design'],
            'selectedUserCard' => $userCard,
            'editorHref' => $editorHref,
            'previewKind' => $previewKind,
        ]);
    }
}
