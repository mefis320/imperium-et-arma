'use strict';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scrollBehavior = () => reducedMotion.matches ? 'auto' : 'smooth';

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initSliders();
    initPageNavigation();
    const current = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.desktop-nav a, .mobile-nav-links a').forEach(link => {
        const active = link.getAttribute('href') === current;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });
    const topButton = document.getElementById('scrollTopBtn');
    if (topButton) {
        const update = () => { topButton.hidden = window.scrollY < 300; };
        window.addEventListener('scroll', update, {passive: true});
        topButton.addEventListener('click', () => window.scrollTo({top: 0, behavior: scrollBehavior()}));
        update();
    }
    if (window.bootstrap) {
        document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => new bootstrap.Tooltip(el));
        document.querySelectorAll('[data-bs-toggle="popover"]').forEach(el => new bootstrap.Popover(el));
    }
    revealGlossaryTerm();
    window.addEventListener('hashchange', revealGlossaryTerm);
});

function initMobileMenu() {
    const button = document.getElementById('hamburgerBtn');
    const menu = document.getElementById('mobileNav');
    if (!button || !menu) return;
    const desktop = window.matchMedia('(min-width: 992px)');
    const background = [...document.body.children].filter(el => el !== menu && el.tagName !== 'SCRIPT');
    const previousInert = new Map();
    const close = (restoreFocus = true) => {
        if (menu.hidden) return;
        menu.hidden = true;
        menu.classList.remove('active');
        button.classList.remove('active');
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-label', 'Открыть меню');
        document.body.classList.remove('menu-open');
        background.forEach(el => { el.inert = previousInert.get(el) || false; });
        if (restoreFocus && !desktop.matches) button.focus();
    };
    button.addEventListener('click', () => {
        menu.hidden = false;
        menu.classList.add('active');
        button.classList.add('active');
        button.setAttribute('aria-expanded', 'true');
        button.setAttribute('aria-label', 'Закрыть меню');
        document.body.classList.add('menu-open');
        background.forEach(el => { previousInert.set(el, el.inert); el.inert = true; });
        menu.querySelector('.mobile-nav-close').focus();
    });
    menu.querySelector('.mobile-nav-close').addEventListener('click', () => close());
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => close(false)));
    menu.addEventListener('keydown', event => {
        if (event.key === 'Escape') close();
        if (event.key !== 'Tab') return;
        const items = [...menu.querySelectorAll('button, a[href]')];
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    desktop.addEventListener('change', () => { if (desktop.matches) close(false); });
}

function initSliders() {
    document.querySelectorAll('.slider').forEach(slider => {
        const slides = [...slider.querySelectorAll('.slide')];
        if (!slides.length) return;
        let current = Math.max(0, slides.findIndex(slide => slide.classList.contains('active')));
        const show = index => {
            current = (index + slides.length) % slides.length;
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === current);
                slide.setAttribute('aria-hidden', String(i !== current));
            });
        };
        slider.setAttribute('role', 'region');
        slider.setAttribute('aria-label', 'Галерея изображений');
        slider.setAttribute('aria-roledescription', 'карусель');
        slider.tabIndex = 0;
        slider.querySelector('.next')?.addEventListener('click', () => show(current + 1));
        slider.querySelector('.prev')?.addEventListener('click', () => show(current - 1));
        slider.addEventListener('keydown', event => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                event.preventDefault();
                show(current + (event.key === 'ArrowRight' ? 1 : -1));
            }
        });
        let start = null;
        slider.addEventListener('touchstart', event => {
            start = event.touches.length === 1 ? {x:event.touches[0].clientX, y:event.touches[0].clientY} : null;
        }, {passive:true});
        slider.addEventListener('touchend', event => {
            if (!start) return;
            const dx = event.changedTouches[0].clientX - start.x;
            const dy = event.changedTouches[0].clientY - start.y;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1));
            start = null;
        }, {passive:true});
        slider.addEventListener('touchcancel', () => { start = null; }, {passive:true});
        // Manual navigation keeps captions readable and avoids many background timers.
        show(current);
    });
}

function initPageNavigation() {
    const pages = [
        ['index.html', 'Главная'], ['tools-to-weapons.html', 'Орудия → оружие'],
        ['stone-age.html', 'Каменный век'], ['metal-age.html', 'Металлы и армии'],
        ['bows-and-cavalry.html', 'Луки и конница'], ['early-firearms.html', 'Ранний огнестрел'],
        ['glossary.html', 'Глоссарий'], ['about.html', 'Об авторе']
    ];
    const index = pages.findIndex(([url]) => url === location.pathname.split('/').pop());
    if (index < 1 || index > 5 || document.querySelector('.page-navigation')) return;
    const nav = document.createElement('nav');
    nav.className = 'page-navigation page-navigation-grid';
    nav.setAttribute('aria-label', 'Навигация между эпохами');
    [[pages[index-1], '← '], [pages[0], ''], [pages[index+1], '→ ']].forEach(([[url,title],prefix]) => {
        const link = document.createElement('a');
        link.href = url;
        link.className = 'btn btn-outline-danger';
        link.textContent = prefix + title;
        nav.append(link);
    });
    document.querySelector('main')?.append(nav);
}

function revealGlossaryTerm() {
    if (!location.pathname.endsWith('glossary.html') || !location.hash) return;
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const term = document.getElementById(id);
    if (!term) return;
    const reveal = () => {
        term.scrollIntoView({behavior: scrollBehavior(), block:'center'});
        term.classList.add('highlight-term');
        setTimeout(() => term.classList.remove('highlight-term'), 3000);
    };
    const panel = term.closest('.accordion-collapse');
    if (panel && !panel.classList.contains('show')) {
        if (window.bootstrap) {
            panel.addEventListener('shown.bs.collapse', reveal, {once:true});
            bootstrap.Collapse.getOrCreateInstance(panel, {toggle:false}).show();
        } else {
            panel.classList.add('show');
            reveal();
        }
    } else reveal();
}
