<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('signaling_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rtc_session_id')->constrained('rtc_sessions')->onDelete('cascade');
            $table->string('from_peer_id');
            $table->string('to_peer_id')->nullable();
            $table->string('type');
            $table->json('payload');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('signaling_messages');
    }
};
