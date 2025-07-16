// src/app/(admin)/layout.tsx
import AdminLayoutClient from "./AdminLayoutClient";

// This layout now simply wraps its children in the new client component.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayoutClient>
      {children}
    </AdminLayoutClient>
  );
}