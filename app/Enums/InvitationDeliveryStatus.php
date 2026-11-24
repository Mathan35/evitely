<?php

namespace App\Enums;

enum InvitationDeliveryStatus: string
{
    case Pending = 'pending';
    case Sent = 'sent';
    case Viewed = 'viewed';
    case Responded = 'responded';
}
