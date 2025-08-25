'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getBoard, createColumn, createCard, moveCard, deleteCard, updateCard } from '@/lib/database'
import type { BoardWithFullData, Column, Card } from '@/lib/types'

export default function BoardPage() {
  const params = useParams()
  const router = useRouter()
  const boardId = params.id as string
  
  const [board, setBoard] = useState<BoardWithFullData | null>(null)
  const [optimisticBoard, setOptimisticBoard] = useState<BoardWithFullData | null>(null)
  const [loading, setLoading] = useState(true)
  const [draggedCard, setDraggedCard] = useState<Card | null>(null)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [newCardDescription, setNewCardDescription] = useState('')
  const [addingCardTo, setAddingCardTo] = useState<string | null>(null)
  const [editingCard, setEditingCard] = useState<string | null>(null)
  const [editCardTitle, setEditCardTitle] = useState('')
  const [editCardDescription, setEditCardDescription] = useState('')
  const [isOptimisticUpdate, setIsOptimisticUpdate] = useState(false)
  const [optimisticError, setOptimisticError] = useState<string | null>(null)
  const [dragTarget, setDragTarget] = useState<string | null>(null)

  useEffect(() => {
    if (boardId) {
      fetchBoard()
    }
  }, [boardId])

  // Update optimistic board when real board changes
  useEffect(() => {
    if (board && !isOptimisticUpdate) {
      setOptimisticBoard(board)
    }
  }, [board, isOptimisticUpdate])

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
    // Add dragging class to the dragged element
    const target = e.target as HTMLElement
    target.classList.add('dragging')
  }

  const handleDragOver = (e: React.DragEvent, columnId?: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (columnId) {
      setDragTarget(columnId)
    }
  }

  // Optimistic update function
  const applyOptimisticUpdate = useCallback((cardId: string, fromColumnId: string, toColumnId: string, toPosition: number) => {
    if (!optimisticBoard) return null

    const card = optimisticBoard.columns
      .flatMap(col => col.cards)
      .find(c => c.id === cardId)

    if (!card) return null

    // Create optimistic board state
    const updatedBoard = {
      ...optimisticBoard,
      columns: optimisticBoard.columns.map(col => {
        if (col.id === fromColumnId) {
          // Remove card from source column
          return {
            ...col,
            cards: col.cards.filter(c => c.id !== cardId)
          }
        } else if (col.id === toColumnId) {
          // Add card to target column at new position
          const updatedCards = [...col.cards]
          const updatedCard = { ...card, column_id: toColumnId, position: toPosition }
          updatedCards.splice(toPosition, 0, updatedCard)
          
          // Update positions for cards after the inserted position
          const cardsAfterInsert = updatedCards.slice(toPosition + 1)
          cardsAfterInsert.forEach((c, index) => {
            c.position = toPosition + 1 + index
          })
          
          return {
            ...col,
            cards: updatedCards
          }
        }
        return col
      })
    }

    return updatedBoard
  }, [optimisticBoard])

  const handleDrop = async (e: React.DragEvent, targetColumnId: string, targetPosition: number) => {
    e.preventDefault()
    if (!draggedCard || !optimisticBoard) return

    const originalBoard = optimisticBoard
    const fromColumnId = draggedCard.column_id

    // Apply optimistic update immediately
    const optimisticUpdate = applyOptimisticUpdate(draggedCard.id, fromColumnId, targetColumnId, targetPosition)
    if (optimisticUpdate) {
      setOptimisticBoard(optimisticUpdate)
      setIsOptimisticUpdate(true)
      setOptimisticError(null)
    }

    try {
      // Perform the actual backend update
      await moveCard(draggedCard.id, targetColumnId, targetPosition)
      
      // Update the real board state
      setBoard(optimisticUpdate)
      setIsOptimisticUpdate(false)
    } catch (error) {
      console.error('Error moving card:', error)
      
      // Revert optimistic update on error
      setOptimisticBoard(originalBoard)
      setIsOptimisticUpdate(false)
      setOptimisticError('Failed to move card. Please try again.')
      
      // Clear error message after 3 seconds
      setTimeout(() => setOptimisticError(null), 3000)
    } finally {
      setDraggedCard(null)
      setDragTarget(null)
      // Remove dragging class from all elements
      document.querySelectorAll('.dragging').forEach(el => {
        el.classList.remove('dragging')
      })
      // Reset all border styles
      document.querySelectorAll('.kanban-card').forEach(el => {
        (el as HTMLElement).style.borderTop = ''
        ;(el as HTMLElement).style.borderBottom = ''
      })
    }
  }

  // Handle reordering within the same column
  const handleReorderInColumn = async (cardId: string, columnId: string, newPosition: number) => {
    if (!optimisticBoard) return

    const column = optimisticBoard.columns.find(col => col.id === columnId)
    if (!column) return

    const currentPosition = column.cards.findIndex(card => card.id === cardId)
    if (currentPosition === -1 || currentPosition === newPosition) return

    const originalBoard = optimisticBoard

    // Apply optimistic update
    const updatedBoard = {
      ...optimisticBoard,
      columns: optimisticBoard.columns.map(col => {
        if (col.id === columnId) {
          const updatedCards = [...col.cards]
          const [movedCard] = updatedCards.splice(currentPosition, 1)
          updatedCards.splice(newPosition, 0, movedCard)
          
          // Update positions
          updatedCards.forEach((card, index) => {
            card.position = index
          })
          
          return {
            ...col,
            cards: updatedCards
          }
        }
        return col
      })
    }

    setOptimisticBoard(updatedBoard)
    setIsOptimisticUpdate(true)
    setOptimisticError(null)

    try {
      await moveCard(cardId, columnId, newPosition)
      setBoard(updatedBoard)
      setIsOptimisticUpdate(false)
    } catch (error) {
      console.error('Error reordering card:', error)
      setOptimisticBoard(originalBoard)
      setIsOptimisticUpdate(false)
      setOptimisticError('Failed to reorder card. Please try again.')
      setTimeout(() => setOptimisticError(null), 3000)
    } finally {
      // Reset all border styles
      document.querySelectorAll('.kanban-card').forEach(el => {
        (el as HTMLElement).style.borderTop = ''
        ;(el as HTMLElement).style.borderBottom = ''
      })
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

  if (!optimisticBoard) {
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
        {isOptimisticUpdate && (
          <div className="mt-2 text-sm text-blue-600 animate-pulse">
            Updating...
          </div>
        )}
        {optimisticError && (
          <div className="mt-2 text-sm text-red-600 bg-red-100 p-2 rounded">
            {optimisticError}
          </div>
        )}
      </div>

      {/* Kanban board */}
      <div className="kanban-board">
        {optimisticBoard.columns.map((column) => (
          <div
            key={column.id}
            className={`kanban-column ${dragTarget === column.id ? 'drop-target' : ''}`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={() => setDragTarget(null)}
            onDrop={(e) => handleDrop(e, column.id, column.cards.length)}
          >
            <h3>{column.title}</h3>
            
            <div className="space-y-3 flex-1">
              {column.cards.map((card, index) => (
                <div
                  key={card.id}
                  draggable={editingCard !== card.id}
                  onDragStart={(e) => handleDragStart(e, card)}
                  onDragEnd={() => {
                    setDragTarget(null)
                    document.querySelectorAll('.dragging').forEach(el => {
                      el.classList.remove('dragging')
                    })
                    // Reset all border styles
                    document.querySelectorAll('.kanban-card').forEach(el => {
                      (el as HTMLElement).style.borderTop = ''
                      ;(el as HTMLElement).style.borderBottom = ''
                    })
                  }}
                  className={`kanban-card ${isOptimisticUpdate ? 'optimistic' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    // Add visual feedback for reordering
                    if (draggedCard && draggedCard.id !== card.id) {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const midY = rect.top + rect.height / 2
                      if (e.clientY < midY) {
                        e.currentTarget.style.borderTop = '2px solid #667eea'
                        e.currentTarget.style.borderBottom = ''
                      } else {
                        e.currentTarget.style.borderTop = ''
                        e.currentTarget.style.borderBottom = '2px solid #667eea'
                      }
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    // Reset border styles
                    e.currentTarget.style.borderTop = ''
                    e.currentTarget.style.borderBottom = ''
                    
                    if (draggedCard && draggedCard.id !== card.id) {
                      const draggedIndex = column.cards.findIndex(c => c.id === draggedCard.id)
                      const targetIndex = index
                      const newPosition = draggedIndex < targetIndex ? targetIndex : targetIndex
                      handleReorderInColumn(draggedCard.id, column.id, newPosition)
                    }
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.style.borderTop = ''
                    e.currentTarget.style.borderBottom = ''
                  }}
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
