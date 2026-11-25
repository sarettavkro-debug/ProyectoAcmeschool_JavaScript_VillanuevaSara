const STORAGE_KEY = "acme_school_db_v1";

const initialData = {

users: [
    {
        "id": "1020304050",
        "fullName": "Ana María Gómez",
        "email": "ana@acmeschool.edu",
        "phone": "3001234567",
        "role": "Docente",
        "password": "Olamundo22"
    },

    {
        "id": "1098765432",
        "fullName": "Carlos Ruiz Pérez",
        "email": "carlos@acmeschool.edu",
        "phone": "3119876543",
        "role": "Administrativo",
        "password": "Olamundo33"
    },

    {
        "id": "1055566677",
        "fullName": "Lucía Fernández",
        "email": "lucia@acmeschool.edu",
        "phone": "3204567890",
        "role": "Docente",
        "password": "Olamundo44"
    },

    {
        "id": "1012345678",
        "fullName": "Jorge Herrera",
        "email": "jorge@acmeschool.edu",
        "phone": "3152223344",
        "role": "Docente",
        "password": "Olamundo55"
    }
],
exams: [
    {
        id: "exam-101",
        code: "MAT-101",
        title: "Evaluación Diagnóstica de Matemáticas",
        durationMinutes: 15,
        passPercentage: 70,
        description: "Conceptos básicos de álgebra y resolución de problemas.",
        questions: [
        {
            id: "q-1",
            text: "¿Cuál es el resultado de 2x + 4 = 12?",
            options: [
            { id: "opt-1", text: "x = 2", isCorrect: false },
            { id: "opt-2", text: "x = 4", isCorrect: true },
            { id: "opt-3", text: "x = 6", isCorrect: false }
            ]
        }
    ]
}
],
attempts: [],
session: {
    currentUserId: null
}
};

export function loadStore() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
    saveStore(initialData);
    return structuredClone(initialData);
}
    return JSON.parse(raw);
}

export function saveStore(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetStore() {
    saveStore(initialData);
    return structuredClone(initialData);
}
