import { saveStore } from "./store.js";
import { isAuthenticated } from "./auth.js";

let editingExamId = null;
let selectedExamId = null;
let editingQuestionId = null;
let draftOptions = [];

export function initExamsModule(state, onNotify, onCatalogChange) {
    const examForm = document.getElementById("exam-crud-form");
    const resetExamBtn = document.getElementById("reset-exam-form-btn");
    const examsTableBody = document.getElementById("exams-table-body");

const newQuestionBtn = document.getElementById("new-question-btn");
const questionsListContainer = document.getElementById("questions-list-container");
const questionForm = document.getElementById("question-editor-form");
const addOptionBtn = document.getElementById("add-option-btn");
const cancelQuestionBtn = document.getElementById("cancel-question-btn");
const optionsListContainer = document.getElementById("question-options-list");

if (!examForm || !examsTableBody) return;

if (!selectedExamId && state.exams.length > 0) {
    selectedExamId = state.exams[0].id;
}

examForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!isAuthenticated(state)) {
    onNotify("Debes iniciar sesión para gestionar exámenes.", "error");
    return;
    }

    const formData = new FormData(examForm);
    const examPayload = {
    code: String(formData.get("code") || "").trim(),
    title: String(formData.get("title") || "").trim(),
    durationMinutes: Number(formData.get("durationMinutes")),
    passPercentage: Number(formData.get("passPercentage")),
    description: String(formData.get("description") || "").trim()
    };

    const result = editingExamId
    ? updateExam(state, editingExamId, examPayload)
    : createExam(state, examPayload);

    if (!result.ok) {
    onNotify(result.message, "error");
        return;
    }

    resetExamForm();
    renderExamsModule(state);
    if (onCatalogChange) onCatalogChange();
    onNotify(result.message, "success");
});

if (resetExamBtn) {
    resetExamBtn.addEventListener("click", () => {
        resetExamForm();
    });
}


examsTableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    if (!isAuthenticated(state)) {
        onNotify("Acceso denegado. Inicia sesión primero.", "error");
        return;
    }

    const action = button.dataset.action;
    const examId = button.dataset.id;

    if (action === "select") {
        selectedExamId = examId;
        startNewQuestionDraft();
        renderExamsModule(state);
    } else if (action === "edit") {
        loadExamIntoForm(state, examId);
    } else if (action === "delete") {
        const result = deleteExam(state, examId);
        if (!result.ok) {
        onNotify(result.message, "error");
        return;
        }
        if (editingExamId === examId) {
        resetExamForm();
        }
        if (selectedExamId === examId) {
        selectedExamId = state.exams[0]?.id || null;
        startNewQuestionDraft();
        }
        renderExamsModule(state);
        if (onCatalogChange) onCatalogChange();
    onNotify(result.message, "success");
    }
});

if (newQuestionBtn) {
    newQuestionBtn.addEventListener("click", () => {
    if (!selectedExamId) {
        onNotify("Primero selecciona o crea un examen.", "error");
        return;
    }
        startNewQuestionDraft();
        renderQuestionBuilder(state);
    });
    }

if (questionsListContainer) {
    questionsListContainer.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-q-action]");
        if (!button) return;

        if (!isAuthenticated(state)) {
        onNotify("Inicia sesión para modificar preguntas.", "error");
        return;
        }

        const exam = state.exams.find((e) => e.id === selectedExamId);
        if (!exam) return;

        const questionId = button.dataset.qid;
        const qAction = button.dataset.qAction;

        if (qAction === "edit") {
        loadQuestionIntoEditor(exam, questionId);
        } else if (qAction === "delete") {
        exam.questions = exam.questions.filter((q) => q.id !== questionId);
        if (editingQuestionId === questionId) {
            startNewQuestionDraft();
        }
        saveStore(state);
        renderExamsModule(state);
        if (onCatalogChange) onCatalogChange();
        onNotify("Pregunta eliminada del examen.", "success");
        }
    });
}

