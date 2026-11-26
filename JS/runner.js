import { saveStore } from "./store.js";

let activeAttempt = null;

export function renderCatalog(state, onSelectExam) {
const grid = document.getElementById("catalog-grid");
if (!grid) return;

if (!state.exams.length) {
    grid.innerHTML = `<p class="helper-note">No hay exámenes disponibles por el momento.</p>`;
    return;
}

grid.innerHTML = state.exams
    .map(
        (exam) => `
        <article class="exam-card">
        <h3 class="exam-card-title">${escapeHtml(exam.title)}</h3>
        <div class="exam-badges">
            <span class="badge-time">${exam.durationMinutes} min</span>
            <span class="badge-pass">Aprueba con ${exam.passPercentage}%</span>
            <span class="badge-questions">${exam.questions.length} preguntas</span>
        </div>
        <button type="button" class="btn-purple" data-exam-id="${escapeHtml(exam.id)}">
            Presentar examen
        </button>
        </article>
    `
    )
    .join("");

grid.querySelectorAll("button[data-exam-id]").forEach((btn) => {
    btn.addEventListener("click", () => onSelectExam(btn.dataset.examId));
});
}


export function openStudentRegister(exam, onStartExam, onBack) {
document.getElementById("register-title").textContent = exam.title;
document.getElementById("register-meta").innerHTML = `
    <span>Recuerda que el tiempo para este exámen es</span>
    <span class="badge-time">${exam.durationMinutes} min</span>
    <span>con un porcentaje mínimo de aprobación de</span>
    <span class="badge-pass">Aprueba con ${exam.passPercentage}%</span>
`;

const form = document.getElementById("student-register-form");
const backBtn = document.getElementById("back-to-catalog-btn");
form.reset();

const handleSubmit = (event) => {
    event.preventDefault();
    const studentId = form.studentId.value.trim();
    const studentName = form.studentName.value.trim();
    if (!studentId || !studentName) return;

    cleanup();
    onStartExam({ studentId, studentName });
};

const handleBack = () => {
    cleanup();
    onBack();
};

function cleanup() {
    form.removeEventListener("submit", handleSubmit);
    backBtn.removeEventListener("click", handleBack);
}

form.addEventListener("submit", handleSubmit);
backBtn.addEventListener("click", handleBack);
}


export function startExamRunner(state, exam, student, onFinish) {
stopRunnerTimer();

activeAttempt = {
    exam,
    studentId: student.studentId,
    studentName: student.studentName,
    remainingSeconds: Math.max(1, Number(exam.durationMinutes) || 1) * 60,
    timerId: null
};

document.getElementById("runner-exam-title").textContent = exam.title;
document.getElementById("runner-badges").innerHTML = `
    <span class="badge-questions">${exam.questions.length} preguntas</span>
    <span class="badge-pass">Aprueba con ${exam.passPercentage}%</span>
`;


const timerSlot = document.getElementById("runner-timer-slot");
timerSlot.innerHTML = `<exam-timer seconds="${activeAttempt.remainingSeconds}"></exam-timer>`;

renderQuestions(exam);

const form = document.getElementById("runner-questions-form");
const onSubmit = (event) => {
    event.preventDefault();
    finishAttempt(state, onFinish);
};

if (form._runnerSubmitHandler) {
    form.removeEventListener("submit", form._runnerSubmitHandler);
}
form._runnerSubmitHandler = onSubmit;
form.addEventListener("submit", onSubmit);

activeAttempt.timerId = setInterval(() => {
    if (!activeAttempt) return;
    activeAttempt.remainingSeconds -= 1;

    const timerEl = timerSlot.querySelector("exam-timer");
    if (timerEl) {
        timerEl.setAttribute("seconds", String(Math.max(0, activeAttempt.remainingSeconds)));
    }

    if (activeAttempt.remainingSeconds <= 0) {
        finishAttempt(state, onFinish);
    }
}, 1000);
}

