'use client'
import { useEffect, useState } from 'react'

export function useSolutions() {
  const [solutions, setSolutions] = useState<Array<{ id: string; name: string; color: string | null; category: string | null }>>( [])
  useEffect(() => {
    fetch('/api/solutions').then(r => r.json()).then(d => setSolutions(d.data ?? []))
  }, [])
  return { solutions }
}
