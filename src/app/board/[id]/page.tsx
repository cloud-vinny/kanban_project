'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getBoard, createColumn, createCard, updateCard, moveCard } from '@/lib/database'
import type { BoardWithFullData, Column, Card } from '@/lib/types'

export default function BoardPage() {
  const params = useParams()
  const router = useRouter()
  const boardId = params.id as string
  
  const [board, setBoard] = useState<BoardWithFullData | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [creatingColumn, setCreatingColumn] = useState(false)
  const [draggedCard, setDraggedCard] = useState<Card | null>(null)

  useEffect(() => {
    checkUser()
    if (boardId) {
      fetchBoard()
    }
  }, [boardId])

  const checkUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchBoard = async () => {
    try {
      const boardData = await getBoard(boardId)
      setBoard(boardData)
    } catch (error) {
      console.error('Error fetching board:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newColumnTitle.trim() || !board) return

    setCreatingColumn(true)
    try {
      const position = board.columns.length + 1
      const newColumn = await createColumn(board.id, newColumnTitle.trim(), position)
      setBoard(prev => prev ? {
        ...prev,
        columns: [...prev.columns, { ...newColumn, cards: [] }]
      } : null)
      setNewColumnTitle('')
    } catch (error) {
      console.error('Error creating column:', error)
    } finally {
      setCreatingColumn(false)
    }
  }

  const handleCreateCard = async (columnId: string, title: string) => {
    if (!board) return

    try {
      const newCard = await createCard(columnId, title)
      setBoard(prev => prev ? {
        ...prev,
        columns: prev.columns.map(col => 
          col.id === columnId 
            ? { ...col, cards: [...col.cards, newCard] }
            : col
        )
      } : null)
    } catch (error) {
      console.error('Error creating card:', error)
    }
  }

  const handleDragStart = (e: React.DragEvent, card: Card) => {
    setDraggedCard(card)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, targetColumnId: string, targetPosition: number) => {
    e.preventDefault()
    if (!draggedCard || !board) return

    try {
      await moveCard(draggedCard.id, targetColumnId, targetPosition)
      
      // Update local state
      setBoard(prev => {
        if (!prev) return null
        
        // Remove card from old column
        const updatedColumns = prev.columns.map(col => ({
          ...col,
          cards: col.cards.filter(card => card.id !== draggedCard.id)
        }))
        
        // Add card to new column at new position
        const targetColumn = updatedColumns.find(col => col.id === targetColumnId)
        if (targetColumn) {
          targetColumn.cards.splice(targetPosition, 0, draggedCard)
        }
        
        return { ...prev, columns: updatedColumns }
      })
    } catch (error) {
      console.error('Error moving card:', error)
    } finally {
      setDraggedCard(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="flex space-x-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-64 bg-gray-200 rounded h-96"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!board || !user) {
    return (
      <div className="p-6 text-center">
        <p>Board not found or you don't have access.</p>
        <button 
          onClick={() => router.push('/')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Back to Boards
        </button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{board.title}</h1>
          <p className="text-gray-600">Created {new Date(board.created_at).toLocaleDateString()}</p>
        </div>
        <button 
          onClick={() => router.push('/')}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 underline"
        >
          ← Back to Boards
        </button>
      </div>

      {/* Create new column form */}
      <form onSubmit={handleCreateColumn} className="mb-6">
        <div className="flex space-x-3">
          <input
            type="text"
            value={newColumnTitle}
            onChange={(e) => setNewColumnTitle(e.target.value)}
            placeholder="Enter column title..."
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={creatingColumn}
          />
          <button
            type="submit"
            disabled={!newColumnTitle.trim() || creatingColumn}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {creatingColumn ? 'Creating...' : 'Add Column'}
          </button>
        </div>
      </form>

      {/* Kanban board */}
      <div className="flex space-x-6 overflow-x-auto pb-6">
        {board.columns.map((column) => (
          <div
            key={column.id}
            className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id, column.cards.length)}
          >
            <h3 className="font-semibold text-gray-900 mb-4">{column.title}</h3>
            
            <div className="space-y-3">
              {column.cards.map((card, index) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, card)}
                  className="bg-white p-3 rounded border border-gray-200 cursor-move hover:shadow-sm"
                >
                  <h4 className="font-medium text-gray-900">{card.title}</h4>
                  {card.description && (
                    <p className="text-sm text-gray-600 mt-1">{card.description}</p>
                  )}
                </div>
              ))}
              
              {/* Add card form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  const title = formData.get('title') as string
                  if (title.trim()) {
                    handleCreateCard(column.id, title.trim())
                    e.currentTarget.reset()
                  }
                }}
                className="pt-2"
              >
                <input
                  name="title"
                  placeholder="Add a card..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
