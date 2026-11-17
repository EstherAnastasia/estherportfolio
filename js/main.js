/* =========================================================
   1. HEADER: se vuelve sólido al hacer scroll + menú móvil
   ========================================================= */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
});

document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('nav').classList.toggle('open');
});

/* =========================================================
   2. IDIOMA (EN / ES / CA)
   - Lee todos los elementos con data-i18n y pone su texto
   - Guarda la elección en localStorage para recordarla
   ========================================================= */
function setLanguage(lang) {
  document.documentElement.lang = lang;                       // <html lang="...">
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const text = translations[lang][el.dataset.i18n];
    if (text) el.textContent = text;
  });
  document.querySelectorAll('#langSwitch button').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);    // marca el botón activo
  });
  localStorage.setItem('lang', lang);
}

document.querySelectorAll('#langSwitch button').forEach(btn => {
  btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
});

// Idioma inicial: el guardado, o el del navegador si es es/ca, o inglés
const saved = localStorage.getItem('lang');
const browser = navigator.language.slice(0, 2);
setLanguage(saved || (translations[browser] ? browser : 'en'));

/* =========================================================
   3. VÍDEOS Y MEDIA
   Hay DOS tipos de ventana:
   - Ventana simple (#videoModal): trailer del inicio y capturas ampliadas
   - Paneles ALL MEDIA (.media-modal): vídeo arriba + capturas abajo.
     Puede haber VARIOS en una misma página (uno por cada sección Media).
   ========================================================= */

// Código HTML del reproductor de YouTube para un ID
const ytEmbed = id =>
  `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0"
           allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>`;

// Pone la miniatura automática de YouTube (solo si el ID ya es real)
function setThumb(el) {
  const id = el.dataset.video;
  if (id && !id.startsWith('VIDEO_ID')) {
    el.style.backgroundImage = `url(https://img.youtube.com/vi/${id}/maxresdefault.jpg)`;
  }
}
document.querySelectorAll('[data-video]').forEach(setThumb);

/* ---------- 3a. Ventana simple ---------- */
const modal = document.getElementById('videoModal');
const modalInner = document.getElementById('modalInner');

function openSimple(html) {
  modalInner.innerHTML = html;
  modal.classList.add('open');
}
function closeSimple() {
  modal.classList.remove('open');
  modalInner.innerHTML = '';                 // vacía el contenido (y para el vídeo)
}
document.getElementById('modalClose').addEventListener('click', closeSimple);
modal.addEventListener('click', e => { if (e.target === modal) closeSimple(); });

// Tarjetas SIN data-gallery (el trailer grande del inicio) -> ventana simple
document.querySelectorAll('.video-card[data-video]:not([data-gallery])').forEach(card => {
  card.addEventListener('click', () => openSimple(ytEmbed(card.dataset.video)));
});

document.querySelectorAll('[data-play]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    openSimple(ytEmbed(el.dataset.play));
  });
});

// Click en una captura -> se amplía en la ventana simple (encima del panel)
document.querySelectorAll('.shot').forEach(shot => {
  shot.addEventListener('click', () => {
    openSimple(`<div class="lb-img" style="background-image:url('${shot.dataset.src}')"></div>`);
  });
});

/* ---------- 3b. Paneles ALL MEDIA ----------
   Cada <section data-media="idDelPanel"> se conecta con su panel.
   Guardamos las funciones de cierre para poder usar la tecla ESC.        */
const galleryClosers = [];

document.querySelectorAll('[data-media]').forEach(section => {
  const panel   = document.getElementById(section.dataset.media);   // el .media-modal de esta sección
  const player  = panel.querySelector('.media-player');
  const tabs    = panel.querySelector('.media-tabs');
  const cards   = section.querySelectorAll('.video-card[data-gallery]');
  const openBtn = section.querySelector('.all-media-btn, #allMediaBtn');

  // Cambia el vídeo del reproductor y marca su miniatura como activa
  function play(id) {
    player.innerHTML = ytEmbed(id);
    tabs.querySelectorAll('.thumb').forEach(t => {
      t.classList.toggle('active', t.dataset.video === id);
    });
  }

  // Crea las miniaturas del panel a partir de las tarjetas de la sección
  cards.forEach((card, i) => {
    const t = document.createElement('button');
    t.className = 'thumb';
    t.dataset.video = card.dataset.video;
    t.setAttribute('aria-label', 'Video ' + (i + 1));
    setThumb(t);
    t.addEventListener('click', () => play(card.dataset.video));
    tabs.appendChild(t);
  });
  if (cards.length < 2) tabs.style.display = 'none';   // con un solo vídeo no hacen falta miniaturas

  function open(id) {
    panel.classList.add('open');
    document.body.classList.add('no-scroll');          // bloquea el scroll de la web de fondo
    panel.scrollTop = 0;
    play(id || cards[0].dataset.video);
  }
  function close() {
    panel.classList.remove('open');
    document.body.classList.remove('no-scroll');
    player.innerHTML = '';                             // para el vídeo
  }
  galleryClosers.push({ panel, close });

  // Click en una tarjeta de vídeo -> abre el panel con ESE vídeo
  cards.forEach(card => card.addEventListener('click', () => open(card.dataset.video)));
  // Botón ALL MEDIA -> abre el panel con el primer vídeo
  if (openBtn) openBtn.addEventListener('click', () => open());

  panel.querySelector('.modal-close').addEventListener('click', close);
  panel.addEventListener('click', e => { if (e.target === panel) close(); });
});

/* ---------- 3c. Tecla ESC: cierra primero lo de arriba ---------- */
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (modal.classList.contains('open')) { closeSimple(); return; }
  galleryClosers.forEach(g => { if (g.panel.classList.contains('open')) g.close(); });
});
