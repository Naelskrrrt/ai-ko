'use client'

import * as React from 'react'
import { useAuth } from '@/core/providers/AuthProvider'
import { StatsCards } from '@/features/etudiant/components/dashboard/StatsCards'
import { UpcomingExams } from '@/features/etudiant/components/dashboard/UpcomingExams'
import { RecentResults } from '@/features/etudiant/components/dashboard/RecentResults'

export default function EtudiantDashboardPage() {
  const { user } = useAuth()
  const userId = user?.id || ''

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCards userId={userId} />

      {/* Examens à venir & Résultats récents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingExams userId={userId} />
        <RecentResults userId={userId} />
      </div>
    </div>
  )
}
