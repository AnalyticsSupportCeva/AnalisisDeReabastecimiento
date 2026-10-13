/* ============================================================
   common.js - Código compartido entre index.html y bd.html
   Debe cargarse DESPUÉS de la librería Supabase (CDN)
   y ANTES de app.js / bd.js
============================================================ */

// --- Configuración Supabase ---
const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
const SUPABASE_KEY = 'TU-CLAVE-PUBLICA-ANON';

// Cliente global reutilizable
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ------------------------------------------------------------
   Utilidad: escapar HTML (prevención de XSS)
------------------------------------------------------------ */
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

/* ------------------------------------------------------------
   Utilidad: Toast de notificaciones
   Requiere un contenedor <div id="toast"></div> en el HTML
------------------------------------------------------------ */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) {
    console.log(`[${type}] ${message}`);
    return;
  }
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

/* ------------------------------------------------------------
   Utilidad: estado de carga en botones
------------------------------------------------------------ */
function setLoading(button, isLoading) {
  if (!button) return;
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Cargando…';
  } else {
    button.disabled = false;
    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
    }
  }
}

/* ------------------------------------------------------------
   Logout compartido
   Enlaza automáticamente cualquier botón con id="logout-btn"
------------------------------------------------------------ */
async function handleLogout() {
  try {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
  } catch (err) {
    showToast('Error al cerrar sesión', 'error');
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
});

/* ------------------------------------------------------------
   Tema claro/oscuro compartido (opcional)
   Enlaza cualquier botón con id="theme-toggle"
------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }
});
