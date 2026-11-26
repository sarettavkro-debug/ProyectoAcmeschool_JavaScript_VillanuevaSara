import { loadStore } from "./store.js";
import { loginUser, logoutUser, canAccessView, syncAuthUI } from "./auth.js";
import "./components.js";
import { initUsersModule, renderUsersTable, resetUserForm } from "./users.js";
import { renderCatalog, openStudentRegister, startExamRunner, renderResultCard, stopRunnerTimer } from "./runner.js";

const state = loadStore();
let pendingExam = null;
let lastActiveView = "catalog";

function showStatus(message, type = "info") {
const banner = document.getElementById("status-message");
if (!banner) return;
banner.textContent = message;
banner.className = "status-banner";
if (type === "error") banner.classList.add("is-error");
if (type === "success") banner.classList.add("is-success");
banner.classList.remove("is-hidden");
}

function clearStatus() {
const banner = document.getElementById("status-message");
if (banner) banner.classList.add("is-hidden");
}

function navigateTo(viewName) {
if (lastActiveView === "exam-runner" && viewName !== "exam-runner") {
    stopRunnerTimer();
}

if (!canAccessView(state, viewName)) {
    showStatus("Debes iniciar sesión como personal administrativo o docente para acceder.", "error");
    viewName = "login";
}

document.querySelectorAll(".screen").forEach((section) => {
    section.classList.toggle("is-hidden", section.id !== `view-${viewName}`);
});

document.querySelectorAll(".topbar-nav .nav-link").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.view === viewName);
});

lastActiveView = viewName;
syncAuthUI(state);

if (viewName === "catalog") {
    refreshCatalog();
} else if (viewName === "users") {
    renderUsersTable(state);
}
}

function refreshCatalog() {
renderCatalog(state, (examId) => {
    const exam = state.exams.find((item) => item.id === examId);
    if (!exam) return;
    pendingExam = exam;
    clearStatus();
    navigateTo("student-register");
    openStudentRegister(
        exam,
        (student) => {
        navigateTo("exam-runner");
        startExamRunner(state, exam, student, (attempt) => {
            navigateTo("exam-result");
            renderResultCard(attempt, () => {
            pendingExam = null;
            navigateTo("catalog");
            });
        });
        },
        () => {
        pendingExam = null;
        navigateTo("catalog");
        }
    );
});
}

function initNavigationAndAuth() {
document.querySelectorAll("[data-view]").forEach((el) => {
    el.addEventListener("click", (event) => {
        event.preventDefault();
        clearStatus();
        navigateTo(el.dataset.view);
    });
});

const openLoginBtn = document.getElementById("open-login-btn");
if (openLoginBtn) {
    openLoginBtn.addEventListener("click", () => {
        clearStatus();
        navigateTo("login");
    });
}

const cancelLoginBtn = document.getElementById("cancel-login-btn");
if (cancelLoginBtn) {
    cancelLoginBtn.addEventListener("click", () => {
        clearStatus();
        navigateTo("catalog");
    });
}

const loginForm = document.getElementById("login-form");
if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const email = loginForm.email.value;
        const password = loginForm.password.value;
        const res = loginUser(state, email, password);

        if (!res.ok) {
        showStatus(res.message, "error");
        return;
        }

        loginForm.reset();
        showStatus(res.message, "success");
        syncAuthUI(state);
        navigateTo("users");
    });
    }

const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        logoutUser(state);
        resetUserForm();
        syncAuthUI(state);
        showStatus("Sesión cerrada correctamente.", "success");
        navigateTo("catalog");
    });
}
}

initNavigationAndAuth();
initUsersModule(state, showStatus);
syncAuthUI(state);
navigateTo("catalog");