if (addOptionBtn) {
    addOptionBtn.addEventListener("click", () => {
        syncDraftOptionsFromDOM();
        const hasCorrect = draftOptions.some((opt) => opt.isCorrect);
        draftOptions.push({
        id: `opt-${crypto.randomUUID().slice(0, 8)}`,
        text: "",
        isCorrect: !hasCorrect
        });
        renderOptionsEditor();
    });
}


if (cancelQuestionBtn) {
    cancelQuestionBtn.addEventListener("click", () => {
        startNewQuestionDraft();
        renderQuestionBuilder(state);
    });
}


if (optionsListContainer) {
    optionsListContainer.addEventListener("change", (event) => {
        if (event.target.matches('input[type="radio"][name="correctOption"]')) {
        syncDraftOptionsFromDOM();
        const chosenId = event.target.value;

        draftOptions = draftOptions.map((opt) => ({
            ...opt,
            isCorrect: opt.id === chosenId
        }));
        renderOptionsEditor();
    }
    });

    optionsListContainer.addEventListener("click", (event) => {
        const removeBtn = event.target.closest("button[data-remove-opt]");
        if (!removeBtn) return;

        syncDraftOptionsFromDOM();
        const targetOptId = removeBtn.dataset.removeOpt;
        const remaining = draftOptions.filter((opt) => opt.id !== targetOptId);

        if (remaining.length < 2) {
        onNotify("Cada pregunta debe tener al menos 2 opciones de respuesta.", "error");
        return;
        }


        if (!remaining.some((opt) => opt.isCorrect)) {
            remaining[0].isCorrect = true;
        }

        draftOptions = remaining;
        renderOptionsEditor();
    });
}

if (questionForm) {
    questionForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!isAuthenticated(state)) {
        onNotify("Debes iniciar sesión para guardar preguntas.", "error");
        return;
        }

        const exam = state.exams.find((e) => e.id === selectedExamId);
        if (!exam) {
        onNotify("Selecciona primero un examen de la tabla.", "error");
        return;
        }

        syncDraftOptionsFromDOM();
        const promptText = String(document.getElementById("question-text").value || "").trim();

        const validOptions = draftOptions.filter((opt) => opt.text.trim() !== "");
        const correctCount = validOptions.filter((opt) => opt.isCorrect).length;

        if (!promptText) {
        onNotify("El enunciado de la pregunta es obligatorio.", "error");
        return;
        }

        if (validOptions.length < 2) {
        onNotify("Agrega al menos 2 opciones de respuesta con texto.", "error");
        return;
        }

        if (correctCount !== 1) {
        onNotify("Debe haber exactamente una respuesta marcada como correcta.", "error");
        return;
        }

        const questionPayload = {
        id: editingQuestionId || `q-${crypto.randomUUID().slice(0, 8)}`,
        text: promptText,
        options: validOptions.map((opt) => ({
            id: opt.id,
            text: opt.text.trim(),
            isCorrect: Boolean(opt.isCorrect)
        }))
        };

        if (editingQuestionId) {
        const qIndex = exam.questions.findIndex((q) => q.id === editingQuestionId);
        if (qIndex !== -1) {
            exam.questions[qIndex] = questionPayload;
        }
        } else {
        exam.questions.push(questionPayload);
        }

        saveStore(state);
        startNewQuestionDraft();
        renderExamsModule(state);
        if (onCatalogChange) onCatalogChange();
        onNotify("Pregunta guardada correctamente.", "success");
    });
    }

startNewQuestionDraft();
renderExamsModule(state);
}

function createExam(state, data) {
const error = validateExamData(data);
if (error) return { ok: false, message: error };

const duplicateCode = state.exams.some(
    (e) => e.code.toLowerCase() === data.code.toLowerCase()
);
if (duplicateCode) {
    return { ok: false, message: "Ya existe un examen con ese código." };
}

const newExam = {
    id: `exam-${crypto.randomUUID().slice(0, 8)}`,
    code: data.code,
    title: data.title,
    durationMinutes: data.durationMinutes,
    passPercentage: data.passPercentage,
    description: data.description,
    questions: []
};

state.exams.push(newExam);
selectedExamId = newExam.id;
saveStore(state);

return { ok: true, message: `Examen "${newExam.title}" creado.` };
}

