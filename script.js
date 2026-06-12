/* ============================================================
   "In-Feed" — portfolio behaviour. Vanilla JS, no dependencies.
   ============================================================ */

/* ------------------------------------------------------------
   1) EDIT YOUR REELS HERE  (single source of truth)
   ------------------------------------------------------------
   - src    : path to the vertical 9:16 .mp4 in /videos
   - poster : optional still frame shown before play
   - label  : the hook style / format, shown below the video
   Add / remove / reorder freely — the grid adapts.
   (The hero video, with the mypatches credit, is set in index.html.)
------------------------------------------------------------- */
const REELS = [
  { src: 'videos/ic-1.mp4',        poster: 'videos/ic-1.jpg',        label: 'Founder-style talking head' },
  { src: 'videos/ic-2.mp4',        poster: 'videos/ic-2.jpg',        label: '“3 reasons” listicle' },
  { src: 'videos/nerve-patch.mp4', poster: 'videos/nerve-patch.jpg', label: 'Problem–agitate hook' },
  { src: 'videos/knife-2.mp4',     poster: 'videos/knife-2.jpg',     label: 'Hook test · variation 2' },
  { src: 'videos/knife-3.mp4',     poster: 'videos/knife-3.jpg',     label: 'Hook test · variation 3' },
  { src: 'videos/knife-1.mp4',     poster: 'videos/knife-1.jpg',     label: 'Hook test · variation 1' },
];

/* ------------------------------------------------------------
   2) Build the feed grid
------------------------------------------------------------- */
const grid = document.getElementById('reelGrid');

const PLAY_SVG = `
<svg viewBox="0 0 24 24" aria-hidden="true">
  <circle cx="12" cy="12" r="11" fill="rgba(247,243,236,0.86)" stroke="rgba(20,16,9,0.12)" stroke-width="1"/>
  <path d="M10 8.4v7.2l6-3.6z" fill="#c2632f"/>
</svg>`;

if (grid) REELS.forEach((reel, i) => {
  const article = document.createElement('article');
  article.className = 'reel reveal';

  const media = document.createElement('div');
  media.className = 'reel-media';
  media.setAttribute('role', 'button');
  media.setAttribute('tabindex', '0');
  media.setAttribute('aria-label', `Play ad ${i + 1}${reel.label ? ': ' + reel.label : ''}`);

  // Video — src deferred via data-src for lazy loading.
  const video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.preload = 'none';
  if (reel.poster) video.poster = reel.poster;
  if (reel.src) video.dataset.src = reel.src;
  media.appendChild(video);

  // Empty slot if no src is wired yet.
  if (!reel.src) {
    media.classList.add('is-empty');
    const ph = document.createElement('div');
    ph.className = 'placeholder';
    ph.innerHTML = `Drop your ad here<code>videos/ad-0${i + 1}.mp4</code>`;
    media.appendChild(ph);
  }

  const badge = document.createElement('div');
  badge.className = 'play-badge';
  badge.innerHTML = PLAY_SVG;
  media.appendChild(badge);

  const mtag = document.createElement('span');
  mtag.className = 'muted-tag';
  mtag.textContent = 'Muted';
  media.appendChild(mtag);

  article.appendChild(media);

  // caption: one clean hook-style label below the video
  if (reel.label) {
    const foot = document.createElement('div');
    foot.className = 'reel-foot';
    foot.innerHTML = `<span class="live-dot" aria-hidden="true"></span><span class="reel-label">${reel.label}</span>`;
    article.appendChild(foot);
  }

  grid.appendChild(article);
});

/* ------------------------------------------------------------
   3) Lazy-load sources as tiles approach the viewport
------------------------------------------------------------- */
const loadVideo = (video) => {
  if (video && video.dataset.src && !video.src) {
    video.src = video.dataset.src;
    video.load();
  }
};

if (grid && 'IntersectionObserver' in window) {
  const lazyIO = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        loadVideo(entry.target.querySelector('video'));
        obs.unobserve(entry.target);
      }
    });
  }, { rootMargin: '320px 0px' });
  grid.querySelectorAll('.reel-media').forEach((m) => lazyIO.observe(m));
} else if (grid) {
  grid.querySelectorAll('video').forEach(loadVideo);
}

