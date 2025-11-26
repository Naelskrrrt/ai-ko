'use client'

import * as React from 'react'
import { useAuth } from '@/core/providers/AuthProvider'
import { QCMList } from '@/features/enseignant/components/qcm/QCMList'

export default function QCMListPage() {
  const { user } = useAuth()
  const userId = user?.id || ''

  return <QCMList userId={userId} />
}
