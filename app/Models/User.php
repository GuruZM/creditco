<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Billing\Models\PaymentMethod;
use App\Billing\Models\Subscription;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    use HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function subscription()
    {
        // If you only allow ONE subscription per user, keep this.
        // If you later want multiple, we’ll convert this into hasMany.
        return $this->hasOne(Subscription::class, 'user_id')->latestOfMany();
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class, 'user_id');
    }

    public function paymentMethods()
    {
        return $this->hasMany(PaymentMethod::class, 'user_id');
    }

    public function defaultPaymentMethod()
    {
        return $this->hasOne(PaymentMethod::class, 'user_id')->where('is_default', true);
    }

    /**
     * Subscription access helper
     */
    public function isSubscribed()
    {
        $sub = $this->subscription;

        return $sub ? $sub->isActive() : false;
    }

    public function plan()
    {
        return $this->subscription?->plan;
    }

    /**
     * Same as isSubscribed but returns the subscription instance.
     */
    public function activeSubscription(): ?Subscription
    {
        $sub = $this->subscription;

        return ($sub && $sub->isActive()) ? $sub : null;
    }
}
