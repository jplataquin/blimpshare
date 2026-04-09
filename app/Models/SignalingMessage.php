<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SignalingMessage extends Model
{
    protected $fillable = ['rtc_session_id', 'from_peer_id', 'to_peer_id', 'type', 'payload'];

    protected $casts = [
        'payload' => 'array',
    ];

    public function rtcSession()
    {
        return $this->belongsTo(RtcSession::class);
    }
}
