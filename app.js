/* =======================================================================
   CONFIGURACIÓN DE SUPABASE
   Reemplaza estos valores por tus credenciales reales del proyecto.
   Los encuentras en: Supabase Dashboard → Project Settings → API
   ======================================================================= */
const SUPABASE_URL = "https://lilgxfmslakbchtmplec.supabase.co";   // ← reemplazar
const SUPABASE_ANON_KEY = "sb_publishable_ya_zw1lFI5LtsiSwGd4Atw_O1BrniDA";              // ← reemplazar

// Inicialización del cliente de Supabase (desde el CDN global `supabase`)
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* =======================================================================
   REFERENCIAS AL DOM
   ======================================================================= */
const loginView   = document.getElementById("login-view");
const appView     = document.getElementById("app-view");
const loginForm   = document.getElementById("login-form");
const loginBtn    = document.getElementById("login-btn");
const logoutBtn   = document.getElementById("logout-btn");
const themeToggle = document.getElementById("theme-toggle");
const toast       = document.getElementById("toast");

const itemForm    = document.getElementById("item-form");
const itemBtn     = document.getElementById("item-btn");
const itemName    = document.getElementById("item-name");
const itemDesc    = document.getElementById("item-desc");
const itemsBody   = document.getElementById("items-body");
const emptyState  = document.getElementById("empty-state");

const cards       = document.querySelectorAll(".hub-card");

/* =======================================================================
   UTILIDADES DE INTERFAZ
   ======================================================================= */

/**

 * Muestra una notificación flotante (toast).
 * @param {string} message - Texto a mostrar.
 * @param {"success"|"error"} [type="success"] - Tipo de notificación.
 */
function showToast(message, type = "success") {
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  // Oculta automáticamente tras 3.5s
  setTimeout(() => {
    toast.className = "toast";
  }, 3500);
}

/**

 * Activa/desactiva el estado "loading" de un botón con spinner.
 * @param {HTMLButtonElement} btn - Botón a modificar.
 * @param {boolean} isLoading - true = cargando.
 */
function setLoading(btn, isLoading) {
  const text = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".spinner");
  btn.disabled = isLoading;
  if (text) text.style.visibility = isLoading ? "hidden" : "visible";
  if (spinner) spinner.hidden = !isLoading;
}

/* =======================================================================
   GESTIÓN DE TEMA (OSCURO / CLARO)
   ======================================================================= */

/** Aplica el tema guardado en localStorage al cargar la página. */
function initTheme() {
  const saved = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  themeToggle.textContent = saved === "dark" ? "🌙" : "☀️";
}

/** Alterna entre tema oscuro y claro y lo persiste. */
function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  themeToggle.textContent = next === "dark" ? "🌙" : "☀️";
  localStorage.setItem("theme", next);
}

/* =======================================================================
   AUTENTICACIÓN (DEMO)
   Utiliza Supabase Auth con email/contraseña. Si prefieres un login
   simulado, puedes comentar la llamada a Supabase e ir directo a showApp().
   ======================================================================= */

/**

 * Maneja el envío del formulario de login.
 * Intenta iniciar sesión con Supabase Auth.
 * @param {Event} e
 */
async function handleLogin(email, password) {
  console.log('1. Iniciando login con:', email);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  console.log('2. Respuesta Supabase →', { data, error });

  if (error) {
    console.log('3. ERROR:', error.message);
    showToast(error.message, 'error');
    return;
  }

  console.log('4. Login OK, mostrando app...');
  showApp();
}


/** Cierra la sesión actual y vuelve a la vista de login. */
async function handleLogout() {
  try {
    await supabaseClient.auth.signOut();
  } catch (err) {
    console.error("Error al cerrar sesión:", err.message);
  } finally {
    appView.hidden = true;
    loginView.hidden = false;
    showToast("Sesión cerrada", "success");
  }
}

/** Muestra la vista principal y carga los datos. */
function showApp() {
  loginView.hidden = true;
  appView.hidden = false;
  fetchItems(); // Carga inicial de registros
}