function updateExam(state, examId, data) {
const error = validateExamData(data);
if (error) return { ok: false, message: error };

const index = state.exams.findIndex((e) => e.id === examId);
if (index === -1) return { ok: false, message: "Examen no encontrado." };

const duplicateCode = state.exams.some(
    (e) => e.id !== examId && e.code.toLowerCase() === data.code.toLowerCase()
);
if (duplicateCode) {
    return { ok: false, message: "Otro examen ya utiliza ese código." };
}

state.exams[index] = {
    ...state.exams[index],
    code: data.code,
    title: data.title,
    durationMinutes: data.durationMinutes,
    passPercentage: data.passPercentage,
    description: data.description
};

saveStore(state);
return { ok: true, message: `Examen "${data.title}" actualizado.` };
}

function deleteExam(state, examId) {
const index = state.exams.findIndex((e) => e.id === examId);
if (index === -1) return { ok: false, message: "Examen no encontrado." };

const [removed] = state.exams.splice(index, 1);
saveStore(state);
return { ok: true, message: `Examen "${removed.title}" eliminado.` };
}

function validateExamData(data) {
if (!data.code || !data.title || !data.description) {
    return "Código, título y descripción del examen son obligatorios.";
}
if (!Number.isFinite(data.durationMinutes) || data.durationMinutes <= 0) {
    return "La duración debe ser mayor a 0 minutos.";
}
if (!Number.isFinite(data.passPercentage) || data.passPercentage < 1 || data.passPercentage > 100) {
    return "El porcentaje de aprobación debe estar entre 1 y 100.";
}
return null;
}

function loadExamIntoForm(state, examId) {
const exam = state.exams.find((e) => e.id === examId);
if (!exam) return;

editingExamId = exam.id;
selectedExamId = exam.id;

const heading = document.getElementById("exam-form-heading");
if (heading) heading.textContent = `Editando examen: ${exam.title}`;

document.getElementById("exam-code").value = exam.code;
document.getElementById("exam-title").value = exam.title;
document.getElementById("exam-duration").value = exam.durationMinutes;
document.getElementById("exam-pass").value = exam.passPercentage;
document.getElementById("exam-description").value = exam.description;

renderQuestionBuilder(state);
}

export function resetExamForm() {
editingExamId = null;
const form = document.getElementById("exam-crud-form");
const heading = document.getElementById("exam-form-heading");
if (form) form.reset();
if (heading) heading.textContent = "Nuevo exámen";
}

function startNewQuestionDraft() {
editingQuestionId = null;
draftOptions = [
    { id: "draft-opt-1", text: "", isCorrect: true },
    { id: "draft-opt-2", text: "", isCorrect: false }
];

const textArea = document.getElementById("question-text");
const heading = document.getElementById("question-editor-heading");
if (textArea) textArea.value = "";
if (heading) heading.textContent = "Nueva pregunta";

renderOptionsEditor();
}

function loadQuestionIntoEditor(exam, questionId) {
const question = exam.questions.find((q) => q.id === questionId);
if (!question) return;

editingQuestionId = question.id;
draftOptions = structuredClone(question.options);

const heading = document.getElementById("question-editor-heading");
const textArea = document.getElementById("question-text");
const qIndex = exam.questions.findIndex((q) => q.id === question.id);

if (heading) heading.textContent = `Editando la pregunta ${qIndex + 1}`;
if (textArea) textArea.value = question.text;

renderOptionsEditor();
}

function syncDraftOptionsFromDOM() {
const rows = document.querySelectorAll(".option-row-editor");
draftOptions = Array.from(rows).map((row) => {
    const optId = row.dataset.optId;
    const input = row.querySelector('input[type="text"]');
    const radio = row.querySelector('input[type="radio"]');
    return {
        id: optId,
        text: input ? input.value : "",
        isCorrect: radio ? radio.checked : false
    };
});
}

