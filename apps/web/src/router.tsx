import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import type { AuthContextValue } from "@/auth/auth-context";
import { AppShell } from "@/components/app-shell";
import { NotFoundPage } from "@/pages/not-found-page";

interface RouterContext {
  auth: AuthContextValue;
}
const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
  notFoundComponent: NotFoundPage,
});
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: ({ context }) => {
    throw redirect({
      to: context.auth.isAuthenticated ? "/app/dashboard" : "/login",
    });
  },
});
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: lazyRouteComponent(
    () => import("@/pages/login-page"),
    "LoginPage",
  ),
});
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app",
  component: AppShell,
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) throw redirect({ to: "/login" });
  },
});
const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/dashboard",
  component: lazyRouteComponent(
    () => import("@/pages/dashboard-page"),
    "DashboardPage",
  ),
});
const resultsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/results",
  component: lazyRouteComponent(
    () => import("@/pages/results-page"),
    "ResultsPage",
  ),
});
const modulesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/modules",
  component: lazyRouteComponent(
    () => import("@/pages/modules-page"),
    "ModulesPage",
  ),
});
const profileRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/profile",
  component: lazyRouteComponent(
    () => import("@/pages/profile-page"),
    "ProfilePage",
  ),
});
const studentsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/students",
  component: lazyRouteComponent(
    () => import("@/pages/students-page"),
    "StudentsPage",
  ),
  beforeLoad: ({ context }) => {
    if (context.auth.user?.role !== "ADMIN")
      throw redirect({ to: "/app/dashboard" });
  },
});
const importsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/imports",
  component: lazyRouteComponent(
    () => import("@/pages/imports-page"),
    "ImportsPage",
  ),
  beforeLoad: ({ context }) => {
    if (context.auth.user?.role === "STUDENT")
      throw redirect({ to: "/app/dashboard" });
  },
});
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  appRoute.addChildren([
    dashboardRoute,
    resultsRoute,
    modulesRoute,
    studentsRoute,
    importsRoute,
    profileRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  context: { auth: undefined as unknown as AuthContextValue },
  defaultPreload: "intent",
  scrollRestoration: true,
});
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
