<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RtcSession extends Model
{
    protected $fillable = ['slug', 'password_hash', 'expires_at'];

    public function signalingMessages()
    {
        return $this->hasMany(SignalingMessage::class);
    }
}
