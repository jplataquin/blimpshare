<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About Blimpshare - P2P File Sharing</title>
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --brand-primary: rgb(67, 100, 54);
            --brand-light: rgb(214, 245, 153);
            --brand-accent: rgb(210, 255, 40);
            --brand-warm: rgb(200, 76, 9);
            --brand-dark: rgb(66, 2, 23);
        }
        
        body { 
            background-color: #fafbfc; 
            color: var(--brand-dark);
            font-family: 'Inter', system-ui, sans-serif;
            min-height: 100vh; 
            display: flex; 
            flex-direction: column; 
        }

        .navbar-brand {
            color: var(--brand-accent) !important;
            font-weight: 900;
            letter-spacing: -0.5px;
            font-size: 1.5rem;
        }

        .hero-section { flex: 1; padding: 100px 0; }
        
        .card { 
            border: none;
            border-radius: 24px; 
            box-shadow: 0 12px 36px rgba(66, 2, 23, 0.08); 
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
        }

        .bg-primary { background-color: var(--brand-primary) !important; }
        .text-primary { color: var(--brand-primary) !important; }

        .feature-icon {
            width: 60px;
            height: 60px;
            background: var(--brand-light);
            color: var(--brand-primary);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            margin-bottom: 20px;
        }

        h1 { font-weight: 900; letter-spacing: -1px; }
        .lead { color: var(--brand-dark); opacity: 0.8; }
    </style>
</head>
<body>
    <div id="vanta-bg" style="position: fixed; z-index: -1; top: 0; left: 0; width: 100%; height: 100vh;"></div>

    <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div class="container">
            <a class="navbar-brand" href="/"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="-2 -2 28 30" class="me-2" style="transform: translateY(-2px)"><path d="M 6 8 L 1 3 Q 1 6 5 9 Z" fill="var(--brand-warm)" stroke="var(--brand-dark)" stroke-width="1.5" stroke-linejoin="round"/><path d="M 6 16 L 1 21 Q 1 18 5 15 Z" fill="var(--brand-warm)" stroke="var(--brand-dark)" stroke-width="1.5" stroke-linejoin="round"/><path d="M 4 11 L -1 9 V 15 L 4 13 Z" fill="var(--brand-accent)" stroke="var(--brand-dark)" stroke-width="1.5" stroke-linejoin="round"/><ellipse cx="13" cy="12" rx="10" ry="7" fill="var(--brand-accent)" stroke="var(--brand-dark)" stroke-width="1.5" /><path d="M 8 7 Q 13 4.5 17 6.5" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-linecap="round" /><path d="M 3 12 Q 13 15 22.8 12" fill="none" stroke="var(--brand-primary)" stroke-width="1.5" opacity="0.6"/><path d="M 11 18.5 V 20" stroke="var(--brand-dark)" stroke-width="1.5" stroke-linecap="round"/><path d="M 15 18.5 V 20" stroke="var(--brand-dark)" stroke-width="1.5" stroke-linecap.round"/><rect x="9" y="20" width="8" height="4.5" rx="1.5" fill="var(--brand-light)" stroke="var(--brand-dark)" stroke-width="1.5" /><circle cx="11.5" cy="22.25" r="1.2" fill="var(--brand-dark)" /><circle cx="14.5" cy="22.25" r="1.2" fill="var(--brand-dark)" /></svg>Blimpshare</a>
        </div>
    </nav>

    <main class="container hero-section">
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <div class="card p-5">
                    <h1 class="mb-4">Real-Time P2P File Sharing</h1>
                    <p class="lead mb-5">
                        Blimpshare is a breakthrough platform designed for fast, secure, and private data transfer. Our technology eliminates the need for central servers, ensuring your files move directly between devices.
                    </p>

                    <div class="row g-4 mb-5">
                        <div class="col-md-6">
                            <div class="feature-icon"><i class="bi bi-shield-lock-fill"></i></div>
                            <h4>True Privacy</h4>
                            <p class="text-muted">Files are never stored on any server. Data flows directly between peers through secure data channels.</p>
                        </div>
                        <div class="col-md-6">
                            <div class="feature-icon"><i class="bi bi-lightning-charge-fill"></i></div>
                            <h4>High Performance</h4>
                            <p class="text-muted">Direct browser-to-browser streaming ensures maximum transfer speed by leveraging your full network capacity.</p>
                        </div>
                        <div class="col-md-6">
                            <div class="feature-icon"><i class="bi bi-qr-code"></i></div>
                            <h4>Instant Connection</h4>
                            <p class="text-muted">Join sessions instantly using unique codes or by scanning QR codes with your device's camera.</p>
                        </div>
                        <div class="col-md-6">
                            <div class="feature-icon"><i class="bi bi-people-fill"></i></div>
                            <h4>Secure Sessions</h4>
                            <p class="text-muted">Protect your transfers with session passwords and manage connected peers in real-time.</p>
                        </div>
                    </div>

                    <div class="text-center">
                        <a href="/" class="btn btn-primary btn-lg px-5 py-3 rounded-pill">Back to Home</a>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <footer class="footer mt-auto py-3 bg-white border-top">
        <div class="container text-center">
            <div class="mb-2">
                <a href="/about" class="text-muted small text-decoration-none mx-2">About</a>
                <a href="/terms" class="text-muted small text-decoration-none mx-2">Terms & Services</a>
            </div>
            <span class="text-muted small">Built for Privacy - It's Peer to Peer. &copy; {{ date('Y') }} Blimpshare</span>
        </div>
    </footer>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.clouds2.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof VANTA !== 'undefined') {
                VANTA.CLOUDS2({
                    el: "#vanta-bg",
                    mouseControls: true,
                    touchControls: true,
                    gyroControls: false,
                    minHeight: 200.00,
                    minWidth: 200.00,
                    scale: 1.00,
                    skyColor: 0x5bca60,
                    cloudColor: 0x5a9825,
                    texturePath: "/images/noise.png"
                });
            }
        });
    </script>
</body>
</html>
