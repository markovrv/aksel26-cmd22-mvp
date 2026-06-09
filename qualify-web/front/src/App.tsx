import { useEffect } from 'react';
import { createRootRoute, createRoute, createRouter, Outlet, RouterProvider, useLocation } from '@tanstack/react-router';

import { Header } from './components/Header';
import { CandidatePage } from './pages/CandidatePage';
import { DashboardPage } from './pages/DashboardPage';
import { ExcursionsPage } from './pages/ExcursionsPage';
import { LoginPage } from './pages/LoginPage';
import { SurveyPage } from './pages/SurveyPage';

function AppShell() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <ScrollToTop />
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:py-20">
        <Outlet />
      </main>
    </div>
  );
}

function ScrollToTop() {
  const pathname = useLocation({
    select: (location) => location.pathname,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return null;
}

const rootRoute = createRootRoute({
  component: AppShell,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: ExcursionsPage,
});

const surveyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/survey',
  component: SurveyPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardPage,
});

const candidateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/candidates/$attemptId',
  component: CandidatePage,
});

const routeTree = rootRoute.addChildren([indexRoute, surveyRoute, loginRoute, dashboardRoute, candidateRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
