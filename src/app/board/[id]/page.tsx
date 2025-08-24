import { createServerSupabase } from '@/lib/supabase'
import Board from './ui/Board'

export default async function BoardPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase()
  const { data: cols, error } = await supabase
    .from('columns')
    .select('id,title,position,cards(id,title,description,position)')
    .eq('board_id', params.id)
    .order('position', { ascending: true })
    .order('position', { ascending: true, foreignTable: 'cards' })

  if (error) return <pre className="p-6 text-red-600">{error.message}</pre>
  return <Board boardId={params.id} initialColumns={cols ?? []} />
}
