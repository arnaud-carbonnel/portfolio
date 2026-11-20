/* Galerie progressive : les liens vers les images fonctionnent aussi sans JavaScript. */
(() => {
  'use strict';

  const links = [...document.querySelectorAll('[data-gallery]')];
  if (!links.length || !('HTMLDialogElement' in window) || !HTMLDialogElement.prototype.showModal) return;

  // Une seule fenêtre est réutilisée pour toutes les images de la fiche.
  const dialog = document.createElement('dialog');
  dialog.className = 'image-gallery';
  dialog.setAttribute('aria-labelledby', 'gallery-title');
  dialog.innerHTML = `
    <div class="gallery-shell">
      <header class="gallery-header">
        <div><p class="eyebrow">EN IMAGES</p><h2 id="gallery-title"></h2></div>
        <button type="button" class="gallery-close" autofocus>Fermer <span aria-hidden="true">×</span></button>
      </header>
      <figure class="gallery-figure">
        <div class="gallery-stage"><img alt="" decoding="async"><p class="gallery-error" hidden>Cette image n’a pas pu être chargée. Tu peux ouvrir le fichier avec le lien ci-dessous.</p></div>
        <figcaption id="gallery-caption"></figcaption>
      </figure>
      <footer class="gallery-footer">
        <div class="gallery-navigation" role="group" aria-label="Parcourir les images">
          <button type="button" data-gallery-previous aria-label="Image précédente">Précédente</button>
          <p class="gallery-count" role="status" aria-live="polite" aria-atomic="true"></p>
          <button type="button" data-gallery-next aria-label="Image suivante">Suivante</button>
        </div>
        <a class="text-link gallery-original" target="_blank" rel="noopener">Ouvrir l’original <span class="visually-hidden">dans un nouvel onglet</span></a>
      </footer>
    </div>`;
  document.body.append(dialog);

  const picture = dialog.querySelector('img');
  const caption = dialog.querySelector('figcaption');
  const count = dialog.querySelector('.gallery-count');
  const original = dialog.querySelector('.gallery-original');
  const error = dialog.querySelector('.gallery-error');
  let current = 0;
  let opener;

  dialog.querySelector('#gallery-title').textContent = document.querySelector('.breadcrumb [aria-current="page"]')?.textContent || document.querySelector('h1').textContent;

  function show(index) {
    current = (index + links.length) % links.length;
    const link = links[current];
    const source = link.querySelector('img');
    const legend = link.closest('figure').querySelector('figcaption');
    picture.hidden = false;
    error.hidden = true;
    picture.alt = source.alt;
    picture.src = link.href;
    original.href = link.href;
    // Conserver les crédits ; le lien d’agrandissement est inutile dans la fenêtre.
    const legendCopy = legend?.cloneNode(true);
    legendCopy?.querySelectorAll('a').forEach((a) => { if (a.href === link.href) a.remove(); });
    caption.replaceChildren(...(legendCopy ? [...legendCopy.childNodes] : [document.createTextNode(source.alt)]));
    count.textContent = `Image ${current + 1} sur ${links.length}`;
  }

  links.forEach((link, index) => {
    link.classList.add('gallery-trigger');
    // Un repère discret ; le lien entier garde son nom accessible et reste cliquable.
    const cue = document.createElement('span');
    cue.className = 'gallery-cue';
    cue.setAttribute('aria-hidden', 'true');
    cue.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M9 4H4v5M15 4h5v5M4 15v5h5M20 15v5h-5"/></svg>';
    link.append(cue);
    const captionLinks = [...link.closest('figure').querySelectorAll('figcaption a')].filter((a) => a.href === link.href);
    [link, ...captionLinks].forEach((trigger) => {
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.addEventListener('click', (event) => {
        // Ctrl/Cmd + clic conserve l’ouverture normale dans un autre onglet.
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        opener = trigger;
        show(index);
        dialog.showModal();
        document.documentElement.classList.add('gallery-open');
      });
    });
  });

  dialog.querySelector('.gallery-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-gallery-previous]').addEventListener('click', () => show(current - 1));
  dialog.querySelector('[data-gallery-next]').addEventListener('click', () => show(current + 1));
  if (links.length === 1) {
    dialog.querySelector('[data-gallery-previous]').hidden = true;
    dialog.querySelector('[data-gallery-next]').hidden = true;
  }
  dialog.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Tab') {
      const controls = [...dialog.querySelectorAll('button:not([hidden]):not([disabled]), a[href]')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  // Échap ferme naturellement un <dialog>. Le focus revient à l’image choisie.
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('gallery-open');
    opener?.focus({ preventScroll: true });
  });
  picture.addEventListener('error', () => {
    picture.hidden = true;
    error.hidden = false;
  });
})();
