// Core P2P Application Logic
const peerId = sessionStorage.getItem('peerId') || (() => {
    const id = 'peer-' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('peerId', id);
    return id;
})();
let currentSessionSlug = null;
let echo = null;
let rtcConnections = {}; // peerId -> RTCPeerConnection
let dataChannels = {}; // peerId -> RTCDataChannel
let peers = new Set();
let files = {}; // fileId -> file object for sending
let receivedFiles = {}; // fileId -> { name, size, type, chunks: [] }

// ICE Servers Configuration
const iceServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        ...(window.rtcConfig && window.rtcConfig.turnUrl ? (() => {
            const turnUrl = window.rtcConfig.turnUrl;
            const urls = [turnUrl];
            
            // Extract host to provide alternatives
            try {
                // Handle turn:host:port or turn:host
                const parts = turnUrl.split(':');
                if (parts.length >= 2) {
                    const host = parts[1].replace(/\/\//, '');
                    
                    // If it's a turn: URL, also add turns: on 5349 as a fallback for Firefox/Secure contexts
                    if (turnUrl.startsWith('turn:')) {
                        urls.push(`turns:${host}:5349`);
                        urls.push(`turns:${host}:443`);
                        // Also add TCP transport explicitly
                        urls.push(`${turnUrl}?transport=tcp`);
                    }
                }
            } catch (e) {
                console.warn('Failed to parse turnUrl for alternatives', e);
            }

            return [{
                urls: urls,
                username: window.rtcConfig.turnUsername,
                credential: window.rtcConfig.turnCredential
            }];
        })() : [])
    ],
    iceCandidatePoolSize: 10
};

// --- IndexedDB Setup ---
const dbName = 'sharableDB';
const dbVersion = 1;
let db;

const request = indexedDB.open(dbName, dbVersion);
request.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains('fileChunks')) {
        db.createObjectStore('fileChunks', { keyPath: 'id', autoIncrement: true });
    }
};
request.onsuccess = (event) => { db = event.target.result; };

let myDisplayName = 'Anonymous';
let peerNames = {}; // peerId -> displayName
let peerActivity = {}; // peerId -> timestamp
let peerHostedCounts = {}; // peerId -> count

// --- UI Elements ---
const views = {
    landing: document.getElementById('view-landing'),
    session: document.getElementById('view-session'),
    navInfo: document.getElementById('session-info-nav'),
    landingInitial: document.getElementById('landing-initial'),
    landingCreate: document.getElementById('landing-create'),
    landingJoin: document.getElementById('landing-join')
};

const btns = {
    choiceCreate: document.getElementById('btn-choice-create'),
    choiceJoin: document.getElementById('btn-choice-join'),
    choiceScan: document.getElementById('btn-choice-scan'),
    create: document.getElementById('btn-create-session'),
    join: document.getElementById('btn-join-session'),
    back: document.querySelectorAll('.btn-back'),
    showQr: document.getElementById('btn-show-qr')
};

const inputs = {
    createName: document.getElementById('input-create-name'),
    createPassword: document.getElementById('input-create-password'),
    joinSlug: document.getElementById('input-join-slug'),
    joinName: document.getElementById('input-join-name'),
    joinPassword: document.getElementById('input-join-password')
};

// --- Navigation ---
function showView(viewName) {
    // Only toggle main views
    ['landing', 'session'].forEach(v => views[v].classList.add('hidden'));
    views[viewName].classList.remove('hidden');
    
    if (viewName === 'session') {
        views.navInfo.classList.remove('hidden');
        // Turn off Vanta animation when inside a session
        if (window.vantaEffect) {
            window.vantaEffect.destroy();
            window.vantaEffect = null;
        }
        const vantaBg = document.getElementById('vanta-bg');
        if (vantaBg) vantaBg.style.display = 'none';
    } else {
        views.navInfo.classList.add('hidden');
    }
}

function showLandingSubView(subViewName) {
    ['landingInitial', 'landingCreate', 'landingJoin'].forEach(v => {
        if (views[v]) views[v].classList.add('hidden');
    });
    if (views[subViewName]) views[subViewName].classList.remove('hidden');
}

// --- API Calls ---
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(`/api${endpoint}`, options);
    if (!response.ok) throw await response.json();
    
    return response.json();
}

// --- Session Logic ---
btns.choiceCreate.onclick = () => showLandingSubView('landingCreate');
btns.choiceJoin.onclick = () => showLandingSubView('landingJoin');
btns.back.forEach(btn => {
    btn.onclick = () => showLandingSubView('landingInitial');
});

