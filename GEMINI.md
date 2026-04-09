# Blimpshare: P2P File Sharing Application

Blimpshare is a high-performance **Peer-to-Peer (P2P)** file-sharing application designed for secure, direct, and private data transfers.

## 🚀 Core Concept
The application enables users to create temporary sharing sessions where files are streamed directly between devices using **WebRTC**. Unlike traditional cloud storage, **no files are ever stored on a server**, ensuring maximum privacy and speed.

## ✨ Key Features
- **Direct P2P Transfer**: Browser-to-browser streaming via WebRTC Data Channels.
- **Real-Time Signaling**: Instant peer discovery and connection handling using **Laravel Reverb (WebSockets)**.
- **Easy Joining**: Join sessions via a unique 8-character ID, shareable link, or **QR Code**.
- **Security & Privacy**: Optional session passwords and zero server-side storage.
- **Premium UI**: Modern aesthetics featuring glassmorphism, dynamic Vanta.js backgrounds, and custom icons.

## 🛠️ Technology Stack
- **Backend**: Laravel (PHP)
- **Frontend**: Vanilla JavaScript + Bootstrap 5
- **Real-time Engine**: Laravel Echo + Reverb
- **Peer Discovery**: STUN/TURN servers for NAT traversal
- **Temporary Storage**: IndexedDB for chunked file handling during transfers

---
*Created by Antigravity based on code analysis.*
