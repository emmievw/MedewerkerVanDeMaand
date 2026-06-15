// === CONFIGURATIE ===
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxIBntsuKYCDNf1UULhWw8T6SkTKOW7gNqvw-mQpciUREsC9Ux-Zijl0gqsKbrjPodIkQ/exec';
const ADMIN_PASSWORD_HASH = '32905b279b460a446ebb1134c2a6d9023f858d2d788c2eed73cab62fed7237e7';

// === ADMIN LOGIN ===
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('mvdm-admin-auth')) {
        showDashboard();
    }

    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('refresh-btn').addEventListener('click', loadResults);
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
    loadResults();
}

async function loadResults() {
    try {
        const response = await fetch(SCRIPT_URL + '?action=results');
        const data = await response.json();
        const votes = data.votes || [];

        displayStats(votes);
        displayRanking(votes);
        displayVotes(votes);
    } catch (error) {
        document.getElementById('ranking-list').innerHTML =
            '<p class="loading">Kon resultaten niet laden. Controleer de configuratie.</p>';
        document.getElementById('votes-list').innerHTML =
            '<p class="loading">Kon stemmen niet laden.</p>';
    }
}

function displayStats(votes) {
    const tally = getTally(votes);
    const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);

    document.getElementById('total-votes').textContent = votes.length;
    document.getElementById('total-remaining').textContent = Math.max(0, 25 - votes.length);
    document.getElementById('current-leader').textContent =
        sorted.length > 0 ? sorted[0][0] : '—';
}

function displayRanking(votes) {
    const container = document.getElementById('ranking-list');
    const tally = getTally(votes);
    const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) {
        container.innerHTML = '<p class="loading">Nog geen stemmen uitgebracht.</p>';
        return;
    }

    container.innerHTML = sorted.map(([name, count], index) => `
        <div class="ranking-item">
            <span class="ranking-position">${index + 1}</span>
            <span class="ranking-name">${escapeHtml(name)}</span>
            <span class="ranking-votes">${count} stem${count !== 1 ? 'men' : ''}</span>
        </div>
    `).join('');
}

function displayVotes(votes) {
    const container = document.getElementById('votes-list');

    if (votes.length === 0) {
        container.innerHTML = '<p class="loading">Nog geen stemmen uitgebracht.</p>';
        return;
    }

    // Nieuwste eerst
    const reversed = [...votes].reverse();
    container.innerHTML = reversed.map(vote => `
        <div class="vote-item">
            <div class="vote-item-header">
                <span class="vote-item-to">→ ${escapeHtml(vote.nominee)}</span>
                <span style="color: var(--text-light); font-size: 0.8rem;">${formatDate(vote.timestamp)}</span>
            </div>
            <p class="vote-item-motivation">"${escapeHtml(vote.motivation)}"</p>
        </div>
    `).join('');
}

// === HELPERS ===
function getTally(votes) {
    const tally = {};
    votes.forEach(vote => {
        tally[vote.nominee] = (tally[vote.nominee] || 0) + 1;
    });
    return tally;
}

function formatDate(timestamp) {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
