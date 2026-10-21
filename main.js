/* ═══════════════════════════════════════════════════
   Firztweb · main.js — Rediseño v2 2026
   Pure JS · Sin frameworks
═══════════════════════════════════════════════════ */

(() => {
  'use strict';

  /* ────────────────────────────────
     AÑO DINÁMICO EN FOOTER
  ──────────────────────────────── */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ────────────────────────────────
     TEMA CLARO / OSCURO
  ──────────────────────────────── */
  const html          = document.documentElement;
  const themeToggle   = document.getElementById('themeToggle');
  const savedTheme    = localStorage.getItem('fw-theme');

  // Aplicar tema guardado o preferencia del sistema
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initTheme   = savedTheme || (prefersDark ? 'dark' : 'light');
  html.setAttribute('data-theme', initTheme);

  themeToggle?.addEventListener('click', () => {
    const current = html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next    = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('fw-theme', next);
    // registrarEvento se define más abajo; se llama con setTimeout para evitar orden de ejecución
    setTimeout(() => typeof registrarEvento === 'function' && registrarEvento('clic', 'tema_' + next), 0);
  });

  /* ────────────────────────────────
     NAVBAR — scroll effect
  ──────────────────────────────── */
  const navbar = document.getElementById('navbar');
  const onScroll = () => navbar?.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ────────────────────────────────
     HAMBURGER — mobile menu
  ──────────────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  hamburger?.addEventListener('click', () => {
    const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!isOpen));
    navLinks?.classList.toggle('open', !isOpen);
  });

  navLinks?.querySelectorAll('a').forEach(link =>
    link.addEventListener('click', () => {
      hamburger?.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
    })
  );

  /* ────────────────────────────────
     SMOOTH SCROLL — compensar navbar
  ──────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH - 16, behavior: 'smooth' });
    });
  });

  /* ────────────────────────────────
     FADE-UP — IntersectionObserver
  ──────────────────────────────── */
  const fadeObserver = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        fadeObserver.unobserve(e.target);
      }
    }),
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));

  /* ────────────────────────────────
     CUBO 3D — giro aleatorio + drag
  ──────────────────────────────── */
  const cubeScene    = document.getElementById('tiltCard');
  const cube         = document.getElementById('cubeInner');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (cubeScene && cube && !prefersReduced) {
    let rotX = 0, rotY = 0, rotZ = 0;
    let speedX = 0.45, speedY = 0.60, speedZ = 0.18;
    let isDragging = false, isHovered = false;
    let velX = 0, velY = 0;
    let lastMouseX = 0, lastMouseY = 0;
    let rafId = null;

    // Cambia velocidad y dirección aleatoriamente cada 2–4 s
    // Mínimo garantizado para que nunca se detenga
    function randomizeSpin() {
      const sign = () => Math.random() > 0.5 ? 1 : -1;
      speedX = (0.35 + Math.random() * 0.45) * sign();
      speedY = (0.50 + Math.random() * 0.55) * sign();
      speedZ = (0.10 + Math.random() * 0.20) * sign();
      setTimeout(randomizeSpin, 2000 + Math.random() * 2000);
    }
    randomizeSpin();

    // Loop principal — delta suavizado para Brave (throttling de rAF) y otros navegadores
    let lastTime = null;
    let smoothDelta = 16.67; // arranca asumiendo 60fps
    function spinLoop(timestamp) {
      if (lastTime === null) lastTime = timestamp;
      const rawDelta = Math.min(timestamp - lastTime, 50);
      lastTime = timestamp;
      // Media móvil: suaviza los saltos de Brave sin perder respuesta
      smoothDelta = smoothDelta * 0.85 + rawDelta * 0.15;
      const factor = smoothDelta / 16.67;

      if (!isHovered) {
        rotX += speedX * factor;
        rotY += speedY * factor;
        rotZ += speedZ * factor;
        cube.style.transform =
          `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg)`;
      }
      rafId = requestAnimationFrame(spinLoop);
    }
    rafId = requestAnimationFrame(spinLoop);

    // Hover: pausa el giro automático
    cubeScene.addEventListener('mouseenter', () => { isHovered = true; });
    cubeScene.addEventListener('mouseleave', () => {
      isHovered  = false;
      isDragging = false;
      velX = 0; velY = 0;
    });

    // Drag: el usuario gira el cubo libremente
    cubeScene.addEventListener('mousedown', e => {
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      velX = 0; velY = 0;
    });
    window.addEventListener('mouseup', () => {
      if (isDragging && isHovered) {
        // Solo aplicar inercia si hubo movimiento real (evita parar el cubo con un clic)
        const speed = Math.sqrt(velX * velX + velY * velY);
        if (speed > 0.5) {
          speedX = velX * 0.15;
          speedY = velY * 0.15;
        }
        // Si no hubo movimiento suficiente, mantener las velocidades actuales
      }
      isDragging = false;
    });
    window.addEventListener('mousemove', e => {
      if (!isDragging || !isHovered) return;
      velX = (e.clientY - lastMouseY) * 0.45;
      velY = (e.clientX - lastMouseX) * 0.45;
      rotX += velX; rotY += velY;
      lastMouseX = e.clientX; lastMouseY = e.clientY;
      cube.style.transform =
        `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg)`;
    });
  }

  /* ────────────────────────────────
     CONTADORES ANIMADOS — hero stats
  ──────────────────────────────── */
  // (los stats son texto, no números animados para no distraer)

  /* ────────────────────────────────
     FORMULARIO DE CONTACTO
     → mismo backend que Firztnet
     → negocio: 'firztweb'
  ──────────────────────────────── */
  const form      = document.getElementById('contactForm');
  const formErr   = document.getElementById('formErr');
  const formOk    = document.getElementById('formOk');
  const submitBtn = document.getElementById('submitBtn');

  form?.addEventListener('submit', e => {
    e.preventDefault();

    const nombre   = form.nombre?.value.trim();
    const telefono = form.telefono?.value.trim();
    const email    = form.email?.value.trim();
    const mensaje  = form.mensaje?.value.trim();

    // Reset
    if (formErr) formErr.hidden = true;
    if (formOk)  formOk.hidden  = true;

    // Validación
    if (!nombre || !telefono) {
      if (formErr) { formErr.textContent = 'Por favor, rellena tu nombre y teléfono.'; formErr.hidden = false; }
      return;
    }

    // Enviar
    submitBtn.disabled = true;
    const btnSpan = submitBtn.querySelector('span');
    if (btnSpan) btnSpan.textContent = 'Enviando…';

    fetch('https://firztnet-backend-production.up.railway.app/api/seguimiento/solicitar-presupuesto', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre,
        telefono,
        email:   email || '',
        mensaje: mensaje || '(sin detalles adicionales — proyecto de diseño web)',
        negocio: 'firztweb',
      }),
    })
    .then(res => res.json().then(datos => ({ ok: res.ok, datos })))
    .then(({ ok, datos }) => {
      if (!ok) throw new Error(datos.error || 'Error del servidor');
      form.reset();
      if (formOk) formOk.hidden = false;
      registrarEvento('clic', 'formulario_enviado_ok');
    })
    .catch(err => {
      if (formErr) { formErr.textContent = 'Error: ' + (err?.message || 'Sin respuesta del servidor'); formErr.hidden = false; }
    })
    .finally(() => {
      submitBtn.disabled = false;
      if (btnSpan) btnSpan.textContent = 'Enviar solicitud';
    });
  });

  /* ────────────────────────────────
     ESTADÍSTICAS — visitas y eventos
     → mismo sistema que Firztnet
     → sitio: 'firztweb'
  ──────────────────────────────── */
  const API  = 'https://firztnet-backend-production.up.railway.app/api/estadisticas';
  const SITE = 'firztweb';

  // Registrar visita
  fetch(API + '/visita', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sitio:       SITE,
      ruta:        window.location.pathname + window.location.hash,
      referido:    document.referrer || 'directo',
      dispositivo: window.innerWidth <= 768 ? 'movil' : 'escritorio',
    }),
  }).catch(() => {});

  // Registrar eventos de clic
  function registrarEvento(tipo, etiqueta) {
    fetch(API + '/evento', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sitio: SITE, tipo, etiqueta }),
    }).catch(() => {});
  }

  document.querySelectorAll('[data-evento]').forEach(el =>
    el.addEventListener('click', () =>
      registrarEvento('clic', el.getAttribute('data-evento'))
    )
  );

  // Secciones vistas
  if ('IntersectionObserver' in window) {
    const secObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          registrarEvento('seccion_vista', 'seccion_' + entry.target.id);
          secObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('section[id]').forEach(s => secObs.observe(s));
  }

})();