btns.create.onclick = async () => {
    const nameInput = inputs.createName;
    const nameVal = nameInput.value.trim();
    if (!nameVal) {
        nameInput.classList.add('is-invalid');
        return;
    }
    nameInput.classList.remove('is-invalid');

    const termsCheck = document.getElementById('check-create-terms');
    const termsError = document.getElementById('create-terms-error');
    if (!termsCheck.checked) {
        termsError.classList.remove('hidden');
        return;
    }
    termsError.classList.add('hidden');
    
    const originalText = btns.create.innerHTML;
    btns.create.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating...`;
    btns.create.disabled = true;

    try {
        const password = inputs.createPassword.value;
        myDisplayName = nameVal;
        const data = await apiCall('/sessions', 'POST', { password });
        startSession(data.slug, password);
    } catch (e) { 
        alert('Error creating session'); 
    } finally {
        btns.create.innerHTML = originalText;
        btns.create.disabled = false;
    }
};

btns.join.onclick = () => {
    // Hide previous errors on new interaction
    const errDiv = document.getElementById('join-error');
    if (errDiv) errDiv.classList.add('hidden');
    const pwdErr = document.getElementById('password-error');
    if (pwdErr) pwdErr.classList.add('hidden');
    
    let hasError = false;
    
    const slugInput = inputs.joinSlug;
    if (!slugInput.value.trim()) {
        slugInput.classList.add('is-invalid');
        hasError = true;
    } else {
        slugInput.classList.remove('is-invalid');
    }

    const nameInput = inputs.joinName;
    const nameVal = nameInput.value.trim();
    if (!nameVal) {
        nameInput.classList.add('is-invalid');
        hasError = true;
    } else {
        nameInput.classList.remove('is-invalid');
    }

    const termsCheck = document.getElementById('check-join-terms');
    const termsError = document.getElementById('join-terms-error');
    if (!termsCheck.checked) {
        termsError.classList.remove('hidden');
        hasError = true;
    } else {
        termsError.classList.add('hidden');
    }

    if (hasError) return;

    myDisplayName = nameVal;
    attemptJoin(slugInput.value.trim(), inputs.joinPassword.value);
};

async function attemptJoin(slug, password = null) {
    console.log('Attempting to join session:', slug);
    if (!slug) {
        inputs.joinSlug.classList.add('is-invalid');
        return;
    }
    
    const originalText = btns.join.innerHTML;
    btns.join.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Joining...`;
    btns.join.disabled = true;

    try {
        const data = await apiCall(`/sessions/${slug}/join`, 'POST', { password });
        console.log('Join success:', data);
        startSession(slug, password);
    } catch (e) {
        console.error('Join error caught in app.js:', e);
        
        // Handle password error specifically
        if (e && e.error === 'Invalid password') {
            const pwdErr = document.getElementById('password-error');
            if (pwdErr) pwdErr.classList.remove('hidden');
        } else {
            // Handle all other errors (404, 500, network, etc.)
            const errDiv = document.getElementById('join-error');
            if (errDiv) {
                errDiv.innerText = (e && e.error) ? e.error : 'Session not found or has expired.';
                errDiv.classList.remove('hidden');
                console.log('Error div should now be visible:', errDiv.innerText);
            } else {
                alert('Session not found or has expired.');
            }
        }
    } finally {
        btns.join.innerHTML = originalText;
        btns.join.disabled = false;
        console.log('Join button restored.');
    }
}

function startSession(slug, password = null) {
    currentSessionSlug = slug;
    window.history.pushState({}, '', `/${slug}`);
    document.getElementById('nav-session-slug').innerText = slug;
    document.getElementById('share-link').value = window.location.href;
    
    if (password) {
        document.getElementById('session-password-text').innerText = password;
        document.getElementById('session-password-display').classList.remove('hidden');
    }

    showView('session');
    updatePeerList(); // Initialize list with "Me"
    startWebSocket(slug);
    
    // Initial broadcast
    sendSignalingMessage('presence', { peerId, name: myDisplayName, hostedCount: Object.keys(files).length });
    
    console.log('start session',currentSessionSlug);

    // Periodic heartbeat to ensure late-joiners see existing peers
    let isHeartbeatActive = true;

    async function sendHeartbeat() {
        if (!currentSessionSlug || !isHeartbeatActive) return;

        try {
            await sendSignalingMessage('presence', { peerId, name: myDisplayName, hostedCount: Object.keys(files).length });
        } catch (e) {
            console.error('Heartbeat failed', e);
        } finally {
            if (isHeartbeatActive) {
                setTimeout(sendHeartbeat, 5000);
            }
        }
    }

    // Start heartbeat
    sendHeartbeat();

    // Check for stale peers every 10 seconds
    let isStaleCheckActive = true;

    function checkStalePeers() {
        if (!currentSessionSlug || !isStaleCheckActive) return;

        const now = Date.now();
        let changed = false;

        Object.keys(peerNames).forEach(id => {
            const lastSeen = peerActivity[id] || 0;
            if (now - lastSeen > 60000) { // 60 seconds timeout
                console.log(`Peer ${id} timed out.`);
                
                // Disconnect WebRTC
                if (rtcConnections[id]) {
                    rtcConnections[id].close();
                    delete rtcConnections[id];
                }
                
                // Close Data Channel
                if (dataChannels[id]) {
                    dataChannels[id].close();
                    delete dataChannels[id];
                }
                
                // Remove from tracking
                delete peerNames[id];
                delete peerActivity[id];
                delete peerHostedCounts[id];
                changed = true;
            }
        });

        if (changed) {
            updatePeerList();
        }

        if (isStaleCheckActive) {
            setTimeout(checkStalePeers, 10000);
        }
    }

    // Start stale peer check
    checkStalePeers();

    // Polling fallback
    let lastMessageId = 0;
    let isPolling = true;

    async function pollMessages() {
        if (!currentSessionSlug || !isPolling) return;

        try {
            const messages = await apiCall(`/sessions/${currentSessionSlug}/messages?peer_id=${peerId}&last_id=${lastMessageId}`);
            for (const msg of messages) {
                lastMessageId = Math.max(lastMessageId, msg.id);
                await handleSignalingMessage(msg);
            }
        } catch (e) {
            console.error('Polling failed', e);
        } finally {
            if (isPolling) {
                setTimeout(pollMessages, 3000);
            }
        }
    }
    // Start polling
    pollMessages();
}

function startWebSocket(slug) {
    if (echo) echo.disconnect();
    
    const reverbKey = document.querySelector('meta[name="reverb-key"]').content;
    const reverbHost = document.querySelector('meta[name="reverb-host"]').content;
    const reverbPort = document.querySelector('meta[name="reverb-port"]').content;
    const reverbScheme = document.querySelector('meta[name="reverb-scheme"]').content;

    const wsHost = reverbHost === 'localhost' ? window.location.hostname : reverbHost;

    echo = new Echo({
        broadcaster: 'pusher',
        key: reverbKey,
        wsHost: wsHost,
        wsPort: reverbPort,
        wssPort: reverbPort,
        forceTLS: reverbScheme === 'https',
        enabledTransports: ['ws', 'wss'],
        cluster: 'mt1', // Required by pusher-js but ignored by Reverb
    });

    console.log('Listening on channel: signaling.' + slug);

    echo.channel(`signaling.${slug}`)
        .listen('.signal', (e) => {
            // Handle both {message: ...} and direct payload structures
            const msg = e.message || e.messageData || e;
            console.log('Received via WebSocket:', msg);
            
            if (msg && msg.from_peer_id && msg.from_peer_id !== peerId) {
                if (!msg.to_peer_id || msg.to_peer_id === peerId) {
                    handleSignalingMessage(msg);
                }
            }
        });
}

