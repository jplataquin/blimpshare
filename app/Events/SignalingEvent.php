<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class SignalingEvent implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(
        public string $slug,
        public array $message
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('signaling.' . $this->slug),
        ];
    }

    public function broadcastAs(): string
    {
        return 'signal';
    }
}
