const THEME_STORAGE_KEY = 'portfolio-theme';
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const PIXEL_COLORS = ['#4d9de0', '#ff7a3d', '#f4f1e8'];
const ROLES = ['Student', 'Yearner', 'Yapper', 'Gamer', 'Builder', 'Designer', 'Noobie'];

const hasSource = (img) => (img.getAttribute('src') || '').trim() !== '';
const randomFrom = (list) => list[Math.floor(Math.random() * list.length)];

/* ---------- Theme (dark by default) ---------- */

function initThemeToggle() {
    const root = document.documentElement;
    const buttons = document.querySelectorAll('.theme-opt');

    const sync = () => {
        const current = root.dataset.theme === 'light' ? 'light' : 'dark';
        buttons.forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.theme === current)));
    };

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            root.dataset.theme = btn.dataset.theme;
            try { localStorage.setItem(THEME_STORAGE_KEY, btn.dataset.theme); } catch (e) { /* storage unavailable */ }
            sync();
        });
    });

    sync();
}

/* ---------- Image fallbacks ---------- */

function initImageFallbacks(itemSelector, imgSelector, fallbackSelector) {
    document.querySelectorAll(itemSelector).forEach(item => {
        const imgs = item.querySelectorAll(imgSelector);
        const fallback = item.querySelector(fallbackSelector);

        const showFallback = () => {
            imgs.forEach(img => { img.style.display = 'none'; });
            if (fallback) fallback.style.display = 'flex';
        };

        imgs.forEach(img => {
            if (!hasSource(img)) return showFallback();
            img.addEventListener('error', showFallback);
        });
    });
}

/* ---------- Pixel avatar (stacked voxel-style layers = real 3D) ---------- */

// Tweak these colours to match yourself (hair, skin, hoodie, pants, shoes).
const AVATAR_PALETTE = {
    O: '#1b1f4a',               // outline
    H: '#4a3226', h: '#6b4a38', // hair, hair highlight
    S: '#f0b48a', s: '#d99a72', C: '#e98f7a', // skin, skin shade, cheeks
    E: '#1b1f4a',               // eyes
    T: '#15151c', t: '#2e2e3a', W: '#d9d9e2', // black hoodie, folds/pocket, drawstrings
    P: '#384a8f',               // pants
    B: '#f4f1e8',               // shoes
};

const AVATAR_MAP = [
    '.....OOOOOOOO.....',
    '...OOHHHHHHHHOO...',
    '..OHHHHhhHHHHHHO..',
    '..OHHHHHHHHHHHHO..',
    '..OHHSSSSSSSSHHO..',
    '..OHSSSSSSSSSsHO..',
    '..OSSSSSSSSSSSsO..',
    '..OSSSESSSSESSsO..',
    '..OSSSESSSSESSsO..',
    '..OSCSSSSSSSSCsO..',
    '..OSSSSSSSSSSSsO..',
    '...OOSSSSSSSSOO...',
    '....OOOOOOOOOO....',
    '...OTTTWTTWTTTO...',
    '...OTTtWTTWtTTO...',
    '...OTttttttttTO...',
    '...OSSTTTTTTSSO...',
    '...OOOOTTTTOOOO...',
    '....OPPPPPPPPO....',
    '....OPPPOOPPPO....',
    '....OBBBOOBBBO....',
    '....OOOO..OOOO....',
];

