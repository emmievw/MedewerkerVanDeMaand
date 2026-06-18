// === FIREBASE CONFIG ===
const firebaseConfig = {
    apiKey: "AIzaSyAB4Am-ZCGo4OW4vSbqIKytULz82CI2rYM",
    authDomain: "medewerker-van-de-maand.firebaseapp.com",
    databaseURL: "https://medewerker-van-de-maand-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "medewerker-van-de-maand",
    storageBucket: "medewerker-van-de-maand.firebasestorage.app",
    messagingSenderId: "280239375500",
    appId: "1:280239375500:web:49057b2d8d0acef343a7a9"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const ADMIN_HASH = '32905b279b460a446ebb1134c2a6d9023f858d2d788c2eed73cab62fed7237e7';

// === TABS ===
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Stem
    checkAlreadyVoted();
    const voter = document.getElementById('voter');
    const nominee = document.getElementById('nominee');
    const motivation = document.getElementById('motivation');
    const submitBtn = document.getElementById('submit-btn');

    function checkFields() {
        const sameAsVoter = voter.value && nominee.value && voter.value === nominee.value;
        if (sameAsVoter) {
            nominee.value = '';
        }
        const filled = voter.value.trim() && nominee.value.trim() && motivation.value.trim();
        submitBtn.disabled = !filled;
        submitBtn.classList.toggle('btn-disabled', !filled);
    }
    voter.addEventListener('change', () => {
        // Disable de optie met dezelfde naam in de nominee-lijst
        Array.from(nominee.options).forEach(opt => {
            opt.disabled = opt.value && opt.value === voter.value;
        });
        checkFields();
    });
    nominee.addEventListener('change', checkFields);
    motivation.addEventListener('input', checkFields);
    document.getElementById('vote-form').addEventListener('submit', handleVote);

    // Admin
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    if (sessionStorage.getItem('mvdm-admin-auth')) showAdmin();
    document.getElementById('clear-votes-btn').addEventListener('click', clearVotes);

    // Reveal
    document.getElementById('reveal-login-form').addEventListener('submit', handleRevealLogin);
    if (sessionStorage.getItem('mvdm-admin-auth')) showReveal();
    document.getElementById('start-reveal-btn').addEventListener('click', startReveal);
    document.getElementById('reveal-next-btn').addEventListener('click', nextRevealSlide);
});

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    document.querySelector('[data-tab="' + tabId + '"]').classList.add('active');
}

// === STEMMEN ===
function checkAlreadyVoted() {
    if (localStorage.getItem('mvdm-voted-juni-2026')) {
        document.getElementById('vote-form').style.display = 'none';
        document.getElementById('already-voted').style.display = 'block';
    }
}

async function handleVote(e) {
    e.preventDefault();
    const voterVal = document.getElementById('voter').value.trim();
    const nomineeVal = document.getElementById('nominee').value.trim();
    const motivationVal = document.getElementById('motivation').value.trim();
    const btn = document.getElementById('submit-btn');

    btn.disabled = true;
    btn.querySelector('.btn-text').style.display = 'none';
    btn.querySelector('.btn-loading').style.display = 'inline';

    try {
        await db.ref('votes').push({
            voter: voterVal,
            nominee: nomineeVal,
            motivation: motivationVal,
            timestamp: Date.now()
        });

        localStorage.setItem('mvdm-voted-juni-2026', nomineeVal);
        document.getElementById('vote-form').style.display = 'none';
        document.getElementById('success-message').style.display = 'block';
    } catch (err) {
        alert('Er ging iets mis: ' + err.message);
        btn.disabled = false;
        btn.querySelector('.btn-text').style.display = 'inline';
        btn.querySelector('.btn-loading').style.display = 'none';
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
    loadVotes();
}

// === REVEAL LOGIN ===
async function handleRevealLogin(e) {
    e.preventDefault();
    const pw = document.getElementById('reveal-password').value;
    const hash = await sha256(pw);
    if (hash === ADMIN_HASH) {
        sessionStorage.setItem('mvdm-admin-auth', 'true');
        document.getElementById('reveal-login-error').style.display = 'none';
        showReveal();
    } else {
        document.getElementById('reveal-login-error').style.display = 'block';
    }
}

function showReveal() {
    document.getElementById('reveal-login').style.display = 'none';
    document.getElementById('reveal-start').style.display = 'block';
}

function clearVotes() {
    if (!confirm('Weet je zeker dat je ALLE stemmen wilt wissen? Dit kan niet ongedaan worden!')) return;
    db.ref('votes').remove().then(() => {
        localStorage.removeItem('mvdm-voted-juni-2026');
        alert('Alle stemmen zijn gewist.');
    });
}

function loadVotes() {
    db.ref('votes').on('value', (snapshot) => {
        const data = snapshot.val();
        const votes = data ? Object.values(data) : [];
        renderAdmin(votes);
    });
}

function renderAdmin(votes) {
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
        const rev = [...votes].reverse();
        votesEl.innerHTML = rev.map(v =>
            '<div class="vote-item"><div class="vote-item-header"><span class="vote-item-from">' + esc(v.voter || 'Anoniem') + ' \u2192</span> <strong class="vote-item-to">' + esc(v.nominee) + '</strong></div><p class="vote-item-motivation">"' + esc(v.motivation) + '"</p></div>'
        ).join('');
    }
}

// === REVEAL ===
let revealData = [];
let revealIndex = 0;

function startReveal() {
    db.ref('votes').once('value', (snapshot) => {
        const data = snapshot.val();
        const votes = data ? Object.values(data) : [];

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
    });
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
    document.getElementById('reveal-progress-fill').style.width = ((revealIndex + 1) / total * 100) + '%';

    // Button
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
