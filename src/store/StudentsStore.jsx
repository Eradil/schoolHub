/**
 * STORE (Business Logic Layer)
 * Связывает Data Layer с UI через React Context.
 * Компоненты не знают о localStorage — только вызывают функции стора.
 */
import React, { createContext, useContext, useState, useCallback } from "react";
import {
  getStudents,
  addStudent as dbAddStudent,
  updateStudentGrade as dbUpdateGrade,
  removeStudent as dbRemoveStudent,
  saveHomeworkResult as dbSaveHomework,
  getStudentHistory as dbGetHistory,
  getSettings,
  saveSettings,
} from "../data/db";

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [students, setStudents] = useState(() => getStudents());
  const [settings, setSettings] = useState(() => getSettings());

  const addStudent = useCallback((name) => {
    const student = dbAddStudent({ name, classNum: settings.defaultClass });
    setStudents((prev) => [...prev, student]);
  }, [settings.defaultClass]);

  const updateGrade = useCallback((id, grade) => {
    const updated = dbUpdateGrade(id, grade);
    setStudents((prev) => prev.map((s) => s.id === id ? updated : s));
  }, []);

  const removeStudent = useCallback((id) => {
    dbRemoveStudent(id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateSettings = useCallback((patch) => {
    saveSettings(patch);
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const saveHomeworkResult = useCallback((data) => {
    return dbSaveHomework(data);
  }, []);

  const getStudentHistory = useCallback((studentId) => {
    return dbGetHistory(studentId);
  }, []);

  // Строка контекста ученика для AI — включает историю оценок
  const getStudentContext = useCallback((id) => {
    const s = students.find((st) => st.id === Number(id));
    if (!s) return "";
    const history = dbGetHistory(s.id).slice(0, 5);
    const historyText = history.length
      ? `Последние проверки: ${history.map((h) => `${h.subject} — ${h.grade}`).join(", ")}.`
      : "";
    return `Ученик: ${s.name}, ${s.classNum || settings.defaultClass} класс, средний балл: ${s.grade || "нет оценок"}. ${historyText}`.trim();
  }, [students, settings.defaultClass]);

  return (
    <StoreContext.Provider value={{
      students,
      settings,
      addStudent,
      updateGrade,
      removeStudent,
      updateSettings,
      saveHomeworkResult,
      getStudentHistory,
      getStudentContext,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore должен использоваться внутри StoreProvider");
  return ctx;
};
