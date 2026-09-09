export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    "/tracker/:path*",
    "/analytics/:path*",
    "/reminders/:path*",
    "/outreach/:path*",
    "/contacts/:path*",
    "/profile/:path*",
  ],
};
