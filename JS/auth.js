import { saveStore } from "./store.js";

export function loginUser(state, email, password) {
const cleanEmail = email.trim().toLowerCase();
const cleanPassword = password.trim();

const user = state.users.find(
    (item) =>
        item.email.trim().toLowerCase() === cleanEmail &&
        item.password === cleanPassword
);

if (!user) {
    return {
        ok: false,
        message: "Correo o contraseña incorrectos."
    };
}

state.sessionUser = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role
};

saveStore(state);

return {
    ok: true,
    user: state.sessionUser,
    message: `Bienvenido(a), ${user.fullName}.`
};
}

export function logoutUser(state) {
state.sessionUser = null;
saveStore(state);
}

export function isAuthenticated(state) {
return Boolean(state.sessionUser && state.sessionUser.id);
}

export function canAccessView(state, viewName) {
const privateViews = ["users", "exams"];
if (!privateViews.includes(viewName)) {
    return true;
}
return isAuthenticated(state);
}

export function syncAuthUI(state) {
const loggedIn = isAuthenticated(state);
const authOnlyEls = document.querySelectorAll('[data-auth-only="true"]');
const loginBtn = document.getElementById("open-login-btn");
const logoutBtn = document.getElementById("logout-btn");
const badge = document.getElementById("session-badge");

authOnlyEls.forEach((el) => el.classList.toggle("is-hidden", !loggedIn));
if (loginBtn) loginBtn.classList.toggle("is-hidden", loggedIn);
if (logoutBtn) logoutBtn.classList.toggle("is-hidden", !loggedIn);

if (badge) {
    if (loggedIn) {
        badge.textContent = `${state.sessionUser.fullName} (${state.sessionUser.role})`;
        badge.classList.remove("is-hidden");
    } else {
        badge.textContent = "";
        badge.classList.add("is-hidden");
    }
}
}