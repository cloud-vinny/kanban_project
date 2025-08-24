import Link from 'next/link'
export default function Home() {
  // later: fetch boards for the logged-in user
  return (
    <main className="p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Boards</h1>
      <p>Nothing yet. Create a board in Supabase and open it directly:</p>
      <Link href="/login" className="underline">Login</Link>
    </main>
  )
}
