<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blimpshare - P2P File Sharing</title>
    
    <meta name="reverb-key" content="{{ env('REVERB_APP_KEY') }}">
    <meta name="reverb-host" content="{{ env('REVERB_HOST') }}">
    <meta name="reverb-port" content="{{ env('REVERB_PORT') }}">
    <meta name="reverb-scheme" content="{{ env('REVERB_SCHEME') }}">

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

        /* Rebranding specific styling overrides */
        .bg-primary, .navbar-dark.bg-primary { background-color: var(--brand-primary) !important; }
        .text-primary, .text-success { color: var(--brand-primary) !important; }
        .bg-success { background-color: var(--brand-primary) !important; }
        .text-danger { color: var(--brand-warm) !important; }

        .btn-primary, .btn-success {
            background-color: var(--brand-primary);
            border-color: var(--brand-primary);
            color: white;
            font-weight: 600;
            border-radius: 8px;
            transition: all 0.2s ease-in-out;
        }
        .btn-primary:hover, .btn-success:hover {
            background-color: var(--brand-dark);
            border-color: var(--brand-dark);
            color: var(--brand-light);
            transform: translateY(-1px);
        }

        .badge.bg-secondary {
            background-color: var(--brand-accent) !important;
            color: var(--brand-dark) !important;
            font-weight: 800;
        }
        .badge.bg-primary {
            background-color: var(--brand-primary) !important;
            color: white !important;
        }

        .btn-outline-danger {
            color: var(--brand-warm);
            border-color: var(--brand-warm);
        }
        .btn-outline-danger:hover {
            background-color: var(--brand-warm);
            border-color: var(--brand-warm);
            color: white;
        }

        .navbar-brand {
            color: var(--brand-accent) !important;
            font-weight: 900;
            letter-spacing: -0.5px;
            font-size: 1.5rem;
        }

        .hero-section { flex: 1; display: flex; align-items: center; justify-content: center; }
        
        .card { 
            border: none;
            border-radius: 16px; 
            box-shadow: 0 12px 36px rgba(66, 2, 23, 0.08); 
        }

        #drop-zone { 
            border: 3px dashed var(--brand-primary); 
            border-radius: 16px; 
            padding: 50px; 
            text-align: center; 
            background: var(--brand-light); 
            cursor: pointer; 
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
            color: var(--brand-primary);
            font-weight: 600;
        }
        #drop-zone i { color: var(--brand-primary); }
        #drop-zone.dragover { 
            background: var(--brand-accent); 
            border-color: var(--brand-dark); 
            color: var(--brand-dark);
        }
        #drop-zone.dragover i { color: var(--brand-dark); }

        .file-list-item { 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            padding: 12px 16px; 
            border-bottom: 1px solid #f0f0f0; 
            transition: background 0.2s;
        }
        .file-list-item:hover { background-color: rgba(214, 245, 153, 0.15); }
        
        .progress { height: 8px; border-radius: 4px; margin-top: 6px; background-color: #f0f0f0; }
        .progress-bar.bg-info { background-color: var(--brand-accent) !important; color: var(--brand-dark); }

        .nav-tabs .nav-link { color: var(--brand-dark); font-weight: 500; }
        .nav-tabs .nav-link.active { color: var(--brand-primary); font-weight: 800; border-bottom: 3px solid var(--brand-primary); }

        .toast.bg-success { background-color: var(--brand-primary) !important; color: white; }
        .toast.bg-danger { background-color: var(--brand-warm) !important; color: white; }

        /* Dynamic icons mapping */
        .bi-cloud-arrow-up.text-primary, .bi-hdd-network.text-info { color: var(--brand-primary) !important; }
        
        .hidden { display: none !important; }
        .password-hidden { -webkit-text-security: disc; }
        .peer-status { font-size: 0.8rem; font-weight: 600; }
        .peer-online { color: var(--brand-primary); }
        .peer-offline { color: var(--brand-warm); }

        /* QR Features */
        .qr-fullscreen-modal .modal-content {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: none;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .qr-container {
            padding: 2.5rem;
            background: white;
            border-radius: 24px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            display: inline-block;
        }
        #reader {
            width: 100%;
            border-radius: 16px;
            overflow: hidden;
            border: none !important;
        }
        #reader video {
            border-radius: 16px;
        }
        .btn-qr-scan {
            background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-dark) 100%);
            color: white;
            border: none;
        }

        /* Cookie Banner */
        .cookie-banner {
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%) translateY(150%);
            width: calc(100% - 48px);
            max-width: 600px;
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            padding: 20px 24px;
            z-index: 9999;
            transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
        }
        .cookie-banner.show { transform: translateX(-50%) translateY(0); }
        .cookie-text { font-size: 0.9rem; color: var(--brand-dark); line-height: 1.4; margin: 0; }
        .cookie-btns { display: flex; gap: 10px; flex-shrink: 0; }
        
        @media (max-width: 768px) {
            .cookie-banner { flex-direction: column; align-items: flex-start; bottom: 12px; }
            .cookie-btns { width: 100%; justify-content: flex-end; }
        }
    </style>
