// ================================
// GRID CONFIG
// ================================
const P_MIN = -15;
const P_MAX = 15;
const STEP = 3;
const SIZE = 256;

// ================================
// HELPERS
// ================================
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function quantizeToGrid(val) {
  const raw = P_MIN + (val + 1) * (P_MAX - P_MIN) / 2;
  const snapped = Math.round(raw / STEP) * STEP;
  return clamp(snapped, P_MIN, P_MAX);
}

function sanitize(val) {
  return String(val).replace('-', 'm').replace('.', 'p');
}

function gridToFilename(px, py) {
  return `gaze_px${sanitize(px)}_py${sanitize(py)}_${SIZE}.webp`;
}

// ================================
// GLOBAL STATE
// ================================
let activeContainer = null;
let activeSetter = null;

// ================================
// GLOBAL POINTER LISTENERS
// ================================
window.addEventListener('mousemove', (e) => {
  if (!activeContainer || !activeSetter) return;

  const rect = activeContainer.getBoundingClientRect();
  const x = e.clientX;
  const y = e.clientY;

  // 🔒 HARD BOUNDARY CHECK
  if (
    x < rect.left ||
    x > rect.right ||
    y < rect.top ||
    y > rect.bottom
  ) {
    return;
  }

  activeSetter(x, y);
});

window.addEventListener(
  'touchmove',
  (e) => {
    if (!activeContainer || !activeSetter) return;
    if (!e.touches || e.touches.length === 0) return;

    const t = e.touches[0];
    const rect = activeContainer.getBoundingClientRect();
    const x = t.clientX;
    const y = t.clientY;

    if (
      x < rect.left ||
      x > rect.right ||
      y < rect.top ||
      y > rect.bottom
    ) {
      return;
    }

    activeSetter(x, y);
  },
  { passive: true }
);

// ================================
// INITIALIZER
// ================================
function initializeFaceTracker(container) {
  const basePath = container.dataset.basePath || '/faces/';
  const showDebug = String(container.dataset.debug || 'false') === 'true';

  const img = document.createElement('img');
  img.className = 'face-image';
  container.appendChild(img);

  let debugEl = null;
  if (showDebug) {
    debugEl = document.createElement('div');
    debugEl.className = 'face-debug';
    container.appendChild(debugEl);
  }

  function setFromClient(clientX, clientY) {
    const rect = container.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const nx = (clientX - cx) / (rect.width / 2);
    const ny = (cy - clientY) / (rect.height / 2);

    const px = quantizeToGrid(clamp(nx, -1, 1));
    const py = quantizeToGrid(clamp(ny, -1, 1));

    const filename = gridToFilename(px, py);
    img.src = `${basePath}${filename}`;

    if (debugEl) {
      debugEl.innerHTML = `
        x:${Math.round(clientX - rect.left)} 
        y:${Math.round(clientY - rect.top)}<br/>
        ${filename}
      `;
    }
  }

  // ================================
  // ACTIVATE / DEACTIVATE
  // ================================
  container.addEventListener('pointerenter', () => {
    activeContainer = container;
    activeSetter = setFromClient;
  });

  container.addEventListener('pointerleave', () => {
    activeContainer = null;
    activeSetter = null;

    // return to center
    const rect = container.getBoundingClientRect();
    setFromClient(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    );
  });

  // initial center
  const rect = container.getBoundingClientRect();
  setFromClient(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2
  );
}

// ================================
// BOOTSTRAP
// ================================
document.addEventListener('DOMContentLoaded', () => {
  document
    .querySelectorAll('.face-tracker')
    .forEach(initializeFaceTracker);
});
