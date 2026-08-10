/* ==========================================================================
   Adem Hammami — Portfolio interactions
   Vanilla JS, zero dependencies. rAF for cursor/tilt, IO for reveals.
   ========================================================================== */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ------------------------------------------------------------------
     Cinematic entry — full ~7.5s first visit, short for returning visitors
     ------------------------------------------------------------------ */
  var intro = document.getElementById('intro');
  function entered() { document.body.classList.add('entered'); }

  if (intro) {
    var skipBtn = document.getElementById('introSkip');
    var sessionSkip = false;
    var fullSeen = false;
    try {
      sessionSkip = !!sessionStorage.getItem('ah-intro-skip');
      fullSeen = !!localStorage.getItem('ah-intro-full');
    } catch (e) { /* storage unavailable — play full intro */ }
    var playable = !reducedMotion && !sessionSkip;

    if (!playable) {
      intro.setAttribute('hidden', '');
      entered();
    } else {
      var shortMode = !!fullSeen;
      var compact = window.matchMedia('(max-width: 900px)').matches;
      var tTransition = shortMode ? 2000 : (compact ? 6200 : 7400);

      intro.removeAttribute('hidden');
      document.body.classList.add('intro-active');
      if (shortMode) intro.classList.add('intro--short');

      requestAnimationFrame(function () {
        requestAnimationFrame(function () { intro.classList.add('is-play'); });
      });

      var transitionRunning = false;
      function beginTransition() {
        if (transitionRunning) return;
        transitionRunning = true;
        window.clearTimeout(autoTimer);

        intro.classList.add('is-transition');
        entered();

        var photo = intro.querySelector('.intro__photo');
        var heroImg = document.querySelector('.hero .portrait img');
        if (!compact && photo && heroImg) {
          var pr = photo.getBoundingClientRect();
          var hr = heroImg.getBoundingClientRect();
          var sx = (hr.width / pr.width).toFixed(4);
          var sy = (hr.height / pr.height).toFixed(4);
          var tx = Math.round((hr.left + hr.width / 2) - (pr.left + pr.width / 2));
          var ty = Math.round((hr.top + hr.height / 2) - (pr.top + pr.height / 2));
          photo.style.transition = 'transform .95s cubic-bezier(.22,.61,.21,1), border-radius .95s cubic-bezier(.22,.61,.21,1)';
          photo.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + sx + ',' + sy + ')';
          photo.style.borderRadius = '18px';
        }

        setTimeout(function () { intro.classList.add('is-leaving'); }, 1000);
        setTimeout(function () {
          intro.setAttribute('hidden', '');
          document.body.classList.remove('intro-active');
          if (!shortMode) {
            try { localStorage.setItem('ah-intro-full', '1'); } catch (e) {}
          }
        }, 1900);
      }

      var autoTimer = setTimeout(beginTransition, tTransition);

      if (skipBtn) {
        skipBtn.addEventListener('click', function () {
          try { sessionStorage.setItem('ah-intro-skip', '1'); } catch (e) {}
          beginTransition();
        });
      }
    }
  } else {
    entered();
  }

  /* ------------------------------------------------------------------
     Navbar scroll state
     ------------------------------------------------------------------ */
  var navbar = document.getElementById('navbar');
  function onNavScroll() {
    navbar.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  onNavScroll();
  window.addEventListener('scroll', onNavScroll, { passive: true });

  /* ------------------------------------------------------------------
     Scrollspy — desktop nav
     ------------------------------------------------------------------ */
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll('a[data-spy]'));
  var spySections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));

  function spy() {
    var pos = window.scrollY + 140;
    var current = 'hero';
    spySections.forEach(function (s) {
      if (s.offsetTop <= pos) current = s.id;
    });
    spyLinks.forEach(function (l) {
      l.classList.toggle('is-active', l.getAttribute('href') === '#' + current);
    });
  }
  spy();
  window.addEventListener('scroll', spy, { passive: true });

  /* ------------------------------------------------------------------
     Age
     ------------------------------------------------------------------ */
  var ageEl = document.getElementById('ageValue');
  if (ageEl) {
    var birth = new Date(2007, 1, 22); // Feb 22, 2007
    var now = new Date();
    var age = now.getFullYear() - birth.getFullYear();
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
    ageEl.textContent = age;
  }

  /* ------------------------------------------------------------------
     Footer year
     ------------------------------------------------------------------ */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------
     Scroll reveal
     ------------------------------------------------------------------ */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(function (el) {
      var d = el.getAttribute('data-delay');
      if (d) el.style.setProperty('--d', d + 'ms');
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ------------------------------------------------------------------
     Stat counters
     ------------------------------------------------------------------ */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reducedMotion) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        cio.unobserve(el);
        var target = parseInt(el.getAttribute('data-count'), 10);
        var suffix = el.getAttribute('data-suffix') || '';
        var dur = 1100, start = null;
        function tick(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { cio.observe(c); });
  } else {
    counters.forEach(function (c) { c.textContent = c.getAttribute('data-count') + (c.getAttribute('data-suffix') || ''); });
  }

  /* ------------------------------------------------------------------
     Custom cursor
     ------------------------------------------------------------------ */
  if (finePointer && !reducedMotion) {
    var dot = document.querySelector('.cursor-dot');
    var ring = document.querySelector('.cursor-ring');
    var mx = -100, my = -100, rx = -100, ry = -100, shown = false;

    function moveRing() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      dot.style.transform = 'translate(' + mx + 'px, ' + my + 'px) translate(-50%,-50%)';
      ring.style.transform = 'translate(' + rx + 'px, ' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(moveRing);
    }
    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!shown) { shown = true; dot.style.opacity = '1'; ring.style.opacity = '1'; }
    }, { passive: true });
    requestAnimationFrame(moveRing);

    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest('a, button, input, textarea, .project-card, .skill-group, .skill-chip, .achievement, .direction, .channel, .stat, .sys-tag, .featured');
      ring.classList.toggle('is-hovering', !!t);
    });
    document.addEventListener('mouseleave', function () {
      dot.style.opacity = '0'; ring.style.opacity = '0'; shown = false;
    });
  }

  /* ------------------------------------------------------------------
     Magnetic buttons
     ------------------------------------------------------------------ */
  if (finePointer && !reducedMotion) {
    document.querySelectorAll('.magnetic').forEach(function (el) {
      var raf = null;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          el.style.transform = 'translate(' + dx * 0.3 + 'px,' + dy * 0.3 + 'px)';
        });
      });
      el.addEventListener('mouseleave', function () {
        if (raf) cancelAnimationFrame(raf);
        el.style.transform = '';
      });
    });
  }

  /* ------------------------------------------------------------------
     Project card tilt
     ------------------------------------------------------------------ */
  if (finePointer && !reducedMotion) {
    document.querySelectorAll('.project-card').forEach(function (card) {
      var raf = null;
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          card.style.transform = 'perspective(900px) rotateY(' + (px * 4) + 'deg) rotateX(' + (-py * 4) + 'deg) translateY(-6px)';
        });
      });
      card.addEventListener('mouseleave', function () {
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = '';
      });
    });
  }

  /* ------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------ */
  var menuToggle = document.getElementById('navToggle');
  var mobileMenu = document.getElementById('mobileMenu');
  if (menuToggle && mobileMenu) {
    function closeMenu() {
      menuToggle.classList.remove('is-open');
      mobileMenu.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('menu-open');
    }
    function openMenu() {
      menuToggle.classList.add('is-open');
      mobileMenu.classList.add('open');
      menuToggle.setAttribute('aria-expanded', 'true');
      mobileMenu.setAttribute('aria-hidden', 'false');
      document.body.classList.add('menu-open');
    }
    menuToggle.addEventListener('click', function () {
      if (mobileMenu.classList.contains('open')) closeMenu(); else openMenu();
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ------------------------------------------------------------------
     Subtle hero parallax (fine pointers, light)
     ------------------------------------------------------------------ */
  if (finePointer && !reducedMotion) {
    var art = document.querySelector('[data-parallax]');
    var rafP = null;
    if (art) {
      window.addEventListener('scroll', function () {
        if (rafP) return;
        rafP = requestAnimationFrame(function () {
          var y = window.scrollY;
          if (y < window.innerHeight * 1.2) {
            art.style.transform = 'translateY(' + (y * 0.045) + 'px)';
          }
          rafP = null;
        });
      }, { passive: true });
    }
  }

  /* ------------------------------------------------------------------
     Project detail modal
     ------------------------------------------------------------------ */
  var PROJECTS = {
    'biostore': {
      category: 'Full-Stack Web App · E-Commerce',
      title: 'BioStore',
      tagline: 'A complete e-commerce experience for organic and bio products — catalog, cart, checkout and admin panel, built end to end.',
      story: [
        { label: 'The Problem', text: 'Small bio-products sellers are scattered across social media. There is no single place to browse a catalog, compare and order — and no easy way for the seller to manage products.' },
        { label: 'The Idea', text: 'One clean storefront where products live in a real database, customers browse and order, and the owner manages everything from a simple admin panel.' },
        { label: 'The Solution', text: 'A full-stack application: PHP and MySQL power the data layer, with a responsive front-end for the shop and a protected admin area for managing products, orders and inventory.' },
        { label: 'The Technology', text: 'Semantic HTML and CSS for the storefront, JavaScript for interaction, PHP for the application logic, MySQL for the relational data model.' },
        { label: 'The Result', text: 'A working, usable digital product — and my most complete demonstration of the full development cycle so far.' }
      ],
      role: 'Solo developer — design, database schema, front-end & back-end',
      features: ['Product catalog & search', 'Shopping cart & checkout flow', 'Order history & authentication', 'Protected admin panel', 'Responsive storefront', 'MySQL relational data model'],
      tags: ['HTML5', 'CSS3', 'JavaScript', 'PHP', 'MySQL'],
      links: [{ label: 'View Code', href: 'https://github.com/ademhammami', external: true }]
    },
    'ai-chat': {
      category: 'AI · Intelligent Systems',
      title: 'AI Chat Assistant',
      tagline: 'An intelligent conversational assistant powered by machine learning.',
      story: [
        { label: 'The Problem', text: 'Most interfaces only respond to rigid, keyword-perfect input. Ask a question the way people actually talk — and they break.' },
        { label: 'The Idea', text: 'Build an assistant that understands natural language and answers conversationally — not with canned replies, but with meaning.' },
        { label: 'The Solution', text: 'A machine-learning powered system that parses intent and returns relevant, natural responses in real time.' },
        { label: 'The Technology', text: 'Python at the core, with NLP techniques and AI fundamentals — designed modularly so the system can grow with my learning.' },
        { label: 'The Result', text: 'A working intelligent assistant — and a first, real step into artificial intelligence.' }
      ],
      role: 'Solo developer & designer',
      features: ['Natural language understanding', 'Conversational responses', 'ML-driven intent handling'],
      tags: ['Python', 'NLP', 'AI'],
      links: []
    },
    'portfolio': {
      category: 'Web Development',
      title: 'Portfolio Website',
      tagline: 'A premium personal portfolio — designed and built from scratch. The site you\'re looking at right now.',
      story: [
        { label: 'The Problem', text: 'A generic profile page doesn\'t do the work justice — recruiters and collaborators need to feel the quality before they even read the text.' },
        { label: 'The Idea', text: 'Build the portfolio the way I\'d build a product: designed for mobile first, fast, accessible, and memorable.' },
        { label: 'The Solution', text: 'A single-page experience with a strong identity, subtle motion, and clean architecture — no templates, no frameworks.' },
        { label: 'The Technology', text: 'Semantic HTML, a hand-written design system in CSS, and vanilla JavaScript for interactions.' },
        { label: 'The Result', text: 'A fast, responsive portfolio that loads instantly on any phone and leaves an impression.' }
      ],
      role: 'Designer & developer',
      features: ['Mobile-first responsive design', 'Zero dependencies', 'SEO & accessibility optimized'],
      tags: ['HTML5', 'CSS3', 'JavaScript'],
      links: [{ label: 'Live Demo', href: '#hero' }]
    },
    'dashboard': {
      category: 'Web App · Data',
      title: 'Data Dashboard',
      tagline: 'An interactive analytics dashboard that turns raw data into decisions.',
      story: [
        { label: 'The Problem', text: 'Raw data is hard to read. Without a visual layer, trends hide and decisions get delayed.' },
        { label: 'The Idea', text: 'A dashboard that makes data legible at a glance — dynamic charts, live enough to be useful.' },
        { label: 'The Solution', text: 'An interactive interface that queries, processes and visualizes datasets with near real-time updates.' },
        { label: 'The Technology', text: 'JavaScript for the interface and chart rendering, PHP on the server side, SQL for the data layer.' },
        { label: 'The Result', text: 'A working analytics tool that demonstrates full-stack thinking across the whole pipeline.' }
      ],
      role: 'Full-stack developer',
      features: ['Dynamic chart rendering', 'Near real-time updates', 'SQL-backed data layer'],
      tags: ['JavaScript', 'SQL', 'PHP'],
      links: []
    }
  };

  var modal = document.getElementById('projectModal');
  if (modal) {
    var lastFocused = null;
    var closeBtn = modal.querySelector('.modal__close');
    var panel = modal.querySelector('.modal__panel');

    function esc2(s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function openModal(key) {
      var p = PROJECTS[key];
      if (!p) return;
      lastFocused = document.activeElement;

      modal.querySelector('.modal__category').textContent = p.category;
      modal.querySelector('.modal__title').textContent = p.title;
      modal.querySelector('.modal__tagline').textContent = p.tagline;
      modal.querySelector('#modalRole').textContent = p.role;

      var story = modal.querySelector('#modalStory');
      story.innerHTML = p.story.map(function (s) {
        return '<div class="story__step"><p class="mono story__label">' + esc2(s.label) + '</p><p class="story__text">' + esc2(s.text) + '</p></div>';
      }).join('');

      var feats = modal.querySelector('#modalFeatures');
      feats.innerHTML = p.features.map(function (f) { return '<li>' + esc2(f) + '</li>'; }).join('');

      var tags = modal.querySelector('#modalTags');
      tags.innerHTML = p.tags.map(function (t) { return '<li>' + esc2(t) + '</li>'; }).join('');

      var links = modal.querySelector('#modalLinks');
      links.innerHTML = p.links.map(function (l) {
        var external = l.external || (l.href.indexOf('#') !== 0);
        return '<a href="' + esc2(l.href) + '"' + (external ? ' target="_blank" rel="noopener"' : '') + '>' + esc2(l.label) + ' ↗</a>';
      }).join('');

      modal.hidden = false;
      document.body.classList.add('modal-open');
      closeBtn.focus();
    }

    function closeModal() {
      modal.hidden = true;
      document.body.classList.remove('modal-open');
      if (lastFocused) lastFocused.focus();
    }

    document.querySelectorAll('[data-project]').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        openModal(trigger.getAttribute('data-project'));
      });
    });

    modal.querySelectorAll('[data-close]').forEach(function (el) {
      el.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) closeModal();
      if (e.key === 'Tab' && !modal.hidden) {
        var focusables = modal.querySelectorAll('button, a, [tabindex]:not([tabindex="-1"])');
        var list = Array.prototype.slice.call(focusables).filter(function (n) { return !n.hidden && n.offsetParent !== null; });
        if (!list.length) return;
        var first = list[0], last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
})();
