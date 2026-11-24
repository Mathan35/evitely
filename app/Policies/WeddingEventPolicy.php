<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WeddingEvent;

class WeddingEventPolicy
{
    public function update(User $user, WeddingEvent $event): bool
    {
        return $user->id === $event->wedding()->value('user_id');
    }

    public function delete(User $user, WeddingEvent $event): bool
    {
        return $this->update($user, $event);
    }
}
