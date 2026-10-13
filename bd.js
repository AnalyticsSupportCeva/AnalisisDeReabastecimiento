/* =========================================================
   CRUD: TABLA 'BasedeDatos'
========================================================= */
const bdId     = document.getElementById("bd-id");
const bdNombre = document.getElementById("bd-nombre");
const bdValor  = document.getElementById("bd-valor");
const bdBody   = document.getElementById("bd-body");
const bdEmpty  = document.getElementById("bd-empty");

const TABLA_BD = "BasedeDatos";

// --- SELECCIONAR (Read) ---
async function loadBD() {
  const { data, error } = await supabaseClient
    .from(TABLA_BD)
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    showToast(error.message, "error");
    return;
  }
  renderBD(data || []);
}

function renderBD(rows) {
  bdBody.innerHTML = "";
  if (!rows.length) {
    if (bdEmpty) bdEmpty.hidden = false;
    return;
  }
  if (bdEmpty) bdEmpty.hidden = true;

  rows.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(r.id)}</td>
      <td>${escapeHtml(r.nombre)}</td>
      <td>${escapeHtml(r.valor)}</td>
    `;
    // Al hacer clic en una fila, carga sus datos en el formulario
    tr.addEventListener("click", () => {
      bdId.value     = r.id ?? "";
      bdNombre.value = r.nombre ?? "";
      bdValor.value  = r.valor ?? "";
    });
    bdBody.appendChild(tr);
  });
}

// --- AGREGAR (Create) ---
async function addBD() {
  const nombre = bdNombre.value.trim();
  const valor  = bdValor.value.trim();
  if (!nombre) return showToast("El nombre es obligatorio", "error");

  const { error } = await supabaseClient
    .from(TABLA_BD)
    .insert([{ nombre, valor }]);

  if (error) return showToast(error.message, "error");
  showToast("Registro agregado", "success");
  limpiarBD();
  loadBD();
}

// --- ACTUALIZAR (Update) ---
async function updateBD() {
  const id = bdId.value.trim();
  if (!id) return showToast("Indica el ID a actualizar", "error");

  const { error } = await supabaseClient
    .from(TABLA_BD)
    .update({ nombre: bdNombre.value.trim(), valor: bdValor.value.trim() })
    .eq("id", id);

  if (error) return showToast(error.message, "error");
  showToast("Registro actualizado", "success");
  limpiarBD();
  loadBD();
}

// --- ELIMINAR (Delete) ---
async function deleteBD() {
  const id = bdId.value.trim();
  if (!id) return showToast("Indica el ID a eliminar", "error");

  const { error } = await supabaseClient
    .from(TABLA_BD)
    .delete()
    .eq("id", id);

  if (error) return showToast(error.message, "error");
  showToast("Registro eliminado", "success");
  limpiarBD();
  loadBD();
}

function limpiarBD() {
  bdId.value = "";
  bdNombre.value = "";
  bdValor.value = "";
}

// --- Enlazar los 4 botones ---
document.getElementById("bd-add").addEventListener("click", addBD);
document.getElementById("bd-update").addEventListener("click", updateBD);
document.getElementById("bd-delete").addEventListener("click", deleteBD);
document.getElementById("bd-select").addEventListener("click", loadBD);

init();
