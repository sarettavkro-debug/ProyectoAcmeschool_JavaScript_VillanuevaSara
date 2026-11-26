import { saveStore } from "./store.js";
import { isAuthenticated } from "./auth.js";

let editingExamId = null;
let selectedExamId = null;
let editingQuestionId = null;
let optionsDraft = [];

export function initExamsModule(state, onNotify, onCatalogChange) {
  const examForm = document.getElementById("exam-crud-form");
  const resetExamBtn = document.getElementById("reset-exam-form-btn");
  const tableBody = document.getElementById("exams-table-body");
  const newQuestionBtn = document.getElementById("new-question-btn");
  const addOptionBtn = document.getElementById("add-option-btn");
  const cancelQuestionBtn = document.getElementById("cancel-question-btn");
  const questionForm = document.getElementById("question-editor-form");
  const optionsList = document.getElementById("question-options-list");
  const questionsList = document.getElementById("questions-list-container");

  if (!examForm || !tableBody) return;

  if (!selectedExamId && state.exams.length > 0) {
    selectedExamId = state.exams[0].id;
  }

  examForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!isAuthenticated(state)) return onNotify("Inicia sesión primero.", "error");

    const data = {
      code: examForm.code.value.trim(),
      title: examForm.title.value.trim(),
      durationMinutes: Number(examForm.durationMinutes.value),
      passPercentage: Number(examForm.passPercentage.value),
      description: examForm.description.value.trim()
    };

    if (!data.code || !data.title || !data.description || data.durationMinutes <= 0) {
      return onNotify("Completa todos los campos del examen con valores válidos.", "error");
    }

    if (editingExamId) {
      const idx = state.exams.findIndex((item) => item.id === editingExamId);
      if (idx !== -1) state.exams[idx] = { ...state.exams[idx], ...data };
      onNotify("Examen actualizado.", "success");
    } else {
      const created = { id: `exam-${Date.now()}`, ...data, questions: [] };
      state.exams.push(created);
      selectedExamId = created.id;
      onNotify("Examen creado.", "success");
    }

    saveStore(state);
    resetExamForm();
    renderExamsModule(state);
    if (onCatalogChange) onCatalogChange();
  });

  resetExamBtn?.addEventListener("click", resetExamForm);

  tableBody.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn || !isAuthenticated(state)) return;

    const { action, id } = btn.dataset;
    const exam = state.exams.find((item) => item.id === id);
    if (!exam) return;

    if (action === "select") {
      selectedExamId = id;
      resetQuestionEditor();
      renderExamsModule(state);
    } else if (action === "edit") {
      editingExamId = id;
      selectedExamId = id;
      examForm.code.value = exam.code;
      examForm.title.value = exam.title;
      examForm.durationMinutes.value = exam.durationMinutes;
      examForm.passPercentage.value = exam.passPercentage;
      examForm.description.value = exam.description;
      document.getElementById("exam-form-heading").textContent = `Editando: ${exam.title}`;
      renderExamsModule(state);
    } else if (action === "delete") {
      state.exams = state.exams.filter((item) => item.id !== id);
      if (selectedExamId === id) selectedExamId = state.exams[0]?.id || null;
      saveStore(state);
      renderExamsModule(state);
      if (onCatalogChange) onCatalogChange();
      onNotify("Examen eliminado.", "success");
    }
  });

  newQuestionBtn?.addEventListener("click", () => {
    if (!selectedExamId) {
      return onNotify("Primero crea o selecciona un examen.", "error");
    }
    resetQuestionEditor();
    document.getElementById("question-text")?.focus();
  });

  addOptionBtn?.addEventListener("click", () => {
    readOptionsFromInputs();
    optionsDraft.push({
      id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      text: "",
      isCorrect: false
    });
    renderOptions();
  });

  cancelQuestionBtn?.addEventListener("click", resetQuestionEditor);

  optionsList?.addEventListener("change", (e) => {
    if (e.target.matches('input[type="radio"][name="correctOption"]')) {
      readOptionsFromInputs();
      const chosenId = e.target.value;
      // Solo una opción puede quedar marcada como correcta
      optionsDraft = optionsDraft.map((opt) => ({
        ...opt,
        isCorrect: opt.id === chosenId
      }));
      renderOptions();
    }
  });

  optionsList?.addEventListener("click", (e) => {
    const delBtn = e.target.closest("button[data-remove]");
    if (!delBtn) return;
    readOptionsFromInputs();
    if (optionsDraft.length <= 2) {
      return onNotify("La pregunta necesita al menos 2 opciones.", "error");
    }
    optionsDraft = optionsDraft.filter((opt) => opt.id !== delBtn.dataset.remove);
    if (!optionsDraft.some((opt) => opt.isCorrect)) optionsDraft[0].isCorrect = true;
    renderOptions();
  });

  questionsList?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-qaction]");
    if (!btn || !isAuthenticated(state)) return;
    const exam = state.exams.find((item) => item.id === selectedExamId);
    if (!exam) return;

    const qId = btn.dataset.qid;
    if (btn.dataset.qaction === "edit") {
      const q = exam.questions.find((item) => item.id === qId);
      if (!q) return;
      editingQuestionId = q.id;
      document.getElementById("question-text").value = q.text;
      document.getElementById("question-editor-heading").textContent = "Editando pregunta";
      optionsDraft = structuredClone(q.options);
      renderOptions();
    } else if (btn.dataset.qaction === "delete") {
      exam.questions = exam.questions.filter((item) => item.id !== qId);
      saveStore(state);
      resetQuestionEditor();
      renderExamsModule(state);
      if (onCatalogChange) onCatalogChange();
      onNotify("Pregunta eliminada.", "success");
    }
  });

  questionForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!isAuthenticated(state)) return onNotify("Inicia sesión primero.", "error");

    const exam = state.exams.find((item) => item.id === selectedExamId);
    if (!exam) return onNotify("Selecciona un examen primero.", "error");

    readOptionsFromInputs();
    const text = document.getElementById("question-text").value.trim();
    const cleanOptions = optionsDraft.filter((opt) => opt.text.trim() !== "");
    const correctCount = cleanOptions.filter((opt) => opt.isCorrect).length;

    if (!text || cleanOptions.length < 2) {
      return onNotify("Escribe el enunciado y al menos 2 opciones con texto.", "error");
    }
    if (correctCount !== 1) {
      return onNotify("Marca exactamente 1 respuesta como correcta.", "error");
    }

    const questionObj = {
      id: editingQuestionId || `q-${Date.now()}`,
      text,
      options: cleanOptions.map((opt) => ({ ...opt, text: opt.text.trim() }))
    };

    if (editingQuestionId) {
      const idx = exam.questions.findIndex((q) => q.id === editingQuestionId);
      if (idx !== -1) exam.questions[idx] = questionObj;
    } else {
      exam.questions.push(questionObj);
    }

    saveStore(state);
    resetQuestionEditor();
    renderExamsModule(state);
    if (onCatalogChange) onCatalogChange();
    onNotify("Pregunta guardada.", "success");
  });

  resetQuestionEditor();
  renderExamsModule(state);
}