function renderQuestions(exam) {
const list = document.getElementById("runner-questions-list");
const helper = document.getElementById("runner-helper-note");

if (!exam.questions.length) {
    list.innerHTML = `<p class="helper-note">Este examen no tiene preguntas configuradas.</p>`;
    helper.textContent = "";
    return;
}

helper.textContent = "Selecciona una opción por pregunta y pulsa Terminar cuando estés listo.";

list.innerHTML = exam.questions
    .map(
        (q, qIndex) => `
        <fieldset class="question-box">
        <legend class="question-number">Pregunta ${qIndex + 1}</legend>
        <p class="question-prompt">${escapeHtml(q.text)}</p>
        <div class="options-stack">
            ${q.options
            .map(
                (opt) => `
                <label class="option-choice">
                <input
                    type="radio"
                    name="question-${escapeHtml(q.id)}"
                    value="${escapeHtml(opt.id)}"
                />
                <span>${escapeHtml(opt.text)}</span>
                </label>
            `
            )
            .join("")}
        </div>
        </fieldset>
    `
    )
    .join("");


list.querySelectorAll('input[type="radio"]').forEach((radio) => {
    radio.addEventListener("change", () => {
        const group = radio.closest(".options-stack");
        group.querySelectorAll(".option-choice").forEach((lbl) => lbl.classList.remove("is-selected"));
        radio.closest(".option-choice").classList.add("is-selected");
    });
});
}

function finishAttempt(state, onFinish) {
if (!activeAttempt) return;

const { exam, studentId, studentName } = activeAttempt;
stopRunnerTimer();

const totalQuestions = exam.questions.length;
let correctAnswers = 0;

exam.questions.forEach((q) => {
    const checked = document.querySelector(`input[name="question-${CSS.escape(q.id)}"]:checked`);
    const chosenOptionId = checked ? checked.value : null;
    const rightOption = q.options.find((opt) => opt.isCorrect);

    if (chosenOptionId && rightOption && chosenOptionId === rightOption.id) {
        correctAnswers += 1;
    }
});

const scorePercentage =
    totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
const passed = scorePercentage >= Number(exam.passPercentage);

const attemptRecord = {
    id: `att-${Date.now()}`,
    examId: exam.id,
    examTitle: exam.title,
    studentId,
    studentName,
    correctAnswers,
    totalQuestions,
    scorePercentage,
    passPercentage: Number(exam.passPercentage),
    passed,
    submittedAt: new Date().toISOString()
};

state.attempts.push(attemptRecord);
saveStore(state);
activeAttempt = null;

onFinish(attemptRecord);
}

export function stopRunnerTimer() {
if (activeAttempt && activeAttempt.timerId) {
    clearInterval(activeAttempt.timerId);
    activeAttempt.timerId = null;
}
}

export function renderResultCard(attempt, onBackToCatalog) {
const card = document.getElementById("result-card");
if (!card) return;

const statusClass = attempt.passed ? "is-pass" : "is-fail";
const statusLabel = attempt.passed ? "Aprobado" : "No aprobado";
const statusDetail = attempt.passed
    ? `Superaste el ${attempt.passPercentage}% requerido`
    : `Necesitabas al menos ${attempt.passPercentage}%`;

card.innerHTML = `
    <h2 class="result-heading">Resultado final</h2>
    <p class="result-exam-name">${escapeHtml(attempt.examTitle)}</p>
    <p class="result-percent ${statusClass}">${attempt.scorePercentage}%</p>
    <p class="result-count">${attempt.correctAnswers} de ${attempt.totalQuestions} respuestas correctas</p>
    <div class="result-banner-box ${statusClass}">
        <strong>${statusLabel}</strong><br />
        <span>${escapeHtml(statusDetail)}</span>
    </div>
    <button type="button" id="result-back-btn" class="btn-purple">Volver al catálogo</button>
`;

document.getElementById("result-back-btn").addEventListener("click", onBackToCatalog);
}

function escapeHtml(value) {
return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}