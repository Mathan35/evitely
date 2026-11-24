<?php

namespace App\Enums;

enum WeddingStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Archived = 'archived';
}
