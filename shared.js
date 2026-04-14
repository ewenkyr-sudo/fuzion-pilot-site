// ========================================
// FUZION PILOT — SHARED JS
// ========================================

// Navbar — visible at load, hides on scroll down, shows on scroll up
let lastScroll = 0;
const navbar = document.querySelector('.navbar');
if (navbar) {
    navbar.classList.add('show');
    window.addEventListener('scroll', () => {
        const current = window.scrollY;
        if (current < lastScroll || current < 10) {
            navbar.classList.add('show');
        } else {
            navbar.classList.remove('show');
        }
        lastScroll = current;
    }, { passive: true });
}

// Mobile hamburger toggle
function toggleMenu() {
    document.querySelector('.nav-menu')?.classList.toggle('open');
}

// Reveal on scroll (IntersectionObserver — zero layout cost)
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target); // stop watching once visible
        }
    });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Smooth scroll
document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (link) {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            document.querySelector('.nav-menu')?.classList.remove('open');
        }
    }
});

// FAQ accordion
function toggleFaq(el) {
    const item = el.closest('.faq-item');
    const wasActive = item.classList.contains('active');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
    if (!wasActive) item.classList.add('active');
}

// Pause animations when tab not visible (battery saving)
document.addEventListener('visibilitychange', () => {
    document.body.style.animationPlayState = document.hidden ? 'paused' : 'running';
});
