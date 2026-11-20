/* Le lecteur et la maquette sont chargés uniquement après le clic du visiteur. */
(() => {
  'use strict';
  const card = document.querySelector('[data-model-card]');
  if (!card) return;
  const scriptURL = document.currentScript.src;

  const frame = card.querySelector('.model-stage');
  const placeholder = card.querySelector('.model-placeholder');
  const startButton = card.querySelector('[data-model-start]');
  const status = card.querySelector('[data-model-status]');
  const toolbar = card.querySelector('.model-toolbar');
  const help = card.querySelector('.model-help');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const initialOrbit = '35deg 55deg 105%';

  // Un fichier ouvert par double-clic n’a pas l’origine HTTP requise pour la 3D.
  if (location.protocol === 'file:') {
    card.querySelector('.model-launch').hidden = true;
    status.textContent = 'Pour manipuler la maison, ouvre « Ouvrir-le-portfolio.cmd » dans le dossier portfolio, puis garde sa fenêtre ouverte. Le site s’ouvrira automatiquement avec une adresse locale compatible avec la 3D.';
    return;
  }

  let viewer;
  let loading = false;
  let attempt = 0;
  let timer;

  function fail(id) {
    if (id !== attempt) return;
    attempt++;
    clearTimeout(timer);
    loading = false;
    viewer?.remove();
    viewer = undefined;
    placeholder.hidden = false;
    toolbar.hidden = true;
    help.hidden = true;
    startButton.disabled = false;
    startButton.textContent = 'Réessayer la vue 3D';
    frame.removeAttribute('aria-busy');
    status.textContent = 'La vue 3D n’a pas pu démarrer. L’aperçu reste disponible ; vous pouvez réessayer.';
  }

  async function start() {
    if (loading || viewer) return;
    loading = true;
    const id = ++attempt;
    startButton.disabled = true;
    startButton.textContent = 'Chargement de la maquette…';
    status.textContent = 'Préparation de la vue 3D…';
    frame.setAttribute('aria-busy', 'true');
    timer = setTimeout(() => fail(id), 45000);
    try {
      // Bibliothèque et décodeur hébergés dans le portfolio, avec leurs licences.
      await import(new URL('assets/vendor/model-viewer-4.4.0.min.js', scriptURL).href);
      if (id !== attempt) return;
      const ModelViewer = customElements.get('model-viewer');
      ModelViewer.dracoDecoderLocation = new URL('assets/vendor/draco-1.5.6/', scriptURL).href;
      viewer = document.createElement('model-viewer');
      const translations = { 'interaction-prompt': 'Utilisez la souris, le toucher ou les flèches du clavier pour orienter la maquette.' };
      Object.entries({front:'de face',back:'de dos',left:'de gauche',right:'de droite'}).forEach(([key,label]) => {
        translations[key] = `Vue ${label}.`;
        translations[`upper-${key}`] = `Vue ${label}, en plongée.`;
        translations[`lower-${key}`] = `Vue ${label}, en contre-plongée.`;
      });
      viewer.a11y = translations;
      const attributes = {
        alt: 'Maquette de la maison de Beg ar Loued, sans textures, avec sa toiture, ses murs et des éléments séparés pour l’impression 3D.',
        'camera-controls': '',
        'disable-pan': '',
        'touch-action': 'pan-y',
        'camera-orbit': initialOrbit,
        'min-camera-orbit': 'auto 5deg 45%',
        'max-camera-orbit': 'auto 90deg 200%',
        'field-of-view': '30deg',
        'interaction-prompt': 'none',
        'environment-image': 'neutral',
        'shadow-intensity': '1',
        'shadow-softness': '1',
        exposure: '1',
        loading: 'eager',
        'interpolation-decay': reducedMotion.matches ? '0' : '80',
        'aria-describedby': 'aide-maison-3d'
      };
      Object.entries(attributes).forEach(([key, value]) => viewer.setAttribute(key, value));
      viewer.addEventListener('load', () => {
        if (id !== attempt) return;
        clearTimeout(timer);
        loading = false;
        placeholder.hidden = true;
        toolbar.hidden = false;
        help.hidden = false;
        frame.removeAttribute('aria-busy');
        status.textContent = 'Maquette prête à explorer.';
        viewer.focus();
      }, { once: true });
      viewer.addEventListener('error', () => fail(id));
      viewer.src = card.dataset.modelSrc;
      frame.prepend(viewer);
    } catch {
      fail(id);
    }
  }

  startButton.hidden = false;
  startButton.addEventListener('click', start);
  card.querySelector('[data-model-reset]').addEventListener('click', () => {
    if (!viewer) return;
    viewer.cameraOrbit = initialOrbit;
    viewer.cameraTarget = 'auto auto auto';
    status.textContent = 'Vue d’ensemble.';
  });
  card.querySelector('[data-model-top]').addEventListener('click', () => {
    if (!viewer) return;
    viewer.cameraOrbit = '0deg 5deg 105%';
    status.textContent = 'Vue du dessus.';
  });
  card.querySelectorAll('[data-model-zoom]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!viewer) return;
      const { theta, phi, radius } = viewer.getCameraOrbit();
      const distance = radius * (button.dataset.modelZoom === 'in' ? .8 : 1.25);
      viewer.cameraOrbit = `${theta}rad ${phi}rad ${distance}m`;
      status.textContent = button.dataset.modelZoom === 'in' ? 'Vue rapprochée.' : 'Vue éloignée.';
    });
  });
  reducedMotion.addEventListener('change', () => {
    viewer?.setAttribute('interpolation-decay', reducedMotion.matches ? '0' : '80');
  });
})();
