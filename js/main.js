// === CONFIGURATIE ===
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxIBntsuKYCDNf1UULhWw8T6SkTKOW7gNqvw-mQpciUREsC9Ux-Zijl0gqsKbrjPodIkQ/exec';

// === INITIALISATIE ===
document.addEventListener('DOMContentLoaded', () => {
    checkAlreadyVoted();
    document.getElementById('vote-form').addEventListener('submit', handleVote);

    // Knop pas groen als beide velden ingevuld
    const nominee = document.getElementById('nominee');
    const motivation = document.getElementById('motivation');
    const submitBtn = document.getElementById('submit-btn');

    function checkFields() {
        if (nominee.value.trim() && motivation.value.trim()) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('btn-disabled');
        } else {
            submitBtn.disabled = true;
            submitBtn.classList.add('btn-disabled');
        }
    }

    nominee.addEventListener('input', checkFields);
    motivation.addEventListener('input', checkFields);
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

    if (!nominee || !motivation) {
        showError('Vul beide velden in!');
        return;
    }

    // Disable button
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').style.display = 'none';
    submitBtn.querySelector('.btn-loading').style.display = 'inline';
    errorDiv.style.display = 'none';

    try {
        // text/plain is nodig zodat no-cors de body meestuurt
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
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
