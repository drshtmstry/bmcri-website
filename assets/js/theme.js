(function () {
    "use strict";
    const doc = document.documentElement;
    const store = localStorage;

    // Get current theme or default to 'light'
    const getTheme = () => doc.getAttribute("data-theme") || store.getItem("theme") || "light";

    // Update UI (Icons & Text) for all buttons
    const updateUI = () => {
        const theme = getTheme();
        const isDark = theme === "dark";
        const iconClass = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";

        // Text indicates the theme you will SWITCH TO
        const btnText = isDark ? "Light Mode" : "Dark Mode";

        // Select all toggle buttons
        const buttons = document.querySelectorAll("#theme-toggle, #mobile-theme-toggle, #footer-theme-btn");

        buttons.forEach(btn => {
            // 1. Update Icon (Check class first to avoid unnecessary repaints)
            const i = btn.querySelector("i");
            if (i && i.className !== iconClass) {
                i.className = iconClass;
            }

            // 2. Update Text inside Span (Check text first to PREVENT INFINITE LOOP)
            const span = btn.querySelector("span");
            if (span && span.textContent !== btnText) {
                span.textContent = btnText;
            }

            // 3. Update Hover Text Attribute (Check attribute first)
            if (btn.getAttribute("data-theme-text") !== btnText) {
                btn.setAttribute("data-theme-text", btnText);
            }
        });
    };

    // Apply Theme & Save
    const setTheme = (theme) => {
        doc.setAttribute("data-theme", theme);
        store.setItem("theme", theme);
        updateUI();
    };

    // --- INITIALIZATION ---
    // 1. Set theme immediately (prevents flash)
    doc.setAttribute("data-theme", getTheme());

    // 2. Wait for DOM to be ready
    window.addEventListener('DOMContentLoaded', () => {
        // Initial Update
        updateUI();

        // Click Listener (Delegation)
        document.addEventListener("click", (e) => {
            const btn = e.target.closest("#theme-toggle, #mobile-theme-toggle, #footer-theme-btn");
            if (btn) {
                e.preventDefault();
                setTheme(getTheme() === "dark" ? "light" : "dark");
            }
        });

        // Observer: Safely watches for injected Header/Footer
        // The checks inside updateUI() prevent this from looping infinitely
        new MutationObserver(() => updateUI())
            .observe(document.body, { childList: true, subtree: true });
    });
})();