// --- WebRTC Signaling ---
let signalQueue = [];
let isSendingSignal = false;

async function sendSignalingMessage(type, payload, toPeerId = null) {
    signalQueue.push({ type, payload, toPeerId });
    processSignalQueue();
}

async function processSignalQueue() {
    if (isSendingSignal || signalQueue.length === 0) return;
    
    isSendingSignal = true;
    const { type, payload, toPeerId } = signalQueue.shift();

    try {
        const response = await apiCall(`/sessions/${currentSessionSlug}/messages`, 'POST', {
            from_peer_id: peerId,
            to_peer_id: toPeerId,
            type,
            payload
        });
        if (response.status !== 'sent') {
            console.warn('Signaling message might not have been delivered:', response);
        }
    } catch (e) { 
        console.error('Error sending signaling message', e); 
        alert(`Network Error: Failed to send ${type} signaling message. Check your connection or server logs.`);
    } finally {
        isSendingSignal = false;
        // Immediate call for the next item in queue
        processSignalQueue();
    }
}

let processedMessageIds = new Set();

async function handleSignalingMessage(msg) {
    if (msg.id && processedMessageIds.has(msg.id)) return;
    if (msg.id) processedMessageIds.add(msg.id);

    const fromPeerId = msg.from_peer_id;
    const payload = msg.payload;

    peerActivity[fromPeerId] = Date.now();

    if (msg.type !== 'presence' && msg.type !== 'presence-response') {
        console.log(`[SIGNAL] Recv ${msg.type} from ${fromPeerId}`);
    }

    switch (msg.type) {
        case 'presence':
            // console.log('Received presence from:', payload.name, fromPeerId);
            peerNames[fromPeerId] = payload.name || 'Anonymous';
            if (payload.hostedCount !== undefined) {
                peerHostedCounts[fromPeerId] = payload.hostedCount;
            }
            
            // Reply with our presence so they know we are here
            sendSignalingMessage('presence-response', { peerId, name: myDisplayName, hostedCount: Object.keys(files).length }, fromPeerId);

            // Deterministic initiation: the peer with the "smaller" ID initiates
            if (peerId < fromPeerId) {
                const pc = rtcConnections[fromPeerId];
                if (!pc || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                    console.log('We are initiator, starting connection to:', fromPeerId);
                    initiateConnection(fromPeerId);
                }
            }
            updatePeerList();
            break;

        case 'presence-response':
            // console.log('Received presence-response from:', payload.name, fromPeerId);
            peerNames[fromPeerId] = payload.name || 'Anonymous';
            if (payload.hostedCount !== undefined) {
                peerHostedCounts[fromPeerId] = payload.hostedCount;
            }
            
            // If we are the initiator, start the connection
            if (peerId < fromPeerId) {
                const pc = rtcConnections[fromPeerId];
                if (!pc || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                    console.log('We are initiator (from response), starting connection to:', fromPeerId);
                    initiateConnection(fromPeerId);
                }
            }
            updatePeerList();
            break;

        case 'leave':
            console.log('Peer left:', fromPeerId);
            if (rtcConnections[fromPeerId]) {
                rtcConnections[fromPeerId].close();
                delete rtcConnections[fromPeerId];
            }
            if (dataChannels[fromPeerId]) {
                dataChannels[fromPeerId].close();
                delete dataChannels[fromPeerId];
            }
            delete peerNames[fromPeerId];
            delete peerActivity[fromPeerId];
            delete peerHostedCounts[fromPeerId];
            updatePeerList();
            break;
            
        case 'offer':
            console.log('Received offer from:', fromPeerId, payload);
            try {
                await handleOffer(fromPeerId, payload);
            } catch (e) {
                console.error('Error handling offer', e);
                alert(`WebRTC Error: Failed to process offer from peer. Check console.`);
            }
            break;
            
        case 'answer':
            console.log('Received answer from:', fromPeerId, payload);
            try {
                await handleAnswer(fromPeerId, payload);
            } catch (e) {
                console.error('Error handling answer', e);
                alert(`WebRTC Error: Failed to process answer from peer. Check console.`);
            }
            break;
            
        case 'ice-candidate':
            try {
                await handleIceCandidate(fromPeerId, payload);
            } catch (e) {
                console.error('Error handling ice candidate', e);
            }
            break;

        case 'request-files':
            console.log(`Peer ${fromPeerId} requested my hosted files.`);
            resendFilesToPeer(fromPeerId);
            break;
    }
}

async function resendFilesToPeer(targetPeerId) {
    const dc = dataChannels[targetPeerId];
    if (!dc || dc.readyState !== 'open') {
        console.warn(`Cannot resend files: Data channel to ${targetPeerId} is not open.`);
        return;
    }

    // Send each hosted file to the requesting peer
    for (const fileId in files) {
        const file = files[fileId];
        // We call sendFile with targetPeerId to ensure it only goes to the requester
        // and doesn't re-add itself to our own hosted list
        sendFile(file, targetPeerId);
    }
}

