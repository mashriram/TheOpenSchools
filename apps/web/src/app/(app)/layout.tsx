export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col p-8">{children}</div>;
}
