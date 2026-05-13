/**
 * AI SERVICE
 * Все запросы к OpenRouter — в одном месте.
 * Для смены провайдера — меняем только этот файл.
 */

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

const MODEL_PRIMARY = "deepseek/deepseek-r1:free";
const MODEL_FALLBACK = "google/gemini-2.0-flash-exp:free";

export function hasApiKey() {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  return typeof key === "string" && key.trim().length > 10;
}

async function callAI(messages, maxTokens = 1500) {
  if (!hasApiKey()) throw new Error("NO_API_KEY");

  for (const model of [MODEL_PRIMARY, MODEL_FALLBACK]) {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          max_tokens: maxTokens,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 429 || res.status === 503 || res.status === 404)
          continue;
        throw new Error(err?.error?.message || `Ошибка сети: ${res.status}`);
      }

      const data = await res.json();
      return data.choices[0].message.content;
    } catch (e) {
      if (model === MODEL_FALLBACK) throw e;
    }
  }
}

function safeJSON(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw.trim());
  } catch {}
  const m = raw.match(/\{[\s\S]*\}/);
  if (m)
    try {
      return JSON.parse(m[0]);
    } catch {}
  return null;
}

function validateTasks(tasks) {
  if (!Array.isArray(tasks)) return [];
  return tasks.filter((t) => {
    if (!t.question || !Array.isArray(t.options) || t.options.length !== 4)
      return false;
    if (typeof t.correctIndex !== "number") return false;
    if (t.correctIndex < 0 || t.correctIndex > 3) return false;
    if (
      t.options.some((o) => !o || typeof o !== "string" || o.trim().length < 2)
    )
      return false;
    if (t.question.trim().length < 10) return false;
    const unique = new Set(t.options.map((o) => o.trim().toLowerCase()));
    if (unique.size < 3) return false;
    return true;
  });
}

const SUBJECT_RULES = {
  "Русский язык":
    "Проверяй ТОЛЬКО орфографию и пунктуацию. Стиль и смысл не оценивай. Не ищи ошибки в сложных пунктуационных конструкциях — только явные и бесспорные.",
  Литература:
    "Проверяй: 1) орфографию и пунктуацию — только очевидные ошибки, 2) точность пересказа или ответов на вопросы, 3) для сочинений — есть ли своя мысль (хвали за любую попытку выразить себя).",
  Математика:
    "Проверяй ТОЛЬКО правильность вычислений и ход решения задач. Орфографию полностью игнорируй. При ошибке показывай правильный расчёт.",
};

export async function checkHomeworkPhoto({
  imageBase64,
  subject,
  studentContext,
}) {
  const rules =
    SUBJECT_RULES[subject] || "Проверяй правильность выполнения задания.";
  const classMatch = studentContext?.match(/(\d+) класс/);
  const classNum = classMatch ? classMatch[1] : "2";

  const system = `Ты опытный учитель с 20-летним стажем. Проверяешь фото тетради ученика — рукописный текст ребёнка.
Отвечай строго на русском языке. Никакой латиницы.

ПРАВИЛА ДЛЯ ПРЕДМЕТА "${subject}":
${rules}

ОБЩИЕ ПРАВИЛА:
— Проверяй только ОЧЕВИДНЫЕ ошибки. Если сомневаешься — не пиши. Лучше пропустить, чем ошибочно обвинить.
— Адаптируй язык под ${classNum} класс: просто, ободряюще.
— Если слово или цифра написаны нечётко — добавь в "unclear" с вопросом учителю.
— Если фото размытое и текст нечитаем — верни grade: null.

Отвечай ТОЛЬКО валидным JSON без markdown и без текста вне JSON:
{"grade":число 1-5 или null,"verdict":"Отлично/Хорошо/Удовлетворительно/Неудовлетворительно","summary":"1-2 предложения","unclear":[{"word":"слово","question":"Здесь написано ... или ...?"}],"errors":[{"location":"где","mistake":"что не так","correct":"как правильно","tip":"объяснение"}],"positives":["что хорошо"],"recommendation":"совет учителю"}`;

  const raw = await callAI(
    [
      { role: "system", content: system },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
          },
          {
            type: "text",
            text: `${studentContext || ""}\nПредмет: ${subject}. Проверь тетрадь.`,
          },
        ],
      },
    ],
    1200,
  );

  return (
    safeJSON(raw) || {
      grade: null,
      verdict: "Не удалось разобрать",
      summary: "Попробуйте ещё раз или сделайте фото чётче.",
      unclear: [],
      errors: [],
      positives: [],
      recommendation: "",
    }
  );
}