function initPixelAvatar() {
    const host = document.getElementById('pixel-avatar');
    if (!host) return;

    const LAYERS = 20, GAP = 2; // slices and px between them
    const NS = 'http://www.w3.org/2000/svg';
    const W = AVATAR_MAP[0].length, H = AVATAR_MAP.length;

    // Darkened copy of a colour for the side slices (no CSS filters: they glitch in 3D)
    const shade = (hex, k) => '#' + [1, 3, 5]
        .map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');

    let eyes = [];
    const makeLayer = (k, isFront) => {
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        svg.setAttribute('class', 'avatar-layer');
        svg.setAttribute('aria-hidden', 'true');
        const add = (x, y, w, ch) => {
            const r = document.createElementNS(NS, 'rect');
            r.setAttribute('x', x); r.setAttribute('y', y);
            r.setAttribute('width', w + 0.02); r.setAttribute('height', 1.02); // tiny overlap hides seams
            r.setAttribute('fill', k === 1 ? AVATAR_PALETTE[ch] : shade(AVATAR_PALETTE[ch], k));
            svg.appendChild(r);
            return r;
        };
        AVATAR_MAP.forEach((row, y) => {
            let x = 0;
            while (x < W) {
                const ch = row[x];
                if (ch === '.') { x++; continue; }
                let end = x + 1;
                if (ch !== 'E') while (end < W && row[end] === ch) end++; // merge runs into one rect
                const r = add(x, y, end - x, ch);
                if (isFront && ch === 'E') eyes.push(r);
                x = end;
            }
        });
        return svg;
    };

    const stack = document.createElement('div');
    stack.className = 'avatar-stack';
    for (let i = 0; i < LAYERS; i++) {
        const front = i === LAYERS - 1;
        const layer = makeLayer(front ? 1 : 0.55, front);
        layer.style.transform = `translateZ(${(i - (LAYERS - 1) / 2) * GAP}px)`;
        stack.appendChild(layer);
    }
    host.appendChild(stack);

    // Blink every few seconds (front slice only)
    if (!prefersReducedMotion) {
        setInterval(() => {
            eyes.forEach(e => e.setAttribute('height', 0.2));
            setTimeout(() => eyes.forEach(e => e.setAttribute('height', 1.02)), 120);
        }, 4000);
    }

    // One animation loop drives the rotation: it eases toward the cursor, or sways when idle.
    const clamp = (v, max) => Math.max(-max, Math.min(max, v));
    let goalY = null, goalX = null, ry = 0, rx = -6;

    document.addEventListener('pointermove', (e) => {
        const box = stack.getBoundingClientRect();
        const dx = (e.clientX - (box.left + box.width / 2)) / (window.innerWidth / 2);
        const dy = (e.clientY - (box.top + box.height / 2)) / (window.innerHeight / 2);
        goalY = clamp(dx, 1) * 32;
        goalX = -6 - clamp(dy, 1) * 14;
    });
    document.documentElement.addEventListener('pointerleave', () => { goalY = goalX = null; });

    const frame = (t) => {
        const idle = prefersReducedMotion ? 0 : Math.sin(t / 1000) * 22;
        ry += ((goalY ?? idle) - ry) * 0.1;
        rx += ((goalX ?? -6) - rx) * 0.1;
        stack.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
        requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
}

/* ---------- Hero decoration ---------- */

function spawnStars(container, count, maxHeightPercent) {
    if (!container) return;

    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        const roll = Math.random();
        // Mostly 3-5px glowing dots, with a few larger four-point sparkles
        const size = roll < 0.12 ? 11 : roll < 0.4 ? 5 : roll < 0.75 ? 4 : 3;
        star.className = size === 11 ? 'star sparkle' : 'star';
        Object.assign(star.style, {
            width: `${size}px`,
            height: `${size}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * maxHeightPercent}%`,
            animationDelay: `${Math.random() * 3}s`,
        });
        container.appendChild(star);
    }
}

