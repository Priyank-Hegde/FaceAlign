// ================================
// GRID CONFIG (must match images)
// ================================
const P_MIN = -15;
const P_MAX = 15;
const STEP = 3;
const SIZE = 256;

// ================================
// HELPERS
// ================================
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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
// GLOBAL POINTER ROUTING (SAFE)
// ================================
let activeTracker = null;

window.addEventListener('mousemove', (e) => {
  if (activeTracker) activeTracker(e.clientX, e.clientY);
});

window.addEventListener(
  'touchmove',
  (e) => {
    if (!activeTracker) return;
    if (e.touches && e.touches.length > 0) {
      const t = e.touches[0];
      activeTracker(t.clientX, t.clientY);
    }
  },
  { passive: true }
);

// ================================
// MAIN INITIALIZER
// ================================
function initializeFaceTracker(container) {
  const basePath = container.dataset.basePath || '/faces/';
  const showDebug = String(container.dataset.debug || 'false') === 'true';

  const img = document.createElement('img');
  img.className = 'face-image';
  img.alt = 'Face tracking';
  container.appendChild(img);

  let debugEl = null;
  if (showDebug) {
    debugEl = document.createElement('div');
    debugEl.className = 'face-debug';
    container.appendChild(debugEl);
  }

  function updateDebug(x, y, filename) {
    if (!debugEl) return;
    debugEl.innerHTML = `
      Mouse: (${Math.round(x)}, ${Math.round(y)})<br/>
      Image: ${filename}
    `;
  }

  function setFromClient(clientX, clientY) {
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const nx = (clientX - centerX) / (rect.width / 2);
    const ny = (centerY - clientY) / (rect.height / 2);

    const clampedX = clamp(nx, -1, 1);
    const clampedY = clamp(ny, -1, 1);

    const px = quantizeToGrid(clampedX);
    const py = quantizeToGrid(clampedY);

    const filename = gridToFilename(px, py);
    img.src = `${basePath}${filename}`;

    updateDebug(clientX - rect.left, clientY - rect.top, filename);
  }

  // ================================
  // HOVER / TOUCH GATING
  // ================================
  container.addEventListener('mouseenter', () => {
    activeTracker = setFromClient;
  });

  container.addEventListener('mouseleave', () => {
    activeTracker = null;

    // Smooth return to center
    const rect = container.getBoundingClientRect();
    setFromClient(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    );
  });

  // ================================
  // INITIAL STATE (CENTER)
  // ================================
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
    .forEach((el) => initializeFaceTracker(el));
});
