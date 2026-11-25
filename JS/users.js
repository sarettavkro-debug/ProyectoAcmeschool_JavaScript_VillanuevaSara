import { saveStore } from "./store.js";
import { isAuthenticated } from "./auth.js";

let editingUserId = null;


export function initUsersModule(state, onNotify) {
const form = document.getElementById("user-crud-form");
const resetBtn = document.getElementById("reset-user-form-btn");
const tableBody = document.getElementById("users-table-body");

if (!form || !tableBody) return;

form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!isAuthenticated(state)) {
        onNotify("Debes iniciar sesión para gestionar usuarios.", "error");
        return;
    }

    const formData = new FormData(form);
    const userData = {
        id: String(formData.get("id") || "").trim(),
        fullName: String(formData.get("fullName") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        phone: String(formData.get("phone") || "").trim(),
        role: String(formData.get("role") || "").trim(),
        password: String(formData.get("password") || "").trim()
    };

    const result = editingUserId
        ? updateUser(state, editingUserId, userData)
        : createUser(state, userData);

    if (!result.ok) {
        onNotify(result.message, "error");
        return;
    }

    resetUserForm();
    renderUsersTable(state);
    onNotify(result.message, "success");
});

  // Botón Cancelar / Limpiar
if (resetBtn) {
    resetBtn.addEventListener("click", () => {
        resetUserForm();
    });
}

tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    if (!isAuthenticated(state)) {
        onNotify("Acceso denegado. Inicia sesión primero.", "error");
        return;
    }

    const action = button.dataset.action;
    const userId = button.dataset.id;

    if (action === "edit") {
        loadUserIntoForm(state, userId);
    } else if (action === "delete") {
        const result = deleteUser(state, userId);
        if (!result.ok) {
        onNotify(result.message, "error");
        return;
        }
        if (editingUserId === userId) {
        resetUserForm();
        }
        renderUsersTable(state);
        onNotify(result.message, "success");
    }
});
}

function createUser(state, userData) {
const validationError = validateUserFields(userData);
if (validationError) {
    return { ok: false, message: validationError };
}

const duplicatedId = state.users.some((u) => u.id === userData.id);
if (duplicatedId) {
    return { ok: false, message: "Ya existe un usuario con ese número de identificación." };
}

const duplicatedEmail = state.users.some(
    (u) => u.email.toLowerCase() === userData.email.toLowerCase()
);
if (duplicatedEmail) {
    return { ok: false, message: "Ya existe un usuario registrado con ese correo." };
}

state.users.push(userData);
saveStore(state);

return { ok: true, message: `Usuario ${userData.fullName} creado correctamente.` };
}


function updateUser(state, targetId, updatedData) {
const validationError = validateUserFields(updatedData);
if (validationError) {
    return { ok: false, message: validationError };
}

const index = state.users.findIndex((u) => u.id === targetId);
if (index === -1) {
    return { ok: false, message: "No se encontró el usuario a actualizar." };
}

const emailTakenByOther = state.users.some(
    (u) => u.id !== targetId && u.email.toLowerCase() === updatedData.email.toLowerCase()
);
if (emailTakenByOther) {
    return { ok: false, message: "Otro usuario ya utiliza ese correo electrónico." };
}

state.users[index] = {
    ...state.users[index],
    fullName: updatedData.fullName,
    email: updatedData.email,
    phone: updatedData.phone,
    role: updatedData.role,
    password: updatedData.password
};

if (state.sessionUser && state.sessionUser.id === targetId) {
    state.sessionUser.fullName = updatedData.fullName;
    state.sessionUser.email = updatedData.email;
    state.sessionUser.role = updatedData.role;
}

saveStore(state);
return { ok: true, message: `Usuario ${updatedData.fullName} actualizado.` };
}

function deleteUser(state, targetId) {
if (state.users.length <= 1) {
    return {
        ok: false,
        message: "No puedes eliminar el único usuario activo del sistema."
    };
}

    if (state.sessionUser && state.sessionUser.id === targetId) {
    return {
        ok: false,
        message: "No puedes eliminar el usuario con el que tienes sesión iniciada."
    };
}

const index = state.users.findIndex((u) => u.id === targetId);
if (index === -1) {
    return { ok: false, message: "Usuario no encontrado." };
}

const [removed] = state.users.splice(index, 1);
saveStore(state);

return { ok: true, message: `Usuario ${removed.fullName} eliminado.` };
}

function validateUserFields(user) {
if (!user.id || !user.fullName || !user.email || !user.phone || !user.password) {
    return "Todos los campos del usuario son obligatorios.";
}
if (user.role !== "Administrativo" && user.role !== "Docente") {
    return "El cargo debe ser Administrativo o Docente.";
}
return null;
}


function loadUserIntoForm(state, userId) {
const user = state.users.find((u) => u.id === userId);
if (!user) return;

editingUserId = user.id;

const heading = document.getElementById("user-form-heading");
const idInput = document.getElementById("user-id");

if (heading) heading.textContent = `Editando usuario: ${user.fullName}`;
if (idInput) {
    idInput.value = user.id;
    idInput.readOnly = true;
}

document.getElementById("user-fullname").value = user.fullName;
document.getElementById("user-email").value = user.email;
document.getElementById("user-phone").value = user.phone;
document.getElementById("user-role").value = user.role;
document.getElementById("user-password").value = user.password;
}

export function resetUserForm() {
editingUserId = null;

const form = document.getElementById("user-crud-form");
const heading = document.getElementById("user-form-heading");
const idInput = document.getElementById("user-id");

if (form) form.reset();
if (heading) heading.textContent = "Nuevo usuario";
if (idInput) idInput.readOnly = false;
}

export function renderUsersTable(state) {
const tableBody = document.getElementById("users-table-body");
if (!tableBody) return;

tableBody.innerHTML = state.users
    .map(
        (user) => `
        <tr>
        <td>${escapeHtml(user.id)}</td>
        <td><strong>${escapeHtml(user.fullName)}</strong></td>
        <td>${escapeHtml(user.email)}</td>
        <td>${escapeHtml(user.phone)}</td>
        <td>${escapeHtml(user.role)}</td>
        <td>
            <button type="button" class="action-btn-edit" data-action="edit" data-id="${escapeHtml(user.id)}">
            Actualizar
            </button>
            <button type="button" class="action-btn-delete" data-action="delete" data-id="${escapeHtml(user.id)}">
            Eliminar
            </button>
        </td>
        </tr>
    `
    )
    .join("");
}

function escapeHtml(value) {
return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}