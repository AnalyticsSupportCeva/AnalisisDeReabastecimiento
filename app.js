/* =========================================================
   CONFIGURACIÓN DE SUPABASE
========================================================= */
const SUPABASE_URL = "https://lilgxfmslakbchtmplec.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ya_zw1lFI5LtsiSwGd4Atw_O1BrniDA";

// La librería del CDN expone el global `supabase` (solo para createClient)
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* =========================================================
   REFERENCIAS AL DOM
========================================================= */
const loginView   = document.getElementById("login-view");
const appView     = document.getElementById("app-view");
const loginForm   = document.getElementById("login-form");
const emailInput  = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn    = document.getElementById("login-btn");
const logoutBtn   = document.getElementById("logout-btn");

const itemsForm   = document.getElementById("items-form");
const itemNameInput = document.getElementById("item-name");
const itemsTableBody = document.querySelector("#items-table tbody");

const themeToggle = document.getElementById("theme-toggle");
const toastEl     = document.getElementById("toast");

/* =========================================================
   UTILIDADES: VISTAS
========================================================= */
function showApp() {
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
}

function showLogin() {
  appView.classList.add("hidden");
  loginView.classList.remove("hidden");
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
========================================================= */
function setLoading(button, isLoading) {
  if (!button) return;
  if (isLoading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.innerHTML = '<span class="spinner"></span>';
  } else {
    button.disabled = false;
    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
    }
  }
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

  if (items.length === 0) {
    itemsTableBody.innerHTML =
      '<tr><td colspan="3" style="text-align:center">Sin registros</td></tr>';
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(item.id)}</td>
      <td>${escapeHtml(item.name)}</td>
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
========================================================= */
async function handleAddItem(name) {
  const { error } = await supabaseClient
    .from("items")
    .insert([{ name }]);

  if (error) {
    showToast(error.message, "error");
    return;
  }

  showToast("Registro agregado", "success");
  itemNameInput.value = "";
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
    if (!name) {
      showToast("Escribe un nombre", "error");
      return;
    }
    await handleAddItem(name);
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

  const { data: { session } } = await supabaseClient.auth.getSession();

  if (session) {
    showApp();
    loadItems();
  } else {
    showLogin();
  }
}

init();
