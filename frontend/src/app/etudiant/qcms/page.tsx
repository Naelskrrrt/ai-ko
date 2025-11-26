'use client'

import * as React from 'react'
import { QCMsList } from '@/features/etudiant/components/qcms/QCMsList'

export default function QCMsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">QCMs Disponibles</h1>
        <p className="text-default-500 mt-1">
          Entraînez-vous avec les QCMs publiés par vos enseignants
        </p>
      </div>

      <QCMsList />
    </div>
  )
}







