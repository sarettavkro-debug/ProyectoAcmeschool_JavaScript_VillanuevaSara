const STORAGE_KEY = "acme_school_db_v1";

const initialData = {
    users: [
    {
        id: "1020304050",
        fullName: "Sara Caro",
        email: "admin@acmeschool.edu.co",
        phone: "+57 300 123 4567",
        role: "Administrativo",
        password: "Acme2026!"
    }
    ],
    exams: [
    {
        id: "exam-mat",
        code: "102030",
        title: "Matemáticas básicas",
        durationMinutes: 45,
        passPercentage: 70,
        description: "Operaciones fundamentales, fracciones y razonamiento numérico.",
        questions: [
        {
            id: "q-mat-1",
            text: "¿Cuál es el resultado de 12 × 8?",
            options: [
            { id: "o-1", text: "86", isCorrect: false },
            { id: "o-2", text: "96", isCorrect: true },
            { id: "o-3", text: "108", isCorrect: false },
            { id: "o-4", text: "88", isCorrect: false }
            ]
        },
        {
            id: "q-mat-2",
            text: "¿Cuánto es la mitad de 250?",
            options: [
            { id: "o-5", text: "115", isCorrect: false },
            { id: "o-6", text: "125", isCorrect: true },
            { id: "o-7", text: "150", isCorrect: false },
            { id: "o-8", text: "225", isCorrect: false }
            ]
        },
        {
            id: "q-mat-3",
            text: "¿Qué fracción equivale a 0,75?",
            options: [
            { id: "o-9", text: "1/2", isCorrect: false },
            { id: "o-10", text: "2/3", isCorrect: false },
            { id: "o-11", text: "3/4", isCorrect: true },
            { id: "o-12", text: "4/5", isCorrect: false }
            ]
        }
        ]
    },
    {
        id: "exam-len",
        code: "105556",
        title: "Lengua y literatura",
        durationMinutes: 60,
        passPercentage: 65,
        description: "Comprensión lectora, gramática y géneros literarios.",
        questions: [
        {
            id: "q-len-1",
            text: "¿Qué palabra funciona como sustantivo en la oración 'El libro está sobre la mesa'?",
            options: [
            { id: "o-len-1", text: "libro", isCorrect: true },
            { id: "o-len-2", text: "sobre", isCorrect: false },
            { id: "o-len-3", text: "está", isCorrect: false }
            ]
        }
        ]
    },
    {
        id: "exam-cie",
        code: "107788",
        title: "Ciencias naturales",
        durationMinutes: 50,
        passPercentage: 60,
        description: "Ecosistemas, célula y procesos biológicos esenciales.",
        questions: [
        {
            id: "q-cie-1",
            text: "¿Qué organelo celular realiza principalmente la fotosíntesis en las plantas?",
            options: [
            { id: "o-cie-1", text: "Cloroplasto", isCorrect: true },
            { id: "o-cie-2", text: "Mitocondria", isCorrect: false },
            { id: "o-cie-3", text: "Ribosoma", isCorrect: false }
            ]
        }
        ]
    },
    {
        id: "exam-his",
        code: "109876",
        title: "Historia universal",
        durationMinutes: 40,
        passPercentage: 70,
        description: "Procesos históricos clave de la antigüedad y la edad moderna.",
        questions: [
        {
            id: "q-his-1",
            text: "¿En qué continente se desarrollaron las civilizaciones de Mesopotamia y Egipto?",
            options: [
            { id: "o-his-1", text: "América", isCorrect: false },
            { id: "o-his-2", text: "Asia y África", isCorrect: true },
            { id: "o-his-3", text: "Oceanía", isCorrect: false }
            ]
        }
        ]
    },
    {
        id: "exam-ing",
        code: "101234",
        title: "Inglés nivel B2",
        durationMinutes: 90,
        passPercentage: 75,
        description: "Reading comprehension, grammar structures and academic vocabulary.",
        questions: [
        {
            id: "q-ing-1",
            text: "Choose the correct form: 'By next month, she ____ her final project.'",
            options: [
            { id: "o-ing-1", text: "will have finished", isCorrect: true },
            { id: "o-ing-2", text: "finishes", isCorrect: false },
            { id: "o-ing-3", text: "has finish", isCorrect: false }
            ]
        }
        ]
    },
    {
        id: "exam-fis",
        code: "104422",
        title: "Física general",
        durationMinutes: 60,
        passPercentage: 70,
        description: "Movimiento, fuerzas y principios básicos de energía.",
        questions: [
        {
            id: "q-fis-1",
            text: "¿Cuál es la unidad de fuerza en el Sistema Internacional (SI)?",
            options: [
            { id: "o-fis-1", text: "Newton", isCorrect: true },
            { id: "o-fis-2", text: "Joule", isCorrect: false },
            { id: "o-fis-3", text: "Watt", isCorrect: false }
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
