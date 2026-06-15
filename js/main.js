// === CONFIGURATIE ===
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxIBntsuKYCDNf1UULhWw8T6SkTKOW7gNqvw-mQpciUREsC9Ux-Zijl0gqsKbrjPodIkQ/exec';

// === INITIALISATIE ===
document.addEventListener('DOMContentLoaded', () => {
    checkAlreadyVoted();
    document.getElementById('vote-form').addEventListener('submit', handleVote);
});

function checkAlreadyVoted() {
    const voted = localStorage.getItem('mvdm-voted-juni-2026');
    if (voted) {
        document.getElementById('vote-form').style.display = 'none';
        document.getElementById('already-voted').style.display = 'block';
    }
}

async function handleVote(e) {
    e.preventDefault();

    const nominee = document.getElementById('nominee').value.trim();
    const motivation = document.getElementById('motivation').value.trim();
    const submitBtn = document.getElementById('submit-btn');
    const errorDiv = document.getElementById('error-message');

    if (!nominee) {
        showError('Vul een naam in!');
        return;
    }

    // Disable button
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').style.display = 'none';
    submitBtn.querySelector('.btn-loading').style.display = 'inline';
    errorDiv.style.display = 'none';

    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'vote',
                nominee: nominee,
                motivation: motivation,
                timestamp: new Date().toISOString()
            })
        });

        localStorage.setItem('mvdm-voted-juni-2026', nominee);
        document.getElementById('vote-form').style.display = 'none';
        document.getElementById('success-message').style.display = 'block';

    } catch (error) {
        showError('Er ging iets mis. Probeer het opnieuw.');
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').style.display = 'inline';
        submitBtn.querySelector('.btn-loading').style.display = 'none';
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    document.getElementById('error-text').textContent = message;
    errorDiv.style.display = 'block';
}
