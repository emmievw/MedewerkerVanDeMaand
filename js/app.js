// === CONFIG ===
const FORMSPREE_URL = 'https://formspree.io/f/VUL_HIER_JE_FORM_ID_IN';
const STORAGE_KEY = 'mvdm-admin-votes';
const ADMIN_HASH = '32905b279b460a446ebb1134c2a6d9023f858d2d788c2eed73cab62fed7237e7';

// === TABS ===
document.addEventListener('DOMContentLoaded', () => {
    // Tab navigatie
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Stem tab
    checkAlreadyVoted();
    const nominee = document.getElementById('nominee');
    const motivation = document.getElementById('motivation');
    const submitBtn = document.getElementById('submit-btn');

    function checkFields() {
        const filled = nominee.value.trim() && motivation.value.trim();
        submitBtn.disabled = !filled;
        submitBtn.classList.toggle('btn-disabled', !filled);
    }
    nominee.addEventListener('input', checkFields);
    motivation.addEventListener('input', checkFields);
    document.getElementById('vote-form').addEventListener('submit', handleVote);

    // Admin tab
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('add-vote-form').addEventListener('submit', handleAddVote);
    document.getElementById('clear-btn').addEventListener('click', clearAllVotes);

    if (sessionStorage.getItem('mvdm-admin-auth')) showAdmin();

    // Reveal tab
    document.getElementById('start-reveal-btn').addEventListener('click', startReveal);
    document.getElementById('reveal-next-btn').addEventListener('click', nextRevealSlide);
});

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    document.querySelector('[data-tab="' + tabId + '"]').classList.add('active');
}

// === STEM ===
function checkAlreadyVoted() {
    if (localStorage.getItem('mvdm-voted-juni-2026')) {
        document.getElementById('vote-form').style.display = 'none';
        document.getElementById('already-voted').style.display = 'block';
    }
}

async function handleVote(e) {
    e.preventDefault();
    const nominee = document.getElementById('nominee').value.trim();
    const motivation = document.getElementById('motivation').value.trim();
    const btn = document.getElementById('submit-btn');

    btn.disabled = true;
    btn.querySelector('.btn-text').style.display = 'none';
    btn.querySelector('.btn-loading').style.display = 'inline';

    try {
        const response = await fetch(FORMSPREE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ genomineerde: nominee, motivatie: motivation })
        });
        if (!response.ok) throw new Error('fail');

        localStorage.setItem('mvdm-voted-juni-2026', nominee);
        document.getElementById('vote-form').style.display = 'none';
        document.getElementById('success-message').style.display = 'block';
    } catch (err) {
        // Als Formspree niet werkt, sla toch lokaal op als fallback
        localStorage.setItem('mvdm-voted-juni-2026', nominee);
        document.getElementById('vote-form').style.display = 'none';
        document.getElementById('success-message').style.display = 'block';
    }
}

// === ADMIN ===
async function handleLogin(e) {
    e.preventDefault();
    const pw = document.getElementById('admin-password').value;
    const hash = await sha256(pw);
    if (hash === ADMIN_HASH) {
        sessionStorage.setItem('mvdm-admin-auth', 'true');
        document.getElementById('login-error').style.display = 'none';
        showAdmin();
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
}

function showAdmin() {
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    renderAdmin();
}

function getVotes() {
    const d = localStorage.getItem(STORAGE_KEY);
    return d ? JSON.parse(d) : [];
}

function saveVotes(votes) { localStorage.setItem(STORAGE_KEY, JSON.stringify(votes)); }

function handleAddVote(e) {
    e.preventDefault();
    const nominee = document.getElementById('add-nominee').value.trim();
    const motivation = document.getElementById('add-motivation').value.trim();
    if (!nominee || !motivation) return;

    const votes = getVotes();
    votes.push({ nominee, motivation, timestamp: new Date().toISOString() });
    saveVotes(votes);

    document.getElementById('add-nominee').value = '';
    document.getElementById('add-motivation').value = '';
    renderAdmin();
}

function deleteVote(index) {
    const votes = getVotes();
    votes.splice(index, 1);
    saveVotes(votes);
    renderAdmin();
}

function clearAllVotes() {
    if (confirm('Weet je zeker dat je ALLE stemmen wilt wissen?')) {
        localStorage.removeItem(STORAGE_KEY);
        renderAdmin();
    }
}

function renderAdmin() {
    const votes = getVotes();
    document.getElementById('vote-count-label').textContent = votes.length + ' stem' + (votes.length !== 1 ? 'men' : '');

    // Ranking
    const tally = {};
    votes.forEach(v => { tally[v.nominee] = (tally[v.nominee] || 0) + 1; });
    const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);

    const rankEl = document.getElementById('ranking-list');
    if (sorted.length === 0) {
        rankEl.innerHTML = '<p class="loading">Nog geen stemmen.</p>';
    } else {
        rankEl.innerHTML = sorted.map(([name, count], i) => 
            '<div class="ranking-item"><span class="ranking-pos">' + (i === 0 ? '\u{1F451}' : '#' + (i+1)) + '</span><span class="ranking-name">' + esc(name) + '</span><span class="ranking-count">' + count + ' stem' + (count !== 1 ? 'men' : '') + '</span></div>'
        ).join('');
    }

    // Alle stemmen
    const votesEl = document.getElementById('votes-list');
    if (votes.length === 0) {
        votesEl.innerHTML = '<p class="loading">Nog geen stemmen.</p>';
    } else {
        const rev = [...votes].map((v, i) => ({...v, idx: i})).reverse();
        votesEl.innerHTML = rev.map(v =>
            '<div class="vote-item"><div class="vote-item-header"><strong class="vote-item-to">\u2192 ' + esc(v.nominee) + '</strong><button class="btn-delete" onclick="deleteVote(' + v.idx + ')">\u2715</button></div><p class="vote-item-motivation">"' + esc(v.motivation) + '"</p></div>'
        ).join('');
    }
}

