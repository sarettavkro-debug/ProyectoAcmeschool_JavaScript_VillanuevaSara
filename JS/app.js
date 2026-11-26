import { loadStore } from "./store.js";
import { loginUser, logoutUser, canAccessView, syncAuthUI } from "./auth.js";
import "./components.js";
import { initUsersModule, renderUsersTable, resetUserForm } from "./users.js";
import { initExamsModule, renderExamsModule } from "./exams.js";
import {
    renderCatalog,
    openStudentRegister,
    startExamRunner,
    renderResultCard,
    stopRunnerTimer
} from "./runner.js";

// 1. Cargamos el estado general desde localStorage
const state = loadStore();

// Mensajes de aviso arriba de la pantalla
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

// 2. Cambia de vista y redibuja el módulo correspondiente
function showView(viewName) {
    stopRunnerTimer();


    if (!canAccessView(state, viewName)) {
    showStatus("Debes iniciar sesión como personal administrativo o docente.", "error");
    viewName = "login";
}

document.querySelectorAll(".screen").forEach((section) => {
    section.classList.toggle("is-hidden", section.id !== `view-${viewName}`);
});

  document.querySelectorAll(".topbar-nav .nav-link").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.view === viewName);
  });

  syncAuthUI(state);

  if (viewName === "catalog") {
    mountCatalog();
  } else if (viewName === "users") {
    renderUsersTable(state);
  } else if (viewName === "exams") {
    renderExamsModule(state);
  }
}

// 3. Flujo público: catálogo -> registro estudiante -> examen -> resultado
function mountCatalog() {
  renderCatalog(state, (examId) => {
    const exam = state.exams.find((item) => item.id === examId);
    if (!exam) return;

    clearStatus();
    showView("student-register");

    openStudentRegister(
      exam,
      (student) => {
        showView("exam-runner");
        startExamRunner(state, exam, student, (attempt) => {
          showView("exam-result");
          renderResultCard(attempt, () => {
            showView("catalog");
          });
        });
      },
      () => {
        showView("catalog");
      }
    );
  });
}

// 4. Eventos de navegación y sesión
document.addEventListener("click", (event) => {
  const viewTrigger = event.target.closest("[data-view]");
  if (viewTrigger) {
    event.preventDefault();
    clearStatus();
    showView(viewTrigger.dataset.view);
    return;
  }

  if (event.target.closest("#open-login-btn")) {
    clearStatus();
    showView("login");
    return;
  }

  if (event.target.closest("#cancel-login-btn")) {
    clearStatus();
    showView("catalog");
    return;
  }

  if (event.target.closest("#logout-btn")) {
    logoutUser(state);
    resetUserForm();
    syncAuthUI(state);
    showStatus("Sesión cerrada correctamente.", "success");
    showView("catalog");
  }
});

const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const res = loginUser(state, loginForm.email.value, loginForm.password.value);
    if (!res.ok) {
      showStatus(res.message, "error");
      return;
    }
    loginForm.reset();
    showStatus(res.message, "success");
    syncAuthUI(state);
    showView("users");
  });
}

// 5. Arrancamos módulos y mostramos el catálogo inicial
initUsersModule(state, showStatus);
initExamsModule(state, showStatus, mountCatalog);
syncAuthUI(state);
showView("catalog");