/* ------------------------------------------------------------
   4) Playback — hover on desktop, tap on touch
------------------------------------------------------------- */
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const playTile = (media) => {
  const v = media.querySelector('video');
  if (!v || !v.dataset.src) return;          // skip empty slots
  loadVideo(v);
  const p = v.play();
  if (p && p.catch) p.catch(() => {});
  media.closest('.reel').classList.add('is-playing');
};

const stopTile = (media, reset) => {
  const v = media.querySelector('video');
  if (!v) return;
  v.pause();
  if (reset) v.currentTime = 0;
  media.closest('.reel').classList.remove('is-playing');
};

if (grid) grid.querySelectorAll('.reel-media').forEach((media) => {
  const video = media.querySelector('video');

  // Surface missing / broken files instead of a dead black box.
  if (video) {
    video.addEventListener('error', () => {
      media.classList.add('is-empty');
      if (!media.querySelector('.placeholder')) {
        const ph = document.createElement('div');
        ph.className = 'placeholder';
        ph.innerHTML = `Video coming soon<code>${video.dataset.src || ''}</code>`;
        media.insertBefore(ph, media.querySelector('.play-badge'));
      }
    });
  }

  if (canHover) {
    media.addEventListener('mouseenter', () => playTile(media));
    media.addEventListener('mouseleave', () => stopTile(media, true));
  } else {
    media.addEventListener('click', () => {
      const reel = media.closest('.reel');
      if (reel.classList.contains('is-playing')) {
        stopTile(media, false);
      } else {
        grid.querySelectorAll('.reel.is-playing .reel-media').forEach((m) => stopTile(m, false));
        playTile(media);
      }
    });
  }

  media.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      media.closest('.reel').classList.contains('is-playing')
        ? stopTile(media, false) : playTile(media);
    }
  });
});

/* ------------------------------------------------------------
   5) Cursor-following accent glow (desktop only, signature detail)
------------------------------------------------------------- */
const fineHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (fineHover && motionOK) {
  let raf = null, mx = 0, my = 0;
  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      document.body.style.setProperty('--mouse-x', mx + 'px');
      document.body.style.setProperty('--mouse-y', my + 'px');
      document.body.classList.add('glow-on');
      raf = null;
    });
  }, { passive: true });
}

/* ------------------------------------------------------------
   6) Scroll-in reveal (subtle, respects reduced motion)
------------------------------------------------------------- */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const reveals = document.querySelectorAll('.reveal');
const show = (el) => el.classList.add('in');

if (prefersReduced || !('IntersectionObserver' in window)) {
  reveals.forEach(show);
} else {
  const revealIO = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { show(entry.target); obs.unobserve(entry.target); }
    });
  }, { threshold: 0, rootMargin: '0px 0px -6% 0px' });
  reveals.forEach((el) => revealIO.observe(el));

  // Failsafe: a fast/flick scroll can outrun the observer and leave content
  // (e.g. the final CTA) stuck invisible. On every scroll, reveal anything that
  // has actually entered the viewport — guarantees nothing stays hidden.
  let ticking = false;
  const sweep = () => {
    ticking = false;
    reveals.forEach((el) => {
      if (el.classList.contains('in')) return;
      if (el.getBoundingClientRect().top < window.innerHeight * 0.95) show(el);
    });
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(sweep); }
  }, { passive: true });
  window.addEventListener('load', () => setTimeout(sweep, 700));
}

/* ------------------------------------------------------------
   7) DM links
   [data-dm] CTAs scroll to the closer. To send the hero CTA
   straight to one platform, set PRIMARY_DM to a full URL.
------------------------------------------------------------- */
const PRIMARY_DM = ''; // e.g. 'https://instagram.com/your-handle'
if (PRIMARY_DM) {
  document.querySelectorAll('[data-dm]').forEach((a) => {
    a.setAttribute('href', PRIMARY_DM);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
  });
}
