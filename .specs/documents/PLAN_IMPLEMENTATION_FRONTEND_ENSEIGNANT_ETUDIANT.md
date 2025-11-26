# 🎓 Plan d'Implémentation Frontend - Parcours Enseignant & Étudiant

**Projet:** AI-KO - Système de Gestion d'Examens QCM
**Date:** Novembre 2025
**Architecture:** Next.js 15+ (App Router)
**Portée:** Parcours Enseignant + Parcours Étudiant (Sans Admin)

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Structure des Dossiers](#structure-des-dossiers)
3. [Parcours Enseignant](#parcours-enseignant)
4. [Parcours Étudiant](#parcours-étudiant)
5. [Composants Partagés](#composants-partagés)
6. [Services & API](#services--api)
7. [Ordre d'Exécution](#ordre-dexécution)

---

## 🎯 Vue d'Ensemble

### Objectifs

**Parcours Enseignant:**
- ✅ Ajout de supports de cours
- ✅ Génération de QCM avec correction automatique
- ✅ Publication de QCM avec paramétrage (matière, parcours, niveau, durée)
- ✅ Export QCM en CSV
- ✅ Correction des réponses d'étudiants
- ✅ Visualisation des listes d'étudiants avec notes
- ✅ Génération de notes en PDF

**Parcours Étudiant:**
- ✅ Passage d'évaluation QCM (avec compte à rebours)
- ✅ Blocage pendant l'examen (aucune navigation possible)
- ✅ Visualisation des notes et feedback après correction

### Technologies

```typescript
Stack Frontend:
- Framework: Next.js 15+ (App Router)
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS 4+
- UI: shadcn/ui (existant)
- State: React Query + Zustand
- Forms: React Hook Form + Zod
- Charts: Recharts (pour statistiques)
- PDF: jsPDF ou react-pdf
- CSV: papaparse
```

---

## 📁 Structure des Dossiers

```
frontend/
├── src/
│   ├── app/
│   │   ├── (dashboard)/              # Route group
│   │   │   ├── layout.tsx            # Layout avec sidebar
│   │   │   │
│   │   │   ├── enseignant/           # 🟦 PARCOURS ENSEIGNANT
│   │   │   │   ├── page.tsx          # Dashboard enseignant
│   │   │   │   ├── layout.tsx        # Layout spécifique
│   │   │   │   │
│   │   │   │   ├── supports/         # Gestion supports de cours
│   │   │   │   │   ├── page.tsx      # Liste supports
│   │   │   │   │   └── nouveau/
│   │   │   │   │       └── page.tsx  # Upload support
│   │   │   │   │
│   │   │   │   ├── qcm/              # Gestion QCM
│   │   │   │   │   ├── page.tsx      # Liste QCM
│   │   │   │   │   ├── nouveau/
│   │   │   │   │   │   └── page.tsx  # Générer QCM (formulaire)
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx  # Détail QCM
│   │   │   │   │       ├── edit/
│   │   │   │   │       │   └── page.tsx  # Édition QCM
│   │   │   │   │       ├── publier/
│   │   │   │   │       │   └── page.tsx  # Publier QCM
│   │   │   │   │       ├── corrections/
│   │   │   │   │       │   └── page.tsx  # Corriger réponses
│   │   │   │   │       └── resultats/
│   │   │   │   │           └── page.tsx  # Liste étudiants + notes
│   │   │   │   │
│   │   │   │   └── statistiques/
│   │   │   │       └── page.tsx      # Statistiques enseignant
│   │   │   │
│   │   │   └── etudiant/             # 🟩 PARCOURS ÉTUDIANT
│   │   │       ├── page.tsx          # Dashboard étudiant
│   │   │       ├── layout.tsx        # Layout spécifique
│   │   │       │
│   │   │       ├── examens/          # Examens disponibles
│   │   │       │   ├── page.tsx      # Liste examens
│   │   │       │   └── [id]/
│   │   │       │       ├── page.tsx  # Passage examen
│   │   │       │       └── resultat/
│   │   │       │           └── page.tsx  # Résultat + feedback
│   │   │       │
│   │   │       └── notes/
│   │   │           └── page.tsx      # Historique notes
│   │   │
│   │   └── api/                      # API Routes (proxy Flask)
│   │       └── [...path]/
│   │           └── route.ts
│   │
│   ├── features/                     # Features modules
│   │   │
│   │   ├── enseignant/               # 🟦 FEATURE ENSEIGNANT
│   │   │   ├── components/
│   │   │   │   ├── supports/
│   │   │   │   │   ├── SupportList.tsx
│   │   │   │   │   ├── SupportCard.tsx
│   │   │   │   │   └── SupportUploadForm.tsx
│   │   │   │   │
│   │   │   │   ├── qcm/
│   │   │   │   │   ├── QCMList.tsx
│   │   │   │   │   ├── QCMCard.tsx
│   │   │   │   │   ├── QCMGenerateForm.tsx
│   │   │   │   │   ├── QCMEditForm.tsx
│   │   │   │   │   ├── QCMPublishForm.tsx
│   │   │   │   │   ├── QuestionEditor.tsx
│   │   │   │   │   └── QCMExportCSV.tsx
│   │   │   │   │
│   │   │   │   ├── corrections/
│   │   │   │   │   ├── CorrectionList.tsx
│   │   │   │   │   ├── CorrectionItem.tsx
│   │   │   │   │   └── FeedbackEditor.tsx
│   │   │   │   │
│   │   │   │   ├── resultats/
│   │   │   │   │   ├── ResultatsTable.tsx
│   │   │   │   │   ├── ResultatRow.tsx
│   │   │   │   │   └── PDFExport.tsx
│   │   │   │   │
│   │   │   │   └── dashboard/
│   │   │   │       ├── StatsCards.tsx
│   │   │   │       └── RecentActivity.tsx
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useSupports.ts
│   │   │   │   ├── useQCMGeneration.ts
│   │   │   │   ├── useQCMPublish.ts
│   │   │   │   ├── useCorrections.ts
│   │   │   │   └── useResultats.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── supports.service.ts
│   │   │   │   ├── qcm.service.ts
│   │   │   │   ├── corrections.service.ts
│   │   │   │   └── resultats.service.ts
│   │   │   │
│   │   │   └── types/
│   │   │       ├── supports.types.ts
│   │   │       ├── qcm.types.ts
│   │   │       └── resultats.types.ts
│   │   │
│   │   └── etudiant/                 # 🟩 FEATURE ÉTUDIANT
│   │       ├── components/
│   │       │   ├── examens/
│   │       │   │   ├── ExamensList.tsx
│   │       │   │   ├── ExamenCard.tsx
│   │       │   │   ├── ExamenPlayer.tsx
│   │       │   │   ├── QuestionDisplay.tsx
│   │       │   │   ├── ExamTimer.tsx
│   │       │   │   └── ExamLockScreen.tsx
│   │       │   │
│   │       │   ├── resultats/
│   │       │   │   ├── ResultatCard.tsx
│   │       │   │   ├── FeedbackPanel.tsx
│   │       │   │   └── NotesHistory.tsx
│   │       │   │
│   │       │   └── dashboard/
│   │       │       ├── StatsCards.tsx
│   │       │       └── UpcomingExams.tsx
│   │       │
│   │       ├── hooks/
│   │       │   ├── useExamens.ts
│   │       │   ├── useExamTimer.ts
│   │       │   ├── useExamSubmit.ts
│   │       │   └── useNotes.ts
│   │       │
│   │       ├── services/
│   │       │   ├── examens.service.ts
│   │       │   └── notes.service.ts
│   │       │
│   │       └── types/
│   │           ├── examens.types.ts
│   │           └── notes.types.ts
│   │
│   ├── shared/                       # Code partagé
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui (existant)
│   │   │   ├── layout/
│   │   │   │   ├── DashboardLayout.tsx
│   │   │   │   ├── EnseignantSidebar.tsx
│   │   │   │   └── EtudiantSidebar.tsx
│   │   │   │
│   │   │   └── common/
│   │   │       ├── LoadingSpinner.tsx
│   │   │       ├── ErrorBoundary.tsx
│   │   │       ├── ConfirmDialog.tsx
│   │   │       └── DataTable.tsx
│   │   │
│   │   ├── services/
│   │   │   ├── http-client.ts
│   │   │   └── api-config.ts
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAsync.ts
│   │   │   ├── useDebounce.ts
│   │   │   └── useLocalStorage.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── format.ts
│   │   │   ├── validation.ts
│   │   │   ├── export-csv.ts
│   │   │   └── export-pdf.ts
│   │   │
│   │   └── types/
│   │       ├── api.types.ts
│   │       └── common.types.ts
│   │
│   └── core/
│       ├── config/
│       │   ├── routes.ts
│       │   └── constants.ts
│       │
│       └── providers/
│           ├── QueryProvider.tsx
│           └── ThemeProvider.tsx
│
└── package.json
```

---

# 🟦 PARCOURS ENSEIGNANT

## Section 1: Dashboard Enseignant

### 1.1 Page Dashboard (src/app/(dashboard)/enseignant/page.tsx)

**Objectif:** Afficher un aperçu global de l'activité de l'enseignant

**Tâches:**

#### Tâche 1.1.1: Créer la page Dashboard Enseignant

```typescript
// src/app/(dashboard)/enseignant/page.tsx

import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/core/config/auth.config'
import { StatsCards } from '@/features/enseignant/components/dashboard/StatsCards'
import { RecentActivity } from '@/features/enseignant/components/dashboard/RecentActivity'
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner'

export const metadata = {
  title: 'Dashboard Enseignant | AI-KO',
  description: 'Tableau de bord enseignant',
}

export default async function EnseignantDashboardPage() {
  // 1. Vérifier l'authentification et le rôle
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'enseignant') {
    redirect('/unauthorized')
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bonjour, {session.user.name}
          </h1>
          <p className="text-muted-foreground">
            Bienvenue sur votre espace enseignant
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<LoadingSpinner />}>
        <StatsCards userId={session.user.id} />
      </Suspense>

      {/* Recent Activity */}
      <Suspense fallback={<LoadingSpinner />}>
        <RecentActivity userId={session.user.id} />
      </Suspense>
    </div>
  )
}
```

**Instructions détaillées:**
1. Créer le fichier `src/app/(dashboard)/enseignant/page.tsx`
2. Importer `getServerSession` de `next-auth` pour vérifier l'authentification
3. Vérifier que l'utilisateur est bien un enseignant (rôle = 'enseignant')
4. Si non authentifié → rediriger vers `/login`
5. Si mauvais rôle → rediriger vers `/unauthorized`
6. Utiliser `Suspense` pour le chargement asynchrone des composants
7. Afficher les statistiques (QCM créés, étudiants, notes moyennes)
8. Afficher l'activité récente (derniers QCM, corrections en attente)

---

#### Tâche 1.1.2: Créer le composant StatsCards

```typescript
// src/features/enseignant/components/dashboard/StatsCards.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { enseignantService } from '@/features/enseignant/services/enseignant.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { FileText, Users, CheckCircle, TrendingUp } from 'lucide-react'

interface StatsCardsProps {
  userId: string
}

export function StatsCards({ userId }: StatsCardsProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['enseignant-stats', userId],
    queryFn: () => enseignantService.getStats(userId),
  })

  if (isLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="h-20 bg-muted" />
          <CardContent className="h-16 bg-muted" />
        </Card>
      ))}
    </div>
  }

  const cards = [
    {
      title: 'QCM Créés',
      value: stats?.qcm_total || 0,
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      title: 'Étudiants',
      value: stats?.etudiants_total || 0,
      icon: Users,
      color: 'text-green-600',
    },
    {
      title: 'Corrections en attente',
      value: stats?.corrections_en_attente || 0,
      icon: CheckCircle,
      color: 'text-orange-600',
    },
    {
      title: 'Note moyenne',
      value: `${stats?.note_moyenne || 0}/20`,
      icon: TrendingUp,
      color: 'text-purple-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
```

**Instructions détaillées:**
1. Créer le fichier `src/features/enseignant/components/dashboard/StatsCards.tsx`
2. Utiliser le hook `useQuery` de React Query pour fetcher les statistiques
3. Afficher 4 cartes de statistiques:
   - QCM créés (total)
   - Nombre d'étudiants
   - Corrections en attente
   - Note moyenne de tous les examens
4. Utiliser les icônes de `lucide-react`
5. Ajouter un état de chargement avec skeleton (animation pulse)
6. Utiliser les composants `Card` de shadcn/ui

---

#### Tâche 1.1.3: Créer le service enseignant

```typescript
// src/features/enseignant/services/enseignant.service.ts

import { httpClient } from '@/shared/services/http-client'
import type { EnseignantStats } from '../types/enseignant.types'

class EnseignantService {
  /**
   * Récupère les statistiques de l'enseignant
   */
  async getStats(userId: string): Promise<EnseignantStats> {
    const response = await httpClient.get<EnseignantStats>(
      `/api/enseignants/${userId}/stats`
    )
    return response.data
  }

  /**
   * Récupère l'activité récente de l'enseignant
   */
  async getRecentActivity(userId: string) {
    const response = await httpClient.get(
      `/api/enseignants/${userId}/activity`
    )
    return response.data
  }
}

export const enseignantService = new EnseignantService()
```

**Instructions détaillées:**
1. Créer le fichier `src/features/enseignant/services/enseignant.service.ts`
2. Créer une classe `EnseignantService` avec des méthodes pour:
   - `getStats()`: Récupérer les statistiques (appel GET `/api/enseignants/:id/stats`)
   - `getRecentActivity()`: Récupérer l'activité récente
3. Utiliser le `httpClient` partagé pour les appels API
4. Typer les retours avec les interfaces TypeScript
5. Exporter une instance singleton `enseignantService`

---

#### Tâche 1.1.4: Créer les types TypeScript

```typescript
// src/features/enseignant/types/enseignant.types.ts

export interface EnseignantStats {
  qcm_total: number
  qcm_publies: number
  qcm_brouillons: number
  etudiants_total: number
  corrections_en_attente: number
  note_moyenne: number
  examens_passes: number
}

export interface RecentActivity {
  id: string
  type: 'qcm_created' | 'qcm_published' | 'correction_done'
  title: string
  description: string
  date: string
  qcm_id?: string
}
```

**Instructions détaillées:**
1. Créer le fichier `src/features/enseignant/types/enseignant.types.ts`
2. Définir l'interface `EnseignantStats` avec tous les champs de statistiques
3. Définir l'interface `RecentActivity` pour l'activité récente
4. S'assurer que les types correspondent aux données renvoyées par le backend Flask
5. Utiliser des types stricts (pas de `any`)

---

## Section 2: Gestion des Supports de Cours

### 2.1 Page Liste des Supports

#### Tâche 2.1.1: Créer la page liste des supports

```typescript
// src/app/(dashboard)/enseignant/supports/page.tsx

import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/shared/components/ui/button'
import { Plus } from 'lucide-react'
import { SupportList } from '@/features/enseignant/components/supports/SupportList'
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner'

export const metadata = {
  title: 'Mes Supports de Cours | AI-KO',
  description: 'Gérez vos supports de cours',
}

export default async function SupportsPage() {
  const session = await getServerSession()

  if (!session || session.user.role !== 'enseignant') {
    redirect('/login')
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Mes Supports de Cours
          </h1>
          <p className="text-muted-foreground">
            Gérez vos documents pédagogiques
          </p>
        </div>
        <Button asChild>
          <Link href="/enseignant/supports/nouveau">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un support
          </Link>
        </Button>
      </div>

      {/* Liste des supports */}
      <Suspense fallback={<LoadingSpinner />}>
        <SupportList userId={session.user.id} />
      </Suspense>
    </div>
  )
}
```

**Instructions détaillées:**
1. Créer le fichier `src/app/(dashboard)/enseignant/supports/page.tsx`
2. Vérifier l'authentification et le rôle enseignant
3. Afficher un header avec titre et bouton "Ajouter un support"
4. Utiliser `Link` de Next.js pour la navigation vers `/enseignant/supports/nouveau`
5. Afficher la liste des supports avec `Suspense` pour le chargement asynchrone
6. Ajouter les métadonnées SEO avec `metadata`

---

#### Tâche 2.1.2: Créer le composant SupportList

```typescript
// src/features/enseignant/components/supports/SupportList.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { supportsService } from '@/features/enseignant/services/supports.service'
import { SupportCard } from './SupportCard'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { FileX } from 'lucide-react'

interface SupportListProps {
  userId: string
}

export function SupportList({ userId }: SupportListProps) {
  const { data: supports, isLoading, error } = useQuery({
    queryKey: ['supports', userId],
    queryFn: () => supportsService.getAll(userId),
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erreur lors du chargement des supports
        </AlertDescription>
      </Alert>
    )
  }

  if (!supports || supports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileX className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Aucun support</h3>
        <p className="text-muted-foreground">
          Commencez par ajouter votre premier support de cours
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {supports.map((support) => (
        <SupportCard key={support.id} support={support} />
      ))}
    </div>
  )
}
```

**Instructions détaillées:**
1. Créer le fichier `src/features/enseignant/components/supports/SupportList.tsx`
2. Utiliser `useQuery` pour fetcher les supports de l'enseignant
3. Gérer 3 états:
   - Loading: Afficher des skeletons (grille de 6 cartes en animation pulse)
   - Error: Afficher une alerte d'erreur
   - Empty: Afficher un message "Aucun support" avec icône
4. Afficher les supports dans une grille responsive (1 colonne mobile, 3 colonnes desktop)
5. Utiliser le composant `SupportCard` pour chaque support

---

#### Tâche 2.1.3: Créer le composant SupportCard

```typescript
// src/features/enseignant/components/supports/SupportCard.tsx
'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { FileText, MoreVertical, Download, Trash2, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Support } from '@/features/enseignant/types/supports.types'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supportsService } from '@/features/enseignant/services/supports.service'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/shared/components/common/ConfirmDialog'

interface SupportCardProps {
  support: Support
}

export function SupportCard({ support }: SupportCardProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Mutation pour supprimer un support
  const deleteMutation = useMutation({
    mutationFn: () => supportsService.delete(support.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supports'] })
      toast.success('Support supprimé avec succès')
      setShowDeleteDialog(false)
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    },
  })

  const handleDownload = () => {
    window.open(support.file_url, '_blank')
  }

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold line-clamp-2">
                {support.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {support.matiere?.nom || 'Sans matière'}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Télécharger
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent>
          {support.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {support.description}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{support.file_type}</Badge>
            <span className="text-xs text-muted-foreground">
              {(support.file_size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {format(new Date(support.created_at), 'dd MMM yyyy', { locale: fr })}
          </span>
        </CardFooter>
      </Card>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Supprimer ce support ?"
        description="Cette action est irréversible. Le support sera définitivement supprimé."
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </>
  )
}
```

**Instructions détaillées:**
1. Créer le fichier `src/features/enseignant/components/supports/SupportCard.tsx`
2. Afficher les informations du support:
   - Icône fichier
   - Titre du support
   - Matière associée
   - Description (limiter à 2 lignes avec `line-clamp-2`)
   - Type de fichier (PDF, DOCX, etc.) en Badge
   - Taille du fichier
   - Date de création
3. Ajouter un menu dropdown (3 points verticaux) avec actions:
   - Télécharger
   - Supprimer
4. Utiliser `useMutation` pour la suppression
5. Afficher un dialog de confirmation avant suppression
6. Invalider la query `supports` après suppression pour rafraîchir la liste
7. Afficher des toasts de succès/erreur avec `sonner`

---

### 2.2 Page Upload Support

#### Tâche 2.2.1: Créer la page upload support

```typescript
// src/app/(dashboard)/enseignant/supports/nouveau/page.tsx

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { SupportUploadForm } from '@/features/enseignant/components/supports/SupportUploadForm'

export const metadata = {
  title: 'Ajouter un Support | AI-KO',
  description: 'Ajoutez un nouveau support de cours',
}

export default async function NouveauSupportPage() {
  const session = await getServerSession()

  if (!session || session.user.role !== 'enseignant') {
    redirect('/login')
  }

  return (
    <div className="container max-w-2xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Ajouter un Support de Cours
        </h1>
        <p className="text-muted-foreground">
          Téléchargez un document pédagogique (PDF, DOCX, TXT)
        </p>
      </div>

      <SupportUploadForm userId={session.user.id} />
    </div>
  )
}
```

**Instructions détaillées:**
1. Créer le fichier `src/app/(dashboard)/enseignant/supports/nouveau/page.tsx`
2. Vérifier l'authentification
3. Limiter la largeur du conteneur à `max-w-2xl` pour un formulaire centré
4. Afficher le composant `SupportUploadForm`

---

#### Tâche 2.2.2: Créer le formulaire d'upload

```typescript
// src/features/enseignant/components/supports/SupportUploadForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { supportsService } from '@/features/enseignant/services/supports.service'
import { matieresService } from '@/shared/services/api/matieres.service'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Button } from '@/shared/components/ui/button'
import { Upload, Loader2 } from 'lucide-react'
import { useState } from 'react'

const supportSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().optional(),
  matiere_id: z.string().min(1, 'Veuillez sélectionner une matière'),
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 20 * 1024 * 1024, 'Fichier trop volumineux (max 20MB)')
    .refine(
      (file) => ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(file.type),
      'Format de fichier non supporté (PDF, DOCX, TXT uniquement)'
    ),
})

type SupportFormData = z.infer<typeof supportSchema>

interface SupportUploadFormProps {
  userId: string
}

export function SupportUploadForm({ userId }: SupportUploadFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Fetch matieres
  const { data: matieres } = useQuery({
    queryKey: ['matieres'],
    queryFn: () => matieresService.getAll(),
  })

  const form = useForm<SupportFormData>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      title: '',
      description: '',
      matiere_id: '',
    },
  })

  const uploadMutation = useMutation({
    mutationFn: (data: SupportFormData) => {
      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('description', data.description || '')
      formData.append('matiere_id', data.matiere_id)
      formData.append('file', data.file)
      formData.append('createur_id', userId)

      return supportsService.upload(formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supports'] })
      toast.success('Support ajouté avec succès')
      router.push('/enseignant/supports')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de l\'upload')
    },
  })

  const onSubmit = (data: SupportFormData) => {
    uploadMutation.mutate(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Titre */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre du support</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Cours sur les algorithmes de tri" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optionnel)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Décrivez brièvement le contenu du support..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Matière */}
        <FormField
          control={form.control}
          name="matiere_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Matière</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une matière" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {matieres?.map((matiere) => (
                    <SelectItem key={matiere.id} value={matiere.id}>
                      {matiere.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* File upload */}
        <FormField
          control={form.control}
          name="file"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Fichier</FormLabel>
              <FormControl>
                <div className="flex items-center space-x-4">
                  <Input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        onChange(file)
                        setSelectedFile(file)
                      }
                    }}
                    {...field}
                  />
                  {selectedFile && (
                    <div className="text-sm text-muted-foreground">
                      {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                Formats acceptés: PDF, DOCX, TXT (max 20MB)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Boutons */}
        <div className="flex items-center space-x-4">
          <Button
            type="submit"
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Ajouter le support
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Annuler
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

**Instructions détaillées:**
1. Créer le fichier `src/features/enseignant/components/supports/SupportUploadForm.tsx`
2. Utiliser `react-hook-form` avec validation `zod`
3. Schéma de validation:
   - `title`: minimum 3 caractères, requis
   - `description`: optionnel
   - `matiere_id`: requis
   - `file`: max 20MB, types autorisés (PDF, DOCX, TXT)
4. Charger la liste des matières avec `useQuery`
5. Créer un `FormData` pour l'upload multipart
6. Utiliser `useMutation` pour l'upload
7. Afficher la progression (bouton disabled avec spinner pendant l'upload)
8. Rediriger vers `/enseignant/supports` après succès
9. Afficher les toasts de succès/erreur

---

#### Tâche 2.2.3: Créer le service supports

```typescript
// src/features/enseignant/services/supports.service.ts

import { httpClient } from '@/shared/services/http-client'
import type { Support, CreateSupportDto } from '../types/supports.types'

class SupportsService {
  /**
   * Récupère tous les supports d'un enseignant
   */
  async getAll(userId: string): Promise<Support[]> {
    const response = await httpClient.get<Support[]>(
      `/api/supports?createur_id=${userId}`
    )
    return response.data
  }

  /**
   * Récupère un support par ID
   */
  async getById(id: string): Promise<Support> {
    const response = await httpClient.get<Support>(`/api/supports/${id}`)
    return response.data
  }

  /**
   * Upload un nouveau support
   */
  async upload(formData: FormData): Promise<Support> {
    const response = await httpClient.post<Support>(
      '/api/supports',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  }

  /**
   * Supprime un support
   */
  async delete(id: string): Promise<void> {
    await httpClient.delete(`/api/supports/${id}`)
  }
}

export const supportsService = new SupportsService()
```

**Instructions détaillées:**
1. Créer le fichier `src/features/enseignant/services/supports.service.ts`
2. Implémenter les méthodes CRUD:
   - `getAll()`: GET `/api/supports?createur_id=:userId`
   - `getById()`: GET `/api/supports/:id`
   - `upload()`: POST `/api/supports` avec `multipart/form-data`
   - `delete()`: DELETE `/api/supports/:id`
3. Typer les retours avec les interfaces TypeScript
4. Utiliser le `httpClient` partagé

---

#### Tâche 2.2.4: Créer les types supports

```typescript
// src/features/enseignant/types/supports.types.ts

export interface Support {
  id: string
  title: string
  description?: string
  file_url: string
  file_type: string
  file_size: number
  matiere_id: string
  matiere?: {
    id: string
    nom: string
    code: string
  }
  createur_id: string
  created_at: string
  updated_at: string
}

export interface CreateSupportDto {
  title: string
  description?: string
  matiere_id: string
  file: File
  createur_id: string
}
```

**Instructions détaillées:**
1. Créer le fichier `src/features/enseignant/types/supports.types.ts`
2. Définir l'interface `Support` avec tous les champs renvoyés par l'API
3. Définir l'interface `CreateSupportDto` pour la création
4. Inclure l'objet `matiere` en nested pour éviter des appels supplémentaires

---

## Section 3: Génération de QCM

### 3.1 Page Générer QCM

#### Tâche 3.1.1: Créer la page génération QCM

```typescript
// src/app/(dashboard)/enseignant/qcm/nouveau/page.tsx

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { QCMGenerateForm } from '@/features/enseignant/components/qcm/QCMGenerateForm'

export const metadata = {
  title: 'Générer un QCM | AI-KO',
  description: 'Générez un QCM automatiquement avec l\'IA',
}

export default async function NouveauQCMPage() {
  const session = await getServerSession()

  if (!session || session.user.role !== 'enseignant') {
    redirect('/login')
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Générer un QCM
        </h1>
        <p className="text-muted-foreground">
          Créez automatiquement un QCM à partir d'un support de cours ou de texte
        </p>
      </div>

      <QCMGenerateForm userId={session.user.id} />
    </div>
  )
}
```

**Instructions détaillées:**
1. Créer le fichier `src/app/(dashboard)/enseignant/qcm/nouveau/page.tsx`
2. Vérifier l'authentification
3. Afficher le formulaire de génération `QCMGenerateForm`

---

#### Tâche 3.1.2: Créer le formulaire de génération QCM

**Ce formulaire est TRÈS IMPORTANT car il contient toute la logique de génération.**

```typescript
// src/features/enseignant/components/qcm/QCMGenerateForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { qcmService } from '@/features/enseignant/services/qcm.service'
import { supportsService } from '@/features/enseignant/services/supports.service'
import { matieresService } from '@/shared/services/api/matieres.service'
import { niveauxService } from '@/shared/services/api/niveaux.service'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Button } from '@/shared/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Sparkles, Loader2, FileText } from 'lucide-react'
import { useState } from 'react'

const qcmGenerateSchema = z.object({
  titre: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().optional(),
  matiere_id: z.string().min(1, 'Veuillez sélectionner une matière'),
  niveaux: z.array(z.string()).min(1, 'Veuillez sélectionner au moins un niveau'),
  parcours: z.array(z.string()).optional(),
  duree_minutes: z.number().min(5, 'Durée minimale: 5 minutes').max(180, 'Durée maximale: 180 minutes'),
  nombre_questions: z.number().min(5, 'Minimum 5 questions').max(50, 'Maximum 50 questions'),
  difficulty_level: z.enum(['facile', 'moyen', 'difficile']),

  // Source: support ou texte
  source_type: z.enum(['support', 'texte']),
  support_id: z.string().optional(),
  texte_source: z.string().optional(),
}).refine((data) => {
  if (data.source_type === 'support') {
    return !!data.support_id
  } else {
    return !!data.texte_source && data.texte_source.length >= 100
  }
}, {
  message: 'Veuillez sélectionner un support ou saisir au moins 100 caractères de texte',
  path: ['source_type'],
})

type QCMGenerateFormData = z.infer<typeof qcmGenerateSchema>

interface QCMGenerateFormProps {
  userId: string
}

export function QCMGenerateForm({ userId }: QCMGenerateFormProps) {
  const router = useRouter()
  const [sourceType, setSourceType] = useState<'support' | 'texte'>('support')
  const [generationProgress, setGenerationProgress] = useState(0)

  // Fetch données
  const { data: matieres } = useQuery({
    queryKey: ['matieres'],
    queryFn: () => matieresService.getAll(),
  })

  const { data: niveaux } = useQuery({
    queryKey: ['niveaux'],
    queryFn: () => niveauxService.getAll(),
  })

  const { data: supports } = useQuery({
    queryKey: ['supports', userId],
    queryFn: () => supportsService.getAll(userId),
  })

  const form = useForm<QCMGenerateFormData>({
    resolver: zodResolver(qcmGenerateSchema),
    defaultValues: {
      titre: '',
      description: '',
      matiere_id: '',
      niveaux: [],
      parcours: [],
      duree_minutes: 60,
      nombre_questions: 20,
      difficulty_level: 'moyen',
      source_type: 'support',
    },
  })

  // Mutation de génération avec polling
  const generateMutation = useMutation({
    mutationFn: async (data: QCMGenerateFormData) => {
      // 1. Lancer la génération (tâche asynchrone Celery)
      const taskResponse = await qcmService.generateFromAI({
        ...data,
        createur_id: userId,
      })

      // 2. Polling pour suivre la progression
      const taskId = taskResponse.task_id
      let progress = 0

      while (progress < 100) {
        await new Promise(resolve => setTimeout(resolve, 2000)) // Attendre 2s

        const statusResponse = await qcmService.getGenerationStatus(taskId)
        progress = statusResponse.progress
        setGenerationProgress(progress)

        if (statusResponse.status === 'completed') {
          return statusResponse.result
        }

        if (statusResponse.status === 'failed') {
          throw new Error(statusResponse.error || 'Erreur de génération')
        }
      }

      throw new Error('Timeout de génération')
    },
    onSuccess: (qcm) => {
      toast.success('QCM généré avec succès !')
      router.push(`/enseignant/qcm/${qcm.id}`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la génération')
      setGenerationProgress(0)
    },
  })

  const onSubmit = (data: QCMGenerateFormData) => {
    generateMutation.mutate(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>
              Définissez les paramètres de base du QCM
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Titre */}
            <FormField
              control={form.control}
              name="titre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre du QCM</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: QCM Algorithmique - Tri et Recherche" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez le contenu du QCM..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Matière */}
            <FormField
              control={form.control}
              name="matiere_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matière</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une matière" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {matieres?.map((matiere) => (
                        <SelectItem key={matiere.id} value={matiere.id}>
                          {matiere.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Niveaux (multi-select avec checkboxes) */}
            <FormField
              control={form.control}
              name="niveaux"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Niveaux concernés</FormLabel>
                    <FormDescription>
                      Sélectionnez les niveaux pour lesquels ce QCM est destiné
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {niveaux?.map((niveau) => (
                      <FormField
                        key={niveau.id}
                        control={form.control}
                        name="niveaux"
                        render={({ field }) => (
                          <FormItem
                            key={niveau.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(niveau.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, niveau.id])
                                    : field.onChange(
                                        field.value?.filter((value) => value !== niveau.id)
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {niveau.nom}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Durée */}
            <FormField
              control={form.control}
              name="duree_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Durée (en minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={5}
                      max={180}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Temps alloué aux étudiants pour compléter le QCM
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Paramètres de génération IA */}
        <Card>
          <CardHeader>
            <CardTitle>Génération IA</CardTitle>
            <CardDescription>
              Configurez la génération automatique des questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nombre de questions */}
            <FormField
              control={form.control}
              name="nombre_questions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de questions</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={5}
                      max={50}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    L'IA générera ce nombre de questions (entre 5 et 50)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Difficulté */}
            <FormField
              control={form.control}
              name="difficulty_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Niveau de difficulté</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez la difficulté" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="facile">Facile</SelectItem>
                      <SelectItem value="moyen">Moyen</SelectItem>
                      <SelectItem value="difficile">Difficile</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Source du contenu */}
        <Card>
          <CardHeader>
            <CardTitle>Source du contenu</CardTitle>
            <CardDescription>
              Choisissez la source à partir de laquelle générer les questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={sourceType}
              onValueChange={(value) => {
                setSourceType(value as 'support' | 'texte')
                form.setValue('source_type', value as 'support' | 'texte')
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="support">
                  <FileText className="mr-2 h-4 w-4" />
                  Support de cours
                </TabsTrigger>
                <TabsTrigger value="texte">
                  <FileText className="mr-2 h-4 w-4" />
                  Texte libre
                </TabsTrigger>
              </TabsList>

              <TabsContent value="support" className="space-y-4">
                <FormField
                  control={form.control}
                  name="support_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sélectionner un support</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisissez un support de cours" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {supports?.map((support) => (
                            <SelectItem key={support.id} value={support.id}>
                              {support.title} ({support.matiere?.nom})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Le QCM sera généré à partir de ce document
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="texte" className="space-y-4">
                <FormField
                  control={form.control}
                  name="texte_source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texte source</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Collez le contenu à partir duquel générer les questions (minimum 100 caractères)..."
                          rows={10}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum 100 caractères pour une génération optimale
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Progress bar pendant la génération */}
        {generateMutation.isPending && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-blue-900">
                    Génération en cours...
                  </p>
                  <p className="text-sm text-blue-700">
                    {generationProgress}%
                  </p>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
                <p className="text-xs text-blue-700">
                  L'IA analyse le contenu et génère les questions... Cela peut prendre jusqu'à 60 secondes.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Boutons */}
        <div className="flex items-center space-x-4">
          <Button
            type="submit"
            size="lg"
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Génération en cours ({generationProgress}%)...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Générer le QCM avec l'IA
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={generateMutation.isPending}
          >
            Annuler
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

**Instructions ULTRA-DÉTAILLÉES pour cette tâche:**

1. **Créer le fichier** `src/features/enseignant/components/qcm/QCMGenerateForm.tsx`

2. **Imports nécessaires:**
   - `react-hook-form` pour la gestion du formulaire
   - `zod` pour la validation
   - `@tanstack/react-query` pour les queries et mutations
   - Tous les composants UI de shadcn/ui

3. **Schéma de validation Zod:**
   - Définir tous les champs requis
   - Ajouter une validation personnalisée `.refine()` pour vérifier:
     - Si `source_type = 'support'`, alors `support_id` est requis
     - Si `source_type = 'texte'`, alors `texte_source` doit avoir au moins 100 caractères

4. **Queries pour charger les données:**
   - Charger la liste des **matières** (pour le select)
   - Charger la liste des **niveaux** (pour les checkboxes)
   - Charger la liste des **supports** de l'enseignant (pour le select de supports)

5. **Formulaire en plusieurs sections (Cards):**

   **Section 1: Informations générales**
   - Titre (Input texte)
   - Description (Textarea, optionnel)
   - Matière (Select déroulant)
   - Niveaux (Checkboxes multiples - permet de cocher L1, L2, M1, etc.)
   - Durée en minutes (Input number, min 5, max 180)

   **Section 2: Paramètres de génération IA**
   - Nombre de questions (Input number, min 5, max 50)
   - Niveau de difficulté (Select: facile, moyen, difficile)

   **Section 3: Source du contenu (TABS)**
   - **Onglet "Support de cours":**
     - Select pour choisir parmi les supports uploadés par l'enseignant
     - Afficher le titre et la matière de chaque support
   - **Onglet "Texte libre":**
     - Textarea pour coller du texte (minimum 100 caractères)

6. **Mutation de génération avec POLLING:**

   C'est la partie LA PLUS CRITIQUE du code:

   a. **Étape 1 - Lancer la génération:**
      - Appeler `qcmService.generateFromAI(data)`
      - Le backend Flask retourne immédiatement un `task_id` (tâche Celery)
      - Ne PAS attendre la fin de la génération ici

   b. **Étape 2 - Polling de la progression:**
      - Créer une boucle `while (progress < 100)`
      - Toutes les 2 secondes, appeler `qcmService.getGenerationStatus(taskId)`
      - Le backend retourne:
        ```json
        {
          "status": "pending" | "processing" | "completed" | "failed",
          "progress": 0-100,
          "result": { /* QCM généré */ },
          "error": "message d'erreur"
        }
        ```
      - Mettre à jour `generationProgress` avec la valeur reçue
      - Si `status === 'completed'`, retourner le résultat et sortir de la boucle
      - Si `status === 'failed'`, lancer une erreur

   c. **Étape 3 - Affichage du progress:**
      - Pendant la génération, afficher une `Card` bleue avec:
        - Texte "Génération en cours..."
        - Barre de progression (0-100%)
        - Message informatif "Cela peut prendre jusqu'à 60 secondes"
      - Désactiver le bouton de soumission

7. **Redirection après succès:**
   - Une fois le QCM généré, rediriger vers `/enseignant/qcm/{id}` pour voir le détail
   - Afficher un toast de succès

8. **Gestion des erreurs:**
   - Si erreur réseau → Toast d'erreur
   - Si timeout (> 60s) → Toast d'erreur "La génération a pris trop de temps"
   - Réinitialiser `generationProgress` à 0

9. **Bouton de soumission:**
   - Icône "Sparkles" (étoiles) pour indiquer l'IA
   - Texte "Générer le QCM avec l'IA"
   - Pendant la génération:
     - Spinner animé
     - Texte "Génération en cours (X%)..."
     - Bouton disabled

10. **Bouton Annuler:**
    - Appeler `router.back()` pour revenir à la page précédente
    - Désactivé pendant la génération

---

**Cette tâche 3.1.2 est la plus complexe du parcours enseignant. Prenez le temps de bien implémenter chaque partie.**

---

#### Tâche 3.1.3: Créer le service QCM

```typescript
// src/features/enseignant/services/qcm.service.ts

import { httpClient } from '@/shared/services/http-client'
import type {
  QCM,
  CreateQCMDto,
  GenerateQCMDto,
  GenerationStatusResponse,
  PublishQCMDto,
} from '../types/qcm.types'

class QCMService {
  /**
   * Récupère tous les QCM d'un enseignant
   */
  async getAll(userId: string): Promise<QCM[]> {
    const response = await httpClient.get<QCM[]>(
      `/api/qcm?createur_id=${userId}`
    )
    return response.data
  }

  /**
   * Récupère un QCM par ID
   */
  async getById(id: string): Promise<QCM> {
    const response = await httpClient.get<QCM>(`/api/qcm/${id}`)
    return response.data
  }

  /**
   * Génère un QCM avec l'IA (tâche asynchrone)
   */
  async generateFromAI(data: GenerateQCMDto): Promise<{ task_id: string }> {
    const response = await httpClient.post<{ task_id: string }>(
      '/api/qcm/generate',
      data
    )
    return response.data
  }

  /**
   * Récupère le statut d'une génération en cours
   */
  async getGenerationStatus(taskId: string): Promise<GenerationStatusResponse> {
    const response = await httpClient.get<GenerationStatusResponse>(
      `/api/qcm/generate/${taskId}/status`
    )
    return response.data
  }

  /**
   * Crée un QCM manuellement (sans IA)
   */
  async create(data: CreateQCMDto): Promise<QCM> {
    const response = await httpClient.post<QCM>('/api/qcm', data)
    return response.data
  }

  /**
   * Met à jour un QCM
   */
  async update(id: string, data: Partial<QCM>): Promise<QCM> {
    const response = await httpClient.put<QCM>(`/api/qcm/${id}`, data)
    return response.data
  }

  /**
   * Publie un QCM (change le statut + crée une session)
   */
  async publish(id: string, data: PublishQCMDto): Promise<QCM> {
    const response = await httpClient.post<QCM>(
      `/api/qcm/${id}/publish`,
      data
    )
    return response.data
  }

  /**
   * Supprime un QCM
   */
  async delete(id: string): Promise<void> {
    await httpClient.delete(`/api/qcm/${id}`)
  }

  /**
   * Exporte un QCM en CSV
   */
  async exportCSV(id: string): Promise<Blob> {
    const response = await httpClient.get(`/api/qcm/${id}/export/csv`, {
      responseType: 'blob',
    })
    return response.data
  }
}

export const qcmService = new QCMService()
```

**Instructions détaillées:**
1. Créer le fichier `src/features/enseignant/services/qcm.service.ts`
2. Implémenter toutes les méthodes CRUD + génération IA
3. **Méthodes critiques:**
   - `generateFromAI()`: POST `/api/qcm/generate` → retourne `task_id`
   - `getGenerationStatus()`: GET `/api/qcm/generate/:taskId/status` → polling
   - `publish()`: POST `/api/qcm/:id/publish` → publie le QCM
   - `exportCSV()`: GET `/api/qcm/:id/export/csv` → retourne un Blob
4. Typer tous les retours avec les interfaces TypeScript

---

#### Tâche 3.1.4: Créer les types QCM

```typescript
// src/features/enseignant/types/qcm.types.ts

export interface QCM {
  id: string
  titre: string
  description?: string
  duree: number // en minutes
  matiere_id: string
  matiere?: {
    id: string
    nom: string
    code: string
  }
  status: 'draft' | 'published' | 'archived'
  difficulty_level: 'facile' | 'moyen' | 'difficile'
  est_public: boolean
  createur_id: string
  questions: Question[]
  niveaux: Niveau[]
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  enonce: string
  type_question: 'qcm' | 'vrai_faux' | 'texte_libre'
  options: string[] // JSON parsé
  reponse_correcte: string
  points: number
  explication?: string
  qcm_id: string
}

export interface Niveau {
  id: string
  code: string
  nom: string
}

export interface CreateQCMDto {
  titre: string
  description?: string
  duree_minutes: number
  matiere_id: string
  niveaux: string[] // IDs des niveaux
  difficulty_level: 'facile' | 'moyen' | 'difficile'
  createur_id: string
  questions?: Partial<Question>[]
}

export interface GenerateQCMDto extends CreateQCMDto {
  nombre_questions: number
  source_type: 'support' | 'texte'
  support_id?: string
  texte_source?: string
}

export interface GenerationStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number // 0-100
  result?: QCM
  error?: string
}

export interface PublishQCMDto {
  date_debut: string // ISO date
  date_fin: string // ISO date
  classe_id?: string
  tentatives_max: number
  melange_questions: boolean
  melange_options: boolean
  afficher_correction: boolean
  note_passage: number // sur 20
}
```

**Instructions détaillées:**
1. Créer le fichier `src/features/enseignant/types/qcm.types.ts`
2. Définir toutes les interfaces nécessaires
3. **Interface `QCM`:**
   - Tous les champs du modèle backend
   - Inclure `questions[]` et `niveaux[]` en nested
4. **Interface `Question`:**
   - `options` est un tableau de strings (JSON parsé côté frontend)
5. **Interface `GenerateQCMDto`:**
   - Étend `CreateQCMDto`
   - Ajoute les champs spécifiques à la génération IA
6. **Interface `GenerationStatusResponse`:**
   - Pour le polling de la tâche Celery
   - `status` peut être: pending, processing, completed, failed
   - `progress` de 0 à 100
7. **Interface `PublishQCMDto`:**
   - Pour la publication d'un QCM (création de session)

---

**PAUSE - FIN DE SECTION 3.1**

**Ce qui a été fait:**
- ✅ Page génération QCM
- ✅ Formulaire complet avec validation Zod
- ✅ Sélection source (support ou texte libre)
- ✅ Multi-select niveaux
- ✅ Génération IA avec polling en temps réel
- ✅ Barre de progression
- ✅ Service QCM complet
- ✅ Types TypeScript

**Ce qui reste pour le parcours enseignant:**
- Section 3.2: Page détail QCM
- Section 3.3: Édition QCM
- Section 3.4: Publication QCM (formulaire de publication)
- Section 3.5: Export CSV
- Section 4: Corrections
- Section 5: Résultats et notes
- Section 6: Génération PDF notes

**Continuer?**

---

# 🎯 ORDRE D'EXÉCUTION RECOMMANDÉ

Pour développer ce projet frontend de manière efficace, voici l'ordre exact des tâches à suivre:

## Phase 1: Setup et Infrastructure (1-2 jours)

1. **Setup projet et dépendances**
   - Installer toutes les dépendances npm (React Query, Zod, etc.)
   - Configurer shadcn/ui
   - Setup Next.js App Router

2. **Services partagés**
   - Créer `httpClient` (src/shared/services/http-client.ts)
   - Créer les services API de base (matieres.service.ts, niveaux.service.ts)
   - Créer les types communs (src/shared/types/)

3. **Composants UI de base**
   - Créer LoadingSpinner
   - Créer ErrorBoundary
   - Créer ConfirmDialog
   - Créer DataTable

## Phase 2: Parcours Enseignant - Dashboard (2 jours)

4. **Dashboard enseignant**
   - Tâche 1.1.1: Page dashboard
   - Tâche 1.1.2: Composant StatsCards
   - Tâche 1.1.3: Service enseignant
   - Tâche 1.1.4: Types enseignant

## Phase 3: Supports de Cours (2-3 jours)

5. **Gestion supports**
   - Tâche 2.1.1: Page liste supports
   - Tâche 2.1.2: Composant SupportList
   - Tâche 2.1.3: Composant SupportCard
   - Tâche 2.2.1: Page upload support
   - Tâche 2.2.2: Formulaire upload
   - Tâche 2.2.3: Service supports
   - Tâche 2.2.4: Types supports

## Phase 4: Génération QCM (4-5 jours) ⚠️ CRITIQUE

6. **Génération IA**
   - Tâche 3.1.1: Page génération QCM
   - Tâche 3.1.2: Formulaire génération (**TRÈS IMPORTANT**)
   - Tâche 3.1.3: Service QCM
   - Tâche 3.1.4: Types QCM

## Phase 5: Gestion QCM (3-4 jours)

7. **Liste et détail QCM**
   - Page liste QCM
   - Composant QCMList
   - Composant QCMCard
   - Page détail QCM
   - Composant QuestionsList

8. **Édition QCM**
   - Page édition QCM
   - Composant QCMEditForm
   - Composant QuestionEditor (drag & drop pour réorganiser)

## Phase 6: Publication QCM (2 jours)

9. **Publication**
   - Page publication QCM
   - Formulaire PublishQCMForm (paramètres de session)
   - Export CSV

## Phase 7: Corrections (3 jours)

10. **Système de correction**
    - Page corrections
    - Liste des copies à corriger
    - Éditeur de feedback
    - Validation/soumission corrections

## Phase 8: Résultats et Notes (3 jours)

11. **Gestion résultats**
    - Page résultats
    - Table des résultats étudiants
    - Filtres et tri
    - Génération PDF notes (jsPDF)

## Phase 9: Parcours Étudiant (5-6 jours)

12. **Dashboard étudiant**
    - Page dashboard
    - Stats et activité

13. **Passage examen**
    - Page liste examens disponibles
    - Page passage examen (**CRITIQUE: système de verrouillage**)
    - Composant ExamPlayer
    - Composant ExamTimer (compte à rebours)
    - Composant ExamLockScreen (blocage navigation)

14. **Résultats étudiant**
    - Page résultat examen
    - Affichage feedback
    - Historique notes

## Phase 10: Tests et Optimisations (3-4 jours)

15. **Tests**
    - Tests unitaires composants critiques
    - Tests d'intégration (React Testing Library)
    - Tests E2E (Playwright) - parcours complets

16. **Optimisations**
    - Performance (React Query cache)
    - Bundle size
    - Accessibilité (a11y)

---

## Total Estimé: **30-35 jours de développement**

---

**FIN DU PLAN - SECTION ENSEIGNANT (PARTIE 1)**

---

# 🟩 PARCOURS ÉTUDIANT

## Section 1: Dashboard Étudiant

### 1.1 Page Dashboard Étudiant

#### Tâche 1.1.1: Créer la page Dashboard Étudiant

```typescript
// src/app/(dashboard)/etudiant/page.tsx

import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/core/config/auth.config'
import { StatsCards } from '@/features/etudiant/components/dashboard/StatsCards'
import { UpcomingExams } from '@/features/etudiant/components/dashboard/UpcomingExams'
import { RecentResults } from '@/features/etudiant/components/dashboard/RecentResults'
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner'

export const metadata = {
  title: 'Dashboard Étudiant | AI-KO',
  description: 'Tableau de bord étudiant',
}

export default async function EtudiantDashboardPage() {
  // Vérifier l'authentification et le rôle
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'etudiant') {
    redirect('/unauthorized')
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bonjour, {session.user.name}
          </h1>
          <p className="text-muted-foreground">
            Bienvenue sur votre espace étudiant
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<LoadingSpinner />}>
        <StatsCards userId={session.user.id} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Examens à venir */}
        <Suspense fallback={<LoadingSpinner />}>
          <UpcomingExams userId={session.user.id} />
        </Suspense>

        {/* Résultats récents */}
        <Suspense fallback={<LoadingSpinner />}>
          <RecentResults userId={session.user.id} />
        </Suspense>
      </div>
    </div>
  )
}
```

**Instructions détaillées:**
1. Créer le fichier `src/app/(dashboard)/etudiant/page.tsx`
2. Vérifier que l'utilisateur est authentifié et a le rôle `etudiant`
3. Afficher 3 sections:
   - Stats Cards (examens passés, moyenne, taux de réussite)
   - Examens à venir (liste des examens disponibles)
   - Résultats récents (derniers examens corrigés)
4. Utiliser `Suspense` pour le chargement asynchrone

---

#### Tâche 1.1.2: Créer le composant StatsCards Étudiant

```typescript
// src/features/etudiant/components/dashboard/StatsCards.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { etudiantService } from '@/features/etudiant/services/etudiant.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { FileText, TrendingUp, Award, Clock } from 'lucide-react'

interface StatsCardsProps {
  userId: string
}

export function StatsCards({ userId }: StatsCardsProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['etudiant-stats', userId],
    queryFn: () => etudiantService.getStats(userId),
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-20 bg-muted" />
            <CardContent className="h-16 bg-muted" />
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Examens passés',
      value: stats?.examens_passes || 0,
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      title: 'Moyenne générale',
      value: `${stats?.moyenne_generale?.toFixed(2) || 0}/20`,
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      title: 'Taux de réussite',
      value: `${stats?.taux_reussite || 0}%`,
      icon: Award,
      color: 'text-purple-600',
    },
    {
      title: 'Examens en attente',
      value: stats?.examens_en_attente || 0,
      icon: Clock,
      color: 'text-orange-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
```

**Instructions détaillées:**
1. Créer le fichier `src/features/etudiant/components/dashboard/StatsCards.tsx`
2. Utiliser `useQuery` pour récupérer les stats de l'étudiant
3. Afficher 4 cartes:
   - Examens passés
   - Moyenne générale (sur 20)
   - Taux de réussite (%)
   - Examens en attente (non passés)
4. Skeleton pendant le chargement

---

#### Tâche 1.1.3: Créer le service étudiant

```typescript
// src/features/etudiant/services/etudiant.service.ts

import { httpClient } from '@/shared/services/http-client'
import type { EtudiantStats } from '../types/etudiant.types'

class EtudiantService {
  /**
   * Récupère les statistiques de l'étudiant
   */
  async getStats(userId: string): Promise<EtudiantStats> {
    const response = await httpClient.get<EtudiantStats>(
      `/api/etudiants/${userId}/stats`
    )
    return response.data
  }

  /**
   * Récupère les examens à venir
   */
  async getUpcomingExams(userId: string) {
    const response = await httpClient.get(
      `/api/etudiants/${userId}/examens/upcoming`
    )
    return response.data
  }

  /**
   * Récupère les résultats récents
   */
  async getRecentResults(userId: string) {
    const response = await httpClient.get(
      `/api/etudiants/${userId}/resultats/recent`
    )
    return response.data
  }
}

export const etudiantService = new EtudiantService()
```

**Instructions détaillées:**
1. Créer le fichier `src/features/etudiant/services/etudiant.service.ts`
2. Implémenter les méthodes pour récupérer:
   - Les statistiques de l'étudiant
   - Les examens à venir
   - Les résultats récents
3. Utiliser le `httpClient` partagé

---

#### Tâche 1.1.4: Créer les types étudiant

```typescript
// src/features/etudiant/types/etudiant.types.ts

export interface EtudiantStats {
  examens_passes: number
  examens_en_attente: number
  moyenne_generale: number
  taux_reussite: number // pourcentage
  meilleure_note: number
  moins_bonne_note: number
}

export interface UpcomingExam {
  id: string
  titre: string
  matiere: string
  date_debut: string
  date_fin: string
  duree_minutes: number
  niveau: string
  est_commence: boolean
}
```

**Instructions détaillées:**
1. Créer le fichier `src/features/etudiant/types/etudiant.types.ts`
2. Définir toutes les interfaces pour le parcours étudiant
3. S'assurer que les types correspondent au backend Flask

---

#### Tâche 1.1.5: Test unitaire - StatsCards

```typescript
// src/features/etudiant/components/dashboard/__tests__/StatsCards.test.tsx

import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatsCards } from '../StatsCards'
import { etudiantService } from '@/features/etudiant/services/etudiant.service'

jest.mock('@/features/etudiant/services/etudiant.service')

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('StatsCards', () => {
  it('affiche les statistiques correctement', async () => {
    const mockStats = {
      examens_passes: 10,
      moyenne_generale: 15.5,
      taux_reussite: 80,
      examens_en_attente: 3,
    }

    jest.spyOn(etudiantService, 'getStats').mockResolvedValue(mockStats)

    render(<StatsCards userId="user-123" />, { wrapper: createWrapper() })

    // Vérifier que les stats sont affichées
    expect(await screen.findByText('10')).toBeInTheDocument()
    expect(await screen.findByText('15.50/20')).toBeInTheDocument()
    expect(await screen.findByText('80%')).toBeInTheDocument()
    expect(await screen.findByText('3')).toBeInTheDocument()
  })

  it('affiche un skeleton pendant le chargement', () => {
    jest.spyOn(etudiantService, 'getStats').mockImplementation(
      () => new Promise(() => {}) // Ne se résout jamais
    )

    render(<StatsCards userId="user-123" />, { wrapper: createWrapper() })

    // Vérifier que 4 skeletons sont affichés
    const skeletons = screen.getAllByRole('generic', { hidden: true })
    expect(skeletons.length).toBeGreaterThanOrEqual(4)
  })
})
```

**Instructions détaillées:**
1. Créer le fichier `src/features/etudiant/components/dashboard/__tests__/StatsCards.test.tsx`
2. Utiliser `@testing-library/react` pour les tests
3. Mocker le service `etudiantService`
4. Tester:
   - Affichage correct des stats
   - État de chargement (skeleton)
5. Créer un wrapper React Query pour les tests

---

## Section 2: Passage d'Examen (CRITIQUE ⚠️)

### 2.1 Page Liste des Examens Disponibles

#### Tâche 2.1.1: Créer la page liste examens

```typescript
// src/app/(dashboard)/etudiant/examens/page.tsx

import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { ExamensList } from '@/features/etudiant/components/examens/ExamensList'
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner'

export const metadata = {
  title: 'Mes Examens | AI-KO',
  description: 'Liste des examens disponibles',
}

export default async function ExamensPage() {
  const session = await getServerSession()

  if (!session || session.user.role !== 'etudiant') {
    redirect('/login')
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Mes Examens
        </h1>
        <p className="text-muted-foreground">
          Consultez et passez vos examens
        </p>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <ExamensList userId={session.user.id} />
      </Suspense>
    </div>
  )
}
```

**Instructions détaillées:**
1. Créer le fichier `src/app/(dashboard)/etudiant/examens/page.tsx`
2. Vérifier l'authentification
3. Afficher la liste des examens disponibles

---

#### Tâche 2.1.2: Créer le composant ExamensList

```typescript
// src/features/etudiant/components/examens/ExamensList.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { examensService } from '@/features/etudiant/services/examens.service'
import { ExamenCard } from './ExamenCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { FileX } from 'lucide-react'

interface ExamensListProps {
  userId: string
}

export function ExamensList({ userId }: ExamensListProps) {
  const { data: examens, isLoading, error } = useQuery({
    queryKey: ['examens', userId],
    queryFn: () => examensService.getAll(userId),
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erreur lors du chargement des examens
        </AlertDescription>
      </Alert>
    )
  }

  // Séparer les examens par statut
  const examensDisponibles = examens?.filter(e => e.statut === 'disponible') || []
  const examensEnCours = examens?.filter(e => e.statut === 'en_cours') || []
  const examensTermines = examens?.filter(e => e.statut === 'termine') || []

  return (
    <Tabs defaultValue="disponibles">
      <TabsList>
        <TabsTrigger value="disponibles">
          Disponibles ({examensDisponibles.length})
        </TabsTrigger>
        <TabsTrigger value="en_cours">
          En cours ({examensEnCours.length})
        </TabsTrigger>
        <TabsTrigger value="termines">
          Terminés ({examensTermines.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="disponibles" className="space-y-4">
        {examensDisponibles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileX className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Aucun examen disponible</h3>
            <p className="text-muted-foreground">
              Aucun examen n'est actuellement disponible
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {examensDisponibles.map((examen) => (
              <ExamenCard key={examen.id} examen={examen} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="en_cours" className="space-y-4">
        {examensEnCours.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileX className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Aucun examen en cours</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {examensEnCours.map((examen) => (
              <ExamenCard key={examen.id} examen={examen} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="termines" className="space-y-4">
        {examensTermines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileX className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Aucun examen terminé</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {examensTermines.map((examen) => (
              <ExamenCard key={examen.id} examen={examen} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
```

**Instructions détaillées:**
1. Créer le fichier `src/features/etudiant/components/examens/ExamensList.tsx`
2. Utiliser les `Tabs` de shadcn/ui pour séparer:
   - Examens disponibles (pas encore commencés)
   - Examens en cours (déjà commencé mais pas terminé)
   - Examens terminés (complétés)
3. Afficher un message si aucun examen dans une catégorie
4. Grille responsive (2 colonnes sur desktop)

---

#### Tâche 2.1.3: Créer le composant ExamenCard

```typescript
// src/features/etudiant/components/examens/ExamenCard.tsx
'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Calendar, Clock, FileText, Play, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import type { Examen } from '@/features/etudiant/types/examens.types'

interface ExamenCardProps {
  examen: Examen
}

export function ExamenCard({ examen }: ExamenCardProps) {
  const router = useRouter()

  const handleStartExam = () => {
    // Confirmation avant de commencer
    if (window.confirm('Êtes-vous prêt à commencer cet examen ? Le chronomètre démarrera immédiatement.')) {
      router.push(`/etudiant/examens/${examen.id}`)
    }
  }

  const handleViewResult = () => {
    router.push(`/etudiant/examens/${examen.id}/resultat`)
  }

  const getStatusBadge = () => {
    switch (examen.statut) {
      case 'disponible':
        return <Badge variant="default">Disponible</Badge>
      case 'en_cours':
        return <Badge variant="secondary">En cours</Badge>
      case 'termine':
        return <Badge variant="outline">Terminé</Badge>
      default:
        return null
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg line-clamp-2">
              {examen.titre}
            </h3>
            <p className="text-sm text-muted-foreground">
              {examen.matiere}
            </p>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {examen.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {examen.description}
          </p>
        )}

        <div className="flex flex-col space-y-1 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            <span>
              Du {format(new Date(examen.date_debut), 'dd MMM yyyy HH:mm', { locale: fr })}
            </span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Clock className="mr-2 h-4 w-4" />
            <span>Durée: {examen.duree_minutes} minutes</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <FileText className="mr-2 h-4 w-4" />
            <span>{examen.nombre_questions} questions</span>
          </div>
        </div>

        {examen.tentatives_restantes !== undefined && (
          <div className="text-sm text-muted-foreground">
            Tentatives restantes: {examen.tentatives_restantes}
          </div>
        )}
      </CardContent>

      <CardFooter>
        {examen.statut === 'disponible' && (
          <Button
            className="w-full"
            onClick={handleStartExam}
            disabled={examen.tentatives_restantes === 0}
          >
            <Play className="mr-2 h-4 w-4" />
            Commencer l'examen
          </Button>
        )}
        {examen.statut === 'en_cours' && (
          <Button
            className="w-full"
            variant="secondary"
            onClick={handleStartExam}
          >
            <Play className="mr-2 h-4 w-4" />
            Reprendre l'examen
          </Button>
        )}
        {examen.statut === 'termine' && (
          <Button
            className="w-full"
            variant="outline"
            onClick={handleViewResult}
          >
            <Eye className="mr-2 h-4 w-4" />
            Voir le résultat
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
```

**Instructions détaillées:**
1. Créer le fichier `src/features/etudiant/components/examens/ExamenCard.tsx`
2. Afficher les informations de l'examen:
   - Titre et matière
   - Badge de statut (Disponible, En cours, Terminé)
   - Date de début
   - Durée
   - Nombre de questions
   - Tentatives restantes
3. Bouton d'action selon le statut:
   - Disponible → "Commencer l'examen" (avec confirmation)
   - En cours → "Reprendre l'examen"
   - Terminé → "Voir le résultat"
4. Utiliser `useRouter` pour la navigation

---

### 2.2 Page Passage d'Examen (TRÈS CRITIQUE ⚠️⚠️⚠️)

#### Tâche 2.2.1: Créer la page passage examen

```typescript
// src/app/(dashboard)/etudiant/examens/[id]/page.tsx

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { ExamPlayer } from '@/features/etudiant/components/examens/ExamPlayer'

export const metadata = {
  title: 'Passage Examen | AI-KO',
  description: 'Passage de l\'examen',
}

interface ExamPageProps {
  params: {
    id: string
  }
}

export default async function ExamPage({ params }: ExamPageProps) {
  const session = await getServerSession()

  if (!session || session.user.role !== 'etudiant') {
    redirect('/login')
  }

  return (
    <ExamPlayer
      examId={params.id}
      userId={session.user.id}
    />
  )
}
```

**Instructions détaillées:**
1. Créer le fichier `src/app/(dashboard)/etudiant/examens/[id]/page.tsx`
2. Utiliser les dynamic routes de Next.js (`[id]`)
3. Passer l'ID de l'examen au composant `ExamPlayer`
4. IMPORTANT: Pas de layout avec sidebar ici (mode plein écran)

---

#### Tâche 2.2.2: Créer le composant ExamPlayer (COMPLEXE)

**Ce composant est LE PLUS CRITIQUE du parcours étudiant.**

```typescript
// src/features/etudiant/components/examens/ExamPlayer.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { examensService } from '@/features/etudiant/services/examens.service'
import { QuestionDisplay } from './QuestionDisplay'
import { ExamTimer } from './ExamTimer'
import { ExamLockScreen } from './ExamLockScreen'
import { Button } from '@/shared/components/ui/button'
import { Progress } from '@/shared/components/ui/progress'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { ChevronLeft, ChevronRight, Send, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'

interface ExamPlayerProps {
  examId: string
  userId: string
}

export function ExamPlayer({ examId, userId }: ExamPlayerProps) {
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [reponses, setReponses] = useState<Record<string, any>>({})
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isExamStarted, setIsExamStarted] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showLeaveWarning, setShowLeaveWarning] = useState(false)

  // Charger l'examen
  const { data: examen, isLoading } = useQuery({
    queryKey: ['examen', examId],
    queryFn: () => examensService.getById(examId),
  })

  // Démarrer l'examen
  const startMutation = useMutation({
    mutationFn: () => examensService.startExam(examId, userId),
    onSuccess: (data) => {
      setIsExamStarted(true)
      setTimeRemaining(data.duree_restante_secondes)
      toast.success('Examen démarré. Bonne chance !')
    },
    onError: () => {
      toast.error('Erreur lors du démarrage de l\'examen')
      router.push('/etudiant/examens')
    },
  })

  // Soumettre l'examen
  const submitMutation = useMutation({
    mutationFn: () => examensService.submitExam(examId, userId, reponses),
    onSuccess: () => {
      toast.success('Examen soumis avec succès !')
      router.push(`/etudiant/examens/${examId}/resultat`)
    },
    onError: () => {
      toast.error('Erreur lors de la soumission')
    },
  })

  // Démarrer l'examen au chargement
  useEffect(() => {
    if (examen && !isExamStarted) {
      startMutation.mutate()
    }
  }, [examen])

  // Timer countdown
  useEffect(() => {
    if (!isExamStarted || timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Temps écoulé → soumission auto
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isExamStarted, timeRemaining])

  // Bloquer la navigation (Back button, refresh, etc.)
  useEffect(() => {
    if (!isExamStarted) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
      return ''
    }

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault()
      setShowLeaveWarning(true)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isExamStarted])

  // Désactiver le clic droit
  useEffect(() => {
    if (!isExamStarted) return

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      toast.error('Le clic droit est désactivé pendant l\'examen')
    }

    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [isExamStarted])

  // Détecter la perte de focus (changement d'onglet)
  useEffect(() => {
    if (!isExamStarted) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        toast.warning('⚠️ Attention: Vous avez quitté l\'onglet. Cela peut être signalé.')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isExamStarted])

  const handleAutoSubmit = useCallback(() => {
    toast.info('Temps écoulé ! Soumission automatique...')
    submitMutation.mutate()
  }, [submitMutation])

  const handleAnswerChange = (questionId: string, answer: any) => {
    setReponses((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const handleSubmit = () => {
    setShowSubmitDialog(true)
  }

  const confirmSubmit = () => {
    setShowSubmitDialog(false)
    submitMutation.mutate()
  }

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < (examen?.questions.length || 0)) {
      setCurrentQuestionIndex(index)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement de l'examen...</p>
        </div>
      </div>
    )
  }

  if (!examen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertDescription>Examen introuvable</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Écran de verrouillage avant démarrage
  if (!isExamStarted) {
    return <ExamLockScreen examen={examen} onStart={() => startMutation.mutate()} />
  }

  const currentQuestion = examen.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / examen.questions.length) * 100
  const answeredCount = Object.keys(reponses).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header fixe */}
      <div className="sticky top-0 z-50 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Info examen */}
            <div>
              <h1 className="text-xl font-bold">{examen.titre}</h1>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} sur {examen.questions.length}
              </p>
            </div>

            {/* Timer */}
            <ExamTimer timeRemaining={timeRemaining} />
          </div>

          {/* Progress bar */}
          <Progress value={progress} className="mt-4" />
        </div>
      </div>

      {/* Warning si pas toutes les questions répondues */}
      {answeredCount < examen.questions.length && (
        <div className="container mx-auto px-4 mt-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {answeredCount} question(s) répondue(s) sur {examen.questions.length}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Question actuelle */}
      <div className="container mx-auto px-4 py-8">
        <QuestionDisplay
          question={currentQuestion}
          answer={reponses[currentQuestion.id]}
          onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
          questionNumber={currentQuestionIndex + 1}
        />
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => goToQuestion(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Précédent
            </Button>

            <div className="flex items-center space-x-2">
              {examen.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToQuestion(index)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    index === currentQuestionIndex
                      ? 'bg-primary text-primary-foreground'
                      : reponses[examen.questions[index].id]
                      ? 'bg-green-100 text-green-800'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {currentQuestionIndex === examen.questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
              >
                <Send className="mr-2 h-4 w-4" />
                Soumettre l'examen
              </Button>
            ) : (
              <Button
                onClick={() => goToQuestion(currentQuestionIndex + 1)}
                disabled={currentQuestionIndex === examen.questions.length - 1}
              >
                Suivant
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Dialog de confirmation soumission */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Soumettre l'examen ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez répondu à {answeredCount} question(s) sur {examen.questions.length}.
              {answeredCount < examen.questions.length && (
                <span className="block mt-2 text-orange-600 font-medium">
                  ⚠️ Attention: {examen.questions.length - answeredCount} question(s) non répondue(s).
                </span>
              )}
              <span className="block mt-2">
                Une fois soumis, vous ne pourrez plus modifier vos réponses.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit}>
              Confirmer la soumission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Warning si tentative de quitter */}
      <AlertDialog open={showLeaveWarning} onOpenChange={setShowLeaveWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quitter l'examen ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'examen est en cours. Si vous quittez maintenant, votre progression sera perdue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Rester sur l'examen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowLeaveWarning(false)
                router.push('/etudiant/examens')
              }}
              className="bg-destructive"
            >
              Quitter quand même
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
```

**Instructions ULTRA-DÉTAILLÉES pour cette tâche CRITIQUE:**

1. **Créer le fichier** `src/features/etudiant/components/examens/ExamPlayer.tsx`

2. **États React nécessaires:**
   - `currentQuestionIndex`: Index de la question actuelle (0-based)
   - `reponses`: Object avec `questionId → reponse`
   - `timeRemaining`: Temps restant en secondes
   - `isExamStarted`: Boolean pour savoir si l'examen a démarré
   - `showSubmitDialog`: Boolean pour le dialog de confirmation
   - `showLeaveWarning`: Boolean pour warning si tentative de quitter

3. **Chargement de l'examen:**
   - Utiliser `useQuery` pour charger l'examen
   - Au chargement, appeler `startMutation` pour démarrer l'examen
   - Le backend retourne la durée restante (en cas de reprise)

4. **Timer (compte à rebours):**
   - `useEffect` avec `setInterval` pour décrémenter `timeRemaining`
   - Toutes les 1000ms (1 seconde), décrémenter de 1
   - Si `timeRemaining === 0`, appeler `handleAutoSubmit()`
   - **IMPORTANT:** Nettoyer l'intervalle avec `clearInterval` dans le cleanup

5. **Blocage de navigation (TRÈS IMPORTANT):**

   a. **Bloquer le bouton "Retour" du navigateur:**
      - Écouter l'événement `popstate`
      - Afficher un dialog de warning
      - Ne PAS permettre de quitter sans confirmation

   b. **Bloquer le refresh (F5) et fermeture d'onglet:**
      - Écouter `beforeunload`
      - Afficher une confirmation native du navigateur

   c. **Désactiver le clic droit:**
      - Écouter `contextmenu` et faire `e.preventDefault()`
      - Afficher un toast "Le clic droit est désactivé"

   d. **Détecter la perte de focus (changement d'onglet):**
      - Écouter `visibilitychange`
      - Si `document.hidden === true`, afficher un warning toast
      - (Optionnel: enregistrer dans le backend pour détection de triche)

6. **Interface utilisateur:**

   a. **Header fixe (sticky):**
      - Titre de l'examen
      - "Question X sur Y"
      - Composant `ExamTimer` (affichage du temps restant)
      - Barre de progression

   b. **Alert si questions non répondues:**
      - Afficher "X question(s) répondue(s) sur Y"

   c. **Zone de question:**
      - Composant `QuestionDisplay` pour afficher la question actuelle
      - Passer la réponse et le callback `onAnswerChange`

   d. **Navigation fixe (bottom bar):**
      - Bouton "Précédent" (disabled si première question)
      - Mini-navigation: cercles cliquables pour chaque question
        - Cercle gris: pas répondu
        - Cercle vert: répondu
        - Cercle bleu: question actuelle
      - Bouton "Suivant" (ou "Soumettre" si dernière question)

7. **Soumission de l'examen:**
   - Bouton "Soumettre" sur la dernière question
   - Afficher un `AlertDialog` de confirmation avec:
     - Nombre de questions répondues
     - Warning si questions non répondues
     - Confirmation "Vous ne pourrez plus modifier"
   - Appeler `submitMutation` après confirmation
   - Rediriger vers `/etudiant/examens/:id/resultat`

8. **Soumission automatique:**
   - Si `timeRemaining === 0`, appeler `handleAutoSubmit()`
   - Afficher un toast "Temps écoulé ! Soumission automatique..."
   - Soumettre même si pas toutes les questions répondues

9. **Gestion des réponses:**
   - Callback `handleAnswerChange(questionId, answer)`
   - Stocker dans l'état `reponses`
   - Format: `{ "question-id-1": "B", "question-id-2": "Texte libre...", ... }`

10. **Nettoyage (cleanup):**
    - Dans les `useEffect`, TOUJOURS retourner une fonction de cleanup
    - Supprimer tous les event listeners
    - Nettoyer les intervals

---

**PAUSE - Cette tâche est LA PLUS COMPLEXE. Prenez le temps de bien l'implémenter.**

---

#### Tâche 2.2.3: Créer le composant QuestionDisplay

```typescript
// src/features/etudiant/components/examens/QuestionDisplay.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Label } from '@/shared/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'
import { Textarea } from '@/shared/components/ui/textarea'
import type { Question } from '@/features/etudiant/types/examens.types'

interface QuestionDisplayProps {
  question: Question
  answer: any
  onAnswerChange: (answer: any) => void
  questionNumber: number
}

export function QuestionDisplay({
  question,
  answer,
  onAnswerChange,
  questionNumber,
}: QuestionDisplayProps) {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">
          Question {questionNumber}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Énoncé */}
        <div className="prose prose-slate max-w-none">
          <p className="text-lg font-medium">{question.enonce}</p>
        </div>

        {/* Type de question: QCM */}
        {question.type_question === 'qcm' && (
          <RadioGroup value={answer || ''} onValueChange={onAnswerChange}>
            <div className="space-y-3">
              {question.options.map((option, index) => {
                const optionKey = String.fromCharCode(65 + index) // A, B, C, D...
                return (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <RadioGroupItem value={optionKey} id={`option-${index}`} />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer"
                    >
                      <span className="font-medium mr-2">{optionKey}.</span>
                      {option}
                    </Label>
                  </div>
                )
              })}
            </div>
          </RadioGroup>
        )}

        {/* Type de question: Vrai/Faux */}
        {question.type_question === 'vrai_faux' && (
          <RadioGroup value={answer || ''} onValueChange={onAnswerChange}>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="vrai" id="vrai" />
                <Label htmlFor="vrai" className="flex-1 cursor-pointer font-medium">
                  ✅ Vrai
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="faux" id="faux" />
                <Label htmlFor="faux" className="flex-1 cursor-pointer font-medium">
                  ❌ Faux
                </Label>
              </div>
            </div>
          </RadioGroup>
        )}

        {/* Type de question: Texte libre */}
        {question.type_question === 'texte_libre' && (
          <div>
            <Label htmlFor="answer">Votre réponse:</Label>
            <Textarea
              id="answer"
              value={answer || ''}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="Saisissez votre réponse ici..."
              rows={8}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-2">
              {answer?.length || 0} caractères
            </p>
          </div>
        )}

        {/* Points de la question */}
        <div className="text-sm text-muted-foreground border-t pt-4">
          {question.points} point{question.points > 1 ? 's' : ''}
        </div>
      </CardContent>
    </Card>
  )
}
```

**Instructions détaillées:**
1. Créer le fichier `src/features/etudiant/components/examens/QuestionDisplay.tsx`
2. Gérer 3 types de questions:
   - **QCM**: RadioGroup avec options (A, B, C, D...)
   - **Vrai/Faux**: RadioGroup avec 2 options
   - **Texte libre**: Textarea
3. Afficher l'énoncé de la question
4. Appeler `onAnswerChange` quand l'étudiant répond
5. Afficher le nombre de points
6. Utiliser les composants shadcn/ui (RadioGroup, Textarea, Label)

---

#### Tâche 2.2.4: Créer le composant ExamTimer

```typescript
// src/features/etudiant/components/examens/ExamTimer.tsx
'use client'

import { Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

interface ExamTimerProps {
  timeRemaining: number // en secondes
}

export function ExamTimer({ timeRemaining }: ExamTimerProps) {
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60

  const isUrgent = timeRemaining < 300 // Moins de 5 minutes
  const isCritical = timeRemaining < 60 // Moins de 1 minute

  const formatTime = (num: number) => String(num).padStart(2, '0')

  return (
    <div
      className={cn(
        'flex items-center space-x-2 px-4 py-2 rounded-lg font-mono text-lg font-bold',
        isCritical
          ? 'bg-red-100 text-red-700 animate-pulse'
          : isUrgent
          ? 'bg-orange-100 text-orange-700'
          : 'bg-blue-100 text-blue-700'
      )}
    >
      {isCritical && <AlertTriangle className="h-5 w-5 animate-bounce" />}
      <Clock className="h-5 w-5" />
      <span>
        {formatTime(minutes)}:{formatTime(seconds)}
      </span>
    </div>
  )
}
```

**Instructions détaillées:**
1. Créer le fichier `src/features/etudiant/components/examens/ExamTimer.tsx`
2. Convertir les secondes en format MM:SS
3. Utiliser `padStart()` pour avoir toujours 2 chiffres (ex: 05:09)
4. Changer la couleur selon le temps restant:
   - Normal (> 5 min): Bleu
   - Urgent (< 5 min): Orange
   - Critique (< 1 min): Rouge + animation pulse
5. Afficher une icône d'alerte si critique
6. Utiliser `cn()` helper pour les classes conditionnelles

---

#### Tâche 2.2.5: Créer le composant ExamLockScreen

```typescript
// src/features/etudiant/components/examens/ExamLockScreen.tsx
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { FileText, Clock, AlertTriangle, Play } from 'lucide-react'
import type { Examen } from '@/features/etudiant/types/examens.types'

interface ExamLockScreenProps {
  examen: Examen
  onStart: () => void
}

export function ExamLockScreen({ examen, onStart }: ExamLockScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">{examen.titre}</CardTitle>
          <CardDescription className="text-lg">
            {examen.matiere}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informations */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Questions</p>
                <p className="text-xl font-bold">{examen.nombre_questions}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Durée</p>
                <p className="text-xl font-bold">{examen.duree_minutes} min</p>
              </div>
            </div>
          </div>

          {/* Consignes */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p className="font-semibold">Consignes importantes:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Le chronomètre démarrera dès que vous cliquez sur "Commencer"</li>
                <li>Vous ne pourrez pas quitter l'examen une fois démarré</li>
                <li>Le clic droit et le changement d'onglet sont désactivés</li>
                <li>L'examen sera soumis automatiquement à la fin du temps</li>
                <li>Assurez-vous d'avoir une connexion internet stable</li>
              </ul>
            </AlertDescription>
          </Alert>

          {examen.description && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{examen.description}</p>
            </div>
          )}

          {/* Bouton démarrer */}
          <Button
            size="lg"
            className="w-full"
            onClick={onStart}
          >
            <Play className="mr-2 h-5 w-5" />
            Commencer l'examen
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            En cliquant sur "Commencer", vous acceptez les consignes ci-dessus
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Instructions détaillées:**
1. Créer le fichier `src/features/etudiant/components/examens/ExamLockScreen.tsx`
2. Afficher un écran de préparation AVANT de démarrer l'examen
3. Afficher:
   - Titre et matière de l'examen
   - Nombre de questions
   - Durée
   - Description (si présente)
   - **Consignes importantes** (liste à puces)
4. Bouton "Commencer l'examen"
5. Appeler `onStart()` quand l'étudiant clique
6. Design: centré, card avec fond gradient

---

#### Tâche 2.2.6: Créer le service examens

```typescript
// src/features/etudiant/services/examens.service.ts

import { httpClient } from '@/shared/services/http-client'
import type { Examen, StartExamResponse, SubmitExamResponse } from '../types/examens.types'

class ExamensService {
  /**
   * Récupère tous les examens de l'étudiant
   */
  async getAll(userId: string): Promise<Examen[]> {
    const response = await httpClient.get<Examen[]>(
      `/api/etudiants/${userId}/examens`
    )
    return response.data
  }

  /**
   * Récupère un examen par ID
   */
  async getById(examId: string): Promise<Examen> {
    const response = await httpClient.get<Examen>(`/api/examens/${examId}`)
    return response.data
  }

  /**
   * Démarre un examen (ou reprend)
   */
  async startExam(examId: string, userId: string): Promise<StartExamResponse> {
    const response = await httpClient.post<StartExamResponse>(
      `/api/examens/${examId}/start`,
      { user_id: userId }
    )
    return response.data
  }

  /**
   * Soumet les réponses de l'examen
   */
  async submitExam(
    examId: string,
    userId: string,
    reponses: Record<string, any>
  ): Promise<SubmitExamResponse> {
    const response = await httpClient.post<SubmitExamResponse>(
      `/api/examens/${examId}/submit`,
      {
        user_id: userId,
        reponses,
      }
    )
    return response.data
  }
}

export const examensService = new ExamensService()
```

**Instructions détaillées:**
1. Créer le fichier `src/features/etudiant/services/examens.service.ts`
2. Implémenter les méthodes:
   - `getAll()`: GET tous les examens de l'étudiant
   - `getById()`: GET un examen spécifique
   - `startExam()`: POST démarrer un examen (retourne la durée restante)
   - `submitExam()`: POST soumettre les réponses
3. Typer tous les retours

---

#### Tâche 2.2.7: Créer les types examens

```typescript
// src/features/etudiant/types/examens.types.ts

export interface Examen {
  id: string
  titre: string
  description?: string
  matiere: string
  date_debut: string
  date_fin: string
  duree_minutes: number
  nombre_questions: number
  statut: 'disponible' | 'en_cours' | 'termine'
  tentatives_restantes?: number
  questions: Question[]
}

export interface Question {
  id: string
  enonce: string
  type_question: 'qcm' | 'vrai_faux' | 'texte_libre'
  options: string[]
  points: number
}

export interface StartExamResponse {
  success: boolean
  duree_restante_secondes: number
  session_id: string
}

export interface SubmitExamResponse {
  success: boolean
  resultat_id: string
  note_sur_20: number
}
```

**Instructions détaillées:**
1. Créer le fichier `src/features/etudiant/types/examens.types.ts`
2. Définir toutes les interfaces
3. **IMPORTANT:** Ne PAS inclure `reponse_correcte` dans `Question` (sécurité)
4. L'interface `StartExamResponse` retourne la durée restante (pour reprendre un examen)

---

#### Tâche 2.2.8: Test unitaire - ExamTimer

```typescript
// src/features/etudiant/components/examens/__tests__/ExamTimer.test.tsx

import { render, screen } from '@testing-library/react'
import { ExamTimer } from '../ExamTimer'

describe('ExamTimer', () => {
  it('affiche le temps au format MM:SS', () => {
    render(<ExamTimer timeRemaining={125} />)
    expect(screen.getByText('02:05')).toBeInTheDocument()
  })

  it('affiche 00 pour les valeurs inférieures à 10', () => {
    render(<ExamTimer timeRemaining={9} />)
    expect(screen.getByText('00:09')).toBeInTheDocument()
  })

  it('applique la classe urgent quand < 5 minutes', () => {
    const { container } = render(<ExamTimer timeRemaining={250} />)
    const timer = container.querySelector('.bg-orange-100')
    expect(timer).toBeInTheDocument()
  })

  it('applique la classe critique quand < 1 minute', () => {
    const { container } = render(<ExamTimer timeRemaining={50} />)
    const timer = container.querySelector('.bg-red-100')
    expect(timer).toBeInTheDocument()
  })

  it('affiche l\'icône d\'alerte en mode critique', () => {
    render(<ExamTimer timeRemaining={30} />)
    const alertIcon = screen.getByRole('img', { hidden: true })
    expect(alertIcon).toBeInTheDocument()
  })
})
```

**Instructions détaillées:**
1. Créer le fichier `src/features/etudiant/components/examens/__tests__/ExamTimer.test.tsx`
2. Tester:
   - Format MM:SS correct
   - Padding des zéros (00:09)
   - Classes CSS selon le temps (urgent, critique)
   - Affichage de l'icône d'alerte
3. Utiliser `@testing-library/react`

---

#### Tâche 2.2.9: Test unitaire - QuestionDisplay

```typescript
// src/features/etudiant/components/examens/__tests__/QuestionDisplay.test.tsx

import { render, screen, fireEvent } from '@testing-library/react'
import { QuestionDisplay } from '../QuestionDisplay'
import type { Question } from '@/features/etudiant/types/examens.types'

const mockQCMQuestion: Question = {
  id: 'q1',
  enonce: 'Quelle est la capitale de la France ?',
  type_question: 'qcm',
  options: ['Paris', 'Lyon', 'Marseille', 'Toulouse'],
  points: 2,
}

const mockTextQuestion: Question = {
  id: 'q2',
  enonce: 'Expliquez le concept de polymorphisme',
  type_question: 'texte_libre',
  options: [],
  points: 5,
}

describe('QuestionDisplay', () => {
  it('affiche l\'énoncé de la question', () => {
    render(
      <QuestionDisplay
        question={mockQCMQuestion}
        answer={null}
        onAnswerChange={jest.fn()}
        questionNumber={1}
      />
    )

    expect(screen.getByText('Quelle est la capitale de la France ?')).toBeInTheDocument()
  })

  it('affiche les options pour une question QCM', () => {
    render(
      <QuestionDisplay
        question={mockQCMQuestion}
        answer={null}
        onAnswerChange={jest.fn()}
        questionNumber={1}
      />
    )

    expect(screen.getByText(/Paris/)).toBeInTheDocument()
    expect(screen.getByText(/Lyon/)).toBeInTheDocument()
    expect(screen.getByText(/Marseille/)).toBeInTheDocument()
  })

  it('appelle onAnswerChange quand une option est sélectionnée', () => {
    const onAnswerChange = jest.fn()

    render(
      <QuestionDisplay
        question={mockQCMQuestion}
        answer={null}
        onAnswerChange={onAnswerChange}
        questionNumber={1}
      />
    )

    const radioA = screen.getByLabelText(/Paris/)
    fireEvent.click(radioA)

    expect(onAnswerChange).toHaveBeenCalledWith('A')
  })

  it('affiche un textarea pour une question texte libre', () => {
    render(
      <QuestionDisplay
        question={mockTextQuestion}
        answer=""
        onAnswerChange={jest.fn()}
        questionNumber={2}
      />
    )

    expect(screen.getByPlaceholderText('Saisissez votre réponse ici...')).toBeInTheDocument()
  })

  it('affiche le nombre de points', () => {
    render(
      <QuestionDisplay
        question={mockQCMQuestion}
        answer={null}
        onAnswerChange={jest.fn()}
        questionNumber={1}
      />
    )

    expect(screen.getByText('2 points')).toBeInTheDocument()
  })
})
```

**Instructions détaillées:**
1. Créer le fichier `src/features/etudiant/components/examens/__tests__/QuestionDisplay.test.tsx`
2. Créer des questions mock (QCM et texte libre)
3. Tester:
   - Affichage de l'énoncé
   - Affichage des options (QCM)
   - Callback `onAnswerChange` appelé correctement
   - Affichage du textarea (texte libre)
   - Affichage du nombre de points
4. Utiliser `fireEvent` pour simuler les clics

---

## Section 3: Résultats et Feedback

### 3.1 Page Résultat d'Examen

#### Tâche 3.1.1: Créer la page résultat

```typescript
// src/app/(dashboard)/etudiant/examens/[id]/resultat/page.tsx

import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { ResultatView } from '@/features/etudiant/components/resultats/ResultatView'
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner'

export const metadata = {
  title: 'Résultat Examen | AI-KO',
  description: 'Résultat de l\'examen',
}

interface ResultatPageProps {
  params: {
    id: string
  }
}

export default async function ResultatPage({ params }: ResultatPageProps) {
  const session = await getServerSession()

  if (!session || session.user.role !== 'etudiant') {
    redirect('/login')
  }

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingSpinner />}>
        <ResultatView
          examId={params.id}
          userId={session.user.id}
        />
      </Suspense>
    </div>
  )
}
```

**Instructions détaillées:**
1. Créer le fichier `src/app/(dashboard)/etudiant/examens/[id]/resultat/page.tsx`
2. Utiliser dynamic route `[id]`
3. Afficher le composant `ResultatView`

---

#### Tâche 3.1.2: Créer le composant ResultatView

```typescript
// src/features/etudiant/components/resultats/ResultatView.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { notesService } from '@/features/etudiant/services/notes.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Progress } from '@/shared/components/ui/progress'
import { Badge } from '@/shared/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { FeedbackPanel } from './FeedbackPanel'
import { QuestionReview } from './QuestionReview'
import { Trophy, TrendingUp, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useRouter } from 'next/navigation'

interface ResultatViewProps {
  examId: string
  userId: string
}

export function ResultatView({ examId, userId }: ResultatViewProps) {
  const router = useRouter()

  const { data: resultat, isLoading, error } = useQuery({
    queryKey: ['resultat', examId, userId],
    queryFn: () => notesService.getResultat(examId, userId),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement du résultat...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Erreur lors du chargement du résultat</AlertDescription>
      </Alert>
    )
  }

  if (!resultat) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Résultat non encore disponible. L'enseignant n'a pas encore corrigé cet examen.
        </AlertDescription>
      </Alert>
    )
  }

  const isReussi = resultat.note_sur_20 >= (resultat.note_passage || 10)
  const pourcentage = (resultat.note_sur_20 / 20) * 100

  return (
    <div className="space-y-6">
      {/* Header avec navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Résultat de l'Examen</h1>
          <p className="text-muted-foreground">{resultat.examen_titre}</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/etudiant/examens')}>
          Retour aux examens
        </Button>
      </div>

      {/* Carte de résultat principal */}
      <Card className={isReussi ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {isReussi ? (
              <Trophy className="h-16 w-16 text-green-600" />
            ) : (
              <AlertCircle className="h-16 w-16 text-red-600" />
            )}
          </div>
          <CardTitle className="text-4xl">
            {resultat.note_sur_20.toFixed(2)}/20
          </CardTitle>
          <CardDescription className="text-lg">
            {isReussi ? (
              <span className="text-green-700 font-semibold">✅ Examen réussi !</span>
            ) : (
              <span className="text-red-700 font-semibold">❌ Examen non réussi</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={pourcentage} className="h-3" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-background rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {resultat.questions_correctes}
              </div>
              <div className="text-xs text-muted-foreground">Correctes</div>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {resultat.questions_incorrectes}
              </div>
              <div className="text-xs text-muted-foreground">Incorrectes</div>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {resultat.score_total}/{resultat.score_maximum}
              </div>
              <div className="text-xs text-muted-foreground">Points</div>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.floor(resultat.duree_reelle_secondes / 60)} min
              </div>
              <div className="text-xs text-muted-foreground">Durée</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taux de réussite</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pourcentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Score total: {resultat.score_total}/{resultat.score_maximum}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Questions répondues</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resultat.questions_repondues}/{resultat.questions_total}
            </div>
            <p className="text-xs text-muted-foreground">
              {((resultat.questions_repondues / resultat.questions_total) * 100).toFixed(0)}% du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Temps utilisé</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(resultat.duree_reelle_secondes / 60)} min
            </div>
            <p className="text-xs text-muted-foreground">
              sur {resultat.duree_totale_minutes} min
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Feedback et Détail des questions */}
      <Tabs defaultValue="feedback">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="questions">Détail des questions</TabsTrigger>
        </TabsList>

        <TabsContent value="feedback" className="space-y-4">
          <FeedbackPanel resultat={resultat} />
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          {resultat.corrections_affichees ? (
            <div className="space-y-4">
              {resultat.reponses_detail.map((reponse, index) => (
                <QuestionReview key={reponse.question_id} reponse={reponse} index={index} />
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                L'enseignant n'a pas encore autorisé l'affichage des corrections.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

**Instructions détaillées:**
1. Créer le fichier `src/features/etudiant/components/resultats/ResultatView.tsx`
2. Utiliser `useQuery` pour charger le résultat
3. **IMPORTANT:** Vérifier si `resultat` existe (peut être null si pas encore corrigé)
4. Afficher:
   - Note sur 20 avec icône (Trophy si réussi, AlertCircle si non réussi)
   - Badge "Réussi" ou "Non réussi"
   - Barre de progression
   - Statistiques (correctes, incorrectes, points, durée)
   - Tabs avec:
     - Feedback de l'IA et du professeur
     - Détail des questions (si `corrections_affichees === true`)
5. Calculer le pourcentage: `(note_sur_20 / 20) * 100`
6. Comparer `note_sur_20` avec `note_passage` pour déterminer si réussi

---

#### Tâche 3.1.3: Créer le composant FeedbackPanel

```typescript
// src/features/etudiant/components/resultats/FeedbackPanel.tsx
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Lightbulb, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react'
import type { Resultat } from '@/features/etudiant/types/notes.types'

interface FeedbackPanelProps {
  resultat: Resultat
}

export function FeedbackPanel({ resultat }: FeedbackPanelProps) {
  return (
    <div className="space-y-4">
      {/* Feedback automatique (IA) */}
      {resultat.feedback_auto && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="mr-2 h-5 w-5 text-yellow-600" />
              Feedback Automatique (IA)
            </CardTitle>
            <CardDescription>
              Analyse générée automatiquement par l'IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{resultat.feedback_auto}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commentaire du professeur */}
      {resultat.commentaire_prof && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5 text-blue-600" />
              Commentaire du Professeur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{resultat.commentaire_prof}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Points forts et à améliorer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resultat.points_forts && resultat.points_forts.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center text-green-700">
                <ThumbsUp className="mr-2 h-5 w-5" />
                Points Forts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                {resultat.points_forts.map((point, index) => (
                  <li key={index} className="text-sm text-green-800">
                    {point}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {resultat.points_a_ameliorer && resultat.points_a_ameliorer.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-700">
                <ThumbsDown className="mr-2 h-5 w-5" />
                Points à Améliorer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                {resultat.points_a_ameliorer.map((point, index) => (
                  <li key={index} className="text-sm text-orange-800">
                    {point}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Si aucun feedback */}
      {!resultat.feedback_auto && !resultat.commentaire_prof && (
        <Alert>
          <AlertDescription>
            Aucun feedback n'a été fourni pour cet examen.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
```

**Instructions détaillées:**
1. Créer le fichier `src/features/etudiant/components/resultats/FeedbackPanel.tsx`
2. Afficher:
   - Feedback automatique (généré par l'IA)
   - Commentaire du professeur (ajouté manuellement)
   - Points forts (liste)
   - Points à améliorer (liste)
3. Utiliser `whitespace-pre-wrap` pour préserver les retours à la ligne
4. Si aucun feedback, afficher un message "Aucun feedback"
5. Utiliser des couleurs pour distinguer (vert = points forts, orange = à améliorer)

---

#### Tâche 3.1.4: Créer le composant QuestionReview

```typescript
// src/features/etudiant/components/resultats/QuestionReview.tsx
'use client'

import { Card, CardContent, CardHeader } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import type { ReponseDetail } from '@/features/etudiant/types/notes.types'

interface QuestionReviewProps {
  reponse: ReponseDetail
  index: number
}

export function QuestionReview({ reponse, index }: QuestionReviewProps) {
  const getStatusIcon = () => {
    if (reponse.est_correcte) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    } else if (reponse.points_obtenus > 0) {
      return <AlertCircle className="h-5 w-5 text-orange-600" />
    } else {
      return <XCircle className="h-5 w-5 text-red-600" />
    }
  }

  const getStatusBadge = () => {
    if (reponse.est_correcte) {
      return <Badge variant="default" className="bg-green-600">Correcte</Badge>
    } else if (reponse.points_obtenus > 0) {
      return <Badge variant="secondary">Partielle</Badge>
    } else {
      return <Badge variant="destructive">Incorrecte</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h3 className="font-semibold">Question {index + 1}</h3>
              <p className="text-sm text-muted-foreground">
                {reponse.points_obtenus} / {reponse.points_max} points
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Énoncé */}
        <div>
          <p className="font-medium text-sm text-muted-foreground mb-1">Énoncé:</p>
          <p className="text-base">{reponse.enonce}</p>
        </div>

        {/* Votre réponse */}
        <div>
          <p className="font-medium text-sm text-muted-foreground mb-1">Votre réponse:</p>
          <div className={`p-3 rounded-lg ${
            reponse.est_correcte
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className="text-base">
              {reponse.reponse_donnee || <span className="italic text-muted-foreground">Aucune réponse</span>}
            </p>
          </div>
        </div>

        {/* Réponse correcte */}
        {!reponse.est_correcte && reponse.reponse_correcte && (
          <div>
            <p className="font-medium text-sm text-muted-foreground mb-1">Réponse correcte:</p>
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-base">{reponse.reponse_correcte}</p>
            </div>
          </div>
        )}

        {/* Explication */}
        {reponse.explication && (
          <div>
            <p className="font-medium text-sm text-muted-foreground mb-1">💡 Explication:</p>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm">{reponse.explication}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

**Instructions détaillées:**
1. Créer le fichier `src/features/etudiant/components/resultats/QuestionReview.tsx`
2. Afficher pour chaque question:
   - Icône de statut (CheckCircle, XCircle, AlertCircle)
   - Badge (Correcte, Incorrecte, Partielle)
   - Énoncé de la question
   - Réponse donnée par l'étudiant
   - Réponse correcte (si incorrecte)
   - Explication (si disponible)
   - Points obtenus / points max
3. Utiliser des couleurs:
   - Vert: réponse correcte
   - Rouge: réponse incorrecte
   - Orange: réponse partielle
   - Bleu: réponse correcte (affichage)

---

#### Tâche 3.1.5: Créer le service notes

```typescript
// src/features/etudiant/services/notes.service.ts

import { httpClient } from '@/shared/services/http-client'
import type { Resultat, HistoriqueNotes } from '../types/notes.types'

class NotesService {
  /**
   * Récupère le résultat d'un examen
   */
  async getResultat(examId: string, userId: string): Promise<Resultat | null> {
    try {
      const response = await httpClient.get<Resultat>(
        `/api/examens/${examId}/resultats/${userId}`
      )
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Pas encore de résultat
        return null
      }
      throw error
    }
  }

  /**
   * Récupère l'historique des notes de l'étudiant
   */
  async getHistorique(userId: string): Promise<HistoriqueNotes[]> {
    const response = await httpClient.get<HistoriqueNotes[]>(
      `/api/etudiants/${userId}/notes/historique`
    )
    return response.data
  }
}

export const notesService = new NotesService()
```

**Instructions détaillées:**
1. Créer le fichier `src/features/etudiant/services/notes.service.ts`
2. Implémenter:
   - `getResultat()`: GET résultat d'un examen (peut retourner null si pas encore corrigé)
   - `getHistorique()`: GET tous les résultats de l'étudiant
3. **IMPORTANT:** Gérer le cas 404 (résultat pas encore disponible)
4. Utiliser try/catch pour distinguer 404 des autres erreurs

---

#### Tâche 3.1.6: Créer les types notes

```typescript
// src/features/etudiant/types/notes.types.ts

export interface Resultat {
  id: string
  examen_id: string
  examen_titre: string
  etudiant_id: string
  date_passage: string
  note_sur_20: number
  note_passage: number
  score_total: number
  score_maximum: number
  pourcentage: number
  questions_total: number
  questions_repondues: number
  questions_correctes: number
  questions_incorrectes: number
  questions_partielles: number
  duree_reelle_secondes: number
  duree_totale_minutes: number
  est_reussi: boolean
  corrections_affichees: boolean
  feedback_auto?: string
  commentaire_prof?: string
  note_prof?: number
  points_forts?: string[]
  points_a_ameliorer?: string[]
  reponses_detail: ReponseDetail[]
}

export interface ReponseDetail {
  question_id: string
  enonce: string
  reponse_donnee: string
  reponse_correcte: string
  est_correcte: boolean
  points_obtenus: number
  points_max: number
  explication?: string
}

export interface HistoriqueNotes {
  id: string
  examen_titre: string
  matiere: string
  date_passage: string
  note_sur_20: number
  est_reussi: boolean
}
```

**Instructions détaillées:**
1. Créer le fichier `src/features/etudiant/types/notes.types.ts`
2. Définir toutes les interfaces pour les résultats
3. **`Resultat`:** Interface complète avec toutes les stats
4. **`ReponseDetail`:** Détail de chaque question avec correction
5. **`HistoriqueNotes`:** Vue simplifiée pour l'historique

---

#### Tâche 3.1.7: Test unitaire - ResultatView

```typescript
// src/features/etudiant/components/resultats/__tests__/ResultatView.test.tsx

import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ResultatView } from '../ResultatView'
import { notesService } from '@/features/etudiant/services/notes.service'
import type { Resultat } from '@/features/etudiant/types/notes.types'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/features/etudiant/services/notes.service')

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const mockResultatReussi: Resultat = {
  id: 'r1',
  examen_id: 'e1',
  examen_titre: 'QCM Algorithmique',
  etudiant_id: 'u1',
  date_passage: '2025-01-15T10:00:00Z',
  note_sur_20: 15.5,
  note_passage: 10,
  score_total: 31,
  score_maximum: 40,
  pourcentage: 77.5,
  questions_total: 20,
  questions_repondues: 20,
  questions_correctes: 15,
  questions_incorrectes: 5,
  questions_partielles: 0,
  duree_reelle_secondes: 1800,
  duree_totale_minutes: 60,
  est_reussi: true,
  corrections_affichees: true,
  feedback_auto: 'Bon travail !',
  reponses_detail: [],
}

describe('ResultatView', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    })
  })

  it('affiche le résultat avec succès', async () => {
    jest.spyOn(notesService, 'getResultat').mockResolvedValue(mockResultatReussi)

    render(<ResultatView examId="e1" userId="u1" />, { wrapper: createWrapper() })

    // Attendre le chargement
    await waitFor(() => {
      expect(screen.getByText('15.50/20')).toBeInTheDocument()
    })

    // Vérifier le message de réussite
    expect(screen.getByText(/Examen réussi/i)).toBeInTheDocument()

    // Vérifier les stats
    expect(screen.getByText('15')).toBeInTheDocument() // questions correctes
    expect(screen.getByText('5')).toBeInTheDocument() // questions incorrectes
  })

  it('affiche un message si résultat non disponible', async () => {
    jest.spyOn(notesService, 'getResultat').mockResolvedValue(null)

    render(<ResultatView examId="e1" userId="u1" />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText(/non encore disponible/i)).toBeInTheDocument()
    })
  })

  it('affiche le statut échec si note insuffisante', async () => {
    const mockResultatEchec = {
      ...mockResultatReussi,
      note_sur_20: 8.5,
      est_reussi: false,
    }

    jest.spyOn(notesService, 'getResultat').mockResolvedValue(mockResultatEchec)

    render(<ResultatView examId="e1" userId="u1" />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText(/Examen non réussi/i)).toBeInTheDocument()
    })
  })

  it('masque le détail des questions si corrections_affichees = false', async () => {
    const mockResultatSansCorrections = {
      ...mockResultatReussi,
      corrections_affichees: false,
    }

    jest.spyOn(notesService, 'getResultat').mockResolvedValue(mockResultatSansCorrections)

    render(<ResultatView examId="e1" userId="u1" />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('15.50/20')).toBeInTheDocument()
    })

    // Cliquer sur l'onglet "Détail des questions"
    const detailTab = screen.getByRole('tab', { name: /Détail des questions/i })
    detailTab.click()

    // Vérifier le message
    await waitFor(() => {
      expect(screen.getByText(/pas encore autorisé l'affichage/i)).toBeInTheDocument()
    })
  })
})
```

**Instructions détaillées:**
1. Créer le fichier `src/features/etudiant/components/resultats/__tests__/ResultatView.test.tsx`
2. Mocker `next/navigation` et `notesService`
3. Créer un résultat mock complet
4. Tester:
   - Affichage d'un résultat réussi
   - Message si résultat non disponible (null)
   - Affichage d'un résultat échoué
   - Masquage des corrections si `corrections_affichees = false`
5. Utiliser `waitFor` pour les queries asynchrones

---

#### Tâche 3.1.8: Test unitaire - FeedbackPanel

```typescript
// src/features/etudiant/components/resultats/__tests__/FeedbackPanel.test.tsx

import { render, screen } from '@testing-library/react'
import { FeedbackPanel } from '../FeedbackPanel'
import type { Resultat } from '@/features/etudiant/types/notes.types'

const mockResultatAvecFeedback: Partial<Resultat> = {
  feedback_auto: 'Excellente maîtrise des concepts de base.',
  commentaire_prof: 'Continuez ainsi !',
  points_forts: ['Bonne compréhension des algorithmes', 'Code propre'],
  points_a_ameliorer: ['Optimisation des boucles', 'Gestion mémoire'],
}

const mockResultatSansFeedback: Partial<Resultat> = {
  feedback_auto: undefined,
  commentaire_prof: undefined,
  points_forts: [],
  points_a_ameliorer: [],
}

describe('FeedbackPanel', () => {
  it('affiche le feedback automatique', () => {
    render(<FeedbackPanel resultat={mockResultatAvecFeedback as Resultat} />)

    expect(screen.getByText('Feedback Automatique (IA)')).toBeInTheDocument()
    expect(screen.getByText('Excellente maîtrise des concepts de base.')).toBeInTheDocument()
  })

  it('affiche le commentaire du professeur', () => {
    render(<FeedbackPanel resultat={mockResultatAvecFeedback as Resultat} />)

    expect(screen.getByText('Commentaire du Professeur')).toBeInTheDocument()
    expect(screen.getByText('Continuez ainsi !')).toBeInTheDocument()
  })

  it('affiche les points forts', () => {
    render(<FeedbackPanel resultat={mockResultatAvecFeedback as Resultat} />)

    expect(screen.getByText('Points Forts')).toBeInTheDocument()
    expect(screen.getByText(/Bonne compréhension des algorithmes/i)).toBeInTheDocument()
    expect(screen.getByText(/Code propre/i)).toBeInTheDocument()
  })

  it('affiche les points à améliorer', () => {
    render(<FeedbackPanel resultat={mockResultatAvecFeedback as Resultat} />)

    expect(screen.getByText('Points à Améliorer')).toBeInTheDocument()
    expect(screen.getByText(/Optimisation des boucles/i)).toBeInTheDocument()
  })

  it('affiche un message si aucun feedback', () => {
    render(<FeedbackPanel resultat={mockResultatSansFeedback as Resultat} />)

    expect(screen.getByText(/Aucun feedback n'a été fourni/i)).toBeInTheDocument()
  })
})
```

**Instructions détaillées:**
1. Créer le fichier `src/features/etudiant/components/resultats/__tests__/FeedbackPanel.test.tsx`
2. Créer des mocks avec et sans feedback
3. Tester:
   - Affichage feedback auto
   - Affichage commentaire prof
   - Affichage points forts
   - Affichage points à améliorer
   - Message si aucun feedback

---

## Section 4: Historique des Notes

### 4.1 Page Historique Notes

#### Tâche 4.1.1: Créer la page historique notes

```typescript
// src/app/(dashboard)/etudiant/notes/page.tsx

import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { NotesHistory } from '@/features/etudiant/components/resultats/NotesHistory'
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner'

export const metadata = {
  title: 'Mes Notes | AI-KO',
  description: 'Historique de vos notes',
}

export default async function NotesPage() {
  const session = await getServerSession()

  if (!session || session.user.role !== 'etudiant') {
    redirect('/login')
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Mes Notes
        </h1>
        <p className="text-muted-foreground">
          Consultez l'historique de tous vos examens
        </p>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <NotesHistory userId={session.user.id} />
      </Suspense>
    </div>
  )
}
```

**Instructions détaillées:**
1. Créer le fichier `src/app/(dashboard)/etudiant/notes/page.tsx`
2. Afficher le composant `NotesHistory`

---

#### Tâche 4.1.2: Créer le composant NotesHistory

```typescript
// src/features/etudiant/components/resultats/NotesHistory.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { notesService } from '@/features/etudiant/services/notes.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { FileX, Eye, TrendingUp, TrendingDown } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'

interface NotesHistoryProps {
  userId: string
}

export function NotesHistory({ userId }: NotesHistoryProps) {
  const router = useRouter()

  const { data: historique, isLoading, error } = useQuery({
    queryKey: ['notes-historique', userId],
    queryFn: () => notesService.getHistorique(userId),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement de l'historique...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erreur lors du chargement de l'historique
        </AlertDescription>
      </Alert>
    )
  }

  if (!historique || historique.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileX className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Aucun résultat</h3>
        <p className="text-muted-foreground">
          Vous n'avez pas encore passé d'examen
        </p>
      </div>
    )
  }

  // Calculer les stats globales
  const moyenne = historique.reduce((acc, note) => acc + note.note_sur_20, 0) / historique.length
  const tauxReussite = (historique.filter(n => n.est_reussi).length / historique.length) * 100

  return (
    <div className="space-y-6">
      {/* Stats globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Examens passés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{historique.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Moyenne générale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold">{moyenne.toFixed(2)}/20</div>
              {moyenne >= 12 ? (
                <TrendingUp className="ml-2 h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="ml-2 h-5 w-5 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taux de réussite</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tauxReussite.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              {historique.filter(n => n.est_reussi).length} / {historique.length} réussis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table des notes */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des examens</CardTitle>
          <CardDescription>
            Liste de tous vos examens passés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Examen</TableHead>
                <TableHead>Matière</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Note</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historique.map((note) => (
                <TableRow key={note.id}>
                  <TableCell className="font-medium">{note.examen_titre}</TableCell>
                  <TableCell>{note.matiere}</TableCell>
                  <TableCell>
                    {format(new Date(note.date_passage), 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-bold ${
                      note.note_sur_20 >= 10 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {note.note_sur_20.toFixed(2)}/20
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {note.est_reussi ? (
                      <Badge variant="default" className="bg-green-600">Réussi</Badge>
                    ) : (
                      <Badge variant="destructive">Échoué</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/etudiant/examens/${note.examen_id}/resultat`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Voir le détail
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Instructions détaillées:**
1. Créer le fichier `src/features/etudiant/components/resultats/NotesHistory.tsx`
2. Utiliser `useQuery` pour charger l'historique
3. Calculer les stats globales:
   - Nombre total d'examens
   - Moyenne générale
   - Taux de réussite
4. Afficher une table avec:
   - Titre de l'examen
   - Matière
   - Date de passage
   - Note (colorée: vert si >= 10, rouge sinon)
   - Statut (Badge Réussi/Échoué)
   - Bouton "Voir le détail"
5. Utiliser le composant `Table` de shadcn/ui
6. Si aucun résultat, afficher un message "Aucun résultat"

---

#### Tâche 4.1.3: Test unitaire - NotesHistory

```typescript
// src/features/etudiant/components/resultats/__tests__/NotesHistory.test.tsx

import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { NotesHistory } from '../NotesHistory'
import { notesService } from '@/features/etudiant/services/notes.service'
import type { HistoriqueNotes } from '@/features/etudiant/types/notes.types'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/features/etudiant/services/notes.service')

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const mockHistorique: HistoriqueNotes[] = [
  {
    id: 'r1',
    examen_id: 'e1',
    examen_titre: 'QCM Algorithmique',
    matiere: 'Informatique',
    date_passage: '2025-01-15T10:00:00Z',
    note_sur_20: 15.5,
    est_reussi: true,
  },
  {
    id: 'r2',
    examen_id: 'e2',
    examen_titre: 'QCM Base de données',
    matiere: 'Informatique',
    date_passage: '2025-01-10T14:00:00Z',
    note_sur_20: 9.0,
    est_reussi: false,
  },
]

describe('NotesHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    })
  })

  it('affiche l\'historique des notes', async () => {
    jest.spyOn(notesService, 'getHistorique').mockResolvedValue(mockHistorique)

    render(<NotesHistory userId="u1" />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('QCM Algorithmique')).toBeInTheDocument()
      expect(screen.getByText('QCM Base de données')).toBeInTheDocument()
    })
  })

  it('calcule et affiche la moyenne correctement', async () => {
    jest.spyOn(notesService, 'getHistorique').mockResolvedValue(mockHistorique)

    render(<NotesHistory userId="u1" />, { wrapper: createWrapper() })

    await waitFor(() => {
      // Moyenne = (15.5 + 9.0) / 2 = 12.25
      expect(screen.getByText('12.25/20')).toBeInTheDocument()
    })
  })

  it('affiche le taux de réussite', async () => {
    jest.spyOn(notesService, 'getHistorique').mockResolvedValue(mockHistorique)

    render(<NotesHistory userId="u1" />, { wrapper: createWrapper() })

    await waitFor(() => {
      // 1 réussi sur 2 = 50%
      expect(screen.getByText('50%')).toBeInTheDocument()
    })
  })

  it('affiche un message si aucun résultat', async () => {
    jest.spyOn(notesService, 'getHistorique').mockResolvedValue([])

    render(<NotesHistory userId="u1" />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText(/Aucun résultat/i)).toBeInTheDocument()
    })
  })

  it('colore les notes en vert si >= 10, rouge sinon', async () => {
    jest.spyOn(notesService, 'getHistorique').mockResolvedValue(mockHistorique)

    const { container } = render(<NotesHistory userId="u1" />, { wrapper: createWrapper() })

    await waitFor(() => {
      const noteReussie = container.querySelector('.text-green-600')
      const noteEchouee = container.querySelector('.text-red-600')

      expect(noteReussie).toBeInTheDocument()
      expect(noteEchouee).toBeInTheDocument()
    })
  })
})
```

**Instructions détaillées:**
1. Créer le fichier `src/features/etudiant/components/resultats/__tests__/NotesHistory.test.tsx`
2. Créer un historique mock avec 2 notes (1 réussie, 1 échouée)
3. Tester:
   - Affichage de l'historique
   - Calcul de la moyenne
   - Calcul du taux de réussite
   - Message si aucun résultat
   - Coloration des notes (vert/rouge)

---

## 📝 Résumé du Parcours Étudiant

### Composants créés:
✅ **Dashboard:** StatsCards, UpcomingExams, RecentResults
✅ **Examens:** ExamensList, ExamenCard, ExamPlayer, QuestionDisplay, ExamTimer, ExamLockScreen
✅ **Résultats:** ResultatView, FeedbackPanel, QuestionReview, NotesHistory

### Services créés:
✅ etudiantService (stats, examens à venir)
✅ examensService (getAll, getById, startExam, submitExam)
✅ notesService (getResultat, getHistorique)

### Types créés:
✅ etudiant.types.ts
✅ examens.types.ts
✅ notes.types.ts

### Tests unitaires créés:
✅ StatsCards.test.tsx
✅ ExamTimer.test.tsx
✅ QuestionDisplay.test.tsx
✅ ResultatView.test.tsx
✅ FeedbackPanel.test.tsx
✅ NotesHistory.test.tsx

### Fonctionnalités clés implémentées:
🔐 **Système de blocage d'examen (ExamPlayer):**
   - Compte à rebours avec soumission auto
   - Blocage navigation (back button, refresh)
   - Désactivation clic droit
   - Détection perte de focus
   - Confirmation avant soumission

📊 **Affichage des résultats:**
   - Note avec statut (réussi/échoué)
   - Détail des questions
   - Feedback IA + professeur
   - Historique complet

---

## 🎯 ORDRE D'EXÉCUTION FINAL - PARCOURS ÉTUDIANT

### Phase 1: Dashboard (2 jours)
1. Tâche 1.1.1 → 1.1.5: Dashboard étudiant + tests

### Phase 2: Liste des Examens (1-2 jours)
2. Tâche 2.1.1 → 2.1.3: ExamensList et ExamenCard

### Phase 3: Passage d'Examen (5-6 jours) ⚠️ CRITIQUE
3. Tâche 2.2.1: Page passage examen
4. Tâche 2.2.2: **ExamPlayer** (TRÈS COMPLEXE - 2-3 jours)
5. Tâche 2.2.3 → 2.2.5: QuestionDisplay, ExamTimer, ExamLockScreen
6. Tâche 2.2.6 → 2.2.7: Services et types
7. Tâche 2.2.8 → 2.2.9: Tests unitaires

### Phase 4: Résultats (3-4 jours)
8. Tâche 3.1.1 → 3.1.4: ResultatView, FeedbackPanel, QuestionReview
9. Tâche 3.1.5 → 3.1.6: Services et types notes
10. Tâche 3.1.7 → 3.1.8: Tests unitaires

### Phase 5: Historique (1-2 jours)
11. Tâche 4.1.1 → 4.1.3: NotesHistory + tests

---

## 📊 Estimation Totale

| Phase | Durée | Criticité |
|-------|-------|-----------|
| **Parcours Enseignant** | 20-25 jours | HAUTE |
| **Parcours Étudiant** | 12-16 jours | CRITIQUE |
| **Tests E2E complets** | 3-4 jours | HAUTE |
| **TOTAL** | **35-45 jours** | |

---

# ✅ FIN DU PLAN D'IMPLÉMENTATION

Ce plan détaillé contient **TOUTES les instructions** nécessaires pour implémenter les parcours Enseignant et Étudiant, incluant:

- ✅ Code complet de chaque composant
- ✅ Services et types TypeScript
- ✅ Tests unitaires pour chaque composant
- ✅ Instructions ultra-détaillées étape par étape
- ✅ Utilisation des bibliothèques existantes (shadcn/ui, React Query, etc.)
- ✅ Ordre d'exécution recommandé
- ✅ Estimation de temps réaliste

Le développeur peut maintenant suivre ce plan de A à Z pour implémenter le projet frontend complet.

**Bonne chance pour le développement ! 🚀**