// --- WebRTC Core ---
function createPeerConnection(remotePeerId) {
    console.log('Create WebRTC Connection to '+remotePeerId);

    // Clean up existing connection if reconnecting
    if (rtcConnections[remotePeerId]) {
        rtcConnections[remotePeerId].onconnectionstatechange = null;
        rtcConnections[remotePeerId].oniceconnectionstatechange = null;
        rtcConnections[remotePeerId].close();
    }
    if (dataChannels[remotePeerId]) {
        dataChannels[remotePeerId].onclose = null;
        dataChannels[remotePeerId].close();
    }

    const pc = new RTCPeerConnection(iceServers);
    console.log(pc);
    rtcConnections[remotePeerId] = pc;

    if (earlyCandidates[remotePeerId]) {
        pc.candidateQueue = earlyCandidates[remotePeerId];
        delete earlyCandidates[remotePeerId];
    } else {
        pc.candidateQueue = [];
    }

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            sendSignalingMessage('ice-candidate', {
                candidate: event.candidate.candidate,
                sdpMid: event.candidate.sdpMid,
                sdpMLineIndex: event.candidate.sdpMLineIndex
            }, remotePeerId);
        }
    };

    const handleDisconnect = () => {
        updatePeerList();
        console.log(`Connection state change: pc=${pc.connectionState}, ice=${pc.iceConnectionState}`);
        
        // ONLY tear down the connection if it has permanently FAILED. 
        // 'disconnected' can happen temporarily due to network shifts and WebRTC will try to recover.
        if (pc.connectionState === 'failed' || pc.iceConnectionState === 'failed') {
            console.warn(`WebRTC Connection to ${remotePeerId} failed.`);
            
            // Clean up the dead connection
            pc.onconnectionstatechange = null;
            pc.oniceconnectionstatechange = null;
            pc.close();
            
            // ONLY delete if it's still THIS connection
            if (rtcConnections[remotePeerId] === pc) {
                delete rtcConnections[remotePeerId];
                delete dataChannels[remotePeerId];
            }
            updatePeerList();

            // Automatic reconnect if we are the initiator
            if (peerId < remotePeerId) {
                console.log(`Attempting to reconnect to ${remotePeerId} in 2 seconds...`);
                setTimeout(() => {
                    // Check if they are still tracked as an active peer before reconnecting
                    if (peerNames[remotePeerId]) {
                        initiateConnection(remotePeerId);
                    }
                }, 2000);
            }
        }
    };

    pc.onconnectionstatechange = handleDisconnect;
    pc.oniceconnectionstatechange = handleDisconnect;
    
    // Add datachannel debug logging
    pc.onsignalingstatechange = () => console.log('Signaling state:', pc.signalingState);

    return pc;
}

async function initiateConnection(remotePeerId) {
    console.log('Initiate Connection to '+remotePeerId);
    const pc = createPeerConnection(remotePeerId);
    const dc = pc.createDataChannel('fileTransfer');
    setupDataChannel(dc, remotePeerId);

    try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignalingMessage('offer', { type: offer.type, sdp: offer.sdp }, remotePeerId);
    } catch (e) {
        console.error('Error creating or setting offer:', e);
        alert(`WebRTC Error: Failed to create offer. Check console.`);
    }
}

function sanitizeSDP(sdp) {
    if (!sdp) return sdp;
    // Split by any newline combination (\r\n or \n)
    const lines = sdp.split(/\r?\n/);
    
    // Filter out the incompatible max-message-size line
    const filteredLines = lines.filter(line => {
        const trimmed = line.trim().toLowerCase();
        return trimmed.length > 0 && !trimmed.startsWith('a=max-message-size');
    });
    
    // Re-join with the standard \r\n required by WebRTC specifications
    const sanitized = filteredLines.join('\r\n') + '\r\n';
    
    if (sdp.length !== sanitized.length) {
        console.log('SDP Sanitized: Incompatible a=max-message-size line removed.');
    }
    return sanitized;
}

async function handleOffer(remotePeerId, offer) {
    const pc = createPeerConnection(remotePeerId);
    pc.ondatachannel = (event) => setupDataChannel(event.channel, remotePeerId);

    if (pc.signalingState !== 'stable') {
        console.warn('Ignoring offer: PC is not in stable state', pc.signalingState);
        return;
    }

    // Sanitize SDP before setting
    offer.sdp = sanitizeSDP(offer.sdp);

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    // Process any queued candidates
    if (pc.candidateQueue) {
        for (const candidate of pc.candidateQueue) {
            try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } 
            catch (e) { console.error('Error adding queued ICE candidate', e); }
        }
        pc.candidateQueue = [];
    }
    
    sendSignalingMessage('answer', { type: answer.type, sdp: answer.sdp }, remotePeerId);
}

async function handleAnswer(remotePeerId, answer) {
    const pc = rtcConnections[remotePeerId];
    if (pc) {
        if (pc.signalingState !== 'have-local-offer') {
            console.warn('Ignoring answer: PC is not in have-local-offer state', pc.signalingState);
            return;
        }

        // Sanitize SDP before setting
        answer.sdp = sanitizeSDP(answer.sdp);
        
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        
        // Process any queued candidates
        if (pc.candidateQueue) {
            for (const candidate of pc.candidateQueue) {
                try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } 
                catch (e) { console.error('Error adding queued ICE candidate', e); }
            }
            pc.candidateQueue = [];
        }
    }
}

let earlyCandidates = {}; // peerId -> array of candidates

async function handleIceCandidate(remotePeerId, candidate) {
    const pc = rtcConnections[remotePeerId];
    if (!pc) {
        if (!earlyCandidates[remotePeerId]) earlyCandidates[remotePeerId] = [];
        earlyCandidates[remotePeerId].push(candidate);
        return;
    }

    if (pc.remoteDescription && pc.remoteDescription.type) {
        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
            console.error('Error adding ICE candidate', e);
        }
    } else {
        if (!pc.candidateQueue) pc.candidateQueue = [];
        pc.candidateQueue.push(candidate);
    }
}
function setupDataChannel(dc, remotePeerId) {
    console.log(`Setting up data channel with ${remotePeerId}. Current state: ${dc.readyState}`);
    dataChannels[remotePeerId] = dc;
    dc.binaryType = 'arraybuffer';

    const onOpenHandler = () => {
        console.log(`Data channel OPEN with ${remotePeerId}`);
        updatePeerList();
    };

    dc.onopen = onOpenHandler;
    
    // If it's already open, fire the handler immediately
    if (dc.readyState === 'open') {
        onOpenHandler();
    }

    dc.onclose = () => {
        console.log(`Data channel CLOSED with ${remotePeerId}`);
        if (dataChannels[remotePeerId] === dc) {
            delete dataChannels[remotePeerId];
            updatePeerList();
        }
    };
    
    dc.onerror = (error) => {
        console.error(`Data channel ERROR with ${remotePeerId}:`, error);
    };

    dc.onmessage = (event) => handleDataChannelMessage(remotePeerId, event.data);
}

// --- File Transfer Logic ---
const CHUNK_SIZE = 16384; // 16KB

