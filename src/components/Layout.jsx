import React, { useState } from "react";
import { BookOpen, CheckSquare, Sparkles, Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { id: "class",    label: "Мой класс",  icon: BookOpen,    desc: "Ученики и оценки" },
  { id: "homework", label: "Проверка ДЗ",icon: CheckSquare, desc: "Быстрая проверка AI" },
  { id: "tasks",    label: "Задания",    icon: Sparkles,    desc: "Генератор заданий" },
];

export default function Layout({ activePage, setActivePage, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (id) => {
    setActivePage(id);
    setMobileOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-slate-100
          flex flex-col transition-transform duration-300
          lg:static lg:translate-x-0
          ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen size={15} className="text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-sm tracking-tight">
              SchoolHub
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 pl-9">для учителей</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon, desc }) => {
            const active = activePage === id;
            return (
              <button
                key={id}
                onClick={() => handleNav(id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                  transition-all duration-150 group
                  ${active
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  }
                `}
              >
                <Icon
                  size={17}
                  className={active ? "text-white" : "text-slate-400 group-hover:text-indigo-500"}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-tight">{label}</div>
                  <div className={`text-xs leading-tight mt-0.5 ${active ? "text-indigo-200" : "text-slate-400"}`}>
                    {desc}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100">
          <p className="text-xs text-slate-400 leading-relaxed">
            Данные сохраняются локально в браузере
          </p>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-semibold text-slate-800 text-sm">SchoolHub</span>
          <span className="ml-auto text-xs text-slate-400">
            {NAV_ITEMS.find((n) => n.id === activePage)?.label}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