function renderOptionsEditor() {
const container = document.getElementById("question-options-list");
if (!container) return;

container.innerHTML = draftOptions
    .map(
        (opt, idx) => `
        <div class="option-row-editor ${opt.isCorrect ? "is-correct" : ""}" data-opt-id="${escapeHtml(opt.id)}">
        <input
            type="radio"
            name="correctOption"
            value="${escapeHtml(opt.id)}"
            aria-label="Marcar opción ${idx + 1} como respuesta correcta"
            ${opt.isCorrect ? "checked" : ""}
        />
        <input
            type="text"
            value="${escapeHtml(opt.text)}"
            placeholder="Texto de la opción ${idx + 1}"
            aria-label="Descripción de la opción ${idx + 1}"
        />
        ${opt.isCorrect ? '<span class="pill-correct-hint">Respuesta correcta</span>' : ""}
        <button type="button" class="action-btn-delete" data-remove-opt="${escapeHtml(opt.id)}">
            Quitar
        </button>
        </div>
    `
    )
    .join("");
}

export function renderExamsModule(state) {
const tableBody = document.getElementById("exams-table-body");
if (!tableBody) return;

tableBody.innerHTML = state.exams
    .map(
        (exam) => `
        <tr>
        <td>${escapeHtml(exam.code)}</td>
        <td><strong>${escapeHtml(exam.title)}</strong></td>
        <td>${escapeHtml(exam.description)}</td>
        <td>${escapeHtml(exam.durationMinutes)} minutos</td>
        <td>${escapeHtml(exam.passPercentage)}%</td>
        <td>
            <button type="button" class="btn-outline-purple" data-action="select" data-id="${escapeHtml(exam.id)}">
            Preguntas (${exam.questions.length})
            </button>
            <button type="button" class="action-btn-edit" data-action="edit" data-id="${escapeHtml(exam.id)}">
            Actualizar
            </button>
            <button type="button" class="action-btn-delete" data-action="delete" data-id="${escapeHtml(exam.id)}">
            Eliminar
            </button>
        </td>
        </tr>
    `
    )
    .join("");

renderQuestionBuilder(state);
}

function renderQuestionBuilder(state) {
const selectedLabel = document.getElementById("selected-exam-label");
const countHeading = document.getElementById("questions-count-heading");
const listContainer = document.getElementById("questions-list-container");

const exam = state.exams.find((e) => e.id === selectedExamId) || state.exams[0] || null;
if (exam) {
    selectedExamId = exam.id;
}

if (!exam) {
    if (selectedLabel) selectedLabel.textContent = "Crea un examen para agregar preguntas.";
    if (countHeading) countHeading.textContent = "Preguntas (0)";
    if (listContainer) listContainer.innerHTML = "";
    return;
}

if (selectedLabel) {
    selectedLabel.textContent = `Examen seleccionado: ${exam.title} (código ${exam.code})`;
}
if (countHeading) {
    countHeading.textContent = `Preguntas (${exam.questions.length})`;
}

if (listContainer) {
    if (exam.questions.length === 0) {
        listContainer.innerHTML = `<p class="helper-note">Este examen aún no tiene preguntas.</p>`;
        return;
    }

    listContainer.innerHTML = exam.questions
        .map((q, index) => {
        const isEditing = q.id === editingQuestionId;
        return `
            <div class="question-mini-card ${isEditing ? "is-active" : ""}">
            <p class="question-prompt">${index + 1}. ${escapeHtml(q.text)}</p>
            <div>
                <button type="button" class="action-btn-edit" data-q-action="edit" data-qid="${escapeHtml(q.id)}">
                Editar
                </button>
                <button type="button" class="action-btn-delete" data-q-action="delete" data-qid="${escapeHtml(q.id)}">
                Eliminar
                </button>
            </div>
            </div>
        `;
        })
        .join("");
}
}

function escapeHtml(value) {
return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}