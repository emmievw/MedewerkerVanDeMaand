// === REVEAL PRESENTATIE ===
let currentSlide = 0;
let totalSlides = 0;

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
    const nominees = REVEAL_DATA.nominees;
    const winner = nominees[nominees.length - 1];

    // Genereer slides voor elke genomineerde (behalve de winnaar)
    nominees.slice(0, -1).forEach((nominee, index) => {
        const slide = document.createElement('section');
        slide.className = 'slide';
        slide.innerHTML = `
            <div class="slide-content">
                <p class="nominee-rank">#${nominees.length - index} genomineerd</p>
                <h1 class="nominee-name">${escapeHtml(nominee.name)}</h1>
                <div class="nominee-votes">${nominee.votes} stem${nominee.votes !== 1 ? 'men' : ''}</div>
                <div class="nominee-motivations">
                    ${nominee.motivations.map(m => `<blockquote>"${escapeHtml(m)}"</blockquote>`).join('')}
                </div>
            </div>
        `;
        container.appendChild(slide);
    });

    // Vul winnaar-slide
    document.getElementById('winner-name').textContent = winner.name;
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

    // Confetti bij de winnaar (laatste slide)
    if (currentSlide === slides.length - 1) {
        startConfetti();
        document.getElementById('nav-hint').style.display = 'none';
    }
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