/* Pixel mountains + pine trees at the bottom of the hero */
function initHeroScene() {
    const host = document.getElementById('hero-scene');
    if (!host) return;

    const COLS = 80, PX = 4, H = 100, NS = 'http://www.w3.org/2000/svg';
    const peaks = (base, amp, seed) => Array.from({ length: COLS }, (_, i) => {
        const wave = (1 - Math.abs(Math.sin(i / 7 + seed))) * 0.75 + (1 - Math.abs(Math.sin(i / 3.1 + seed * 2))) * 0.25;
        return Math.round((base + amp * wave) / 3) * 3;
    });
    const rolling = Array.from({ length: COLS }, (_, i) => Math.round((10 + 4 * Math.sin(i / 5 + 2.5)) / 3) * 3);

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${COLS * PX} ${H}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMax slice');
    svg.setAttribute('aria-hidden', 'true');

    const rect = (cls, x, y, w, h) => {
        const r = document.createElementNS(NS, 'rect');
        r.setAttribute('class', cls);
        r.setAttribute('x', x); r.setAttribute('y', y);
        r.setAttribute('width', w); r.setAttribute('height', h);
        svg.appendChild(r);
    };
    const layer = (cls, heights) => heights.forEach((h, i) => rect(cls, i * PX, H - h, PX, h));

    const nearRidge = peaks(22, 26, 4);
    layer('scene-far', peaks(36, 34, 1));
    layer('scene-near', nearRidge);
    layer('scene-ground', rolling);

    // Layered pines. Every tier is wider than the one above it, the left side catches
    // the light, the bottom row of each tier sits in shadow, and a short trunk shows below.
    const NEAR = { hi: 't-hi', mid: 't-mid', lo: 't-lo', trunk: 't-trunk' };
    const FAR = { hi: 'f-hi', mid: 'f-mid', lo: 'f-lo', trunk: 'f-trunk' };
    const ROWS_PER_TIER = 3;

    const pine = (col, bottom, tiers, u, set) => {
        const cx = col * PX + PX / 2;
        const top = bottom - u - tiers * ROWS_PER_TIER * u;
        rect(set.trunk, cx - u / 2, bottom - 2 * u, u, 2 * u);
        for (let t = 0; t < tiers; t++) {
            for (let r = 0; r < ROWS_PER_TIER; r++) {
                const half = t + r; // (cells - 1) / 2 for a row that is 2t + 2r + 1 cells wide
                const y = top + (t * ROWS_PER_TIER + r) * u;
                const inShadow = r === ROWS_PER_TIER - 1;
                rect(inShadow ? set.mid : set.hi, cx - u / 2 - half * u, y, (half + 1) * u, u);
                if (half > 0) rect(inShadow ? set.lo : set.mid, cx + u / 2, y, half * u, u);
            }
        }
    };

    // Small trees along the far ridge, then the forest in front. The two big trees frame the scene.
    [5, 13, 21, 30, 36, 45, 51, 60, 68, 74].forEach(col => pine(col, H - nearRidge[col], 2, 2, FAR));

    const SIZES = { A: [2, 3], B: [3, 3], C: [3, 4] }; // [tiers, pixel size]
    const FOREST = [
        [2, 'C'], [8, 'A'], [13, 'B'],
        [22, 'A'], [27, 'B'], [32, 'A'],
        [41, 'A'], [46, 'B'],
        [55, 'A'], [60, 'B'], [65, 'A'],
        [72, 'B'], [77, 'C'],
    ];
    FOREST.forEach(([col, size]) => pine(col, H - rolling[col], ...SIZES[size], NEAR));

    host.appendChild(svg);
}

function initIntro() {
    const intro = document.getElementById('intro');
    const grid = document.getElementById('intro-grid');
    const root = document.documentElement;
    const fillMeters = () => document.querySelectorAll('.meter').forEach(el => el.classList.add('animate'));

    if (!intro || !grid || prefersReducedMotion) {
        if (intro) intro.remove();
        fillMeters();
        return;
    }

    // Pixel-block curtain: one cell per 56px square, wiping away diagonally.
    const SIZE = 56;
    const cols = Math.ceil(window.innerWidth / SIZE);
    const rows = Math.ceil(window.innerHeight / SIZE);
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    const frag = document.createDocumentFragment();
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const cell = document.createElement('span');
            cell.className = 'intro-cell';
            cell.style.setProperty('--d', `${(((x + y) / (cols + rows)) * 0.5 + Math.random() * 0.1).toFixed(2)}s`);
            frag.appendChild(cell);
        }
    }
    grid.appendChild(frag);

    root.classList.add('intro-lock');

    const HOLD_MS = 1100;      // logo is on screen
    const DISSOLVE_MS = 1100;  // blocks wipe away

    setTimeout(() => {
        intro.classList.add('is-leaving');
        fillMeters();
        setTimeout(() => {
            intro.classList.add('is-done');
            root.classList.remove('intro-lock');
        }, DISSOLVE_MS);
    }, HOLD_MS);
}

function initRoleCycler() {
    const word = document.getElementById('role-word');
    if (!word) return;

    // Reduced motion: show every role at once instead of cycling.
    if (prefersReducedMotion) {
        word.textContent = ROLES.join(', ');
        return;
    }

    let index = 0;
    setInterval(() => {
        word.classList.add('is-fading');
        setTimeout(() => {
            index = (index + 1) % ROLES.length;
            word.textContent = ROLES[index];
            word.classList.remove('is-fading');
        }, 300);
    }, 2600);
}

