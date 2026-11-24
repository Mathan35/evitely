<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use App\Services\Growth\GrowthService;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
            'referral_code' => ['nullable', 'string', 'max:40'],
            'partner_code' => ['nullable', 'string', 'max:40'],
            'ref' => ['nullable', 'string', 'max:40'],
            'partner' => ['nullable', 'string', 'max:40'],
        ])->validate();

        $user = User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
        ]);

        $growth = app(GrowthService::class);
        $growth->ensureReferralCode($user);
        $growth->attachSignupCodes(
            $user,
            $input['referral_code'] ?? $input['ref'] ?? null,
            $input['partner_code'] ?? $input['partner'] ?? null,
        );

        return $user->fresh();
    }
}