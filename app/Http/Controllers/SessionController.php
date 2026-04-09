<?php

namespace App\Http\Controllers;

use App\Models\RtcSession;
use App\Models\SignalingMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SessionController extends Controller
{
    public function create(Request $request)
    {
        $request->validate([
            'password' => 'nullable|string|min:6',
        ]);

        $slug = Str::random(8);
        while (RtcSession::where('slug', $slug)->exists()) {
            $slug = Str::random(8);
        }

        $session = RtcSession::create([
            'slug' => $slug,
            'password_hash' => $request->password ? Hash::make($request->password) : null,
            'expires_at' => now()->addHours(24),
        ]);

        return response()->json([
            'slug' => $session->slug,
            'has_password' => !is_null($session->password_hash),
        ]);
    }

    public function join(Request $request, $slug)
    {
        $session = RtcSession::where('slug', $slug)->first();

        if (!$session) {
            return response()->json(['error' => 'Session not found or has expired.'], 404);
        }

        // Auto-expire idle sessions after 1 minute of no heartbeat/messages
        if (now()->diffInMinutes($session->updated_at) >= 1) {
            $session->delete();
            return response()->json(['error' => 'Session not found or has expired.'], 404);
        }

        if ($session->password_hash) {
            if (!$request->password || !Hash::check($request->password, $session->password_hash)) {
                return response()->json(['error' => 'Invalid password'], 401);
            }
        }

        return response()->json([
            'slug' => $session->slug,
            'status' => 'success',
        ]);
    }

    public function sendMessage(Request $request, $slug)
    {
        $session = RtcSession::where('slug', $slug)->firstOrFail();
        $session->touch();

        $request->validate([
            'from_peer_id' => 'required|string',
            'to_peer_id' => 'nullable|string',
            'type' => 'required|string',
            'payload' => 'present|array',
        ]);

        $messageData = [
            'rtc_session_id' => $session->id,
            'from_peer_id' => $request->from_peer_id,
            'to_peer_id' => $request->to_peer_id,
            'type' => $request->type,
            'payload' => $request->payload,
        ];

        $signalingMessage = SignalingMessage::create($messageData);

        // Prune old messages periodically to keep the database clean
        if (rand(1, 10) === 1) {
            SignalingMessage::where('rtc_session_id', $session->id)
                ->where('created_at', '<', now()->subMinutes(2))
                ->delete();
        }

        try {
            broadcast(new \App\Events\SignalingEvent($slug, $signalingMessage->toArray()));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Broadcast failed (fallback to polling): ' . $e->getMessage());
        }

        return response()->json(['status' => 'sent']);
    }

    public function getMessages(Request $request, $slug)
    {
        $session = RtcSession::where('slug', $slug)->firstOrFail();
        $session->touch();
        $peerId = $request->query('peer_id');
        $lastId = $request->query('last_id', 0);

        // Only return messages from the last minute. This ensures that peers 
        // who haven't sent a heartbeat in 60 seconds are effectively removed 
        // from the session for any new joiners.
        $messages = SignalingMessage::where('rtc_session_id', $session->id)
            ->where('id', '>', $lastId)
            ->where('created_at', '>=', now()->subMinutes(1))
            ->where(function ($query) use ($peerId) {
                $query->where('to_peer_id', $peerId)
                      ->orWhereNull('to_peer_id');
            })
            ->where('from_peer_id', '!=', $peerId)
            ->orderBy('id', 'asc')
            ->get();

        return response()->json($messages);
    }
}
