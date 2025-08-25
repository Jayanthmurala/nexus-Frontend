export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/",
    "/dashboard",
    "/applications",
    "/placements",
    "/messages",
    "/profile",
    "/head-admin",
    "/dept-admin",
    "/placements-admin",
    "/students",
    "/network",
    "/projects",
    "/events",
    "/learning",
    "/collaboration",
    "/badges",
  ],
};
