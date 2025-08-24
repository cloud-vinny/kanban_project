export interface Board {
  id: string
  owner_id: string
  title: string
  created_at: string
}

export interface Column {
  id: string
  board_id: string
  title: string
  position: number
  created_at: string
}

export interface Card {
  id: string
  board_id: string
  column_id: string
  title: string
  description?: string
  position: number
  created_at: string
}

export interface BoardWithColumns extends Board {
  columns: Column[]
}

export interface ColumnWithCards extends Column {
  cards: Card[]
}

export interface BoardWithFullData extends Board {
  columns: ColumnWithCards[]
}