function handleDataChannelMessage(remotePeerId, data) {
    if (typeof data === 'string') {
        const msg = JSON.parse(data);
        if (msg.type === 'file-meta') {
            // Check if file is already in the list
            const isDuplicate = Object.values(receivedFiles).some(f => f.name === msg.name && f.size === msg.size);
            if (isDuplicate) {
                console.log(`Ignoring duplicate file: ${msg.name}`);
                return;
            }

            receivedFiles[msg.fileId] = {
                id: msg.fileId,
                name: msg.name,
                size: msg.size,
                mime: msg.mime,
                receivedSize: 0,
                chunkCount: 0
            };
            const senderName = peerNames[remotePeerId] || 'Unknown User';
            addFileToList(msg.fileId, msg.name, msg.size, 'receiving', remotePeerId, senderName, msg.mime);
        } else if (msg.type === 'file-end') {
            assembleFile(msg.fileId);
        }
    } else {
        const view = new Uint8Array(data);
        const fileId = new TextDecoder().decode(view.slice(0, 36));
        const chunk = view.slice(36);
        
        const file = receivedFiles[fileId];
        if (file) {
            // Save chunk to IndexedDB
            const transaction = db.transaction(['fileChunks'], 'readwrite');
            const store = transaction.objectStore('fileChunks');
            store.add({ fileId, chunk, index: file.chunkCount });
            
            file.chunkCount++;
            file.receivedSize += chunk.byteLength;
            updateProgress(fileId, (file.receivedSize / file.size) * 100);
        }
    }
}

async function sendFile(file, targetPeerId = null) {
    let fileId;
    
    // If targetPeerId is null, this is a new file being added by the user
    if (targetPeerId === null) {
        fileId = crypto.randomUUID();
        // Track the file for later resending
        files[fileId] = file;
        updateHostedStats();
    } else {
        // This is a resend to a specific peer. We generate a new ID for this transfer
        // to avoid any potential conflicts with existing transfer UI items on the receiver side
        fileId = crypto.randomUUID();
    }

    const openChannels = targetPeerId 
        ? (dataChannels[targetPeerId] && dataChannels[targetPeerId].readyState === 'open' ? [dataChannels[targetPeerId]] : [])
        : Object.values(dataChannels).filter(dc => dc.readyState === 'open');
    
    if (openChannels.length === 0) {
        if (targetPeerId === null) {
            const peerCount = Object.keys(peerNames).length;
            if (peerCount > 0) {
                alert("File added to your shared list. Peers are connecting but not yet ready to receive files.");
            } else {
                alert("File added to your shared list. No connected peers to send the file to. Share the link to invite someone!");
            }
            // Still add it to the UI list as hosted so the user sees it
            addFileToList(fileId, file.name, file.size, 'hosting', peerId, 'Me (' + myDisplayName + ')', file.type);

            // Automatically switch to "My Files" tab
            const mineTab = document.getElementById('mine-tab');
            if (mineTab) bootstrap.Tab.getOrCreateInstance(mineTab).show();
        }
        return;
    }

    // Only show in OUR list if it's the initial upload or if we specifically want to see resends
    // For now, let's only add to list if it's the initial upload to avoid cluttering "My Files"
    if (targetPeerId === null) {
        addFileToList(fileId, file.name, file.size, 'sending', peerId, 'Me (' + myDisplayName + ')', file.type);
        
        // Automatically switch to "My Files" tab if not already there
        const mineTab = document.getElementById('mine-tab');
        if (mineTab) bootstrap.Tab.getOrCreateInstance(mineTab).show();
    }

    const meta = JSON.stringify({
        type: 'file-meta',
        fileId,
        name: file.name,
        size: file.size,
        mime: file.type
    });

    // Send meta to targeted channels
    openChannels.forEach(dc => dc.send(meta));

    const reader = file.stream().getReader();
    let offset = 0;
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Chunk the value further if it's larger than CHUNK_SIZE
        for (let i = 0; i < value.length; i += CHUNK_SIZE) {
            const chunk = value.slice(i, i + CHUNK_SIZE);
            const packet = new Uint8Array(36 + chunk.length);
            packet.set(new TextEncoder().encode(fileId), 0);
            packet.set(chunk, 36);

            for (const dc of openChannels) {
                if (dc.readyState === 'open') {
                    // Proper backpressure: Wait if buffer gets too large (e.g., > 1MB)
                    while (dc.bufferedAmount > 1024 * 1024) {
                        await sleep(50);
                        if (dc.readyState !== 'open') break; // Abort wait if channel closes
                    }
                    if (dc.readyState === 'open') {
                        dc.send(packet);
                    }
                }
            }
            offset += chunk.length;
            // Only update progress in UI if it's our initial upload (linked to the UI item)
            if (targetPeerId === null) {
                updateProgress(fileId, (offset / file.size) * 100);
            }
        }
    }

    // Final update for the sender UI
    if (targetPeerId === null) {
        updateProgress(fileId, 100);
    }

    const end = JSON.stringify({ type: 'file-end', fileId });
    for (const dc of openChannels) {
        if (dc.readyState === 'open') dc.send(end);
    }
}

