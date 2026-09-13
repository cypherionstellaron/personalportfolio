const THEME_STORAGE_KEY = 'portfolio-theme';

function initThemeToggle() {
    const options = document.querySelectorAll('.theme-opt');

    function applyTheme(theme) {
        document.body.classList.toggle('light-mode', theme === 'light');
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }

    options.forEach(btn => {
        btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
    });
}

function initMarquees() {
    const MIN_WIDTH_MULTIPLIER = 2;
    const PIXELS_PER_SECOND = 70;

    function fillTrack(track) {
        const strip = track.closest('.marquee-strip');
        const baseGroup = track.querySelector('.marquee-group');
        if (!baseGroup) return;

        track.querySelectorAll('.marquee-group').forEach((el, i) => { if (i > 0) el.remove(); });

        const groupWidth = baseGroup.getBoundingClientRect().width;
        const stripWidth = strip.getBoundingClientRect().width;
        if (groupWidth === 0) return;

        const minTotalWidth = stripWidth * MIN_WIDTH_MULTIPLIER;
        let totalWidth = groupWidth;
        while (totalWidth < minTotalWidth) {
            const clone = baseGroup.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            track.appendChild(clone);
            totalWidth += groupWidth;
        }

        const groupCount = track.querySelectorAll('.marquee-group').length;
        track.style.setProperty('--marquee-shift', `-${100 / groupCount}%`);
        track.style.animationDuration = `${groupWidth / PIXELS_PER_SECOND}s`;
    }

    const tracks = document.querySelectorAll('.marquee-track');
    tracks.forEach(fillTrack);
    window.addEventListener('resize', () => tracks.forEach(fillTrack));
}

