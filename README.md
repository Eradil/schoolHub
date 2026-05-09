# SchoolHub 📚

Минималистичный AI-инструмент для учителей 1–9 классов.  
Помогает сократить рутину: проверка домашних заданий по фото и генерация заданий-квизов.

> Проект в активной разработке. MVP работает полностью в браузере без сервера.

---

## Возможности

- **Мой класс** — список учеников с оценками, фильтрация по классу (1–9), сортировка по алфавиту, статистика успеваемости, письмо родителям одним кликом
- **Проверка ДЗ** — фотографируете тетрадь (или загружаете фото), AI распознаёт почерк и проверяет работу по предмету: орфография, вычисления, пересказ. Результат сохраняется в историю ученика
- **Генератор заданий** — задания в формате квиза (4 варианта ответа) по любой теме, предмету и классу. Плейсхолдеры адаптируются под выбранный класс и предмет

---

## Стек

- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/) — иконки
- [OpenRouter](https://openrouter.ai/) — AI (бесплатный tier)
- localStorage — хранилище данных (офлайн, без сервера)

---

## Быстрый старт

### 1. Клонируй репозиторий

```bash
git clone https://github.com/Eradil/schoolHub.git
cd schoolHub
```

### 2. Установи зависимости

```bash
npm install
```

### 3. Создай файл `.env` в корне проекта

```
VITE_GROQ_API_KEY=sk-or-v1-твой_ключ
```

Бесплатный ключ получи на [openrouter.ai](https://openrouter.ai) → Keys → Create Key.

### 4. Запусти

```bash
npm run dev
```

Открой [http://localhost:5173](http://localhost:5173)

---

## Деплой на Vercel

1. Залей репозиторий на GitHub
2. Подключи его на [vercel.com](https://vercel.com)
3. В настройках проекта → **Environment Variables** добавь:
   - `VITE_GROQ_API_KEY` = твой ключ от OpenRouter
4. Deploy

Файл `vercel.json` уже настроен — маршрутизация SPA работает корректно.

---

## Структура проекта

```
src/
├── data/
│   └── db.js              # Data Layer — вся работа с хранилищем здесь
├── store/
│   └── StudentsStore.jsx  # Business Logic — стор, логика, контекст для AI
├── services/
│   └── aiService.js       # AI Layer — запросы к OpenRouter
├── pages/
│   ├── ClassPage.jsx      # Страница "Мой класс"
│   ├── HomeworkPage.jsx   # Страница "Проверка ДЗ"
│   └── TasksPage.jsx      # Страница "Генератор заданий"
├── components/
│   ├── Layout.jsx         # Сайдбар + мобильная навигация
│   └── Modal.jsx          # Переиспользуемая модалка
└── index.css              # Глобальные стили + Tailwind
```

### Принцип разделения слоёв

```
UI (pages, components)
    ↓ вызывает
Store (бизнес-логика, React Context)
    ↓ вызывает
Data Layer (db.js — localStorage сейчас, API в будущем)
```

UI никогда не работает с localStorage напрямую.

---

## Как подключить backend в будущем

Вся работа с данными сосредоточена в `src/data/db.js`.  
Каждая функция — это одна точка замены:

```js
// Сейчас:
export function getStudents() {
  return load(KEYS.students, DEFAULT_STUDENTS);
}

// В будущем — просто заменяешь реализацию:
export async function getStudents() {
  const res = await fetch("/api/students");
  return res.json();
}
```

UI и стор при этом не меняются.

---

## Как добавить новую функцию

1. **Новые данные** → добавь функции в `src/data/db.js`
2. **Логика** → добавь в `src/store/StudentsStore.jsx`
3. **AI-запрос** → добавь функцию в `src/services/aiService.js`
4. **Страница** → создай файл в `src/pages/`, добавь роут в `src/App.jsx` и пункт в `src/components/Layout.jsx`

---

## Планы по развитию

- [ ] История проверок ДЗ на странице ученика
- [ ] Журнал оценок — таблица по датам и предметам
- [ ] Экспорт в PDF — отчёт по классу для родительского собрания
- [ ] Подключение backend + база данных (Supabase)
- [ ] Авторизация — несколько учителей в одном приложении
- [ ] Мобильное приложение (PWA или Flutter)
- [ ] Расширение предметов: окружающий мир, английский язык

---

## Переменные окружения

| Переменная | Описание |
|---|---|
| `VITE_GROQ_API_KEY` | API ключ OpenRouter (обязательно) |

---

## Лицензия

MIT
