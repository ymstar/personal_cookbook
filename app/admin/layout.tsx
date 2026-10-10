import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";
import { BottomNav } from "@/components/BottomNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthenticated();

  if (!authed) {
    return (
      <>
        <LoginForm />
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <header
        className="sticky top-0 z-10 flex items-center justify-between border-b px-4"
        style={{
          background: "rgba(250, 247, 242, 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderColor: "var(--line)",
          paddingTop: "calc(8px + env(safe-area-inset-top))",
          paddingBottom: "8px",
        }}
      >
        <h1 className="text-lg font-bold" style={{ color: "var(--ink)" }}>
          ✏️ 管理
        </h1>
        <a
          href="/admin/ingredients"
          className="rounded-lg px-2.5 py-1 text-sm"
          style={{ color: "var(--muted)" }}
        >
          食材管理
        </a>
      </header>
      <main
        className="mx-auto"
        style={{
          maxWidth: "640px",
          padding: "14px 14px calc(86px + env(safe-area-inset-bottom))",
        }}
      >
        {children}
      </main>
      <BottomNav />
    </>
  );
}
