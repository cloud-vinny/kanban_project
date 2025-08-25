'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the user's board with the actual UUID
    router.push('/board/f6ee8711-d8fc-4052-be36-8626ecbea3cb')
  }, [router])

  return (
    <main className="p-6">
      <div className="home-container text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4 mx-auto"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          </div>
        </div>
        <p className="mt-4 text-gray-600">Loading your Kanban board...</p>
      </div>
    </main>
  )
}
