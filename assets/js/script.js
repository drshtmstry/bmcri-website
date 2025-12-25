document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // 1. CONFIGURATION
    // Gets the base path defined in HTML, or defaults to root
    const BASE = window.SITE_BASE || './';

    // 2. HELPER: Fix Links AND Images (Header, Footer, History Logo, etc.)
    function fixNavLinks() {
        // Select links (href) and images (src) in Header and Footer
        const selectors = '#global-header a[href], #global-footer a[href], #global-header img[src], #global-footer img[src]';

        document.querySelectorAll(selectors).forEach(el => {
            const attr = el.tagName === 'IMG' ? 'src' : 'href';
            const val = el.getAttribute(attr);

            // Skip external links, anchors, or special protocols
            if (!val || val.startsWith('http') || val.startsWith('//') ||
                val.startsWith('mailto:') || val.startsWith('tel:') ||
                val.startsWith('#') || val.startsWith('data:')) return;

            // Clean path (remove ./ or /) and prepend BASE
            const cleanPath = val.replace(/^\.?\//, '');
            el.setAttribute(attr, BASE + cleanPath);
        });
    }

    // 3. HELPER: Scroll Reveal Animation
    function initScrollReveal() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        setTimeout(() => {
            document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
        }, 100);
    }

    // 4. SLIDESHOW LOGIC (Restored)
    async function initSlideshow() {
        const box = document.getElementById("dynamic-slideshow");
        if (!box) return; // Exit if not on homepage

        // Internal Helper: Start rotation and click events
        const startRotation = () => {
            const slides = box.querySelectorAll(".hero-slide");
            if (!slides.length) return;

            let current = 0;
            let timer;

            const showSlide = (n) => {
                slides[current].classList.remove("active");
                current = (n + slides.length) % slides.length; // Loop around
                slides[current].classList.add("active");
            };

            const startTimer = () => timer = setInterval(() => showSlide(current + 1), 5000);
            const resetTimer = () => { clearInterval(timer); startTimer(); };

            // Bind Next/Prev Buttons
            const nextBtn = box.querySelector(".slide-btn.next");
            const prevBtn = box.querySelector(".slide-btn.prev");

            if (nextBtn) nextBtn.onclick = (e) => { e.stopPropagation(); showSlide(current + 1); resetTimer(); };
            if (prevBtn) prevBtn.onclick = (e) => { e.stopPropagation(); showSlide(current - 1); resetTimer(); };

            startTimer();
        };

        // Fetch Images & Shuffle
        try {
            const res = await fetch(BASE + "assets/slideshow/slideshow.json");
            if (!res.ok) throw new Error("Slideshow JSON not found");

            let images = await res.json();

            // Shuffle Array (Fisher-Yates)
            for (let i = images.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [images[i], images[j]] = [images[j], images[i]];
            }

            // Inject Images into DOM
            const overlay = box.querySelector(".slide-overlay");
            images.forEach((src, i) => {
                const div = document.createElement("div");
                div.className = `hero-slide ${i === 0 ? "active" : ""}`;
                // Use BASE for image path
                div.innerHTML = `<img src="${BASE}assets/slideshow/${src}" alt="Slide" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}>`;
                box.insertBefore(div, overlay);
            });

            startRotation();

        } catch (e) {
            console.warn("Slideshow Error:", e);
            // Attempt to run anyway (in case static images exist in HTML)
            startRotation();
        }
    }

    // 5. COMPONENT LOADER (Header/Footer)
    async function loadSharedComponents() {
        try {
            // Header
            const headerReq = await fetch(BASE + 'header.html');
            if (headerReq.ok) {
                document.getElementById('global-header').innerHTML = await headerReq.text();
                fixNavLinks();    // Fix links immediately
                initNavigation(); // Bind mobile menu events
            }

            // Footer
            const footerReq = await fetch(BASE + 'footer.html');
            if (footerReq.ok) {
                document.getElementById('global-footer').innerHTML = await footerReq.text();
                fixNavLinks();    // Fix links/icons immediately
                const yearEl = document.getElementById("current-year");
                if (yearEl) yearEl.textContent = new Date().getFullYear();
            }
        } catch (error) {
            console.error("Error loading components:", error);
        }
    }

    // 6. HOMEPAGE CONTENT LOADER
    async function loadHomeContent() {
        const mainContent = document.getElementById("main-content-area");
        if (!mainContent) return; // Not homepage

        try {
            const res = await fetch(BASE + "homepage.html");
            if (res.ok) {
                mainContent.innerHTML = await res.text();

                // Re-run setup for the new content
                initScrollReveal();
                initSlideshow(); // <--- This triggers the slideshow now
            }
        } catch (e) {
            console.error("Error loading homepage:", e);
        }
    }

    // 7. NAVIGATION LOGIC (Mobile & Active State)
    function initNavigation() {
        // Active Link Highlight
        const currentPath = window.location.pathname;
        const currentFile = currentPath.split('/').pop() || 'index.html';

        document.querySelectorAll(".nav-list a").forEach(link => {
            const href = link.getAttribute("href");
            if (!href) return;
            if (href.endsWith(currentFile)) {
                link.classList.add("active");
                const parent = link.closest(".nav-item");
                if (parent) parent.querySelector(".nav-link")?.classList.add("active");
            }
        });

        // Mobile Menu Toggles
        const btn = document.querySelector(".mobile-menu-toggle");
        const nav = document.querySelector(".nav-list");
        const overlay = document.getElementById("sidebar-overlay");

        if (btn && nav) {
            const toggle = (forceClose) => {
                const isActive = forceClose ? false : !nav.classList.contains("active");
                nav.classList.toggle("active", isActive);
                btn.classList.toggle("active", isActive);
                if (overlay) overlay.classList.toggle("active", isActive);
                document.body.style.overflow = isActive ? "hidden" : "";
            };

            btn.onclick = (e) => { e.stopPropagation(); toggle(); };
            if (overlay) overlay.onclick = () => toggle(true);

            nav.onclick = (e) => {
                const link = e.target.closest("a");
                if (!link) return;
                const sub = link.nextElementSibling;
                if (sub && (sub.matches('.dropdown-menu') || sub.matches('.dropdown-submenu'))) {
                    e.preventDefault(); e.stopPropagation();
                    link.parentElement.classList.toggle("dropdown-active");
                } else {
                    toggle(true);
                }
            };
        }
    }

    // --- EXECUTE ---
    loadSharedComponents();
    loadHomeContent();
    initScrollReveal();
});