function resetExamForm() {
  editingExamId = null;
  document.getElementById("exam-crud-form")?.reset();
  const heading = document.getElementById("exam-form-heading");
  if (heading) heading.textContent = "Nuevo exámen";
}

function resetQuestionEditor() {
  editingQuestionId = null;
  const textArea = document.getElementById("question-text");
  const heading = document.getElementById("question-editor-heading");
  if (textArea) textArea.value = "";
  if (heading) heading.textContent = "Nueva pregunta";

  optionsDraft = [
    { id: "opt-1", text: "", isCorrect: true },
    { id: "opt-2", text: "", isCorrect: false }
  ];
  renderOptions();
}

function readOptionsFromInputs() {
  const rows = document.querySelectorAll(".option-row-editor");
  optionsDraft = Array.from(rows).map((row) => ({
    id: row.dataset.optId,
    text: row.querySelector('input[type="text"]')?.value || "",
    isCorrect: Boolean(row.querySelector('input[type="radio"]')?.checked)
  }));
}

function renderOptions() {
  const container = document.getElementById("question-options-list");
  if (!container) return;

  container.innerHTML = optionsDraft
    .map(
      (opt, idx) => `
      <div class="option-row-editor ${opt.isCorrect ? "is-correct" : ""}" data-opt-id="${opt.id}">
        <input type="radio" name="correctOption" value="${opt.id}" ${opt.isCorrect ? "checked" : ""} />
        <input type="text" value="${escapeHtml(opt.text)}" placeholder="Opción ${idx + 1}" />
        ${opt.isCorrect ? '<span class="pill-correct-hint">Respuesta correcta</span>' : ""}
        <button type="button" class="action-btn-delete" data-remove="${opt.id}">Quitar</button>
      </div>
    `
    )
    .join("");
}

export function renderExamsModule(state) {
  const tableBody = document.getElementById("exams-table-body");
  if (!tableBody) return;

  if (!selectedExamId && state.exams.length > 0) {
    selectedExamId = state.exams[0].id;
  }

  tableBody.innerHTML = state.exams
    .map(
      (exam) => `
      <tr>
        <td>${escapeHtml(exam.code)}</td>
        <td><strong>${escapeHtml(exam.title)}</strong></td>
        <td>${escapeHtml(exam.description)}</td>
        <td>${exam.durationMinutes} minutos</td>
        <td>${exam.passPercentage}%</td>
        <td>
          <button type="button" class="btn-outline-purple" data-action="select" data-id="${exam.id}">
            Preguntas (${exam.questions.length})
          </button>
          <button type="button" class="action-btn-edit" data-action="edit" data-id="${exam.id}">
            Actualizar
          </button>
          <button type="button" class="action-btn-delete" data-action="delete" data-id="${exam.id}">
            Eliminar
          </button>
        </td>
      </tr>
    `
    )
    .join("");

  const selectedLabel = document.getElementById("selected-exam-label");
  const countHeading = document.getElementById("questions-count-heading");
  const qList = document.getElementById("questions-list-container");
  const exam = state.exams.find((item) => item.id === selectedExamId);

  if (selectedLabel) {
    selectedLabel.textContent = exam
      ? `Examen seleccionado: ${exam.title} (código ${exam.code})`
      : "Crea o selecciona un examen para agregar preguntas.";
  }
  if (countHeading) {
    countHeading.textContent = `Preguntas (${exam ? exam.questions.length : 0})`;
  }
  if (qList) {
    qList.innerHTML = exam
      ? exam.questions
          .map(
            (q, i) => `
            <div class="question-mini-card ${q.id === editingQuestionId ? "is-active" : ""}">
              <p class="question-prompt">${i + 1}. ${escapeHtml(q.text)}</p>
              <button type="button" class="action-btn-edit" data-qaction="edit" data-qid="${q.id}">Editar</button>
              <button type="button" class="action-btn-delete" data-qaction="delete" data-qid="${q.id}">Eliminar</button>
            </div>
          `
          )
          .join("")
      : "";
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}