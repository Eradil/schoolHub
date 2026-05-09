/**
 * AI SERVICE
 * Все запросы к OpenRouter — в одном месте.
 * Для смены провайдера — меняем только этот файл.
 */

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL   = "openrouter/free";

// Проверяем наличие ключа — import.meta.env читается только при сборке,
// поэтому проверяем строку а не просто truthy
export function hasApiKey() {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  return typeof key === "string" && key.trim().length > 10;
}

async function callAI(messages, maxTokens = 1200) {
  if (!hasApiKey()) throw new Error("NO_API_KEY");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.3, max_tokens: maxTokens }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Ошибка сети: ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

// Безопасный парсинг JSON — пробует напрямую, затем ищет JSON внутри текста
function safeJSON(raw) {
  if (!raw) return null;
  try { return JSON.parse(raw.trim()); } catch {}
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) try { return JSON.parse(m[0]); } catch {}
  return null;
}

// ─── Правила проверки по предметам ───────────────────────────────────────
const SUBJECT_RULES = {
  "Русский язык": "Проверяй ТОЛЬКО орфографию и пунктуацию. Стиль и смысл не оценивай. Не ищи ошибки в сложных пунктуационных конструкциях — только явные и бесспорные.",
  "Литература":   "Проверяй: 1) орфографию и пунктуацию — только очевидные ошибки, 2) точность пересказа или ответов на вопросы, 3) для сочинений — есть ли своя мысль (хвали за любую попытку выразить себя).",
  "Математика":   "Проверяй ТОЛЬКО правильность вычислений и ход решения задач. Орфографию полностью игнорируй. При ошибке показывай правильный расчёт.",
};

// ─── Проверка фото тетради ────────────────────────────────────────────────
export async function checkHomeworkPhoto({ imageBase64, subject, studentContext }) {
  const rules = SUBJECT_RULES[subject] || "Проверяй правильность выполнения задания.";

  // Извлекаем класс из контекста ученика для адаптации сложности
  const classMatch = studentContext?.match(/(\d+) класс/);
  const classNum   = classMatch ? classMatch[1] : "2";

  const system = `Ты опытный учитель начальных классов. Проверяешь фото тетради ученика — рукописный текст ребёнка.
Отвечай строго на русском языке. Никакой латиницы.

ПРАВИЛА ДЛЯ ПРЕДМЕТА "${subject}":
${rules}

ОБЩИЕ ПРАВИЛА:
— Проверяй только ОЧЕВИДНЫЕ ошибки. Если сомневаешься — не пиши. Лучше пропустить, чем ошибочно обвинить.
— Адаптируй язык под ${classNum} класс: просто, ободряюще.
— Если слово или цифра написаны нечётко — добавь в "unclear" с вопросом учителю.
— Если фото размытое и текст нечитаем — верни grade: null.

Отвечай ТОЛЬКО валидным JSON без markdown и без текста вне JSON:
{"grade":число 1-5 или null,"verdict":"Отлично/Хорошо/Удовлетворительно/Неудовлетворительно","summary":"1-2 предложения общего вывода","unclear":[{"word":"нечёткое слово","question":"Здесь написано ... или ...?"}],"errors":[{"location":"номер задания или строка","mistake":"что не так","correct":"как правильно","tip":"объяснение простыми словами"}],"positives":["что хорошо — конкретно"],"recommendation":"совет учителю"}`;

  const userText = [
    studentContext || "",
    `Предмет: ${subject}. Проверь тетрадь по указанным правилам.`,
  ].filter(Boolean).join("\n");

  const raw = await callAI([
    { role: "system", content: system },
    {
      role: "user",
      content: [
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        { type: "text", text: userText },
      ],
    },
  ], 1200);

  return safeJSON(raw) || {
    grade: null,
    verdict: "Не удалось разобрать",
    summary: "Попробуйте ещё раз или сделайте фото чётче.",
    unclear: [], errors: [], positives: [], recommendation: "",
  };
}

// ─── Генерация заданий-квизов ─────────────────────────────────────────────
export async function generateTasks({ topic, subject, classNum, count = 3 }) {
  const topicText = topic?.trim()
    ? `Тема: ${topic}`
    : `Тема: общая программа по предмету "${subject}" для ${classNum} класса`;

  const system = `Ты учитель начальных классов. Составляешь задания-квизы.
Отвечай строго на русском языке. Никаких иностранных слов.
Адаптируй сложность строго под ${classNum} класс.
Правило: ровно 4 варианта ответа, только один правильный, остальные правдоподобные но неверные.
Отвечай ТОЛЬКО валидным JSON без markdown:
{"tasks":[{"question":"текст задания","options":["вариант А","вариант Б","вариант В","вариант Г"],"correctIndex":число 0-3,"explanation":"почему этот ответ правильный — кратко и понятно"}]}`;

  const raw = await callAI([
    { role: "system", content: system },
    { role: "user", content: `Предмет: ${subject}\nКласс: ${classNum}\n${topicText}\nКоличество вопросов: ${count}\nЗадания должны быть интересными, с примерами из жизни детей.` },
  ], 1500);

  return safeJSON(raw) || { tasks: [] };
}
