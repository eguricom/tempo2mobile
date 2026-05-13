import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import RootLayout from "./routes/__root";
import HomePage from "./routes/index";
import AdminPage from "./routes/admin";
import UsuariosPage from "./routes/usuarios";

const rootRoute = createRootRoute({ component: RootLayout });

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: HomePage });
const adminRoute = createRoute({ getParentRoute: () => rootRoute, path: "/admin", component: AdminPage });
const usuariosRoute = createRoute({ getParentRoute: () => rootRoute, path: "/usuarios", component: UsuariosPage });

export const routeTree = rootRoute.addChildren([homeRoute, adminRoute, usuariosRoute]);