</head>
<body>
    <div id="vanta-bg" style="position: fixed; z-index: -1; top: 0; left: 0; width: 100%; height: 100vh;"></div>

    <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div class="container">
            <a class="navbar-brand" href="/"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="-2 -2 28 30" class="me-2" style="transform: translateY(-2px)"><path d="M 6 8 L 1 3 Q 1 6 5 9 Z" fill="var(--brand-warm)" stroke="var(--brand-dark)" stroke-width="1.5" stroke-linejoin="round"/><path d="M 6 16 L 1 21 Q 1 18 5 15 Z" fill="var(--brand-warm)" stroke="var(--brand-dark)" stroke-width="1.5" stroke-linejoin="round"/><path d="M 4 11 L -1 9 V 15 L 4 13 Z" fill="var(--brand-accent)" stroke="var(--brand-dark)" stroke-width="1.5" stroke-linejoin="round"/><ellipse cx="13" cy="12" rx="10" ry="7" fill="var(--brand-accent)" stroke="var(--brand-dark)" stroke-width="1.5" /><path d="M 8 7 Q 13 4.5 17 6.5" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-linecap="round" /><path d="M 3 12 Q 13 15 22.8 12" fill="none" stroke="var(--brand-primary)" stroke-width="1.5" opacity="0.6"/><path d="M 11 18.5 V 20" stroke="var(--brand-dark)" stroke-width="1.5" stroke-linecap="round"/><path d="M 15 18.5 V 20" stroke="var(--brand-dark)" stroke-width="1.5" stroke-linecap="round"/><rect x="9" y="20" width="8" height="4.5" rx="1.5" fill="var(--brand-light)" stroke="var(--brand-dark)" stroke-width="1.5" /><circle cx="11.5" cy="22.25" r="1.2" fill="var(--brand-dark)" /><circle cx="14.5" cy="22.25" r="1.2" fill="var(--brand-dark)" /></svg>Blimpshare</a>
            <div id="session-info-nav" class="navbar-text text-light ms-auto hidden">
                Session: <span id="nav-session-slug" class="fw-bold"></span>
            </div>
        </div>
    </nav>

    <main class="container py-5 hero-section">
        
        <!-- Landing View -->
        <div id="view-landing" class="row w-100 justify-content-center">
            <div class="col-md-6 col-lg-5">
                
                <!-- Initial Choice -->
                <div id="landing-initial" class="card p-4">
                    <h3 class="text-center mb-4">Transfer Files P2P</h3>
                    <p class="text-muted text-center mb-4">Secure, fast, with no files stored on our servers.</p>
                    
                    <div class="d-grid gap-3">
                        <button type="button" id="btn-choice-create" class="btn btn-primary btn-lg py-3">
                            <i class="bi bi-plus-circle me-2"></i> Create a Session
                        </button>
                        <button type="button" id="btn-choice-join" class="btn btn-outline-primary btn-lg py-3">
                            <i class="bi bi-box-arrow-in-right me-2"></i> Join a Session
                        </button>
                        <button type="button" id="btn-choice-scan" class="btn btn-qr-scan btn-lg py-3">
                            <i class="bi bi-qr-code-scan me-2"></i> Scan QR Code
                        </button>
                    </div>
                </div>

                <!-- Create Session Card -->
                <div id="landing-create" class="card p-4 hidden">
                    <h3 class="text-center mb-4">Create Session</h3>
                    <div class="mb-3">
                        <label class="form-label small fw-bold">Your Name <span class="text-danger">*</span></label>
                        <input type="text" id="input-create-name" class="form-control" placeholder="Enter your name">
                        <div class="invalid-feedback">Please enter your name.</div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small fw-bold">Session Password (Optional)</label>
                        <div class="input-group">
                            <input type="password" id="input-create-password" class="form-control" placeholder="Min 6 characters">
                            <button class="btn btn-outline-secondary toggle-password" type="button">
                                <i class="bi bi-eye"></i>
                            </button>
                        </div>
                    </div>
                    <div class="mb-4 form-check">
                        <input type="checkbox" class="form-check-input border border-primary" id="check-create-terms">
                        <label class="form-check-label small text-muted" for="check-create-terms">
                            I agree to the <a href="/terms" target="_blank">Terms & Services</a>
                        </label>
                        <div id="create-terms-error" class="text-danger small hidden mt-1">You must agree to the terms.</div>
                    </div>
                    <div class="d-grid gap-2">
                        <button type="button" id="btn-create-session" class="btn btn-success btn-lg">Generate Session</button>
                        <button type="button" class="btn btn-link btn-back">Back</button>
                    </div>
                </div>

                <!-- Join Session Card -->
                <div id="landing-join" class="card p-4 hidden">
                    <h3 class="text-center mb-4">Join Session</h3>
                    <div class="mb-3">
                        <label class="form-label small fw-bold">Session ID <span class="text-danger">*</span></label>
                        <input type="text" id="input-join-slug" class="form-control" placeholder="Enter Session ID">
                        <div class="invalid-feedback">A Session ID is required.</div>
                        <div id="join-error" class="alert alert-danger p-2 mt-2 small hidden" style="font-size: 0.8rem;"></div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small fw-bold">Your Name <span class="text-danger">*</span></label>
                        <input type="text" id="input-join-name" class="form-control" placeholder="Enter your name">
                        <div class="invalid-feedback">Please enter your name.</div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small fw-bold">Session Password (If required)</label>
                        <div class="input-group">
                            <input type="password" id="input-join-password" class="form-control" placeholder="Enter password">
                            <button class="btn btn-outline-secondary toggle-password" type="button">
                                <i class="bi bi-eye"></i>
                            </button>
                        </div>
                        <div id="password-error" class="text-danger mt-2 small hidden">Incorrect password. Please try again.</div>
                    </div>
                    <div class="mb-4 form-check">
                        <input type="checkbox" class="form-check-input border border-primary" id="check-join-terms">
                        <label class="form-check-label small text-muted" for="check-join-terms">
                            I agree to the <a href="/terms" target="_blank">Terms & Services</a>
                        </label>
                        <div id="join-terms-error" class="text-danger small hidden mt-1">You must agree to the terms.</div>
                    </div>
                    <div class="d-grid gap-2">
                        <button type="button" id="btn-join-session" class="btn btn-primary btn-lg">Join Session</button>
                        <button type="button" class="btn btn-link btn-back">Back</button>
                    </div>
                </div>

            </div>
        </div>

        <!-- Session View -->
        <div id="view-session" class="row w-100 hidden">
            <div class="col-lg-4 mb-4">
                <div class="card h-100">
                    <div class="card-header bg-white fw-bold">Session Details</div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="small text-muted">Shareable Link</label>
                            <div class="input-group">
                                <input type="text" id="share-link" class="form-control form-control-sm" readonly>
                                <button class="btn btn-sm btn-outline-secondary" onclick="copyLink()" title="Copy Link"><i class="bi bi-copy"></i></button>
                                <button class="btn btn-sm btn-qr-scan" id="btn-show-qr" title="Show QR Code"><i class="bi bi-qr-code"></i></button>
                            </div>
                            <div id="session-password-display" class="small text-muted mt-1 hidden">
                                Password: <span id="session-password-text" class="fw-bold text-dark password-hidden"></span>
                                <button class="btn btn-link btn-sm p-0 ms-1 text-decoration-none" id="toggle-session-password" type="button">
                                    <i class="bi bi-eye"></i>
                                </button>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="small text-muted">Connected Peers</label>
                            <div id="peer-list" class="list-group list-group-flush">
                                <div class="list-group-item px-0 py-1 text-muted italic small">Waiting for others to join...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-lg-8">
                <div class="card mb-4">
                    <div class="card-body">
                        <div id="drop-zone">
                            <i class="bi bi-cloud-arrow-up display-4 text-primary"></i>
                            <h5>Drag & Drop Files</h5>
                            <p class="text-muted">or click to browse</p>
                            <input type="file" id="file-input" class="hidden" multiple>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header bg-white d-flex flex-md-row justify-content-between align-items-start align-items-md-end pb-0 border-bottom-0 gap-2">
                        <ul class="nav nav-tabs border-bottom-0 flex-nowrap" id="fileTabs" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active fw-bold" id="others-tab" data-bs-toggle="tab" data-bs-target="#others-pane" type="button" role="tab" aria-controls="others-pane" aria-selected="true">
                                    Peers <span id="count-others" class="small fw-normal">(0)</span>
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link fw-bold" id="mine-tab" data-bs-toggle="tab" data-bs-target="#mine-pane" type="button" role="tab" aria-controls="mine-pane" aria-selected="false">
                                    My Files <span id="count-mine" class="small fw-normal">(0)</span>
                                </button>
                            </li>
                        </ul>
                        

                        <div class="dropdown mb-2" id="filter-dropdown-container">
                            <button class="btn btn-sm btn-outline-secondary position-relative" type="button" id="filterDropdown" data-bs-toggle="dropdown" aria-expanded="false" data-bs-auto-close="outside" title="Filter Files">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-funnel" viewBox="0 0 16 16">
                                    <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5zm1 .5v1.308l4.372 4.858A.5.5 0 0 1 7 8.5v5.306l2-.666V8.5a.5.5 0 0 1 .128-.334L13.5 3.308V2z"/>
                                </svg>
                                <span id="filter-indicator" class="position-absolute top-0 start-100 translate-middle p-1 bg-primary border border-light rounded-circle hidden">
                                    <span class="visually-hidden">Filter active</span>
                                </span>
                            </button>
                            <div class="dropdown-menu dropdown-menu-end p-3 shadow-lg border-0" aria-labelledby="filterDropdown" style="min-width: 220px; backdrop-filter: blur(10px); background: rgba(255, 255, 255, 0.95);">
                                <h6 class="dropdown-header px-0 mb-2 text-dark fw-bold">Filter Files</h6>
                                
                                <div class="mb-3">
                                    <label class="form-label small text-muted mb-1">By User</label>
                                    <select id="file-filter" class="form-select form-select-sm">
                                        <option value="all">All Users</option>
                                    </select>
                                </div>
                                
                                <div class="mb-2">
                                    <label class="form-label small text-muted mb-1">By Type</label>
                                    <select id="file-type-filter" class="form-select form-select-sm">
                                        <option value="all">All Types</option>
                                        <option value="photo">Photos</option>
                                        <option value="video">Videos</option>
                                        <option value="music">Music</option>
                                        <option value="document">Documents</option>
                                        <option value="other">Others</option>
                                    </select>
                                </div>

                                <div class="text-end border-top pt-2">
                                    <button class="btn btn-link btn-sm text-decoration-none p-0" id="btn-reset-filters">Reset All</button>
                                </div>
                            </div>
                        </div>
                    </div>



                    <div class="card-body p-0 border-top">
                        <div class="tab-content" id="fileTabsContent">
                            <div class="tab-pane fade show active" id="others-pane" role="tabpanel" aria-labelledby="others-tab" tabindex="0">
                                <div id="file-list-others" class="list-group list-group-flush">
                                    <!-- Other users' files -->
                                </div>
                            </div>
                            <div class="tab-pane fade" id="mine-pane" role="tabpanel" aria-labelledby="mine-tab" tabindex="0">
                                <div id="file-list-mine" class="list-group list-group-flush">
                                    <!-- My files -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </main>

    <!-- Password Modal -->
    <div class="modal fade" id="passwordModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Password Required</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <input type="password" id="modal-password" class="form-control" placeholder="Enter session password">
                        <button class="btn btn-outline-secondary toggle-password" type="button">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
                    <div id="password-error" class="text-danger mt-2 small hidden">Incorrect password. Please try again.</div>
                </div>
                <div class="modal-footer">
                    <button type="button" id="btn-submit-password" class="btn btn-primary">Join Session</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Download Manager Modal -->
    <div class="modal fade" id="downloadModal" tabindex="-1">
        <div class="modal-dialog modal-sm">
            <div class="modal-content">
                <div class="modal-header bg-light">
                    <h6 class="modal-title fw-bold text-dark">File Actions</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center py-4">
                    <p class="mb-0 text-muted">Manage <strong><span id="download-modal-filename"></span></strong></p>
                </div>
                <div class="modal-footer d-flex justify-content-between bg-light border-top-0">
                    <button type="button" class="btn btn-outline-danger btn-sm" id="btn-download-modal-delete">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                    <div>
                        <a href="#" class="btn btn-primary btn-sm" id="btn-download-modal-download">Download Again</a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Container -->
    <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1055;">
        <div id="actionToast" class="toast align-items-center text-white bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body" id="actionToastBody">
                    Message
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    </div>

    </div>

    <!-- QR Display Modal (Full Screen Feel) -->
    <div class="modal fade qr-fullscreen-modal" id="qrModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header border-0 pb-0">
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center pb-5">
                    <h4 class="mb-4 fw-bold">Session QR Code</h4>
                    <div class="qr-container mb-4">
                        <div id="qrcode-display"></div>
                    </div>
                    <p class="text-muted small">To join this session from another device, scan the QR code.</p>
                </div>
            </div>
        </div>
    </div>

    <!-- QR Scanner Modal -->
    <div class="modal fade" id="scanModal" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><i class="bi bi-qr-code-scan me-2"></i>Scan Session QR Code</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" id="btn-close-scan"></button>
                </div>
                <div class="modal-body">
                    <div id="reader"></div>
                    <div id="scan-result" class="mt-3 hidden">
                        <div class="alert alert-success">
                            QR Code Detected! Redirecting...
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <p class="text-muted small w-100 text-center mb-0">Point your camera at the Blimpshare QR code.</p>
                </div>
            </div>
        </div>
    </div>

    </div>

    <!-- Cookie Disclaimer -->
    <div id="cookie-banner" class="cookie-banner">
        <p class="cookie-text">
            <strong>Cookies & Privacy:</strong> We use essential cookies to keep your session secure and anonymized analytics to improve Blimpshare. By continuing, you agree to our use of cookies.
        </p>
        <div class="cookie-btns">
            <button id="btn-cookie-essential" class="btn btn-sm btn-outline-secondary">Essential Only</button>
            <button id="btn-cookie-accept" class="btn btn-sm btn-primary px-4">Accept All</button>
        </div>
    </div>

    <footer class="footer mt-auto py-3 bg-white border-top">
        <div class="container text-center">
            <div class="mb-2">
                <a href="/about" class="text-muted small text-decoration-none mx-2">About</a>
                <a href="/terms" class="text-muted small text-decoration-none mx-2">Terms & Services</a>
            </div>
            <span class="text-muted small">Built for Privacy - It's Peer to Peer. &copy; {{ date('Y') }}</span>
        </div>
    </footer>

    <script>
        window.rtcConfig = {
            turnUrl: "{{ config('services.turn.url') }}",
            turnUsername: "{{ config('services.turn.username') }}",
            turnCredential: "{{ config('services.turn.credential') }}"
        };
    </script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/pusher-js@8.3.0/dist/web/pusher.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/laravel-echo@1.16.1/dist/echo.iife.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <script src="https://unpkg.com/html5-qrcode"></script>
    <script src="/js/app.js?v={{ time() }}"></script>
    
    <!-- Vanta.js Background -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.clouds2.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof VANTA !== 'undefined') {
                window.vantaEffect = VANTA.CLOUDS2({
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

            // Cookie Banner Logic
            const cookieBanner = document.getElementById('cookie-banner');
            const acceptBtn = document.getElementById('btn-cookie-accept');
            const essentialBtn = document.getElementById('btn-cookie-essential');

            if (!localStorage.getItem('cookie-consent')) {
                setTimeout(() => {
                    cookieBanner.classList.add('show');
                }, 1000);
            }

            const hideBanner = () => {
                cookieBanner.classList.remove('show');
                localStorage.setItem('cookie-consent', 'true');
            };

            acceptBtn.onclick = hideBanner;
            essentialBtn.onclick = hideBanner;
        });
    </script>
</body>
</html>
