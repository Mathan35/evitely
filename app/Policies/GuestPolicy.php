<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WeddingGuest;

class GuestPolicy
{
    public function view(User $user, WeddingGuest $guest): bool
    {
        return $user->id === $guest->wedding()->value('user_id');
    }

    public function update(User $user, WeddingGuest $guest): bool
    {
        return $this->view($user, $guest);
    }

    public function delete(User $user, WeddingGuest $guest): bool
    {
        return $this->view($user, $guest);
    }
}
