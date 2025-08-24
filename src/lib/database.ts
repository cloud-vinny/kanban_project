import { createClient } from './supabase'
import type { Board, Column, Card, BoardWithColumns, ColumnWithCards, BoardWithFullData } from './types'

// Board operations
export async function getBoards(): Promise<Board[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function getBoard(id: string): Promise<BoardWithFullData | null> {
  const supabase = createClient()
  
  // Get board with columns and cards
  const { data: board, error: boardError } = await supabase
    .from('boards')
    .select('*')
    .eq('id', id)
    .single()
  
  if (boardError || !board) return null
  
  // Get columns for this board
  const { data: columns, error: columnsError } = await supabase
    .from('columns')
    .select('*')
    .eq('board_id', id)
    .order('position')
  
  if (columnsError) throw columnsError
  
  // Get cards for each column
  const columnsWithCards: ColumnWithCards[] = []
  for (const column of columns || []) {
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      .eq('column_id', column.id)
      .order('position')
    
    if (cardsError) throw cardsError
    
    columnsWithCards.push({
      ...column,
      cards: cards || []
    })
  }
  
  return {
    ...board,
    columns: columnsWithCards
  }
}

export async function createBoard(title: string): Promise<Board> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('boards')
    .insert({ title })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateBoard(id: string, updates: Partial<Board>): Promise<Board> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('boards')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteBoard(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('boards')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Column operations
export async function createColumn(boardId: string, title: string, position: number): Promise<Column> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('columns')
    .insert({ board_id: boardId, title, position })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateColumn(id: string, updates: Partial<Column>): Promise<Column> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('columns')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteColumn(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('columns')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Card operations
export async function createCard(columnId: string, title: string, description?: string, position?: number): Promise<Card> {
  const supabase = createClient()
  
  // If no position specified, get the next position
  let cardPosition = position
  if (cardPosition === undefined) {
    const { data: existingCards } = await supabase
      .from('cards')
      .select('position')
      .eq('column_id', columnId)
      .order('position', { ascending: false })
      .limit(1)
    
    cardPosition = (existingCards?.[0]?.position || -1) + 1
  }
  
  const { data, error } = await supabase
    .from('cards')
    .insert({ 
      column_id: columnId, 
      title, 
      description, 
      position: cardPosition 
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateCard(id: string, updates: Partial<Card>): Promise<Card> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cards')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteCard(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

export async function moveCard(cardId: string, newColumnId: string, newPosition: number): Promise<void> {
  const supabase = createClient()
  
  // Get the card to update
  const { data: card, error: cardError } = await supabase
    .from('cards')
    .select('*')
    .eq('id', cardId)
    .single()
  
  if (cardError || !card) throw cardError
  
  // Update the card with new column and position
  const { error } = await supabase
    .from('cards')
    .update({ 
      column_id: newColumnId, 
      position: newPosition 
    })
    .eq('id', cardId)
  
  if (error) throw error
}
