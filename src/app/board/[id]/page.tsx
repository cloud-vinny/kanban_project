'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getBoard, createColumn, createCard, moveCard, deleteCard, updateCard } from '@/lib/database'
import type { BoardWithFullData, Column, Card } from '@/lib/types'

export default function BoardPage() {
  const params = useParams()
  const router = useRouter()
  const boardId = params.id as string
  
  const [board, setBoard] = useState<BoardWithFullData | null>(null)
  const [loading, setLoading] = useState(true)
  const [draggedCard, setDraggedCard] = useState<Card | null>(null)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [newCardDescription, setNewCardDescription] = useState('')
  const [addingCardTo, setAddingCardTo] = useState<string | null>(null)
  const [editingCard, setEditingCard] = useState<string | null>(null)
  const [editCardTitle, setEditCardTitle] = useState('')
  const [editCardDescription, setEditCardDescription] = useState('')

  useEffect(() => {
    if (boardId) {
      fetchBoard()
    }
  }, [boardId])

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

  const handleCreateCard = async (columnId: string) => {
    if (!board || !newCardTitle.trim()) return

    try {
      const newCard = await createCard(columnId, newCardTitle.trim(), newCardDescription.trim())
      setBoard(prev => prev ? {
        ...prev,
        columns: prev.columns.map(col => 
          col.id === columnId 
            ? { ...col, cards: [...col.cards, newCard] }
            : col
        )
      } : null)
      setNewCardTitle('')
      setNewCardDescription('')
      setAddingCardTo(null)
    } catch (error) {
      console.error('Error creating card:', error)
    }
  }

  const handleEditCard = (card: Card) => {
    setEditingCard(card.id)
    setEditCardTitle(card.title)
    setEditCardDescription(card.description || '')
  }

  const handleSaveCard = async (cardId: string, columnId: string) => {
    if (!board || !editCardTitle.trim()) return

    try {
      await updateCard(cardId, {
        title: editCardTitle.trim(),
        description: editCardDescription.trim()
      })
      setBoard(prev => prev ? {
        ...prev,
        columns: prev.columns.map(col => 
          col.id === columnId 
            ? { 
                ...col, 
                cards: col.cards.map(card => 
                  card.id === cardId 
                    ? { ...card, title: editCardTitle.trim(), description: editCardDescription.trim() }
                    : card
                )
              }
            : col
        )
      } : null)
      setEditingCard(null)
      setEditCardTitle('')
      setEditCardDescription('')
    } catch (error) {
      console.error('Error updating card:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingCard(null)
    setEditCardTitle('')
    setEditCardDescription('')
  }

  const handleDeleteCard = async (cardId: string, columnId: string) => {
    if (!board) return

    try {
      await deleteCard(cardId)
      setBoard(prev => prev ? {
        ...prev,
        columns: prev.columns.map(col => 
          col.id === columnId 
            ? { ...col, cards: col.cards.filter(card => card.id !== cardId) }
            : col
        )
      } : null)
    } catch (error) {
      console.error('Error deleting card:', error)
    }
  }

  const handleDragStart = (e: React.DragEvent, card: Card) => {
    setDraggedCard(card)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
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

  if (!board) {
    return (
      <div className="p-6 text-center">
        <p>Board not found.</p>
        <button 
          onClick={() => router.push('/')}
          className="btn btn-primary mt-4"
        >
          Back to Boards
        </button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Kanban Board</h1>
      </div>

      {/* Kanban board */}
      <div className="kanban-board">
        {board.columns.map((column) => (
          <div
            key={column.id}
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id, column.cards.length)}
          >
            <h3>{column.title}</h3>
            
            <div className="space-y-3 flex-1">
              {column.cards.map((card, index) => (
                <div
                  key={card.id}
                  draggable={editingCard !== card.id}
                  onDragStart={(e) => handleDragStart(e, card)}
                  className="kanban-card"
                >
                  {editingCard === card.id ? (
                    // Edit mode
                    <div>
                      <input
                        type="text"
                        value={editCardTitle}
                        onChange={(e) => setEditCardTitle(e.target.value)}
                        className="form-input text-sm mb-2"
                        autoFocus
                      />
                      <textarea
                        value={editCardDescription}
                        onChange={(e) => setEditCardDescription(e.target.value)}
                        placeholder="Description (optional)..."
                        className="form-input text-sm mb-2"
                        rows={2}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSaveCard(card.id, column.id)}
                          disabled={!editCardTitle.trim()}
                          className="btn btn-primary text-sm px-2 py-1"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="btn btn-secondary text-sm px-2 py-1"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 
                          className="cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => handleEditCard(card)}
                        >
                          {card.title}
                        </h4>
                        <button
                          onClick={() => handleDeleteCard(card.id, column.id)}
                          className="delete-card-btn"
                          title="Delete card"
                        >
                          🗑️
                        </button>
                      </div>
                      {card.description && (
                        <p className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleEditCard(card)}>
                          {card.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Add card section */}
              {addingCardTo === column.id ? (
                <div className="card-creation-form">
                  <input
                    type="text"
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    placeholder="Card title..."
                    className="form-input text-sm mb-2"
                    autoFocus
                  />
                  <textarea
                    value={newCardDescription}
                    onChange={(e) => setNewCardDescription(e.target.value)}
                    placeholder="Description (optional)..."
                    className="form-input text-sm mb-2"
                    rows={2}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleCreateCard(column.id)}
                      disabled={!newCardTitle.trim()}
                      className="btn btn-primary text-sm px-3 py-1"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setAddingCardTo(null)
                        setNewCardTitle('')
                        setNewCardDescription('')
                      }}
                      className="btn btn-secondary text-sm px-3 py-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingCardTo(column.id)}
                  className="add-card-button"
                >
                  + Add a card
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
