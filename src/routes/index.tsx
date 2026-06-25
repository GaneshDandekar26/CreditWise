import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const u = localStorage.getItem("fintech.user");
    const r = localStorage.getItem("fintech.role");
    if (!u) throw redirect({ to: "/auth" });
    throw redirect({ to: r === "admin" ? "/admin" : "/dashboard" });
  },
  component: () => null,
});
