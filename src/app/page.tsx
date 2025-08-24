'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getBoards, createBoard } from '@/lib/database'
import type { Board } from '@/lib/types'

export default function Home() {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [creatingBoard, setCreatingBoard] = useState(false)

  useEffect(() => {
    console.log('Home component mounted')
    console.log('Environment check:', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    })
    fetchBoards()
  }, [])

  const fetchBoards = async () => {
    try {
      console.log('Fetching boards...')
      const boardsData = await getBoards()
      console.log('Boards fetched:', boardsData)
      setBoards(boardsData)
    } catch (error) {
      console.error('Error fetching boards:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBoardTitle.trim()) return

    setCreatingBoard(true)
    try {
      const newBoard = await createBoard(newBoardTitle.trim())
      setBoards([newBoard, ...boards])
      setNewBoardTitle('')
    } catch (error) {
      console.error('Error creating board:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setCreatingBoard(false)
    }
  }

  if (error) {
    return (
      <main className="p-6">
        <div className="home-container text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading App</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null)
              fetchBoards()
            }}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="p-6">
        <div className="home-container">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="p-6">
      <div className="home-container">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Kanban</h1>
          <p className="text-xl text-gray-600">Organize your tasks with a beautiful Kanban board</p>
        </div>

        {/* Create new board form */}
        <form onSubmit={handleCreateBoard} className="mb-8">
          <div className="flex space-x-3 max-w-md mx-auto">
            <input
              type="text"
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              placeholder="Enter board title..."
              className="form-input"
              disabled={creatingBoard}
            />
            <button
              type="submit"
              disabled={!newBoardTitle.trim() || creatingBoard}
              className="btn btn-primary"
            >
              {creatingBoard ? 'Creating...' : 'Create Board'}
            </button>
          </div>
        </form>

        {/* Boards grid */}
        {boards.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No boards yet</h3>
            <p className="text-gray-600">Create your first board to get started organizing your tasks.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <Link
                key={board.id}
                href={`/board/${board.id}`}
                className="board-card block"
              >
                <h3>{board.title}</h3>
                <p>Created {new Date(board.created_at).toLocaleDateString()}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