const QUIZ_EXAMPLES = {
  Математика: `[
  {"question":"Реши пример: 47 + 35 = ?","options":["72","82","73","92"],"correctIndex":1,"explanation":"47 + 35 = 82. Складываем единицы: 7+5=12, пишем 2 переносим 1. Десятки: 4+3+1=8."},
  {"question":"В классе 28 учеников. Отсутствовали 5. Сколько присутствовали?","options":["21","22","23","24"],"correctIndex":2,"explanation":"28 − 5 = 23."}
]`,
  "Русский язык": `[
  {"question":"В каком слове безударная гласная проверяется словом «горы»?","options":["лес","гора","дом","кот"],"correctIndex":1,"explanation":"В слове «гора» безударная О. Проверочное слово — «горы»."},
  {"question":"Какое окончание у слова «кошка» в родительном падеже?","options":["-а","-и","-е","-у"],"correctIndex":1,"explanation":"Кошки (нет кого?) — окончание -И. Первое склонение, родительный падеж."}
]`,
  Литература: `[
  {"question":"Кто написал сказку «Золотой петушок»?","options":["Лев Толстой","Александр Пушкин","Николай Гоголь","Иван Крылов"],"correctIndex":1,"explanation":"Сказку написал Александр Пушкин в 1834 году."},
  {"question":"Как звали девочку из сказки Андерсена ростом с дюйм?","options":["Золушка","Дюймовочка","Герда","Элли"],"correctIndex":1,"explanation":"Дюймовочка — героиня сказки Андерсена. Дюйм — около 2,5 см."}
]`,
};

export async function generateTasks({ topic, subject, classNum, count = 3 }) {
  const topicText = topic?.trim()
    ? `Тема урока: ${topic}`
    : `Тема: повторение программы "${subject}" за ${classNum} класс`;

  const examples = QUIZ_EXAMPLES[subject] || QUIZ_EXAMPLES["Математика"];

  const system = `Ты опытный учитель с 20-летним стажем, эксперт по предмету "${subject}".
Составляешь профессиональные задания-квизы для учеников ${classNum} класса российской школы.
Отвечай строго на русском языке.

ТРЕБОВАНИЯ:
1. Вопрос проверяет конкретное знание из программы ${classNum} класса по "${subject}"
2. Вопрос сформулирован чётко и однозначно
3. Правильный ответ бесспорно верен
4. Три неправильных варианта правдоподобны, но явно неверны
5. Все 4 варианта одного типа (все числа, или все слова, или все имена)
6. Объяснение помогает ученику понять правильный ответ

ЗАПРЕЩЕНО:
— Абсурдные или бессмысленные вопросы
— Вопросы не из школьной программы
— Повторяющиеся варианты ответа
— Иностранные реалии (только российская программа)

Примеры ПРАВИЛЬНЫХ вопросов:
${examples}

Отвечай ТОЛЬКО валидным JSON без markdown:
{"tasks":[{"question":"вопрос","options":["А","Б","В","Г"],"correctIndex":0-3,"explanation":"объяснение"}]}`;

  const raw = await callAI(
    [
      { role: "system", content: system },
      {
        role: "user",
        content: `Предмет: ${subject}\nКласс: ${classNum}\n${topicText}\nКоличество вопросов: ${count}`,
      },
    ],
    2000,
  );

  const parsed = safeJSON(raw);
  if (!parsed?.tasks)
    return {
      tasks: [],
      error: "Не удалось получить ответ от AI. Попробуйте ещё раз.",
    };

  const valid = validateTasks(parsed.tasks);
  if (valid.length === 0)
    return {
      tasks: [],
      error: "AI сгенерировал некорректные вопросы. Попробуйте уточнить тему.",
    };

  return { tasks: valid };
}
