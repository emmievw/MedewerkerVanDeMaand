// === CONFIGURATIE ===
const STORAGE_KEY = 'mvdm-admin-votes';
const ADMIN_PASSWORD_HASH = '32905b279b460a446ebb1134c2a6d9023f858d2d788c2eed73cab62fed7237e7';

// === ADMIN LOGIN ===
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('mvdm-admin-auth')) {
        showDashboard();
    }

    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('add-vote-form').addEventListener('submit', handleAddVote);
    document.getElementById('export-reveal-btn').addEventListener('click', exportForReveal);
    document.getElementById('clear-btn').addEventListener('click', clearAllVotes);
});

async function handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;
    const hash = await sha256(password);

    if (hash === ADMIN_PASSWORD_HASH) {
        sessionStorage.setItem('mvdm-admin-auth', 'true');
        document.getElementById('login-error').style.display = 'none';
        showDashboard();
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
}

function showDashboard() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
    renderAll();
}

// === STEMMEN BEHEREN ===
function getVotes() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveVotes(votes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
}

function handleAddVote(e) {
    e.preventDefault();
    const nominee = document.getElementById('add-nominee').value.trim();
    const motivation = document.getElementById('add-motivation').value.trim();

    if (!nominee || !motivation) return;

    const votes = getVotes();
    votes.push({
        nominee: nominee,
        motivation: motivation,
        timestamp: new Date().toISOString()
    });
    saveVotes(votes);

    document.getElementById('add-nominee').value = '';
    document.getElementById('add-motivation').value = '';
    renderAll();
}

function deleteVote(index) {
    const votes = getVotes();
    votes.splice(index, 1);
    saveVotes(votes);
    renderAll();
}

function clearAllVotes() {
    if (confirm('Weet je zeker dat je ALLE stemmen wilt wissen?')) {
        localStorage.removeItem(STORAGE_KEY);
        renderAll();
    }
}

// === WEERGAVE ===
function renderAll() {
    const votes = getVotes();
    document.getElementById('vote-count-label').textContent = votes.length + ' stem' + (votes.length !== 1 ? 'men' : '') + ' ingevoerd';
    renderRanking(votes);
    renderVotes(votes);
}

function renderRanking(votes) {
    const container = document.getElementById('ranking-list');
    const tally = {};
    votes.forEach(v => { tally[v.nominee] = (tally[v.nominee] || 0) + 1; });
    const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) {
        container.innerHTML = '<p class="loading">Nog geen stemmen ingevoerd.</p>';
        return;
    }

    container.innerHTML = sorted.map(([name, count], i) => `
        <div class="ranking-item">
            <span class="ranking-pos">${i === 0 ? '\u{1F451}' : '#' + (i + 1)}</span>
            <span class="ranking-name">${escapeHtml(name)}</span>
            <span class="ranking-count">${count} stem${count !== 1 ? 'men' : ''}</span>
        </div>
    `).join('');
}

function renderVotes(votes) {
    const container = document.getElementById('votes-list');

    if (votes.length === 0) {
        container.innerHTML = '<p class="loading">Nog geen stemmen ingevoerd.</p>';
        return;
    }

    const reversed = [...votes].map((v, i) => ({ ...v, index: i })).reverse();
    container.innerHTML = reversed.map(vote => `
        <div class="vote-item">
            <div class="vote-item-header">
                <strong class="vote-item-to">\u2192 ${escapeHtml(vote.nominee)}</strong>
                <button class="btn-delete" onclick="deleteVote(${vote.index})">\u2715</button>
            </div>
            <p class="vote-item-motivation">"${escapeHtml(vote.motivation)}"</p>
        </div>
    `).join('');
}

// === EXPORT VOOR REVEAL ===
function exportForReveal() {
    const votes = getVotes();
    if (votes.length === 0) {
        alert('Geen stemmen om te exporteren!');
        return;
    }

    const grouped = {};
    votes.forEach(v => {
        if (!grouped[v.nominee]) grouped[v.nominee] = [];
        grouped[v.nominee].push(v.motivation);
    });

    const sorted = Object.entries(grouped)
        .map(([name, motivations]) => ({ name, votes: motivations.length, motivations }))
        .sort((a, b) => a.votes - b.votes);

    const code = `const REVEAL_DATA = {\n    nominees: [\n${sorted.map(n => `        {\n            name: "${n.name}",\n            votes: ${n.votes},\n            motivations: [\n${n.motivations.map(m => `                "${m.replace(/"/g, '\\"')}"`).join(',\n')}\n            ]\n        }`).join(',\n')}\n    ]\n};`;

    navigator.clipboard.writeText(code).then(() => {
        alert('Code gekopieerd naar klembord!\n\nPlak dit in js/reveal-data.js');
    }).catch(() => {
        prompt('Kopieer deze code en plak in js/reveal-data.js:', code);
    });
}

// === HELPERS ===
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
