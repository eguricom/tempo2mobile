import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import RootLayout from "./routes/__root";
import HomePage from "./routes/index";
import AdminPage from "./routes/admin";
import UsuariosPage from "./routes/usuarios";
import MisJornadasPage from "./routes/mis-jornadas";
import PerfilPage from "./routes/perfil";

const rootRoute = createRootRoute({ component: RootLayout });

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: HomePage });
const adminRoute = createRoute({ getParentRoute: () => rootRoute, path: "/admin", component: AdminPage });
const usuariosRoute = createRoute({ getParentRoute: () => rootRoute, path: "/usuarios", component: UsuariosPage });
const misJornadasRoute = createRoute({ getParentRoute: () => rootRoute, path: "/mis-jornadas", component: MisJornadasPage });
const perfilRoute = createRoute({ getParentRoute: () => rootRoute, path: "/perfil", component: PerfilPage });

export const routeTree = rootRoute.addChildren([homeRoute, adminRoute, usuariosRoute, misJornadasRoute, perfilRoute]);
