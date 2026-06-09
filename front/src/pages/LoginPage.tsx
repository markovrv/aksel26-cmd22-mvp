import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LogIn } from "lucide-react";

import { login as authorize, useCurrentUser } from "../auth";
import { DEMO_USERS, ROLE_LABELS } from "../data/users";

export function LoginPage() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [loginValue, setLoginValue] = useState("hr");
  const [password, setPassword] = useState("hr123");
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const user = authorize(loginValue, password);

    if (!user) {
      setError("Неверный логин или пароль");
      return;
    }

    setError("");
    navigate({ to: "/dashboard" });
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1fr)] lg:items-start">
      <div className="space-y-5">
        <div className="inline-flex rounded-full bg-blue-100 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-700">
          Демо-авторизация
        </div>
        <h2 className="max-w-2xl text-4xl font-black leading-none tracking-tight sm:text-5xl">
          Войти в личный кабинет
        </h2>
        <p className="max-w-2xl text-base font-bold leading-7 text-slate-500 sm:text-lg">
          Это необходимо для доступа к личному кабинету
        </p>
        {currentUser && (
          <div className="rounded-3xl border border-green-100 bg-green-50 p-5 font-bold text-green-800">
            Сейчас активен: {currentUser.name} · {ROLE_LABELS[currentUser.role]}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-black text-slate-500">Логин</span>
            <input
              value={loginValue}
              onChange={(event) => setLoginValue(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-base font-bold outline-none transition focus:border-blue-500"
              autoComplete="username"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-black text-slate-500">Пароль</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-base font-bold outline-none transition focus:border-blue-500"
              autoComplete="current-password"
            />
          </label>

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="flex h-14 w-full items-center justify-center gap-3 rounded-3xl bg-slate-900 px-5 text-lg font-black text-white transition hover:bg-blue-600"
          >
            <LogIn size={21} />
            Войти
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Тестовые пользователи
          </p>
          {DEMO_USERS.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => {
                setLoginValue(user.login);
                setPassword(user.password);
                setError("");
              }}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50"
            >
              <span className="block font-black text-slate-900">
                {user.login} / {user.password}
              </span>
              <span className="mt-1 block text-sm font-bold leading-5 text-slate-500">
                {ROLE_LABELS[user.role]} · {user.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