function initMusicPlayer() {
    const button = document.getElementById('music-toggle');
    const audio = document.getElementById('favorite-song');
    if (!button || !audio) return;

    const row = button.closest('.music-row');
    const setPlaying = (isPlaying) => {
        button.classList.toggle('is-playing', isPlaying);
        if (row) row.classList.toggle('is-playing', isPlaying);
        button.setAttribute('aria-label', isPlaying ? 'Pause favorite song' : 'Play favorite song');
    };

    button.addEventListener('click', () => {
        if (audio.paused) audio.play().catch(() => setPlaying(false));
        else audio.pause();
    });

    audio.addEventListener('play', () => setPlaying(true));
    audio.addEventListener('pause', () => setPlaying(false));
    audio.addEventListener('ended', () => setPlaying(false));
    audio.addEventListener('error', () => {
        console.error('Audio failed to load. Check that audio/celestial.mp3 exists and the filename matches exactly.');
        setPlaying(false);
    });
}

/* ---------- Navigation ---------- */

function initTopMenu() {
    const menu = document.getElementById('site-menu');
    if (!menu) return;

    const toggle = menu.querySelector('.menu-toggle');
    const navButtons = menu.querySelectorAll('.nav-btn');

    // The menu collapses into a popover on narrow screens.
    const setOpen = (isOpen) => {
        menu.classList.toggle('is-open', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    };

    toggle.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
    document.addEventListener('pointerdown', (e) => { if (!menu.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.classList.contains('is-open')) {
            setOpen(false);
            toggle.focus();
        }
    });

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = document.getElementById(btn.dataset.target);
            if (target) target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
            setOpen(false);
        });
    });

    // Mark the section that crosses the middle of the viewport.
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            navButtons.forEach(btn => {
                const isActive = btn.dataset.target === entry.target.id;
                btn.classList.toggle('active', isActive);
                if (isActive) btn.setAttribute('aria-current', 'true');
                else btn.removeAttribute('aria-current');
            });
        });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    navButtons.forEach(btn => {
        const section = document.getElementById(btn.dataset.target);
        if (section) observer.observe(section);
    });
}

function initBrandScrollTop() {
    const brand = document.getElementById('brand-mark');
    if (!brand) return;

    const toTop = () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    brand.addEventListener('click', toTop);
    brand.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toTop();
        }
    });
}

/* ---------- Links ---------- */

function initExternalLinks() {
    document.querySelectorAll('[data-url]').forEach(btn => {
        btn.addEventListener('click', () => {
            const url = btn.dataset.url;
            if (url && url !== '#') window.open(url, '_blank', 'noopener');
        });
    });

    const emailBtn = document.getElementById('email-btn');
    if (emailBtn) {
        emailBtn.addEventListener('click', () => {
            window.location.href = `mailto:${emailBtn.dataset.mailto}`;
        });
    }
}

/* ---------- Project sheet ---------- */

function initProjectSheet() {
    const sheet = document.getElementById('project-sheet');
    if (!sheet) return;

    const imgEl = document.getElementById('sheet-img');
    const titleEl = document.getElementById('sheet-title');
    const descEl = document.getElementById('sheet-desc');
    const featuresEl = document.getElementById('sheet-features');
    const storyEl = document.getElementById('sheet-story');

    function openFor(card) {
        const thumbImg = card.querySelector('.project-thumb img');
        const title = card.querySelector('.project-title');
        const desc = card.querySelector('.project-desc');

        titleEl.textContent = title ? title.textContent.trim() : '';
        descEl.textContent = desc ? desc.textContent.replace(/\s+/g, ' ').trim() : '';
        storyEl.textContent = card.dataset.story || '';

        if (thumbImg) {
            imgEl.src = thumbImg.getAttribute('src') || '';
            imgEl.alt = thumbImg.getAttribute('alt') || '';
            imgEl.parentElement.style.display = '';
        } else {
            imgEl.parentElement.style.display = 'none';
        }

        featuresEl.replaceChildren(
            ...(card.dataset.features || '')
                .split('|')
                .map(f => f.trim())
                .filter(Boolean)
                .map(f => {
                    const li = document.createElement('li');
                    li.textContent = f;
                    return li;
                })
        );

        sheet.showModal();
    }

    document.querySelectorAll('.project-card').forEach(card => {
        // Mouse users can click anywhere on the card; keyboard users use the Details button.
        card.addEventListener('click', (e) => {
            if (!e.target.closest('button')) openFor(card);
        });
        card.querySelector('.project-details').addEventListener('click', () => openFor(card));
    });

    document.getElementById('sheet-close').addEventListener('click', () => sheet.close());
    // A click on the dimmed area outside the sheet lands on the dialog element itself.
    sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.close(); });
}

/* ---------- Scroll reveal ---------- */