// === REVEAL ===
let revealData = [];
let revealIndex = 0;

function startReveal() {
    const votes = getVotes();
    if (votes.length === 0) {
        document.getElementById('reveal-no-data').style.display = 'block';
        return;
    }

    // Groepeer
    const grouped = {};
    votes.forEach(v => {
        if (!grouped[v.nominee]) grouped[v.nominee] = [];
        grouped[v.nominee].push(v.motivation);
    });

    // Sorteer minst naar meest (winnaar laatst)
    revealData = Object.entries(grouped)
        .map(([name, motivations]) => ({ name, votes: motivations.length, motivations }))
        .sort((a, b) => a.votes - b.votes);

    revealIndex = 0;
    document.getElementById('reveal-start').style.display = 'none';
    document.getElementById('reveal-show').style.display = 'block';
    showRevealSlide();
}

function showRevealSlide() {
    const item = revealData[revealIndex];
    const isWinner = revealIndex === revealData.length - 1;
    const total = revealData.length;
    const rank = total - revealIndex;

    const slide = document.getElementById('reveal-slide');
    slide.className = 'reveal-slide' + (isWinner ? ' winner' : '');

    let html = '';
    if (isWinner) {
        html = '<p class="nominee-rank">\u{1F451} De winnaar is...</p>';
    } else {
        html = '<p class="nominee-rank">#' + rank + ' genomineerd</p>';
    }
    html += '<p class="nominee-name">' + esc(item.name) + '</p>';
    html += '<p class="nominee-votes">' + item.votes + ' stem' + (item.votes !== 1 ? 'men' : '') + '</p>';
    html += item.motivations.map(m => '<blockquote>"' + esc(m) + '"</blockquote>').join('');

    slide.innerHTML = html;

    // Progress
    const pct = ((revealIndex + 1) / total) * 100;
    document.getElementById('reveal-progress-fill').style.width = pct + '%';

    // Button text
    const btn = document.getElementById('reveal-next-btn');
    if (isWinner) {
        btn.style.display = 'none';
        startConfetti();
    } else if (revealIndex === total - 2) {
        btn.textContent = 'En de winnaar is... \u{1F389}';
    } else {
        btn.textContent = 'Volgende \u2192';
    }
}

function nextRevealSlide() {
    if (revealIndex < revealData.length - 1) {
        revealIndex++;
        showRevealSlide();
    }
}

// === CONFETTI ===
function startConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#00a651', '#f0c040', '#ff6b6b', '#4ecdc4', '#6c5ce7', '#fff'];
    const particles = [];
    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: -10 - Math.random() * 200,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            speedY: Math.random() * 3 + 2,
            speedX: (Math.random() - 0.5) * 4,
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 10,
            opacity: 1
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        particles.forEach(p => {
            p.y += p.speedY; p.x += p.speedX;
            p.rotation += p.rotSpeed; p.opacity -= 0.003;
            if (p.y < canvas.height && p.opacity > 0) {
                alive = true;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size * 0.6);
                ctx.restore();
            }
        });
        if (alive) requestAnimationFrame(animate);
        else canvas.style.display = 'none';
    }
    animate();
}

// === HELPERS ===
function esc(text) {
    const d = document.createElement('div');
    d.textContent = text || '';
    return d.innerHTML;
}

async function sha256(msg) {
    const buf = new TextEncoder().encode(msg);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
