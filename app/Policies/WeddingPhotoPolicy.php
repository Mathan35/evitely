<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WeddingPhoto;

class WeddingPhotoPolicy
{
    public function update(User $user, WeddingPhoto $photo): bool
    {
        return $user->id === $photo->wedding()->value('user_id');
    }

    public function delete(User $user, WeddingPhoto $photo): bool
    {
        return $this->update($user, $photo);
    }
}
