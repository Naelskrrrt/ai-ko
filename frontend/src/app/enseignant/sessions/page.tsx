'use client'

import * as React from 'react'
import { useAuth } from '@/core/providers/AuthProvider'
import { SessionList } from '@/features/enseignant/components/sessions/SessionList'

export default function SessionsListPage() {
  const { user } = useAuth()
  const userId = user?.id || ''

  return <SessionList userId={userId} />
}
