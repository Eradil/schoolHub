import React, { useState, useRef, useCallback } from "react";
import {
  Camera,
  Upload,
  X,
  Loader2,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  HelpCircle,
} from "lucide-react";
import { useStore } from "../store/StudentsStore";
import { checkHomeworkPhoto, hasApiKey } from "../services/aiService";

const SUBJECTS = ["Русский язык", "Литература", "Математика"];

const SUBJECT_HINT = {
  "Русский язык": "Например: диктант, упражнение 47, списывание",
  Литература:
    "Например: сочинение по рассказу, пересказ главы, ответы на вопросы",
  Математика: "Например: примеры на умножение, задача №3, контрольная",
};

const GRADE_STYLE = {
  5: {
    bar: "bg-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-800",
  },
  4: {
    bar: "bg-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
  },
  3: {
    bar: "bg-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
  },
  2: {
    bar: "bg-red-500",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
  },
  1: {
    bar: "bg-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-900",
  },
};

// ─── Загрузка фото ────────────────────────────────────────────────────────
function PhotoCapture({ onPhoto, onReset, photoUrl }) {
  const fileRef = useRef(null);
  const camRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const process = (file) => {
    if (!file?.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = (e) =>
      onPhoto({
        base64: e.target.result.split(",")[1],
        previewUrl: e.target.result,
      });
    r.readAsDataURL(file);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDrag(false);
    process(e.dataTransfer.files[0]);
  }, []);

  if (photoUrl)
    return (
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
        <img
          src={photoUrl}
          alt="Тетрадь"
          className="w-full max-h-64 object-contain"
        />
        <button
          onClick={onReset}
          className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
        >
          <X size={16} />
        </button>
        <div className="absolute bottom-2 left-2 bg-white/90 rounded-lg px-2 py-1 text-xs text-slate-500 font-medium">
          Фото загружено ✓
        </div>
      </div>
    );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${drag ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center">
          <Camera size={26} className="text-slate-400" />
        </div>
        <div>
          <p className="font-medium text-slate-700 text-sm">
            Сфотографируйте тетрадь
          </p>
          <p className="text-xs text-slate-400 mt-1">
            или перетащите фото сюда
          </p>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={() => camRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Camera size={16} /> Камера
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <Upload size={16} /> Выбрать файл
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Совет: хорошее освещение = точнее проверка почерка
        </p>
      </div>
      <input
        ref={camRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => process(e.target.files[0])}
        className="hidden"
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={(e) => process(e.target.files[0])}
        className="hidden"
      />
    </div>
  );
}

// ─── Карточка результата ──────────────────────────────────────────────────
function ResultCard({ result, student, onSaveGrade }) {
  const [saved, setSaved] = useState(false);
  const style = GRADE_STYLE[result.grade] || GRADE_STYLE[3];

  return (
    <div className="space-y-4 mt-6">
      {/* Оценка */}
      <div className={`rounded-2xl border p-5 ${style.bg} ${style.border}`}>
        <div className="flex items-center gap-4">
          <div className={`text-5xl font-bold ${style.text}`}>
            {result.grade ?? "—"}
          </div>
          <div>
            <p className={`font-bold text-lg leading-tight ${style.text}`}>
              {result.verdict}
            </p>
            <p className={`text-sm mt-1 ${style.text} opacity-80`}>
              {result.summary}
            </p>
          </div>
        </div>
        {result.grade && (
          <div className="mt-4 bg-white/60 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-700 ${style.bar}`}
              style={{ width: `${(result.grade / 5) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Нечёткие слова */}
      {result.unclear?.length > 0 && (
        <div className="bg-violet-50 rounded-2xl border border-violet-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-violet-100 flex items-center gap-2">
            <HelpCircle size={16} className="text-violet-400" />
            <span className="font-semibold text-violet-800 text-sm">
              Нечётко написано — уточните
            </span>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs text-violet-600">
              AI не уверен в прочтении — проверьте в тетради.
            </p>
            {result.unclear.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="shrink-0 w-5 h-5 bg-violet-100 text-violet-500 rounded-full text-xs font-bold flex items-center justify-center mt-0.5">
                  ?
                </span>
                <div>
                  <p className="text-sm font-medium text-violet-800">
                    «{item.word}»
                  </p>
                  <p className="text-xs text-violet-600 mt-0.5">
                    {item.question}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ошибки */}
      {result.errors?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400" />
            <span className="font-semibold text-slate-800 text-sm">
              Ошибки · {result.errors.length}
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {result.errors.map((err, i) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-5 h-5 bg-red-100 text-red-500 rounded-full text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                      {err.location}
                    </p>
                    <p className="text-sm text-red-700 font-medium">
                      {err.mistake}
                    </p>
                    <p className="text-sm text-emerald-700">
                      <span className="font-medium">Правильно: </span>
                      {err.correct}
                    </p>
                    {err.tip && (
                      <p className="text-xs text-slate-500 italic">
                        💡 {err.tip}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.errors?.length === 0 && result.grade >= 4 && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 flex items-center gap-3">
          <CheckCircle size={18} className="text-emerald-500 shrink-0" />
          <p className="text-sm text-emerald-800 font-medium">
            Ошибок не найдено!
          </p>
        </div>
      )}

      {/* Что хорошо */}
      {result.positives?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-400" />
            <span className="font-semibold text-slate-800 text-sm">
              Что хорошо
            </span>
          </div>
          <ul className="px-5 py-4 space-y-2">
            {result.positives.map((p, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-slate-700"
              >
                <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Рекомендация */}
      {result.recommendation && (
        <div className="bg-indigo-50 rounded-2xl border border-indigo-100 px-5 py-4">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-1">
            Рекомендация учителю
          </p>
          <p className="text-sm text-indigo-800">{result.recommendation}</p>
        </div>
      )}

      {/* Сохранить оценку */}
      {result.grade && student && !saved && (
        <button
          onClick={() => {
            onSaveGrade(result.grade);
            setSaved(true);
          }}
          className="w-full py-3 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
        >
          Сохранить оценку {result.grade} для {student.name}
        </button>
      )}
      {saved && (
        <p className="text-center text-sm text-emerald-600 font-medium py-2">
          ✓ Оценка сохранена в журнале
        </p>
      )}
    </div>
  );
}

// ─── Главная страница ─────────────────────────────────────────────────────
export default function HomeworkPage() {
  const { students, updateGrade, saveHomeworkResult, getStudentContext } =
    useStore();

  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [studentId, setStudentId] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const apiKeyOk = hasApiKey();
  const selectedStudent = students.find((s) => s.id === Number(studentId));

  const handleSubjectChange = (val) => {
    setSubject(val);
    setNote("");
  };

  const handleCheck = async () => {
    if (!photo) return;
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const studentContext = getStudentContext(studentId);
      const res = await checkHomeworkPhoto({
        imageBase64: photo.base64,
        subject,
        studentContext,
      });
      setResult(res);

      // Сохраняем результат в историю если ученик выбран
      if (selectedStudent && res.grade) {
        saveHomeworkResult({
          studentId: selectedStudent.id,
          studentName: selectedStudent.name,
          subject,
          grade: res.grade,
          summary: res.summary,
          errors: res.errors,
        });
      }
    } catch (e) {
      setError(
        e.message === "NO_API_KEY"
          ? "API ключ не найден. Создайте файл .env с VITE_GROQ_API_KEY=ваш_ключ и перезапустите сервер."
          : e.message || "Ошибка запроса. Попробуйте ещё раз.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPhoto(null);
    setResult(null);
    setError("");
    setNote("");
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">
          Проверка домашнего задания
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Сфотографируйте тетрадь — AI распознает почерк и проверит работу
        </p>
      </div>

      {!apiKeyOk && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">Нужен API ключ OpenRouter</p>
          <p>
            Создайте файл{" "}
            <code className="bg-amber-100 px-1 rounded">.env</code> в папке
            проекта и добавьте:
            <br />
            <code className="bg-amber-100 px-1 rounded">
              VITE_GROQ_API_KEY=sk-or-v1-ваш_ключ
            </code>
            <br />
            Затем перезапустите{" "}
            <code className="bg-amber-100 px-1 rounded">npm run dev</code>.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="col-span-2">
            <label className="label">Класс</label>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => {
                  setFilterClass("");
                  setStudentId("");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  !filterClass
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                }`}
              >
                Все
              </button>
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setFilterClass(c);
                    setStudentId("");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    filterClass === c
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Предмет</label>
            <div className="relative">
              <select
                value={subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="input w-full appearance-none pr-8"
              >
                {SUBJECTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <ChevronDown
                size={15}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
          <div>
            <label className="label">Ученик</label>
            <div className="relative">
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="input w-full appearance-none pr-8"
              >
                <option value="">Не выбран</option>
                {students
                  .filter((s) => !filterClass || s.classNum === filterClass)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {filterClass ? "" : `(${s.classNum} кл.)`}
                    </option>
                  ))}
              </select>
              <ChevronDown
                size={15}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="label">
            Уточнение{" "}
            <span className="normal-case font-normal text-slate-400">
              (необязательно)
            </span>
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={SUBJECT_HINT[subject]}
            className="input w-full"
          />
        </div>

        <PhotoCapture
          onPhoto={setPhoto}
          onReset={handleReset}
          photoUrl={photo?.previewUrl}
        />

        {photo && !result && (
          <button
            onClick={handleCheck}
            disabled={loading || !apiKeyOk}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed py-3"
          >
            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin" /> Читаю почерк и
                проверяю...
              </>
            ) : (
              "Проверить тетрадь"
            )}
          </button>
        )}

        {result && (
          <button
            onClick={handleReset}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <RotateCcw size={15} /> Проверить другую тетрадь
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <ResultCard
          result={result}
          student={selectedStudent}
          onSaveGrade={(grade) =>
            selectedStudent && updateGrade(selectedStudent.id, grade)
          }
        />
      )}
    </div>
  );
}
