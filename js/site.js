// FlowCHAOS website: menu, theme, gentle reveals (GSAP), documentation search, copy and zoom.
(function () {
    const root = document.documentElement;

    // ---- mobile menu ---------------------------------------------------------------
    const toggle = document.querySelector('.nav-toggle');
    const mobile = document.getElementById('mobile-nav');
    if (toggle && mobile) {
        const setOpen = (open) => {
            mobile.classList.toggle('is-open', open);
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        };
        toggle.addEventListener('click', () => setOpen(!mobile.classList.contains('is-open')));
        document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setOpen(false); });
        mobile.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
    }

    // ---- the wave dividers: a lighter wave behind each one, swaying the other way --------
    document.querySelectorAll('.wave-divider').forEach((svg) => {
        const front = svg.querySelector('path');
        if (!front || svg.querySelector('.wave-back')) return;
        const back = front.cloneNode();
        back.classList.add('wave-back');
        svg.insertBefore(back, front);
    });

    // ---- light / dark (light by default) ---------------------------------------
    const theme = document.querySelector('.theme-toggle');
    if (theme) {
        theme.addEventListener('click', () => {
            root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
            try { localStorage.setItem('fc-theme', root.dataset.theme); } catch (e) { /* private mode */ }
        });
    }

    // ---- header edge once the page scrolls -------------------------------------
    const masthead = document.querySelector('.masthead');
    const onScroll = () => masthead && masthead.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ---- gentle reveals as sections come into view (nothing stays hidden without it) ----
    if ('IntersectionObserver' in window) {
        const seen = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-in');
                    seen.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px' });
        document.querySelectorAll('.reveal').forEach((el) => seen.observe(el));
        root.classList.add('reveal-ready');
    }

    // ---- drawn lines, when GSAP is there ---------------------------------------------
    window.addEventListener('load', () => {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!window.gsap || reduced) {
            return;
        }
        document.querySelectorAll('[data-draw]').forEach((path) => {
            const length = path.getTotalLength();
            gsap.fromTo(path, { strokeDasharray: length, strokeDashoffset: length },
                { strokeDashoffset: 0, duration: 2.4, ease: 'power1.inOut', delay: 0.2 });
        });
    });

    // ---- documentation search -------------------------------------------------------
    const search = document.querySelector('[data-doc-search]');
    if (search) {
        const results = document.querySelector('[data-doc-results]');
        let index = null;
        const load = () => index ? Promise.resolve(index)
            : fetch(search.dataset.docSearch).then((r) => r.json()).then((data) => (index = data));
        const escape = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        search.addEventListener('input', () => {
            const words = search.value.toLowerCase().split(/\s+/).filter(Boolean);
            if (!words.length) { results.innerHTML = ''; results.classList.add('hidden'); return; }
            load().then((entries) => {
                const scored = entries.map((e) => {
                    const hay = `${e.page} ${e.section} ${e.text}`.toLowerCase();
                    if (!words.every((w) => hay.includes(w))) return null;
                    const score = words.reduce((s, w) => s + (e.section.toLowerCase().includes(w) ? 3 : 0)
                        + (e.page.toLowerCase().includes(w) ? 2 : 0), 0);
                    return { e, score };
                }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 8);
                results.innerHTML = scored.length ? scored.map(({ e }) => {
                    const at = e.text.toLowerCase().indexOf(words[0]);
                    const snippet = e.text.slice(Math.max(0, at - 50), at + 110);
                    return `<a class="block rounded-2xl px-4 py-3 no-underline hover:bg-foam" href="${escape(e.url)}">`
                        + `<span class="block text-sm font-semibold text-ink">${escape(e.section)}</span>`
                        + `<span class="block text-xs text-mist">${escape(e.page)}</span>`
                        + `<span class="mt-1 block text-sm text-ink-soft">${escape(snippet)}</span></a>`;
                }).join('') : '<p class="px-4 py-3 text-sm text-mist">Nothing found. Try other words.</p>';
                results.classList.remove('hidden');
            });
        });
    }

    // ---- copy buttons and screenshot zoom -------------------------------------------
    document.querySelectorAll('[data-copy]').forEach((button) => {
        button.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(button.dataset.copy);
                const label = button.textContent;
                button.textContent = 'Copied';
                setTimeout(() => { button.textContent = label; }, 1500);
            } catch (e) { /* not allowed: the text stays selectable */ }
        });
    });
    document.querySelectorAll('[data-zoom]').forEach((image) => {
        image.style.cursor = 'zoom-in';
        image.addEventListener('click', () => {
            const box = document.createElement('div');
            box.className = 'fixed inset-0 z-50 grid cursor-zoom-out place-items-center bg-ink/85 p-6';
            const big = document.createElement('img');
            big.src = image.currentSrc || image.src;
            big.alt = image.alt;
            big.className = 'max-h-[92vh] w-auto rounded-2xl shadow-2xl';
            box.appendChild(big);
            const close = () => { box.remove(); document.removeEventListener('keydown', onKey); };
            const onKey = (event) => { if (event.key === 'Escape') close(); };
            box.addEventListener('click', close);
            document.addEventListener('keydown', onKey);
            document.body.appendChild(box);
        });
    });
})();
