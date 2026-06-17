// === REVEAL PRESENTATIE ===
let currentSlide = 0;
let totalSlides = 0;

// Keyword-gebaseerde titel generator
const TITLE_RULES = [
    { keywords: ['team', 'samenwerk', 'samen', 'verbind', 'groep'], title: 'De teamverbinder' },
    { keywords: ['help', 'hulp', 'bijspring', 'ondersteun', 'steun', 'klaarstaa'], title: 'De helpende hand' },
    { keywords: ['positie', 'energie', 'enthousiast', 'vrolijk', 'blij', 'lach', 'optimist'], title: 'De energiebron' },
    { keywords: ['kennis', 'slim', 'expert', 'weet', 'kundig', 'technisch', 'oploss'], title: 'De kennisbron' },
    { keywords: ['rustig', 'kalm', 'stabiel', 'betrouwbaar', 'constant', 'solide'], title: 'De rots in de branding' },
    { keywords: ['creatief', 'idee', 'innovati', 'vernieuw', 'bedenk', 'origineel'], title: 'De creatieve geest' },
    { keywords: ['humor', 'grappig', 'lol', 'sfeer', 'gezellig', 'leuk'], title: 'De sfeermaker' },
    { keywords: ['inspireer', 'inspirat', 'motiveer', 'motivat', 'aanstek', 'voorbeeld'], title: 'De inspirator' },
    { keywords: ['hard werk', 'inzet', 'ijver', 'doorzet', 'toegewijd', 'gedreven', 'werkpaard'], title: 'De doorzetter' },
    { keywords: ['communicat', 'luister', 'praat', 'gesprek', 'communic'], title: 'De communicator' },
    { keywords: ['leid', 'leider', 'stuur', 'richting', 'initiatief', 'voortouw'], title: 'De aanjager' },
    { keywords: ['zorgzaam', 'zorg', 'warm', 'lief', 'attent', 'betrokken', 'empathi'], title: 'Het warme hart' },
    { keywords: ['kwaliteit', 'nauwkeurig', 'precies', 'detail', 'grondig', 'zorgvuldig'], title: 'Het oog voor detail' },
    { keywords: ['flexibel', 'aanpass', 'meega', 'veelzijdig', 'alles kan'], title: 'De alleskunner' },
    { keywords: ['mentor', 'coach', 'leer', 'begel', 'uitleg', 'geduld'], title: 'De mentor' },
];

function generateTitle(motivations) {
    const text = motivations.join(' ').toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const rule of TITLE_RULES) {
        let score = 0;
        for (const kw of rule.keywords) {
            if (text.includes(kw)) score++;
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = rule.title;
        }
    }

    return bestMatch || 'De onmisbare collega';
}

document.addEventListener('DOMContentLoaded', () => {
    buildSlides();
    totalSlides = document.querySelectorAll('.slide').length;
    updateProgress();

    // Navigatie: klik of pijltoets
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
        if (e.key === 'ArrowLeft') prevSlide();
    });
    document.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') nextSlide();
    });
});

function buildSlides() {
    const container = document.getElementById('nominee-slides');
    // Filter: alleen nominees met 2 of meer stemmen
    const allNominees = REVEAL_DATA.nominees.filter(n => n.votes >= 2);
    if (allNominees.length === 0) return;

    const winner = allNominees[allNominees.length - 1];
    const others = allNominees.slice(0, -1);

    // Genereer slides voor elke genomineerde (behalve de winnaar)
    others.forEach((nominee, index) => {
        const rank = others.length - index + 1; // +1 want winnaar is #1
        const title = nominee.title || generateTitle(nominee.motivations);
        const slide = document.createElement('section');
        slide.className = 'slide';
        slide.innerHTML = `
            <div class="slide-content">
                <p class="nominee-rank">#${rank} genomineerd</p>
                <h1 class="nominee-name reveal-name" data-name="${escapeHtml(nominee.name)}">???</h1>
                <div class="nominee-title reveal-detail" style="opacity:0">${escapeHtml(title)}</div>
                <div class="nominee-votes reveal-detail" style="opacity:0">${nominee.votes} stem${nominee.votes !== 1 ? 'men' : ''}</div>
                <div class="nominee-motivations reveal-detail" style="opacity:0">
                    ${nominee.motivations.map(m => `<blockquote>"${escapeHtml(m)}"</blockquote>`).join('')}
                </div>
            </div>
        `;
        container.appendChild(slide);
    });

    // Vul winnaar-slide
    const winnerTitle = winner.title || generateTitle(winner.motivations);
    document.getElementById('winner-name').textContent = winner.name;
    document.getElementById('winner-title').textContent = winnerTitle;
    document.getElementById('winner-votes').textContent = winner.votes + ' stemmen';
    document.getElementById('winner-motivations').innerHTML =
        winner.motivations.map(m => `<blockquote>"${escapeHtml(m)}"</blockquote>`).join('');
}

