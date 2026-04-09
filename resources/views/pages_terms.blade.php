<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terms of Service - Blimpshare</title>
    
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

        h1 { font-weight: 900; letter-spacing: -1px; }
        h4 { font-weight: 800; margin-top: 2rem; color: var(--brand-primary); }
    </style>
</head>
<body>
    <div id="vanta-bg" style="position: fixed; z-index: -1; top: 0; left: 0; width: 100%; height: 100vh;"></div>

    <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div class="container">
            <a class="navbar-brand" href="/"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="-2 -2 28 30" class="me-2" style="transform: translateY(-2px)"><path d="M 6 8 L 1 3 Q 1 6 5 9 Z" fill="var(--brand-warm)" stroke="var(--brand-dark)" stroke-width="1.5" stroke-linejoin="round"/><path d="M 6 16 L 1 21 Q 1 18 5 15 Z" fill="var(--brand-warm)" stroke="var(--brand-dark)" stroke-width="1.5" stroke-linejoin="round"/><path d="M 4 11 L -1 9 V 15 L 4 13 Z" fill="var(--brand-accent)" stroke="var(--brand-dark)" stroke-width="1.5" stroke-linejoin="round"/><ellipse cx="13" cy="12" rx="10" ry="7" fill="var(--brand-accent)" stroke="var(--brand-dark)" stroke-width="1.5" /><path d="M 8 7 Q 13 4.5 17 6.5" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-linecap="round" /><path d="M 3 12 Q 13 15 22.8 12" fill="none" stroke="var(--brand-primary)" stroke-width="1.5" opacity="0.6"/><path d="M 11 18.5 V 20" stroke="var(--brand-dark)" stroke-width="1.5" stroke-linecap="round"/><path d="M 15 18.5 V 20" stroke="var(--brand-dark)" stroke-width="1.5" stroke-linecap="round"/><rect x="9" y="20" width="8" height="4.5" rx="1.5" fill="var(--brand-light)" stroke="var(--brand-dark)" stroke-width="1.5" /><circle cx="11.5" cy="22.25" r="1.2" fill="var(--brand-dark)" /><circle cx="14.5" cy="22.25" r="1.2" fill="var(--brand-dark)" /></svg>Blimpshare</a>
        </div>
    </nav>

    <main class="container hero-section">
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <div class="card p-5">
                    <h1 class="mb-4">Terms of Service</h1>
                    <p class="text-muted small">Effective date: {{ date('F j, Y') }}</p>

                    <h4>1. P2P Nature of Service</h4>
                    <p>Blimpshare is a peer-to-peer (P2P) file transfer tool. We provide the signaling infrastructure to connect devices, but the actual file transfer occurs directly between browsers. We do not store, intercept, or monitor the files you share.</p>

                    <h4>2. User Responsibility</h4>
                    <p>You are solely responsible for the content you share through Blimpshare. You agree not to use the service to share illegal, copyright-protected (without permission), or harmful content. We have no ability to "delete" or "take down" shared content as it is transferred directly between users.</p>

                    <h4>3. Data Security</h4>
                    <p>While we use secure WebRTC data channels for transfers, you should provide session passwords for sensitive data. You acknowledge that P2P transfers depend on your own network security and the security of the devices involved.</p>

                    <h4>4. No Warranty</h4>
                    <p>Blimpshare is provided "as is" without any warranties. We do not guarantee 100% uptime or that transfers will always be successful, as performance depends on peer availability and network configurations.</p>

                    <div class="text-center mt-5">
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
            <span class="text-muted small">By using Blimpshare, you agree to these terms. &copy; {{ date('Y') }}</span>
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
