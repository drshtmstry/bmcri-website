document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // --- 1. ROBUST BASE PATH DETECTION ---
    const getBasePath = () => {
        const path = window.location.pathname;
        // The name of your GitHub repository
        const repoName = '/bmcri-website';

        // Check if we are hosted on GitHub Pages (or a folder named bmcri-website)
        // If the URL starts with "/bmcri-website", that is our root.
        if (path.indexOf(repoName) === 0) {
            return repoName + '/';
        }

        // Otherwise, we are at the server root (Vercel, Live Server root, etc.)
        return '/';
    };

    const BASE = getBasePath();
    console.log("Calculated Site Base:", BASE); // Check console to verify path

    // --- 2. HELPER: Fix Links AND Images ---
    function fixNavLinks() {
        // Target all links and images in the global header and footer
        const selectors = '#global-header a[href], #global-footer a[href], #global-header img[src], #global-footer img[src]';

        document.querySelectorAll(selectors).forEach(el => {
            const attr = el.tagName === 'IMG' ? 'src' : 'href';
            const val = el.getAttribute(attr);

            // Safety Check: Skip empty, external, mailto, tel, javascript, or anchors
            if (!val || val.startsWith('http') || val.startsWith('//') ||
                val.startsWith('mailto:') || val.startsWith('tel:') ||
                val.startsWith('#') || val.startsWith('data:')) {
                return;
            }

            // CLEAN THE PATH: 
            // 1. Remove leading './' or '/'
            // 2. Remove leading '../' (recursively) to prevent "up-directory" errors
            // This assumes your header.html links are written relative to the Home Page.
            let cleanPath = val.replace(/^(\.?\/)/, '');

            // Strip any "../" attempts (e.g. "../index.html" becomes "index.html")
            while (cleanPath.startsWith('../')) {
                cleanPath = cleanPath.substring(3);
            }

            // APPLY BASE:
            // Result is always Absolute: "/about.html" or "/bmcri-website/about.html"
            // This works from ANY depth (level 1, 2, or 10)
            el.setAttribute(attr, BASE + cleanPath);
        });
    }

    // --- 3. HELPER: Scroll Reveal ---
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

    // --- 4. SLIDESHOW LOGIC ---
    async function initSlideshow() {
        const box = document.getElementById("dynamic-slideshow");
        if (!box) return;

        const startRotation = () => {
            const slides = box.querySelectorAll(".hero-slide");
            if (!slides.length) return;
            let current = 0;
            let timer;
            const showSlide = (n) => {
                slides[current].classList.remove("active");
                current = (n + slides.length) % slides.length;
                slides[current].classList.add("active");
            };
            const startTimer = () => timer = setInterval(() => showSlide(current + 1), 5000);
            const resetTimer = () => { clearInterval(timer); startTimer(); };

            const nextBtn = box.querySelector(".slide-btn.next");
            const prevBtn = box.querySelector(".slide-btn.prev");
            if (nextBtn) nextBtn.onclick = (e) => { e.stopPropagation(); showSlide(current + 1); resetTimer(); };
            if (prevBtn) prevBtn.onclick = (e) => { e.stopPropagation(); showSlide(current - 1); resetTimer(); };
            startTimer();
        };

        try {
            const res = await fetch(BASE + "assets/slideshow/slideshow.json");
            if (!res.ok) throw new Error("Slideshow JSON not found");
            let images = await res.json();

            // Shuffle
            for (let i = images.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [images[i], images[j]] = [images[j], images[i]];
            }

            const overlay = box.querySelector(".slide-overlay");
            images.forEach((src, i) => {
                const div = document.createElement("div");
                div.className = `hero-slide ${i === 0 ? "active" : ""}`;
                div.innerHTML = `<img src="${BASE}assets/slideshow/${src}" alt="Slide" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}>`;
                box.insertBefore(div, overlay);
            });
            startRotation();
        } catch (e) {
            console.warn("Slideshow Error:", e);
            startRotation();
        }
    }

    // --- 5. COMPONENT LOADER ---
    async function loadSharedComponents() {
        try {
            const getComp = async (file) => {
                const req = await fetch(BASE + file);
                return req.ok ? await req.text() : null;
            };

            const headerHTML = await getComp('header.html');
            if (headerHTML) {
                document.getElementById('global-header').innerHTML = headerHTML;
                fixNavLinks(); // Fix links immediately after injecting header
                initNavigation();
            }

            const footerHTML = await getComp('footer.html');
            if (footerHTML) {
                document.getElementById('global-footer').innerHTML = footerHTML;
                fixNavLinks(); // Fix links immediately after injecting footer
                const yearEl = document.getElementById("current-year");
                if (yearEl) yearEl.textContent = new Date().getFullYear();
            }
        } catch (error) {
            console.error("Error loading components:", error);
        }
    }

    // --- 6. HOMEPAGE CONTENT LOADER ---
    async function loadHomeContent() {
        const mainContent = document.getElementById("main-content-area");
        if (!mainContent) return;

        try {
            const res = await fetch(BASE + "homepage.html");
            if (res.ok) {
                mainContent.innerHTML = await res.text();
                fixNavLinks(); // Run fix again for homepage content
                initScrollReveal();
                initSlideshow();
            }
        } catch (e) {
            console.error("Error loading homepage:", e);
        }
    }

    // --- 7. NAVIGATION LOGIC ---
    function initNavigation() {
        const currentPath = window.location.pathname;
        const currentFile = currentPath.split('/').pop() || 'index.html';

        document.querySelectorAll(".nav-list a").forEach(link => {
            const href = link.getAttribute("href");
            if (!href) return;
            // Robust active check
            if (href.endsWith(currentFile)) {
                link.classList.add("active");
                const parent = link.closest(".nav-item");
                if (parent) parent.querySelector(".nav-link")?.classList.add("active");
            }
        });

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