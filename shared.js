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

// ========================================
// LANGUAGE TOGGLE
// ========================================
(function() {
    // Detect current language from path
    var isEN = window.location.pathname.startsWith('/en/') || window.location.pathname === '/en';
    var currentLang = isEN ? 'en' : 'fr';

    // Inject toggle into navbar
    var navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        var li = document.createElement('li');
        li.innerHTML = '<button class="lang-toggle" onclick="switchLang()" title="' +
            (currentLang === 'fr' ? 'Switch to English' : 'Passer en Français') + '">' +
            (currentLang === 'fr' ? 'EN' : 'FR') +
            '</button>';
        // Insert before the last item (CTA button)
        var cta = navMenu.querySelector('.nav-cta-btn')?.closest('li');
        if (cta) navMenu.insertBefore(li, cta);
        else navMenu.appendChild(li);
    }
})();

function switchLang() {
    var isEN = window.location.pathname.startsWith('/en/');
    if (isEN) {
        // Switch to FR
        document.cookie = 'fp-site-lang=fr;path=/;max-age=' + (30*24*60*60) + ';SameSite=Lax';
        var frPath = window.location.pathname.replace('/en/', '/');
        window.location.href = frPath;
    } else {
        // Switch to EN
        document.cookie = 'fp-site-lang=en;path=/;max-age=' + (30*24*60*60) + ';SameSite=Lax';
        var page = window.location.pathname;
        if (page === '/' || page === '') page = '/index.html';
        window.location.href = '/en' + page;
    }
}
