/* =========================================================
   CONFIGURACIÓN DE SUPABASE
========================================================= */
const SUPABASE_URL = "https://lilgxfmslakbchtmplec.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ya_zw1lFI5LtsiSwGd4Atw_O1BrniDA";

// La librería del CDN expone el global `supabase` (solo para createClient)
const supabaseClient = supabase.createClient("https://lilgxfmslakbchtmplec.supabase.co", "sb_publishable_ya_zw1lFI5LtsiSwGd4Atw_O1BrniDA");

/* =========================================================
   REFERENCIAS AL DOM
========================================================= */
const loginView     = document.getElementById("login-view");
const appView       = document.getElementById("app-view");
const loginForm     = document.getElementById("login-form");
const emailInput    = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn      = document.getElementById("login-btn");
const logoutBtn     = document.getElementById("logout-btn");


// FIX #1: el formulario en el HTML tiene id="item-form" (no "items-form")
const itemsForm     = document.getElementById("item-form");
const itemNameInput = document.getElementById("item-name");
const itemDescInput = document.getElementById("item-desc"); // FIX: se usaba el input pero no se leía
const itemBtn       = document.getElementById("item-btn");  // FIX: faltaba referencia para el loading
const itemsTableBody = document.querySelector("#items-table tbody");
const emptyState    = document.getElementById("empty-state");

const themeToggle   = document.getElementById("theme-toggle");
const toastEl       = document.getElementById("toast");

/* =========================================================
   UTILIDADES: VISTAS
   FIX #2: el HTML usa el atributo `hidden`, no la clase .hidden.
   Alternamos la propiedad `hidden` para que ocultar/mostrar funcione.
========================================================= */

// --- Cerrar sesión ---
logoutBtn.addEventListener("click", async () => {
  logoutBtn.disabled = true;
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;

    // Alterna vistas usando la MISMA mecánica (clase .hidden)
    appView.classList.add("hidden");
    loginView.classList.remove("hidden");

  // Limpia el formulario de login
  const loginForm = document.getElementById("login-form"); // ajusta al id real
  loginForm?.reset();

    showToast("Sesión cerrada correctamente", "success");
  } catch (err) {
    showToast("Error al cerrar sesión: " + err.message, "error");
  } finally {
    logoutBtn.disabled = false;
  }
});

function showApp() {
  loginView.hidden = true;
  appView.hidden = false;
}

function showLogin() {
  appView.hidden = true;
  loginView.hidden = false;
}

/* =========================================================
   UTILIDADES: TOAST
========================================================= */
let toastTimeout;
function showToast(message, type = "success") {
  if (!toastEl) return;
  clearTimeout(toastTimeout);

  toastEl.textContent = message;
  toastEl.className = `toast ${type} show`;

  toastTimeout = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 3000);
}

/* =========================================================
   UTILIDADES: ESCAPAR HTML (prevención XSS)
   FIX: entidades correctas (& -> &, < -> <, etc.)
========================================================= */
function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/'/g, "&#039;");
}

/* =========================================================
   UTILIDADES: ESTADO DE CARGA EN BOTÓN
   FIX: ya no se destruye el innerHTML del botón. Alternamos
   la visibilidad del .btn-text y del .spinner definidos en el HTML.
========================================================= */
function setLoading(button, isLoading) {
  if (!button) return;

  const text = button.querySelector(".btn-text");
  const spinner = button.querySelector(".spinner");

  button.disabled = isLoading;

  if (text) text.hidden = isLoading;
  if (spinner) spinner.hidden = !isLoading;
}

/* =========================================================
   AUTENTICACIÓN
========================================================= */
async function handleLogin(email, password) {
  setLoading(loginBtn, true);

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  setLoading(loginBtn, false);

  if (error) {
    showToast(error.message, "error");
    return;
  }

  showApp();
  showToast("Sesión iniciada correctamente", "success");
  loadItems();
}

async function handleLogout() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    showToast(error.message, "error");
    return;
  }
  showLogin();
  showToast("Sesión cerrada", "success");
}

/* =========================================================
   CRUD: LEER ITEMS
========================================================= */
async function loadItems() {
  if (!itemsTableBody) return;

  const { data, error } = await supabaseClient
    .from("items")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    showToast(error.message, "error");
    return;
  }

  renderItems(data || []);
}

function renderItems(items) {
  itemsTableBody.innerHTML = "";

  // FIX #4: usamos el elemento #empty-state del HTML en vez de una fila duplicada
  if (!items.length) {
    if (emptyState) emptyState.hidden = false;
    return;
  }
  if (emptyState) emptyState.hidden = true;

  items.forEach((item) => {
    const row = document.createElement("tr");
    // FIX #3: las celdas ahora coinciden con el <thead>:
    // Nombre | Descripción | Creado | (Acciones)
    const created = item.created_at
      ? new Date(item.created_at).toLocaleString()
      : "";

    row.innerHTML = `
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.description)}</td>
      <td>${escapeHtml(created)}</td>
      <td>
        <button class="btn-ghost" data-delete="${escapeHtml(item.id)}">
          Eliminar
        </button>
      </td>
    `;
    itemsTableBody.appendChild(row);
  });
}

/* =========================================================
   CRUD: CREAR ITEM
   FIX #5: ahora el botón muestra estado de carga y se guarda la descripción.
========================================================= */
async function handleAddItem(name, description) {
  setLoading(itemBtn, true);

  const { error } = await supabaseClient
    .from("items")
    .insert([{ name, description }]);

  setLoading(itemBtn, false);

  if (error) {
    showToast(error.message, "error");
    return;
  }

  showToast("Registro agregado", "success");
  itemNameInput.value = "";
  if (itemDescInput) itemDescInput.value = "";
  loadItems();
}

/* =========================================================
   CRUD: ELIMINAR ITEM
========================================================= */
async function handleDeleteItem(id) {
  const { error } = await supabaseClient
    .from("items")
    .delete()
    .eq("id", id);

  if (error) {
    showToast(error.message, "error");
    return;
  }

  showToast("Registro eliminado", "success");
  loadItems();
}

/* =========================================================
   TEMA OSCURO / CLARO
========================================================= */
function initTheme() {
  const saved = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
}

/* =========================================================
   EVENT LISTENERS
========================================================= */
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    await handleLogin(email, password);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", handleLogout);
}

if (itemsForm) {
  itemsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = itemNameInput.value.trim();
    const description = itemDescInput ? itemDescInput.value.trim() : "";

    if (!name) {
      showToast("Escribe un nombre", "error");
      return;
    }

    await handleAddItem(name, description);
  });
}

// Delegación de eventos para botones "Eliminar"
if (itemsTableBody) {
  itemsTableBody.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-delete]");
    if (btn) {
      handleDeleteItem(btn.dataset.delete);
    }
  });
}

if (themeToggle) {
  themeToggle.addEventListener("click", toggleTheme);
}

/* =========================================================
   INICIALIZACIÓN
========================================================= */
async function init() {
  initTheme();

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (session) {
    showApp();
    loadItems();
  } else {
    showLogin();
  }
}

init();
