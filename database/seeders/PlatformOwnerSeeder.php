<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PlatformOwnerSeeder extends Seeder
{
    public const OWNER_EMAIL = 'bmathank555@gmail.com';

    public function run(): void
    {
        $user = User::query()->firstOrNew(['email' => self::OWNER_EMAIL]);
        $user->name = $user->name ?: 'Platform Owner';
        if (! $user->exists || blank($user->password)) {
            $user->password = Hash::make('Admin@12345');
        }
        $user->email_verified_at = $user->email_verified_at ?? now();
        $user->disabled_at = null;
        $user->save();

        $this->command?->info('Platform owner ready: '.self::OWNER_EMAIL);
    }
}