function nextSlide() {
    const slides = document.querySelectorAll('.slide');
    if (currentSlide >= slides.length - 1) return;

    slides[currentSlide].classList.remove('active');
    slides[currentSlide].classList.add('past');
    currentSlide++;
    slides[currentSlide].classList.add('active');

    updateProgress();

    // Drumroll-slide: start automatische countdown
    if (slides[currentSlide].id === 'slide-drumroll') {
        startDrumroll();
        return;
    }

    // Naam onthulling met vertraging
    const nameEl = slides[currentSlide].querySelector('.reveal-name');
    if (nameEl) {
        nameEl.classList.add('name-hidden');
        setTimeout(() => {
            nameEl.textContent = nameEl.dataset.name;
            nameEl.classList.remove('name-hidden');
            nameEl.classList.add('name-revealed');
            // Toon stemmen en motivaties na naam
            slides[currentSlide].querySelectorAll('.reveal-detail').forEach((el, i) => {
                setTimeout(() => { el.style.opacity = '1'; el.classList.add('detail-appear'); }, 400 + i * 300);
            });
        }, 1200);
    }

    // Confetti bij de winnaar (laatste slide)
    if (currentSlide === slides.length - 1) {
        startConfetti();
        document.getElementById('nav-hint').style.display = 'none';
    }
}

function startDrumroll() {
    const dots = document.getElementById('drumroll-dots');
    const countEl = document.getElementById('drumroll-count');
    let count = 3;

    // Toon aftelling
    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            countEl.textContent = count;
            countEl.classList.remove('count-pop');
            void countEl.offsetWidth; // force reflow
            countEl.classList.add('count-pop');
        } else {
            clearInterval(interval);
            // Ga automatisch naar winnaar-slide
            setTimeout(() => nextSlide(), 600);
        }
    }, 1200);

    countEl.textContent = count;
    countEl.classList.add('count-pop');
}

function prevSlide() {
    const slides = document.querySelectorAll('.slide');
    if (currentSlide <= 0) return;

    slides[currentSlide].classList.remove('active');
    currentSlide--;
    slides[currentSlide].classList.remove('past');
    slides[currentSlide].classList.add('active');

    updateProgress();
}

function updateProgress() {
    const fill = document.getElementById('progress-fill');
    const pct = ((currentSlide + 1) / totalSlides) * 100;
    fill.style.width = pct + '%';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// === CONFETTI ===
function startConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    let particles = [];
    const colors = ['#00a651', '#f0c040', '#ff6b6b', '#4ecdc4', '#6c5ce7', '#fff'];

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: -10 - Math.random() * 200,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            speedY: Math.random() * 3 + 2,
            speedX: (Math.random() - 0.5) * 4,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10,
            opacity: 1
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;

        particles.forEach(p => {
            p.y += p.speedY;
            p.x += p.speedX;
            p.rotation += p.rotationSpeed;
            p.opacity -= 0.002;

            if (p.y < canvas.height && p.opacity > 0) {
                alive = true;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                ctx.restore();
            }
        });

        if (alive) requestAnimationFrame(animate);
    }
    animate();
}