async function assembleFile(fileId) {
    const file = receivedFiles[fileId];
    if (!file) return; // File was ignored as a duplicate
    
    // Retrieve all chunks from IndexedDB
    const transaction = db.transaction(['fileChunks'], 'readonly');
    const store = transaction.objectStore('fileChunks');
    const chunks = [];

    // We'll use a manual cursor approach to filter by fileId
    const request = store.openCursor();

    request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            if (cursor.value.fileId === fileId) {
                chunks.push(cursor.value.chunk);
            }
            cursor.continue();
        } else {
            // All chunks retrieved
            const blob = new Blob(chunks, { type: file.mime });
            const url = URL.createObjectURL(blob);
            
            const item = document.querySelector(`[data-file-id="${fileId}"]`);
            if (item) {
                const downloadBtn = item.querySelector('.download-btn');
                downloadBtn.href = url;
                downloadBtn.download = file.name;
                downloadBtn.classList.remove('hidden');
                item.querySelector('.progress').classList.add('hidden');
                
                downloadBtn.onclick = (e) => {
                    if (downloadBtn.classList.contains('downloaded')) {
                        e.preventDefault();
                        const modalEl = document.getElementById('downloadModal');
                        document.getElementById('download-modal-filename').innerText = file.name;
                        
                        const downloadAgainBtn = document.getElementById('btn-download-modal-download');
                        downloadAgainBtn.href = url;
                        downloadAgainBtn.download = file.name;
                        
                        const deleteBtn = document.getElementById('btn-download-modal-delete');
                        const modalInstance = new bootstrap.Modal(modalEl);
                        
                        downloadAgainBtn.onclick = () => {
                            modalInstance.hide();
                        };
                        
                        deleteBtn.onclick = () => {
                            item.remove();
                            const tx = db.transaction(['fileChunks'], 'readwrite');
                            const store = tx.objectStore('fileChunks');
                            const cursorReq = store.openCursor();
                            cursorReq.onsuccess = (ev) => {
                                const cursor = ev.target.result;
                                if (cursor) {
                                    if (cursor.value.fileId === fileId) cursor.delete();
                                    cursor.continue();
                                }
                            };
                            delete receivedFiles[fileId];
                            
                            const groupEl = item.closest('.user-file-group');
                            if (groupEl && groupEl.querySelectorAll('.file-list-item').length === 0) {
                                groupEl.remove();
                                updateFileFilterOptions();
                            }
                            
                            applyFilters();
                            modalInstance.hide();
                        };
                        
                        modalInstance.show();
                    } else {
                        // Delay UI update slightly to ensure the browser registers the first click for download
                        setTimeout(() => {
                            downloadBtn.classList.add('downloaded');
                            downloadBtn.classList.replace('btn-success', 'btn-outline-secondary');
                            downloadBtn.innerHTML = '<i class="bi bi-check-circle-fill"></i>';
                            downloadBtn.title = 'Downloaded - Click to manage';
                        }, 50);
                    }
                };
            }
        }
    };
}

// --- UI Helpers ---
window.forceUpdatePeerList = updatePeerList;

function updatePeerList() {
  
    const list = document.getElementById('peer-list');
    if (!list) return;
    list.innerHTML = '';
    
    // Add current user
    const myHostedCount = Object.keys(files).length;
    const myHostedBadge = myHostedCount > 0 ? `<span class="badge bg-primary ms-2" title="${myHostedCount} files hosted by you">${myHostedCount} hosted</span>` : '';

    list.innerHTML += `<div class="list-group-item px-0 py-1 d-flex justify-content-between align-items-center">
        <span><i class="bi bi-person-fill me-2 text-primary"></i>${myDisplayName} (Me)${myHostedBadge}</span>
        <span class="peer-status" title="Online"><i class="bi bi-circle-fill text-success"></i></span>
    </div>`;

    // Add other known peers
    Object.keys(peerNames).forEach(id => {
        const name = peerNames[id];
        const pc = rtcConnections[id];
        const dc = dataChannels[id];
        
        let state = pc ? pc.connectionState : 'offline';
        let dcStatus = dc ? ` (DC: ${dc.readyState})` : '';
        
        // Final status is "online" only if both PC is connected and DC is open
        const isOnline = (state === 'connected' && dc && dc.readyState === 'open');
        const isConnecting = (state === 'connecting' || state === 'new' || (state === 'connected' && (!dc || dc.readyState !== 'open')));

        let statusIcon = '<i class="bi bi-circle-fill text-danger"></i>';
        let statusTitle = `Offline (${state}${dcStatus})`;

        if (isOnline) {
            statusIcon = '<i class="bi bi-circle-fill text-success"></i>';
            statusTitle = 'Online';
        } else if (isConnecting) {
            statusIcon = '<i class="bi bi-circle-fill text-warning"></i>';
            statusTitle = `Connecting... (${state}${dcStatus})`;
        }
        
        const hostedCount = peerHostedCounts[id] || 0;
        let hostedBadge = '';
        if (hostedCount > 0) {
            hostedBadge = `
                <span class="badge bg-info ms-2" title="${hostedCount} files available">${hostedCount} hosted</span>
                <button class="btn btn-sm btn-link p-0 ms-1 btn-request-files" data-peer-id="${id}" title="Request files from this peer">
                    <i class="bi bi-arrow-repeat text-info"></i>
                </button>
            `;
        }

        list.innerHTML += `<div class="list-group-item px-0 py-1 d-flex justify-content-between align-items-center">
            <span><i class="bi bi-person-fill me-2"></i>${name}${hostedBadge}</span>
            <span class="peer-status" title="${statusTitle}">${statusIcon}</span>
        </div>`;
    });

    if (Object.keys(peerNames).length === 0) {
        list.innerHTML += '<div id="waiting-msg" class="list-group-item px-0 py-1 text-muted italic small">Waiting for others to join...</div>';
    }
}

function showToast(message, isError = false) {
    const toastEl = document.getElementById('actionToast');
    if (!toastEl) return;
    const toastBody = document.getElementById('actionToastBody');
    toastBody.innerText = message;
    
    if (isError) {
        toastEl.classList.replace('bg-success', 'bg-danger');
    } else {
        toastEl.classList.replace('bg-danger', 'bg-success');
    }
    
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

// Global listener for request files buttons
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-request-files');
    if (btn) {
        e.preventDefault();
        if (btn.disabled) return;

        const targetPeerId = btn.getAttribute('data-peer-id');
        console.log(`Requesting files from peer: ${targetPeerId}`);
        
        btn.disabled = true;
        const icon = btn.querySelector('i');
        if (icon) {
            icon.classList.remove('bi-arrow-repeat', 'text-info');
            icon.classList.add('bi-hourglass-split', 'text-secondary');
        }

        try {
            await apiCall(`/sessions/${currentSessionSlug}/messages`, 'POST', {
                from_peer_id: peerId,
                to_peer_id: targetPeerId,
                type: 'request-files',
                payload: {}
            });
            showToast("File synchronization request sent!");
        } catch (err) {
            console.error('Request files error', err);
            showToast("Failed to request files.", true);
        } finally {
            setTimeout(() => {
                btn.disabled = false;
                if (icon) {
                    icon.classList.remove('bi-hourglass-split', 'text-secondary');
                    icon.classList.add('bi-arrow-repeat', 'text-info');
                }
            }, 3000);
        }
    }
});

