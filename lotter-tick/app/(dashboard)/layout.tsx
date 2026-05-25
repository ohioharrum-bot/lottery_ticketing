import Navbar from '@/components/Navbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <main className="max-w-md mx-auto px-4 pt-8">
        {children}
      </main>
      <Navbar />
    </div>
  )
}