function initHeroStarfield() {
    const STAR_COUNT = 70;
    const MAX_STAR_HEIGHT_PERCENT = 65;
    const container = document.getElementById('stars-container');

    for (let i = 0; i < STAR_COUNT; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = Math.random() < 0.7 ? 2 : 3;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * MAX_STAR_HEIGHT_PERCENT}%`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        container.appendChild(star);
    }
}

function initScrollCue() {
    const scrollCue = document.getElementById('scroll-cue-btn');
    const firstStrip = document.getElementById('lang-strip');
    scrollCue.addEventListener('click', () => firstStrip.scrollIntoView({ behavior: 'smooth' }));
}

function initBottomNav() {
    const SCROLL_SPY_THRESHOLD = 0.4;
    const navButtons = document.querySelectorAll('.nav-btn');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = document.getElementById(btn.dataset.target);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });

    const trackedSectionIds = ['hero', 'lang-strip', 'games', 'credentials', 'projects', 'contact'];
    const trackedSections = trackedSectionIds.map(id => document.getElementById(id)).filter(Boolean);

    const setActiveNavItem = (entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            navButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.target === entry.target.id);
            });
        });
    };

    const spyObserver = new IntersectionObserver(setActiveNavItem, { threshold: SCROLL_SPY_THRESHOLD });
    trackedSections.forEach(section => spyObserver.observe(section));
}

function initLoadingScreen() {
    const PROGRESS_STEP_MAX = 18;
    const TICK_INTERVAL_MS = 180;
    const HIDE_DELAY_MS = 300;

    const bar = document.getElementById('loader-bar');
    const percentLabel = document.getElementById('loader-percent');
    const loadingScreen = document.getElementById('loading-screen');
    let progress = 0;

    const tick = setInterval(() => {
        progress = Math.min(100, progress + Math.random() * PROGRESS_STEP_MAX);
        bar.style.width = `${progress}%`;
        percentLabel.textContent = `${Math.floor(progress)}%`;

        if (progress >= 100) {
            clearInterval(tick);
            setTimeout(() => loadingScreen.classList.add('hidden'), HIDE_DELAY_MS);
        }
    }, TICK_INTERVAL_MS);
}

function initProfilePhoto() {
    const photo = document.getElementById('profile-photo');
    const hint = document.getElementById('photo-hint');

    const revealPhotoIfSourced = () => {
        const hasSource = photo.getAttribute('src') && photo.getAttribute('src').trim() !== '';
        photo.style.display = hasSource ? 'block' : 'none';
        hint.style.display = hasSource ? 'none' : 'block';
    };

    photo.addEventListener('load', revealPhotoIfSourced);
    revealPhotoIfSourced();
}

function initGameCards() {
    // Hover already flips the card via CSS. This adds tap support for
    // touch devices, which have no hover state.
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', () => card.classList.toggle('flipped'));
    });
}

function initMusicPlayer() {
    const button = document.getElementById('music-toggle');
    const audio = document.getElementById('favorite-song');
    const label = button ? button.querySelector('.music-label') : null;
    if (!button || !audio) return;

    const setPlayingState = (isPlaying) => {
        button.classList.toggle('is-playing', isPlaying);
        if (label) label.textContent = isPlaying ? 'PAUSE SONG' : 'PLAY FAVORITE SONG';
    };

    button.addEventListener('click', () => {
        if (audio.paused) {
            audio.play().catch(() => {
                // Most likely no audio file has been added yet at audio/favorite-song.mp3
                setPlayingState(false);
            });
        } else {
            audio.pause();
        }
    });

    audio.addEventListener('play', () => setPlayingState(true));
    audio.addEventListener('pause', () => setPlayingState(false));
    audio.addEventListener('ended', () => setPlayingState(false));
    audio.addEventListener('error', () => {
        console.error('Audio failed to load — check that audio/favorite-song.mp3 exists and the filename matches exactly.');
        setPlayingState(false);
    });
}

function initProjectLinks() {
    document.querySelectorAll('.project-link').forEach(btn => {
        btn.addEventListener('click', () => {
            const url = btn.dataset.url;
            if (url && url !== '#') window.open(url, '_blank');
        });
    });
}

function initContactButtons() {
    const emailBtn = document.getElementById('email-btn');
    const githubBtn = document.getElementById('github-btn');
    const linkedinBtn = document.getElementById('linkedin-btn');

    emailBtn.addEventListener('click', () => {
        window.location.href = `mailto:${emailBtn.dataset.mailto}`;
    });
    githubBtn.addEventListener('click', () => window.open(githubBtn.dataset.url, '_blank'));
    linkedinBtn.addEventListener('click', () => window.open(linkedinBtn.dataset.url, '_blank'));
}

function initFooterYear() {
    document.getElementById('year').textContent = new Date().getFullYear();
}

function initContactPixelField() {
    const AREA_PER_PARTICLE = 9000; // higher = sparser field
    const particleColors = ['#4d9de0', '#ff7a3d', '#f4f1e8'];

    const canvas = document.getElementById('pixel-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resizeCanvas() {
        const section = document.getElementById('contact');
        canvas.width = section.offsetWidth;
        canvas.height = section.offsetHeight;
    }

    function createParticles() {
        const count = Math.floor((canvas.width * canvas.height) / AREA_PER_PARTICLE);
        particles = Array.from({ length: count }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() < 0.5 ? 3 : 5,
            speedX: (Math.random() - 0.5) * 0.4,
            speedY: (Math.random() - 0.5) * 0.4,
            color: particleColors[Math.floor(Math.random() * particleColors.length)],
            alpha: Math.random() * 0.5 + 0.2
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

    window.addEventListener('resize', () => { resizeCanvas(); createParticles(); });
    resizeCanvas();
    createParticles();
    step();
}

function initBrandFloatingPixels() {
    const PIXEL_COLORS = ['#4d9de0', '#ff7a3d', '#f4f1e8'];
    const PIXEL_COUNT = 18;
    const MIN_DURATION_S = 2.6;
    const MAX_DURATION_S = 4.2;
    const SIZE_STEPS = [12, 16, 20, 26];

    const brand = document.getElementById('brand-mark');
    if (!brand) return;

    let layer = document.getElementById('pixel-burst-layer');
    if (!layer) {
        layer = document.createElement('div');
        layer.id = 'pixel-burst-layer';
        document.body.appendChild(layer);
    }

    function spawnBurst() {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) return;

        for (let i = 0; i < PIXEL_COUNT; i++) {
            const pixel = document.createElement('div');
            pixel.className = 'floating-pixel';

            const size = SIZE_STEPS[Math.floor(Math.random() * SIZE_STEPS.length)];
            const duration = MIN_DURATION_S + Math.random() * (MAX_DURATION_S - MIN_DURATION_S);
            const drift = (Math.random() - 0.5) * 140;
            const delay = Math.random() * 0.4;
            const spin = Math.random() < 0.5 ? '90deg' : '-90deg';

            pixel.style.left = `${Math.random() * 100}vw`;
            pixel.style.width = `${size}px`;
            pixel.style.height = `${size}px`;
            pixel.style.background = PIXEL_COLORS[Math.floor(Math.random() * PIXEL_COLORS.length)];
            pixel.style.setProperty('--drift', `${drift}px`);
            pixel.style.setProperty('--spin', spin);
            pixel.style.animationDuration = `${duration}s`;
            pixel.style.animationDelay = `${delay}s`;

            pixel.addEventListener('animationend', () => pixel.remove());
            layer.appendChild(pixel);
        }
    }

    brand.addEventListener('click', spawnBurst);
    brand.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            spawnBurst();
        }
    });
}

initThemeToggle();
initMarquees();
initHeroStarfield();
initScrollCue();
initBottomNav();
initLoadingScreen();
initProfilePhoto();
initGameCards();
initMusicPlayer();
initProjectLinks();
initContactButtons();
initFooterYear();
initContactPixelField();
initBrandFloatingPixels();