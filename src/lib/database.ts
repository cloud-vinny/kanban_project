import { createClient } from './supabase'
import type { Board, Column, Card, BoardWithColumns, ColumnWithCards, BoardWithFullData } from './types'

// Board operations
export async function getBoards(): Promise<Board[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching boards:', error)
    throw error
  }
  return data || []
}

export async function getBoard(id: string): Promise<BoardWithFullData | null> {
  const supabase = createClient()
  
  try {
    // Get board with columns and cards
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('*')
      .eq('id', id)
      .single()
    
    if (boardError || !board) {
      console.error('Board not found:', boardError)
      return null
    }
    
    // Get columns for this board
    const { data: columns, error: columnsError } = await supabase
      .from('columns')
      .select('*')
      .eq('board_id', id)
      .order('position')
    
    if (columnsError) {
      console.error('Error fetching columns:', columnsError)
      throw columnsError
    }
    
    // Get cards for each column
    const columnsWithCards: ColumnWithCards[] = []
    for (const column of columns || []) {
      const { data: cards, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .eq('column_id', column.id)
        .order('position')
      
      if (cardsError) {
        console.error('Error fetching cards:', cardsError)
        throw cardsError
      }
      
      columnsWithCards.push({
        ...column,
        cards: cards || []
      })
    }
    
    return {
      ...board,
      columns: columnsWithCards
    }
  } catch (error) {
    console.error('Error in getBoard:', error)
    throw error
  }
}

export async function createBoard(title: string): Promise<Board> {
  const supabase = createClient()
  
  // Since RLS is disabled, we'll create a board without owner_id for now
  const { data, error } = await supabase
    .from('boards')
    .insert({ title })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating board:', error)
    throw error
  }
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
  
  if (error) {
    console.error('Error updating board:', error)
    throw error
  }
  return data
}

export async function deleteBoard(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('boards')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting board:', error)
    throw error
  }
}

// Column operations
export async function createColumn(boardId: string, title: string, position: number): Promise<Column> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('columns')
    .insert({ board_id: boardId, title, position })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating column:', error)
    throw error
  }
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
  
  if (error) {
    console.error('Error updating column:', error)
    throw error
  }
  return data
}

export async function deleteColumn(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('columns')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting column:', error)
    throw error
  }
}

// Card operations
export async function createCard(columnId: string, title: string, description?: string): Promise<Card> {
  try {
    const supabase = createClient()
    
    // First get the column to get the board_id
    const { data: column, error: columnError } = await supabase
      .from('columns')
      .select('board_id')
      .eq('id', columnId)
      .single()
    
    if (columnError) {
      console.error('Error fetching column:', columnError)
      throw columnError
    }
    
    // Get the next position for this column
    const { data: existingCards, error: positionError } = await supabase
      .from('cards')
      .select('position')
      .eq('column_id', columnId)
      .order('position', { ascending: false })
      .limit(1)
    
    if (positionError) {
      console.error('Error fetching existing cards:', positionError)
      throw positionError
    }
    
    const nextPosition = existingCards && existingCards.length > 0 ? existingCards[0].position + 1 : 1
    
    const { data, error } = await supabase
      .from('cards')
      .insert({
        board_id: column.board_id,
        column_id: columnId,
        title,
        description: description || null,
        position: nextPosition
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating card:', error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Error in createCard:', error)
    throw error
  }
}

export async function updateCard(id: string, updates: Partial<Card>): Promise<Card> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cards')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating card:', error)
    throw error
  }
  return data
}

export async function deleteCard(cardId: string): Promise<void> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', cardId)
    
    if (error) {
      console.error('Error deleting card:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in deleteCard:', error)
    throw error
  }
}

export async function moveCard(cardId: string, newColumnId: string, newPosition: number): Promise<void> {
  const supabase = createClient()
  
  // Get the card to update
  const { data: card, error: cardError } = await supabase
    .from('cards')
    .select('*')
    .eq('id', cardId)
    .single()
  
  if (cardError || !card) {
    console.error('Error getting card:', cardError)
    throw cardError
  }
  
  // Update the card with new column and position
  const { error } = await supabase
    .from('cards')
    .update({ 
      column_id: newColumnId, 
      position: newPosition 
    })
    .eq('id', cardId)
  
  if (error) {
    console.error('Error moving card:', error)
    throw error
  }
}
