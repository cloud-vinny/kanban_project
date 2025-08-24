'use client'
type Card = { id: string; title: string; description?: string; position: number }
type Column = { id: string; title: string; position: number; cards: Card[] }

export default function Board({ boardId, initialColumns }: { boardId: string; initialColumns: Column[] }) {
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">Board {boardId}</h1>
      <div className="grid grid-cols-3 gap-4">
        {initialColumns?.map(c => (
          <section key={c.id} className="rounded-lg border p-3 bg-white">
            <h2 className="font-medium mb-2">{c.title}</h2>
            <ul className="space-y-2">
              {c.cards?.map(card => (
                <li key={card.id} className="border rounded p-2 bg-neutral-50">{card.title}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  )
}
