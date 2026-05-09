/**
 * DATA LAYER — единственное место где работаем с хранилищем.
 *
 * Сейчас: localStorage (работает офлайн, без зависимостей).
 * Будущее: заменить реализацию каждой функции на fetch() к API —
 * UI и бизнес-логика при этом не меняются.
 */

const KEYS = {
  students:       "schoolhub_students",
  homeworkHistory:"schoolhub_homework_history",
  settings:       "schoolhub_settings",
};

// ─── Утилиты ──────────────────────────────────────────────────────────────

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`[db] Не удалось сохранить ${key}:`, e);
    return false;
  }
}

// ─── Вычисление статуса по оценке ─────────────────────────────────────────

function gradeToStatus(grade) {
  if (grade >= 4.5) return "excellent";
  if (grade >= 3.5) return "good";
  if (grade >= 3.0) return "attention";
  return "risk";
}

// ─── Ученики ──────────────────────────────────────────────────────────────

const DEFAULT_STUDENTS = [
  { id: 1, name: "Иван Петров",     grade: 4.5, status: "excellent", classNum: "2" },
  { id: 2, name: "Мария Сидорова",  grade: 4.2, status: "good",      classNum: "2" },
  { id: 3, name: "Алексей Иванов",  grade: 3.8, status: "attention", classNum: "2" },
  { id: 4, name: "Елена Козлова",   grade: 2.9, status: "risk",      classNum: "2" },
  { id: 5, name: "Дмитрий Новиков", grade: 3.5, status: "attention", classNum: "2" },
  { id: 6, name: "Анна Белова",     grade: 4.8, status: "excellent", classNum: "2" },
];

export function getStudents() {
  return load(KEYS.students, DEFAULT_STUDENTS);
}

export function addStudent({ name, classNum = "2" }) {
  if (!name?.trim()) throw new Error("Имя ученика не может быть пустым");
  const students = getStudents();
  const newStudent = {
    id:       Date.now(),
    name:     name.trim(),
    grade:    0,
    status:   "attention",
    classNum,
  };
  save(KEYS.students, [...students, newStudent]);
  return newStudent;
}

export function updateStudentGrade(id, grade) {
  const num = parseFloat(grade);
  if (isNaN(num) || num < 1 || num > 5) throw new Error("Оценка должна быть от 1 до 5");
  const students = getStudents().map((s) =>
    s.id === id ? { ...s, grade: num, status: gradeToStatus(num) } : s
  );
  save(KEYS.students, students);
  return students.find((s) => s.id === id);
}

export function removeStudent(id) {
  const students = getStudents().filter((s) => s.id !== id);
  save(KEYS.students, students);
}

// ─── История проверок ДЗ ──────────────────────────────────────────────────

export function getHomeworkHistory() {
  return load(KEYS.homeworkHistory, []);
}

export function saveHomeworkResult({ studentId, studentName, subject, grade, summary, errors }) {
  const history = getHomeworkHistory();
  const record = {
    id:          Date.now(),
    studentId,
    studentName: studentName || "Не указан",
    subject,
    grade,
    summary,
    errorsCount: errors?.length || 0,
    date:        new Date().toISOString(),
  };
  // Храним не больше 200 последних записей
  const trimmed = [record, ...history].slice(0, 200);
  save(KEYS.homeworkHistory, trimmed);
  return record;
}

export function getStudentHistory(studentId) {
  return getHomeworkHistory().filter((r) => r.studentId === studentId);
}

// ─── Настройки ────────────────────────────────────────────────────────────

export function getSettings() {
  return load(KEYS.settings, { defaultClass: "2" });
}

export function saveSettings(patch) {
  const current = getSettings();
  save(KEYS.settings, { ...current, ...patch });
}
