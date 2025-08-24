'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { getBoards, createBoard } from '@/lib/database'
import type { Board } from '@/lib/types'

export default function Home() {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [creatingBoard, setCreatingBoard] = useState(false)

  useEffect(() => {
    checkUser()
    fetchBoards()
  }, [])

  const checkUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchBoards = async () => {
    try {
      const boardsData = await getBoards()
      setBoards(boardsData)
    } catch (error) {
      console.error('Error fetching boards:', error)
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
    } finally {
      setCreatingBoard(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setBoards([])
  }

  if (loading) {
    return (
      <main className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Kanban</h1>
          <p className="text-gray-600 mb-6">Organize your tasks with a beautiful Kanban board</p>
          <Link 
            href="/login" 
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">My Boards</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">Welcome, {user.email}</span>
          <button
            onClick={handleSignOut}
            className="text-gray-600 hover:text-gray-800 text-sm underline"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Create new board form */}
      <form onSubmit={handleCreateBoard} className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex space-x-3">
          <input
            type="text"
            value={newBoardTitle}
            onChange={(e) => setNewBoardTitle(e.target.value)}
            placeholder="Enter board title..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={creatingBoard}
          />
          <button
            type="submit"
            disabled={!newBoardTitle.trim() || creatingBoard}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {creatingBoard ? 'Creating...' : 'Create Board'}
          </button>
        </div>
      </form>

      {/* Boards grid */}
      {boards.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No boards yet</h3>
          <p className="text-gray-600">Create your first board to get started organizing your tasks.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/board/${board.id}`}
              className="block bg-white p-6 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{board.title}</h3>
              <p className="text-sm text-gray-500">
                Created {new Date(board.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
