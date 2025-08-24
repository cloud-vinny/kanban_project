import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { boardId, columnId, title } = await req.json()
  const supabase = createServerSupabase()
  const { data: last } = await supabase.from('cards')
    .select('position').eq('column_id', columnId).order('position', { ascending: false }).limit(1).maybeSingle()
  const position = (last?.position ?? 0) + 1
  const { data, error } = await supabase.from('cards')
    .insert({ board_id: boardId, column_id: columnId, title, position })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
