// Medewerker van de Maand - Confetti animatie
(function () {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    const colors = ['#f0c040', '#ff6b6b', '#4ecdc4', '#45b7d1', '#fff'];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    function createParticle() {
        return {
            x: Math.random() * canvas.width,
            y: -10,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            speedY: Math.random() * 3 + 2,
            speedX: (Math.random() - 0.5) * 4,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10,
            opacity: 1
        };
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Voeg nieuwe confetti toe gedurende de eerste 3 seconden
        if (performance.now() < 3000) {
            for (let i = 0; i < 5; i++) {
                particles.push(createParticle());
            }
        }

        particles.forEach((p, index) => {
            p.y += p.speedY;
            p.x += p.speedX;
            p.rotation += p.rotationSpeed;
            p.opacity -= 0.003;

            if (p.y > canvas.height || p.opacity <= 0) {
                particles.splice(index, 1);
                return;
            }

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
            ctx.restore();
        });

        if (particles.length > 0) {
            requestAnimationFrame(animate);
        }
    }

    animate();
})();
