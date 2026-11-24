<?php

namespace App\Enums;

enum GuestbookStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Hidden = 'hidden';
}
