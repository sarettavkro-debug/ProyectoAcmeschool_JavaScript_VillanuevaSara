import { saveStore } from "./store.js";

export function loginUser(state, email, password) {
const normalizedEmail = email.trim().toLowerCase();
const cleanPassword = password.trim();

const matchedUser = state.users.find(
    (user) =>
        user.email.trim().toLowerCase() === normalizedEmail &&
        user.password === cleanPassword
    );


    if (!matchedUser) {
    return {
        ok: false,
        message: "Correo o contraseña incorrectos. Verifica tus credenciales."
    };
    }

state.sessionUser = {
    id: matchedUser.id,
    fullName: matchedUser.fullName,
    email: matchedUser.email,
    role: matchedUser.role
};

    saveStore(state);

    return {
    ok: true,
    user: state.sessionUser,
    message: `Bienvenido(a), ${matchedUser.fullName}.`
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
const protectedViews = ["users", "exams"];
if (!protectedViews.includes(viewName)) {
    return true;
}
return isAuthenticated(state);
}

export function syncAuthUI(state) {
const loggedIn = isAuthenticated(state);
const authOnlyElements = document.querySelectorAll('[data-auth-only="true"]');
const openLoginBtn = document.getElementById("open-login-btn");
const logoutBtn = document.getElementById("logout-btn");
const sessionBadge = document.getElementById("session-badge");

authOnlyElements.forEach((el) => {
    el.classList.toggle("is-hidden", !loggedIn);
});

if (openLoginBtn) {
    openLoginBtn.classList.toggle("is-hidden", loggedIn);
}

if (logoutBtn) {
    logoutBtn.classList.toggle("is-hidden", !loggedIn);
}

if (sessionBadge) {
    if (loggedIn) {
        sessionBadge.textContent = `${state.sessionUser.fullName} (${state.sessionUser.role})`;
        sessionBadge.classList.remove("is-hidden");
    } else {
        sessionBadge.textContent = "";
        sessionBadge.classList.add("is-hidden");
    }
}
}