import React, { useState } from "react";
import {
  Sparkles,
  Loader2,
  Copy,
  ChevronDown,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { generateTasks } from "../services/aiService";

const SUBJECTS = ["Математика", "Русский язык", "Литература"];
// const CLASSES = ["1", "2", "3", "4"];
const CLASSES = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

// const TOPIC_PLACEHOLDER = {
//   Математика: "Например: сложение двузначных чисел, таблица умножения на 3",
//   "Русский язык": "Например: безударные гласные, имена собственные",
//   Литература: "Например: сказки Пушкина, рассказы о природе",
// };
const TOPIC_PLACEHOLDER = {
  Математика: {
    1: "Например: сложение и вычитание до 10, состав числа",
    2: "Например: таблица умножения на 2 и 3, сложение до 100",
    3: "Например: умножение и деление, дроби, периметр фигур",
    4: "Например: многозначные числа, площадь, порядок действий",
    5: "Например: натуральные числа, дроби, координатная прямая",
    6: "Например: отрицательные числа, проценты, уравнения",
    7: "Например: линейные уравнения, степени, многочлены",
    8: "Например: квадратные уравнения, системы уравнений",
    9: "Например: функции и графики, прогрессии, вероятность",
  },
  "Русский язык": {
    1: "Например: буквы и звуки, слоги, заглавная буква",
    2: "Например: безударные гласные, парные согласные",
    3: "Например: части речи, состав слова, падежи",
    4: "Например: склонения, спряжения, однородные члены",
    5: "Например: морфология, синтаксис, правописание",
    6: "Например: причастие, деепричастие, лексика",
    7: "Например: наречие, предлоги, союзы, частицы",
    8: "Например: простое предложение, пунктуация",
    9: "Например: сложное предложение, ССП, СПП",
  },
  Литература: {
    1: "Например: сказки, стихи Чуковского, Маршака",
    2: "Например: рассказы Толстого, басни Крылова",
    3: "Например: сказки Пушкина, рассказы Носова",
    4: "Например: произведения Гоголя, Тургенева",
    5: "Например: мифы Древней Греции, Гомер, басни",
    6: "Например: Пушкин, Лермонтов, Тургенев",
    7: "Например: Некрасов, Достоевский, Чехов",
    8: "Например: Грибоедов, Пушкин, Лермонтов",
    9: "Например: Гоголь, Островский, Толстой",
  },
};

function QuizCard({ task, index }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSelect = (i) => {
    if (revealed) return;
    setSelected(i);
    setRevealed(true);
  };

  const copyText = () => {
    const text = `${task.question}\n${task.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join("\n")}\nОтвет: ${String.fromCharCode(65 + task.correctIndex)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const letters = ["А", "Б", "В", "Г"];

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4">
      <div className="flex items-start gap-3 mb-3">
        <span className="shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full text-xs font-bold flex items-center justify-center mt-0.5">
          {index + 1}
        </span>
        <p className="text-sm text-slate-800 leading-relaxed font-medium">
          {task.question}
        </p>
      </div>

      <div className="space-y-2 ml-9">
        {task.options.map((opt, i) => {
          const isCorrect = i === task.correctIndex;
          const isSelected = i === selected;
          let cls = "border border-slate-200 text-slate-700 bg-white";
          if (revealed) {
            if (isCorrect)
              cls =
                "border-2 border-emerald-400 bg-emerald-50 text-emerald-800 font-medium";
            else if (isSelected)
              cls = "border-2 border-red-300 bg-red-50 text-red-700";
            else cls = "border border-slate-100 text-slate-400 bg-slate-50";
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={revealed}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-all ${cls} ${!revealed ? "hover:border-indigo-300 hover:bg-indigo-50/50" : ""}`}
            >
              <span className="shrink-0 w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs font-bold">
                {letters[i]}
              </span>
              <span className="flex-1">{opt}</span>
              {revealed && isCorrect && (
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              )}
              {revealed && isSelected && !isCorrect && (
                <XCircle size={15} className="text-red-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {revealed && task.explanation && (
        <div className="ml-9 mt-3 bg-indigo-50 rounded-lg px-3 py-2 text-xs text-indigo-700">
          💡 {task.explanation}
        </div>
      )}

      <div className="ml-9 mt-3 flex items-center gap-3">
        {revealed && (
          <button
            onClick={() => {
              setSelected(null);
              setRevealed(false);
            }}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Сбросить
          </button>
        )}
        <button
          onClick={copyText}
          className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 ml-auto"
        >
          <Copy size={11} /> {copied ? "Скопировано" : "Копировать"}
        </button>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [classNum, setClassNum] = useState(CLASSES[1]);
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");

  const noApiKey = !import.meta.env.VITE_GROQ_API_KEY;

  const handleSubjectChange = (val) => {
    setSubject(val);
    setTopic("");
  };

  const handleGenerate = async () => {
    setError("");
    setTasks([]);
    setLoading(true);
    try {
      const res = await generateTasks({ subject, classNum, topic, count });
      setTasks(res.tasks || []);
    } catch (e) {
      setError(e.message || "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    const text = tasks
      .map(
        (t, i) =>
          `${i + 1}. ${t.question}\n${t.options.map((o, j) => `${String.fromCharCode(65 + j)}) ${o}`).join("\n")}\nОтвет: ${String.fromCharCode(65 + t.correctIndex)}`,
      )
      .join("\n\n");
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Генератор заданий</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Задания в формате квиза — 4 варианта ответа
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
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
            <label className="label">Класс</label>
            <div className="relative">
              <select
                value={classNum}
                onChange={(e) => setClassNum(e.target.value)}
                className="input w-full appearance-none pr-8"
              >
                {CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c} класс
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
          <label className="label">Тема</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={
              TOPIC_PLACEHOLDER[subject]?.[classNum] || "Введите тему урока"
            }
            className="input w-full"
            onKeyDown={(e) =>
              e.key === "Enter" && !loading && topic.trim() && handleGenerate()
            }
          />
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="label">Количество вопросов</label>
            <div className="flex gap-2">
              {[2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${count === n ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || noApiKey}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Составляю квиз...
            </>
          ) : (
            <>
              <Sparkles size={16} /> Сгенерировать квиз
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {tasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800 text-sm">
              {tasks.length} вопроса готово
            </h2>
            <div className="flex gap-2">
              <button
                onClick={copyAll}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Copy size={13} /> Копировать всё
              </button>
              <button
                onClick={handleGenerate}
                className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                <RefreshCw size={13} /> Ещё раз
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {tasks.map((task, i) => (
              <QuizCard key={i} task={task} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