/* =======================================================================
   LÓGICA DE DATOS CON SUPABASE (tabla 'items')
   Estructura sugerida de la tabla:
     id          : uuid / int8 (PK)
     name        : text
     description : text
     created_at  : timestamptz (default now())
   ======================================================================= */

/**

 * INSERTA un nuevo registro en la tabla 'items'.
 * @param {Event} e
 */
async function insertItem(e) {
  e.preventDefault();
  const name = itemName.value.trim();
  const description = itemDesc.value.trim();

  if (!name) {
    showToast("El nombre es obligatorio", "error");
    return;
  }

  setLoading(itemBtn, true);

  try {
    const { error } = await supabaseClient
      .from("items")
      .insert([{ name, description }]);

    if (error) throw error;

    showToast("Registro agregado correctamente ✓", "success");
    itemForm.reset();
    await fetchItems(); // Refresca la tabla tras insertar
  } catch (err) {
    console.error("Error al insertar:", err.message);
    showToast("No se pudo agregar el registro", "error");
  } finally {
    setLoading(itemBtn, false);
  }
}

/**

 * LEE todos los registros de 'items' ordenados por fecha
 * de creación de forma descendente (más recientes primero).
 */
async function fetchItems() {
  try {
    const { data, error } = await supabaseClient
      .from("items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    renderItems(data || []);
  } catch (err) {
    console.error("Error al leer datos:", err.message);
    showToast("Error al cargar los registros", "error");
  }
}

/**

 * Renderiza las filas de la tabla a partir de un array de ítems.
 * @param {Array<Object>} items
 */
function renderItems(items) {
  itemsBody.innerHTML = "";

  // Estado vacío
  if (items.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  // Genera una fila por cada registro
  items.forEach((item) => {
    const tr = document.createElement("tr");

    // Formatea la fecha de creación de forma legible
    const fecha = item.created_at
      ? new Date(item.created_at).toLocaleString("es-ES")
      : "-";

    tr.innerHTML = `
      <td>${escapeHtml(item.name ?? "")}</td>
      <td>${escapeHtml(item.description ?? "")}</td>
      <td>${fecha}</td>
    `;
    itemsBody.appendChild(tr);
  });
}

/**

 * Escapa caracteres HTML para prevenir inyección (XSS) al renderizar.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const map = {
    "&": "&",
    "<": "<",
    ">": ">",
    '"': '"',
    "'": "&#039;"
  };
  return String(str).replace(/[&<>"']/g, (char) => map[char]);
}

/* =======================================================================
   NAVEGACIÓN DE TARJETAS (CONSULTAS / BD / DASHBOARD / USUARIOS)
   Punto de extensión: aquí puedes enrutar a cada módulo real.
   ======================================================================= */

/** Asigna el evento click/teclado a cada tarjeta del hub. */
function initCards() {
  cards.forEach((card) => {
    const section = card.dataset.section;

    const activate = () => {
      showToast(`Abriendo módulo: ${section.toUpperCase()}`, "success");
      console.log(`Navegación → ${section}`);
      // TODO: aquí integrarías la lógica real de cada sección.
    };

    card.addEventListener("click", activate);
    // Accesibilidad: activar con Enter o Espacio
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate();
      }
    });
  });
}

/* =======================================================================
   INICIALIZACIÓN GENERAL
   ======================================================================= */

/** Comprueba si ya existe una sesión activa al cargar la app. */
async function checkSession() {
  try {
    const { data } = await supabaseClient.auth.getSession();
    if (data.session) {
      showApp(); // Si hay sesión, salta el login
    }
  } catch (err) {
    console.error("Error al verificar sesión:", err.message);
  }
}

/** Registra todos los event listeners de la aplicación. */
function initEventListeners() {
  loginForm.addEventListener("submit", handleLogin);
  logoutBtn.addEventListener("click", handleLogout);
  itemForm.addEventListener("submit", insertItem);
  themeToggle.addEventListener("click", toggleTheme);
}

/** Punto de entrada: se ejecuta cuando el DOM está listo. */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initEventListeners();
  initCards();
  checkSession();
});

async function init() {
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    showApp();
  } else {
    showLogin();
  }
}

init();