function initScrollReveal() {
    const REVEAL_RATIO = 0.12;
    const selector = [
        '.sec-head', '.card', '.project-card', '.gallery-item',
        '.about-grid > .grouped', '.tag-rows',
        '.academic-grid > .grouped'
    ].join(', ');
    const targets = Array.from(document.querySelectorAll(selector)).filter(el => !el.closest('#hero'));

    targets.forEach((el, i) => {
        el.classList.add('reveal-bounce');
        el.style.setProperty('--reveal-delay', `${(i % 4) * 0.08}s`);

        // Once the entrance has played, drop the reveal classes so hover effects can use transform.
        el.addEventListener('animationend', (e) => {
            if (e.target !== el || e.animationName !== 'revealBounce') return;
            el.classList.remove('reveal-bounce', 'in-view');
            el.style.removeProperty('--reveal-delay');
        });
    });

    if (prefersReducedMotion) {
        targets.forEach(el => el.classList.add('in-view'));
        return;
    }

    // Each element bounces in once, the first time it appears.
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.intersectionRatio < REVEAL_RATIO) return;
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
        });
    }, { threshold: [0, REVEAL_RATIO], rootMargin: '0px 0px -40px 0px' });

    targets.forEach(el => observer.observe(el));
}

/* ---------- Technical skills: tap to reveal on touch screens ---------- */

function initSkillCards() {}

/* ---------- Info card: photo and tilt ---------- */

// Head-and-shoulders crop of the avatar, drawn flat for the card photo.
function initIdPhoto() {
    const svg = document.getElementById('id-photo-svg');
    if (!svg) return;

    const NS = 'http://www.w3.org/2000/svg';
    const rect = (parent, x, y, w, h, fill, cls) => {
        const r = document.createElementNS(NS, 'rect');
        r.setAttribute('x', x);
        r.setAttribute('y', y);
        r.setAttribute('width', w + 0.02); // tiny overlap hides seams
        r.setAttribute('height', h + 0.02);
        r.setAttribute('fill', fill);
        if (cls) r.setAttribute('class', cls);
        parent.appendChild(r);
        return r;
    };

    // Everything lives in one group so the whole figure can breathe together.
    const figure = document.createElementNS(NS, 'g');
    figure.setAttribute('class', 'id-figure');
    svg.appendChild(figure);

    const rows = AVATAR_MAP.slice(0, 17);
    const eyes = [];

    rows.forEach((row, y) => {
        let x = 0;
        while (x < row.length) {
            const ch = row[x];
            if (ch === '.') { x++; continue; }

            // Eyes are drawn on top of skin so a blink closes onto skin, not a hole.
            if (ch === 'E') {
                rect(figure, x, y, 1, 1, AVATAR_PALETTE.S);
                if (rows[y - 1] && rows[y - 1][x] === 'E') { x++; continue; } // second row of a tall eye
                eyes.push([x, y]);
                x++;
                continue;
            }

            let end = x + 1;
            while (end < row.length && row[end] === ch) end++;
            rect(figure, x, y, end - x, 1, AVATAR_PALETTE[ch]);
            x = end;
        }
    });

    eyes.forEach(([x, y]) => rect(figure, x, y, 1, 2, AVATAR_PALETTE.E, 'id-eye'));
}

// The card leans toward the pointer, with a soft light that follows it.
function initInfoCardTilt() {
    const card = document.querySelector('.info-card');
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!card || !canHover || prefersReducedMotion) return;

    const MAX_X = 6, MAX_Y = 8; // degrees
    const reset = () => {
        card.classList.remove('is-tilting');
        ['--rx', '--ry', '--mx', '--my'].forEach(v => card.style.removeProperty(v));
    };

    card.addEventListener('pointermove', (e) => {
        const box = card.getBoundingClientRect();
        const px = (e.clientX - box.left) / box.width;
        const py = (e.clientY - box.top) / box.height;
        card.style.setProperty('--rx', `${((0.5 - py) * 2 * MAX_X).toFixed(2)}deg`);
        card.style.setProperty('--ry', `${((px - 0.5) * 2 * MAX_Y).toFixed(2)}deg`);
        card.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
        card.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
        card.classList.add('is-tilting');
    });
    card.addEventListener('pointerleave', reset);
}

/* ---------- Custom cursor (cursors/pointer.svg + cursors/target.svg) ---------- */

