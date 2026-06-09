import { Link } from '@tanstack/react-router';

import { logout, useCurrentUser } from '../auth';
import { ROLE_LABELS } from '../data/users';

export function Header() {
  const user = useCurrentUser();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 px-4 py-1.5 backdrop-blur-md sm:px-6 sm:py-4">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-6 gap-y-1 sm:justify-between sm:gap-y-3">
        <Link to="/" className="flex h-7 w-full items-center justify-center gap-1.5 sm:h-10 sm:w-auto sm:justify-start sm:gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white shadow-md shadow-blue-200 sm:h-10 sm:w-10 sm:rounded-xl sm:text-base sm:shadow-lg">
            Q
          </div>
          <h1 className="text-base font-bold leading-none tracking-tight sm:text-xl">Qualify.GNN</h1>
        </Link>

        <div className="flex min-h-7 w-full items-center justify-center gap-3 text-xs font-bold leading-none text-slate-500 sm:min-h-0 sm:w-auto sm:justify-end sm:gap-6 sm:text-sm md:gap-8">
          <Link
            to="/"
            activeProps={{ className: 'text-blue-600' }}
            inactiveProps={{ className: 'transition hover:text-blue-600' }}
          >
            Экскурсии
          </Link>
          <Link
            to="/dashboard"
            activeProps={{ className: 'text-blue-600' }}
            inactiveProps={{ className: 'transition hover:text-blue-600' }}
          >
            Дашборд
          </Link>
          {user ? (
            <button
              onClick={logout}
              className="flex h-7 max-w-[150px] items-center rounded-full bg-slate-900 px-3 text-[11px] text-white transition-all hover:shadow-xl sm:h-9 sm:max-w-none sm:px-5 sm:text-sm"
              title={`${user.name} · ${ROLE_LABELS[user.role]}`}
            >
              <span className="truncate">{ROLE_LABELS[user.role]}</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="flex h-7 items-center rounded-full bg-slate-900 px-3 text-[11px] text-white transition-all hover:shadow-xl sm:h-9 sm:px-6 sm:text-sm"
            >
              Войти
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
