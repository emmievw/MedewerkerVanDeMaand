// === CONFIGURATIE ===
// VUL HIER JE GOOGLE SHEET ID IN:
// Open je sheet → kopieer het lange ID uit de URL:
// https://docs.google.com/spreadsheets/d/HIER_STAAT_HET_ID/edit
const SHEET_ID = 'VUL_HIER_JE_SHEET_ID_IN';
const SHEET_NAME = 'Juni 2026';
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

    if (SHEET_ID === 'VUL_HIER_JE_SHEET_ID_IN') {
        document.getElementById('setup-notice').style.display = 'block';
        document.getElementById('ranking-list').innerHTML = '<p class="loading">Sheet ID nog niet ingesteld.</p>';
        document.getElementById('votes-list').innerHTML = '';
        return;
    }

    loadResults();
}

async function loadResults() {
    try {
        document.getElementById('ranking-list').innerHTML = '<p class="loading">Laden...</p>';
        document.getElementById('votes-list').innerHTML = '<p class="loading">Laden...</p>';

        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
        const response = await fetch(url);
        const text = await response.text();

        // Google wraps de response in: google.visualization.Query.setResponse({...});
        const jsonStr = text.match(/google\.visualization\.Query\.setResponse\((.+)\)/);
        if (!jsonStr) throw new Error('Kon data niet parsen. Is de sheet gepubliceerd?');

        const data = JSON.parse(jsonStr[1]);
        const rows = data.table.rows;

        // Parse de rijen (kolom 0=timestamp, 1=genomineerde, 2=motivatie)
        const votes = rows.map(row => ({
            timestamp: row.c[0] ? row.c[0].v : '',
            nominee: row.c[1] ? row.c[1].v : '',
            motivation: row.c[2] ? row.c[2].v : ''
        })).filter(v => v.nominee);

        displayStats(votes);
        displayRanking(votes);
        displayVotes(votes);

    } catch (error) {
        console.error('Fout bij laden:', error);
        document.getElementById('ranking-list').innerHTML =
            `<p class="loading">Kon resultaten niet laden.<br><small>${escapeHtml(error.message)}</small></p>`;
        document.getElementById('votes-list').innerHTML = '';
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
        <div style="display:flex; align-items:center; gap:1rem; padding:0.75rem 0; border-bottom:1px solid var(--border, #eee);">
            <span style="font-size:1.5rem; font-weight:700; color:var(--afas-green); min-width:2rem;">#${index + 1}</span>
            <span style="flex:1; font-weight:500;">${escapeHtml(name)}</span>
            <span style="background:var(--afas-green); color:white; padding:0.25rem 0.75rem; border-radius:20px; font-size:0.85rem;">${count} stem${count !== 1 ? 'men' : ''}</span>
        </div>
    `).join('');
}

function displayVotes(votes) {
    const container = document.getElementById('votes-list');

    if (votes.length === 0) {
        container.innerHTML = '<p class="loading">Nog geen stemmen uitgebracht.</p>';
        return;
    }

    const reversed = [...votes].reverse();
    container.innerHTML = reversed.map(vote => `
        <div style="padding:0.75rem 0; border-bottom:1px solid var(--border, #eee);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="color:var(--afas-green);">→ ${escapeHtml(vote.nominee)}</strong>
                <small style="color:var(--text-light, #999);">${formatDate(vote.timestamp)}</small>
            </div>
            <p style="margin-top:0.3rem; font-style:italic; color:var(--text-medium, #666);">"${escapeHtml(vote.motivation)}"</p>
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
    if (isNaN(d)) return '';
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

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