function initCustomCursor() {
    const cursor = document.getElementById('cursor');
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!cursor || !canHover) return;

    const root = document.documentElement;
    const INTERACTIVE = 'a[href], button, summary, [role="button"], [data-url], .project-card, input, select, textarea, label';
    const supportsPopover = typeof cursor.showPopover === 'function';

    // Only swap the native cursor out once both images are known to load,
    // so a wrong path never leaves the page without a cursor.
    const probe = (src) => new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
    });
    const sources = Array.from(cursor.querySelectorAll('img')).map(img => img.getAttribute('src'));

    Promise.all(sources.map(probe)).then(results => {
        if (results.every(Boolean)) start();
        else console.warn('Custom cursor skipped. Check that cursors/pointer.svg and cursors/target.svg exist.');
    });

    function start() {
        let x = -100, y = -100;
        let frameQueued = false, recheckTarget = false, shown = false;

        const setTarget = (el) => cursor.classList.toggle('is-target', Boolean(el && el.closest(INTERACTIVE)));

        const paint = () => {
            frameQueued = false;
            cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            if (recheckTarget) {
                recheckTarget = false;
                setTarget(document.elementFromPoint(x, y));
            }
        };
        const queue = () => {
            if (frameQueued) return;
            frameQueued = true;
            requestAnimationFrame(paint);
        };

        root.classList.add('has-custom-cursor');
        if (supportsPopover) {
            try { cursor.showPopover(); } catch (e) { /* stays a normal fixed element */ }
        }

        document.addEventListener('pointermove', (e) => {
            if (e.pointerType !== 'mouse') return;
            x = e.clientX;
            y = e.clientY;
            if (!shown) {
                shown = true;
                cursor.classList.add('is-visible');
            }
            queue();
        }, { passive: true });

        document.addEventListener('pointerover', (e) => {
            if (e.pointerType === 'mouse') setTarget(e.target);
        }, { passive: true });

        // Scrolling moves content under a still pointer, so look again.
        window.addEventListener('scroll', () => { recheckTarget = true; queue(); }, { passive: true });

        document.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse') cursor.classList.add('is-down');
        });
        ['pointerup', 'pointercancel', 'dragend'].forEach(type =>
            document.addEventListener(type, () => cursor.classList.remove('is-down')));

        root.addEventListener('pointerleave', () => {
            shown = false;
            cursor.classList.remove('is-visible', 'is-down');
        });

        // A modal dialog sits in the top layer, so lift the cursor above it again.
        const sheet = document.getElementById('project-sheet');
        if (sheet) {
            new MutationObserver(() => {
                if (supportsPopover) {
                    try { cursor.hidePopover(); cursor.showPopover(); } catch (e) { /* ignore */ }
                } else {
                    root.classList.toggle('has-custom-cursor', !sheet.open);
                }
            }).observe(sheet, { attributes: true, attributeFilter: ['open'] });
        }
    }
}

/* ---------- Contact particles and footer ---------- */

function initContactPixelField() {
    const AREA_PER_PARTICLE = 9000;

    const canvas = document.getElementById('pixel-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];

    function setup() {
        const section = document.getElementById('contact');
        canvas.width = section.offsetWidth;
        canvas.height = section.offsetHeight;

        const count = Math.floor((canvas.width * canvas.height) / AREA_PER_PARTICLE);
        particles = Array.from({ length: count }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() < 0.5 ? 3 : 5,
            speedX: prefersReducedMotion ? 0 : (Math.random() - 0.5) * 0.4,
            speedY: prefersReducedMotion ? 0 : (Math.random() - 0.5) * 0.4,
            color: randomFrom(PIXEL_COLORS),
            alpha: Math.random() * 0.5 + 0.2,
        }));
    }

    function step() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x = (p.x + p.speedX + canvas.width) % canvas.width;
            p.y = (p.y + p.speedY + canvas.height) % canvas.height;
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        ctx.globalAlpha = 1;
        requestAnimationFrame(step);
    }

    window.addEventListener('resize', setup);
    setup();
    step();
}

function initFooterYear() {
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
}

/* ---------- Boot ---------- */

initThemeToggle();
spawnStars(document.getElementById('stars-container'), 70, 65);
initImageFallbacks('.gallery-item', '.gallery-img', '.gallery-fallback');
initPixelAvatar();
initHeroScene();
initRoleCycler();
initMusicPlayer();
initTopMenu();
initBrandScrollTop();
initIntro();
initExternalLinks();
initProjectSheet();
initScrollReveal();
initSkillCards();
initIdPhoto();
initInfoCardTilt();
initCustomCursor();
initContactPixelField();
initFooterYear();