function getOrCreateUserGroup(ownerId, ownerName) {
    let group = document.getElementById(`user-group-${ownerId}`);
    if (!group) {
        const isMe = (ownerId === peerId);
        const list = document.getElementById(isMe ? 'file-list-mine' : 'file-list-others');
        
        const groupHtml = `
            <div id="user-group-${ownerId}" class="user-file-group" data-owner-id="${ownerId}">
                <div class="bg-light p-2 border-bottom fw-bold text-muted small">
                    <i class="bi bi-person-fill me-1"></i> ${ownerName}
                </div>
                <div class="list-group list-group-flush group-items"></div>
            </div>
        `;
        list.insertAdjacentHTML('afterbegin', groupHtml);
        group = document.getElementById(`user-group-${ownerId}`);
        updateFileFilterOptions();
    }
    return group.querySelector('.group-items');
}

function updateFileFilterOptions() {
    const select = document.getElementById('file-filter');
    if (!select) return;
    
    const currentVal = select.value;
    select.innerHTML = '<option value="all">All Users</option>';
    
    // Find groups in both tabs
    const groups = document.querySelectorAll('.user-file-group');
    groups.forEach(group => {
        const ownerId = group.getAttribute('data-owner-id');
        const nameEl = group.querySelector('.bg-light');
        const ownerName = nameEl ? nameEl.innerText.trim() : 'Unknown';
        const option = document.createElement('option');
        option.value = ownerId;
        option.innerText = ownerName;
        select.appendChild(option);
    });
    
    const exists = Array.from(select.options).some(opt => opt.value === currentVal);
    select.value = exists ? currentVal : 'all';
}

function applyFilters() {
    const fileFilter = document.getElementById('file-filter');
    const typeFilter = document.getElementById('file-type-filter');
    const userVal = fileFilter ? fileFilter.value : 'all';
    const typeVal = typeFilter ? typeFilter.value : 'all';
    
    document.querySelectorAll('.user-file-group').forEach(group => {
        const isUserMatch = (userVal === 'all' || group.getAttribute('data-owner-id') === userVal);
        
        let visibleInGroup = 0;
        group.querySelectorAll('.file-list-item').forEach(item => {
            const isTypeMatch = (typeVal === 'all' || item.getAttribute('data-category') === typeVal);
            if (isTypeMatch) {
                item.classList.remove('hidden');
                visibleInGroup++;
            } else {
                item.classList.add('hidden');
            }
        });

        if (isUserMatch && visibleInGroup > 0) {
            group.classList.remove('hidden');
        } else {
            group.classList.add('hidden');
        }
    });
    updateTransferStats();
}

// Add event listener for filtering files
document.addEventListener('DOMContentLoaded', () => {
    const fileFilter = document.getElementById('file-filter');
    const typeFilter = document.getElementById('file-type-filter');
    
    if (fileFilter) fileFilter.addEventListener('change', applyFilters);
    if (typeFilter) typeFilter.addEventListener('change', applyFilters);

    // Tab change listener to hide/show filter
    const fileTabs = document.getElementById('fileTabs');
    if (fileTabs) {
        fileTabs.addEventListener('shown.bs.tab', (e) => {
            const isOthers = e.target.id === 'others-tab';
            if (fileFilter) {
                if (isOthers) fileFilter.classList.remove('hidden');
                else fileFilter.classList.add('hidden');
            }
            applyFilters();
        });
    }
});

function getFileCategory(name, mime) {
    mime = mime || '';
    if (mime.startsWith('image/')) return 'photo';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'music';
    
    const ext = name.split('.').pop().toLowerCase();
    const photos = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    if (photos.includes(ext)) return 'photo';
    
    const videos = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
    if (videos.includes(ext)) return 'video';
    
    const music = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'];
    if (music.includes(ext)) return 'music';
    
    const documents = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'];
    if (documents.includes(ext) || mime.startsWith('text/') || mime.includes('document') || mime.includes('pdf')) return 'document';
    
    return 'other';
}

