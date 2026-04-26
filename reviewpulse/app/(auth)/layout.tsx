export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EFF6FF] via-white to-[#F8FAFC]">
      <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
    </div>
  )
}
