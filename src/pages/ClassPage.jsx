import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  Mail,
} from "lucide-react";
import { useStore } from "../store/StudentsStore";
import Modal from "../components/Modal";

const STATUS_CONFIG = {
  excellent: { label: "Отлично", color: "bg-emerald-100 text-emerald-700" },
  good: { label: "Хорошо", color: "bg-blue-100 text-blue-700" },
  attention: { label: "Нужно внимание", color: "bg-amber-100 text-amber-700" },
  risk: { label: "Зона риска", color: "bg-red-100 text-red-700" },
};

// const CLASS_OPTIONS = ["1", "2", "3", "4"];
const CLASS_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className={`text-3xl font-bold ${accent || "text-slate-800"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function ParentLetterModal({ student, onClose }) {
  const [copied, setCopied] = useState(false);
  const text = `Уважаемые родители!\n\nХочу сообщить вам об успеваемости вашего ребёнка, ${student.name}, в этом семестре.\n\nТекущий средний балл: ${student.grade || "—"}\n\n${
    student.status === "risk"
      ? "Успеваемость снизилась ниже допустимого уровня. Прошу уделить дополнительное внимание домашним заданиям и рассмотреть возможность дополнительных занятий."
      : "Прошу продолжать поддерживать ребёнка в учёбе и следить за выполнением домашних заданий."
  }\n\nЯ готова обсудить с вами подробности и ответить на любые вопросы.\n\nС уважением,\nВаш учитель`;

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Письмо родителям — ${student.name}`}
    >
      <div className="bg-slate-50 rounded-xl p-4 font-mono text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
        {text}
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={handleCopy} className="btn-primary flex-1">
          {copied ? "Скопировано ✓" : "Скопировать"}
        </button>
        <button onClick={onClose} className="btn-secondary">
          Закрыть
        </button>
      </div>
    </Modal>
  );
}

function GradeCell({ student }) {
  const { updateGrade } = useStore();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(student.grade?.toString() || "");

  const save = () => {
    const n = parseFloat(val);
    if (!isNaN(n) && n >= 1 && n <= 5) updateGrade(student.id, n);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          type="number"
          step="0.1"
          min="1"
          max="5"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-16 px-2 py-1 border border-indigo-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={save}
          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
        >
          <Check size={14} />
        </button>
        <button
          onClick={() => setEditing(false)}
          className="p-1 text-slate-400 hover:bg-slate-100 rounded"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1.5 group"
    >
      <span className="font-semibold text-slate-800">
        {student.grade > 0 ? student.grade : "—"}
      </span>
      <Edit2
        size={12}
        className="text-slate-300 group-hover:text-indigo-400 transition-colors"
      />
    </button>
  );
}

export default function ClassPage() {
  const { students, settings, addStudent, removeStudent, updateSettings } =
    useStore();
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [letterStudent, setLetterStudent] = useState(null);

  const classStudents = students
    .filter((s) => s.classNum === settings.defaultClass)
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));

  const atRisk = classStudents.filter((s) => s.status === "risk").length;
  const withGrades = classStudents.filter((s) => s.grade > 0);
  const avg = withGrades.length
    ? (withGrades.reduce((a, b) => a + b.grade, 0) / withGrades.length).toFixed(
        1,
      )
    : "—";

  const handleAdd = () => {
    if (newName.trim()) {
      addStudent(newName.trim());
      setNewName("");
      setAdding(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Мой класс</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Кликните на оценку чтобы изменить
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Класс:</span>
          <div className="flex gap-1 flex-wrap">
            {CLASS_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => updateSettings({ defaultClass: c })}
                className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${
                  settings.defaultClass === c
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Учеников"
          value={classStudents.length}
          sub="в классе"
        />

        <StatCard label="Средний балл" value={avg} sub="по классу" />
        <StatCard
          label="Зона риска"
          value={atRisk}
          sub="учеников"
          accent={atRisk > 0 ? "text-red-500" : "text-slate-800"}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 text-sm">Успеваемость</h2>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            <Plus size={14} /> Добавить ученика
          </button>
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50">
                {["Ученик", "Средний балл", "Статус", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {classStudents.map((student) => {
                const sc = STATUS_CONFIG[student.status];
                return (
                  <tr key={student.id} className="hover:bg-slate-50/50 group">
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-800 text-sm">
                        {student.name}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <GradeCell student={student} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${sc.color}`}
                      >
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(student.status === "risk" ||
                          student.status === "attention") && (
                          <button
                            onClick={() => setLetterStudent(student)}
                            title="Письмо родителям"
                            className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Mail size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => removeStudent(student.id)}
                          title="Удалить"
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {adding && (
                <tr className="bg-indigo-50/30">
                  <td colSpan={4} className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Имя Фамилия"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAdd();
                          if (e.key === "Escape") setAdding(false);
                        }}
                        className="flex-1 px-3 py-1.5 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                      <button
                        onClick={handleAdd}
                        className="btn-primary py-1.5 px-4 text-sm"
                      >
                        Добавить
                      </button>
                      <button
                        onClick={() => setAdding(false)}
                        className="btn-secondary py-1.5 px-3 text-sm"
                      >
                        Отмена
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-slate-50">
          {classStudents.map((student) => {
            const sc = STATUS_CONFIG[student.status];
            return (
              <div
                key={student.id}
                className="px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-slate-800 text-sm">
                    {student.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <GradeCell student={student} />
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}
                    >
                      {sc.label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {(student.status === "risk" ||
                    student.status === "attention") && (
                    <button
                      onClick={() => setLetterStudent(student)}
                      className="p-2 text-slate-400 hover:text-indigo-500"
                    >
                      <Mail size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => removeStudent(student.id)}
                    className="p-2 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
          {adding && (
            <div className="px-4 py-3 flex items-center gap-2">
              <input
                autoFocus
                type="text"
                placeholder="Имя Фамилия"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") setAdding(false);
                }}
                className="flex-1 px-3 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={handleAdd}
                className="btn-primary py-2 px-3 text-sm"
              >
                OK
              </button>
            </div>
          )}
        </div>

        {classStudents.length === 0 && !adding && (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm">Нет учеников. Добавьте первого.</p>
          </div>
        )}
      </div>

      {atRisk > 0 && (
        <div className="mt-4 flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
          <AlertTriangle size={17} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">
            <strong>
              {atRisk} {atRisk === 1 ? "ученик" : "ученика"}
            </strong>{" "}
            в зоне риска. Наведите на строку и нажмите{" "}
            <Mail size={13} className="inline" /> чтобы подготовить письмо
            родителям.
          </p>
        </div>
      )}

      {letterStudent && (
        <ParentLetterModal
          student={letterStudent}
          onClose={() => setLetterStudent(null)}
        />
      )}
    </div>
  );
}