function addFileToList(id, name, size, type, ownerId, ownerName, mime = '') {
    const container = getOrCreateUserGroup(ownerId, ownerName);
    const category = getFileCategory(name, mime);
    const sizeStr = (size / (1024 * 1024)).toFixed(2) + ' MB';
    
    let iconHtml = '';
    if (type === 'sending') iconHtml = '<i class="bi bi-cloud-arrow-up text-primary fs-4 me-2"></i>';
    else if (type === 'hosting') iconHtml = '<i class="bi bi-hdd-network text-info fs-4 me-2" title="Hosted & Available"></i>';

    const progressWidth = type === 'hosting' ? '100%' : '0%';
    const progressClass = type === 'hosting' ? 'bg-info' : 'progress-bar-striped progress-bar-animated';

    const html = `
        <div class="list-group-item file-list-item" data-file-id="${id}" data-category="${category}">
            <div class="flex-grow-1 me-3">
                <div class="d-flex justify-content-between">
                    <span class="fw-bold text-truncate" style="max-width: 200px;">${name}</span>
                    <span class="small text-muted">${sizeStr}</span>
                </div>
                <div class="progress mt-1">
                    <div class="progress-bar ${progressClass}" role="progressbar" style="width: ${progressWidth}"></div>
                </div>
            </div>
            <div class="d-flex align-items-center">
                ${iconHtml}
                <a href="#" class="btn btn-sm btn-success download-btn hidden"><i class="bi bi-download"></i></a>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('afterbegin', html);
    applyFilters();
}

async function updateProgress(id, percent) {
    const item = document.querySelector(`[data-file-id="${id}"]`);
    if (item) {
        const bar = item.querySelector('.progress-bar');
        bar.style.width = percent + '%';
        
        if (percent >= 100) {
            bar.classList.remove('progress-bar-animated', 'progress-bar-striped');
            bar.classList.add('bg-success');
        }
    }
}

function updateTransferStats() {
    // Update tab-specific counters based on actual visibility
    let othersCount = 0;
    document.querySelectorAll('#file-list-others .file-list-item').forEach(item => { 
        const group = item.closest('.user-file-group');
        if (group && !group.classList.contains('hidden') && !item.classList.contains('hidden')) {
            othersCount++;
        }
    });

    let mineCount = 0;
    document.querySelectorAll('#file-list-mine .file-list-item').forEach(item => { 
        const group = item.closest('.user-file-group');
        if (group && !group.classList.contains('hidden') && !item.classList.contains('hidden')) {
            mineCount++;
        }
    });
    
    const countOthersEl = document.getElementById('count-others');
    const countMineEl = document.getElementById('count-mine');
    
    if (countOthersEl) countOthersEl.innerText = `(${othersCount})`;
    if (countMineEl) countMineEl.innerText = `(${mineCount})`;
}

function updateHostedStats() {
    const count = Object.keys(files).length;
    const badge = document.getElementById('hosted-stats');
    if (badge) {
        badge.innerText = `${count} hosted`;
        if (count > 0) {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
    
    // Update local peer list to show own hosted count
    updatePeerList();

    // Broadcast the new count to peers immediately if session is active
    if (currentSessionSlug) {
        sendSignalingMessage('presence', { peerId, name: myDisplayName, hostedCount: count });
    }
}

function processUpload(file) {
    const existingNames = new Set([
        ...Object.values(files).map(f => f.name),
        ...Object.values(receivedFiles).map(f => f.name)
    ]);
    
    let targetName = file.name;
    if (existingNames.has(targetName)) {
        let counter = 1;
        const lastDot = file.name.lastIndexOf('.');
        const base = lastDot !== -1 ? file.name.substring(0, lastDot) : file.name;
        const ext = lastDot !== -1 ? file.name.substring(lastDot) : '';
        
        while (existingNames.has(targetName)) {
            targetName = `${base} (${counter})${ext}`;
            counter++;
        }
    }
    
    // If the name was changed, generate a new File object
    const finalFile = targetName !== file.name 
        ? new File([file], targetName, { type: file.type || 'application/octet-stream' }) 
        : file;
        
    sendFile(finalFile);
}

// --- Event Listeners ---
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

dropZone.onclick = () => fileInput.click();

dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('dragover'); };
dropZone.ondragleave = () => dropZone.classList.remove('dragover');
dropZone.ondrop = (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const droppedFiles = e.dataTransfer.files;
    Array.from(droppedFiles).forEach(f => processUpload(f));
};

fileInput.onchange = () => {
    Array.from(fileInput.files).forEach(f => processUpload(f));
    fileInput.value = '';
};

function copyLink() {
    const link = document.getElementById('share-link');
    link.select();
    document.execCommand('copy');
    alert('Link copied to clipboard!');
}

// Check if URL has a slug on load
window.onload = () => {
    const path = window.location.pathname.substring(1);
    if (path && path.length === 8) {
        showLandingSubView('landingJoin');
        inputs.joinSlug.value = path;
        // Focus on name input for better UX
        inputs.joinName.focus();
    }
};

window.addEventListener('beforeunload', () => {
    if (currentSessionSlug) {
        // Use keepalive to ensure the request is sent even as the tab closes
        fetch(`/api/sessions/${currentSessionSlug}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                from_peer_id: peerId,
                to_peer_id: null,
                type: 'leave',
                payload: {}
            }),
            keepalive: true
        });
    }
});

// --- QR Code Features ---
let html5QrCode = null;

if (btns.showQr) {
    btns.showQr.onclick = () => {
        const qrModalEl = document.getElementById('qrModal');
        const qrDisplay = document.getElementById('qrcode-display');
        qrDisplay.innerHTML = ''; // Clear previous
        
        const qrModal = new bootstrap.Modal(qrModalEl);
        qrModal.show();
        
        // Use a small timeout to ensure modal is visible
        setTimeout(() => {
            new QRCode(qrDisplay, {
                text: window.location.href,
                width: 256,
                height: 256,
                colorDark: '#436436', // --brand-primary
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        }, 300);
    };
}

if (btns.choiceScan) {
    btns.choiceScan.onclick = () => {
        const scanModalEl = document.getElementById('scanModal');
        const scanModal = new bootstrap.Modal(scanModalEl);
        scanModal.show();
        
        setTimeout(startQrScanner, 500);
    };
}

if (document.getElementById('btn-close-scan')) {
    document.getElementById('btn-close-scan').onclick = stopQrScanner;
}

function startQrScanner() {
    html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        (decodedText) => {
            // SUCCESS
            console.log(`Scan result: ${decodedText}`);
            handleScannedUrl(decodedText);
            stopQrScanner();
            
            document.getElementById('scan-result').classList.remove('hidden');
            
            setTimeout(() => {
                const scanModal = bootstrap.Modal.getInstance(document.getElementById('scanModal'));
                if (scanModal) scanModal.hide();
                document.getElementById('scan-result').classList.add('hidden');
            }, 1000);
        },
        (errorMessage) => {
            // parse error, ignore
        }
    ).catch((err) => {
        console.error('Camera Error:', err);
        alert('Could not start camera. Please ensure you have granted permissions and are on a secure (HTTPS) connection.');
        const scanModal = bootstrap.Modal.getInstance(document.getElementById('scanModal'));
        if (scanModal) scanModal.hide();
    });
}

function stopQrScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            console.log("QR Scanner stopped.");
            html5QrCode.clear();
        }).catch(err => console.error("Failed to stop scanner", err));
    }
}

function handleScannedUrl(url) {
    try {
        const scannedUrl = new URL(url);
        // Check if it's our domain or just extract path
        const path = scannedUrl.pathname.substring(1);
        if (path && path.length === 8) {
            showLandingSubView('landingJoin');
            inputs.joinSlug.value = path;
            inputs.joinName.focus();
            showToast("Session detected! Please enter your name to join.");
        } else {
            alert("Invalid Blimpshare QR code.");
        }
    } catch (e) {
        console.error("Invalid URL scanned", e);
        alert("Scanned data is not a valid URL.");
    }
}

