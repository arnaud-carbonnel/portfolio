/* Petites interactions locales : aucun compte, cookie ou service externe. */
(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // BLOC 1 — Les trois cartes existent dans le HTML. On change leur ordre dans la pile.
  function setupPreview() {
    const showcase = document.querySelector('[data-showcase]');
    if (!showcase) return;
    const tabs = [...showcase.querySelectorAll('[data-preview]')];
    const cards = [...showcase.querySelectorAll('[data-preview-card]')];
    const status = showcase.querySelector('[data-preview-status]');
    let activeProject = 'beg';

    function selectProject(key) {
      if (key === activeProject) return;
      const activeCard = cards.find((card) => card.dataset.previewCard === key);
      if (!activeCard) return;
      activeProject = key;
      let depth = 1;

      cards.forEach((card) => {
        const selected = card === activeCard;
        card.classList.toggle('is-active', selected);
        card.dataset.depth = selected ? '0' : String(depth++);
        card.setAttribute('aria-hidden', String(!selected));
        card.inert = !selected;
        card.querySelector('a').tabIndex = selected ? 0 : -1;
      });
      tabs.forEach((tab) => {
        const selected = tab.dataset.preview === key;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      status.textContent = `Au premier plan : ${activeCard.querySelector('.preview-title').textContent}.`;
    }

    tabs.forEach((tab, index) => {
      // Un survol sélectionne ; le clic/toucher et le clavier donnent le même résultat.
      tab.addEventListener('pointerenter', (event) => {
        if (event.pointerType === 'mouse') selectProject(tab.dataset.preview);
      });
      tab.addEventListener('click', () => selectProject(tab.dataset.preview));
      tab.addEventListener('focus', () => selectProject(tab.dataset.preview));
      tab.addEventListener('keydown', (event) => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        tabs[next].focus();
      });
    });
    showcase.querySelector('.preview-tabs').hidden = false;
    showcase.classList.add('is-enhanced');
  }

  // BLOC 2 — Chaque élément apparaît une seule fois, à son entrée dans la fenêtre.
  function setupScrollReveal() {
    const items = [...document.querySelectorAll('[data-reveal]')];
    const seen = new WeakSet();
    let observer;

    function showImmediately(element) {
      seen.add(element);
      observer?.unobserve(element);
      element.classList.remove('reveal-pending', 'is-revealed');
    }

    function start() {
      observer?.disconnect();
      items.forEach((element) => element.classList.remove('reveal-pending', 'is-revealed'));
      if (reducedMotion.matches || !('IntersectionObserver' in window)) return;

      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          seen.add(entry.target);
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });

      items.forEach((element) => {
        // Le contenu déjà visible au chargement reste visible, y compris après un retour arrière.
        if (seen.has(element) || element.getBoundingClientRect().top < window.innerHeight) {
          seen.add(element);
          return;
        }
        element.classList.add('reveal-pending');
        observer.observe(element);
      });
    }

    items.forEach((element) => element.addEventListener('animationend', (event) => {
      if (event.target === element && event.animationName === 'apparition-defilement') showImmediately(element);
    }));
    // Un lien atteint avec Tab est visible immédiatement, même avant le défilement.
    document.addEventListener('focusin', (event) => {
      const element = event.target.closest('[data-reveal]');
      if (element) showImmediately(element);
    });
    reducedMotion.addEventListener('change', start);
    start();
  }

  setupPreview();
  setupScrollReveal();
})();
