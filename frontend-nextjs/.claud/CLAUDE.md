# Règles de Développement Frontend - AI-KO

## Architecture Générale

### Stack Technologique

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4+
- **UI Library:** shadcn/ui (Radix UI)
- **State Management:** Zustand + SWR
- **Authentification:** Better-Auth
- **Formulaires:** React Hook Form + Zod
- **Charts:** Recharts
- **Emails:** React-Email
- **Workflows:** Inngest
- **Actions:** Next-safe-action
- **Hotkeys:** React Hotkeys
- **URL State:** Nuqs
- **AI:** AI SDK (Vercel)

## Structure des Dossiers

```
frontend-nextjs/
├── app/                          # App Router (Next.js 15+)
│   ├── (marketing)/              # Route group - Pages publiques
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── about/
│   │       └── page.tsx
│   ├── (auth)/                   # Route group - Authentification
│   │   ├── layout.tsx
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/              # Route group - Dashboards
│   │   ├── layout.tsx
│   │   ├── enseignant/
│   │   │   ├── page.tsx
│   │   │   ├── qcm/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── nouveau/
│   │   │   │       └── page.tsx
│   │   │   └── statistiques/
│   │   │       └── page.tsx
│   │   ├── etudiant/
│   │   │   ├── page.tsx
│   │   │   ├── examens/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   └── resultats/
│   │   │       └── page.tsx
│   │   └── admin/
│   │       └── page.tsx
│   ├── api/                      # API Routes (Next.js)
│   │   ├── auth/
│   │   │   └── [...better-auth]/
│   │   │       └── route.ts
│   │   ├── qcm/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   └── proxy/                 # Proxy vers Flask backend
│   │       └── [...path]/
│   │           └── route.ts
│   ├── layout.tsx                # Root layout
│   ├── loading.tsx               # Global loading
│   ├── error.tsx                  # Global error boundary
│   └── not-found.tsx              # 404 page
├── features/                     # Feature modules
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   └── actions/
│   │       └── auth.actions.ts   # Next-safe-action
│   ├── qcm/
│   │   ├── components/
│   │   │   ├── QCMList.tsx
│   │   │   ├── QCMCard.tsx
│   │   │   ├── QCMForm.tsx
│   │   │   └── ExamPlayer.tsx
│   │   ├── hooks/
│   │   │   ├── useQCMForm.ts
│   │   │   └── useExamTimer.ts
│   │   └── actions/
│   │       └── qcm.actions.ts
│   ├── correction/
│   │   └── components/
│   │       └── CorrectionView.tsx
│   └── statistics/
│       └── components/
│           └── StatsDashboard.tsx
├── shared/                       # Code partagé
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   └── common/
│   │       └── LoadingSkeleton.tsx
│   ├── hooks/
│   │   ├── useAsync.ts
│   │   └── useDebounce.ts
│   ├── services/
│   │   ├── api/
│   │   │   ├── qcm.service.ts
│   │   │   └── auth.service.ts
│   │   └── socket.service.ts
│   └── types/
│       └── api.types.ts
├── core/                         # Configuration
│   ├── providers/
│   │   ├── Providers.tsx
│   │   ├── AuthProvider.tsx
│   │   └── QueryProvider.tsx
│   ├── middleware.ts             # Next.js middleware
│   └── config/
│       ├── env.ts
│       └── routes.ts
├── middleware.ts                 # Middleware Next.js (racine)
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## Règles de Développement

### 1. Stratégies de Rendu (OBLIGATOIRE)

#### Server Components (Par Défaut)

```typescript
// app/(dashboard)/enseignant/qcm/page.tsx
// Server Component - pas de 'use client'
import { qcmService } from '@/shared/services/api/qcm.service'

export default async function QCMListPage() {
  // Fetch côté serveur
  const qcms = await qcmService.getByEnseignant(enseignantId)
  
  return (
    <div>
      {qcms.map(qcm => <QCMCard key={qcm.id} qcm={qcm} />)}
    </div>
  )
}
```

**Règle:** Utiliser Server Components par défaut. Ajouter `'use client'` UNIQUEMENT si nécessaire (hooks, événements, state local).

#### ISR (Incremental Static Regeneration)

```typescript
// Pour contenu qui change peu fréquemment
export const revalidate = 300 // Régénère toutes les 5 minutes

export default async function QCMListPage() {
  const qcms = await fetch(`${API_URL}/api/qcm`, {
    next: { revalidate: 300 }
  }).then(res => res.json())
  
  return <QCMList qcms={qcms} />
}
```

**Règle:** Utiliser ISR pour les listes qui changent peu (QCM publiés, statistiques).

#### Client Components (Interactivité)

```typescript
// app/(dashboard)/etudiant/examens/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ExamPlayer } from '@/features/qcm/components/ExamPlayer'

export default function ExamPage() {
  const params = useParams()
  const [exam, setExam] = useState(null)
  
  useEffect(() => {
    fetchExam(params.id as string).then(setExam)
  }, [params.id])
  
  if (!exam) return <LoadingSkeleton />
  
  return <ExamPlayer exam={exam} />
}
```

**Règle:** Utiliser Client Components pour les pages interactives (formulaires, examens, timers).

### 2. State Management

#### SWR pour les Requêtes API (OBLIGATOIRE)

```typescript
// shared/hooks/useQCMList.ts
import useSWR from 'swr'
import { qcmService } from '@/shared/services/api/qcm.service'

export function useQCMList(enseignantId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    ['qcms', enseignantId],
    () => qcmService.getByEnseignant(enseignantId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
    }
  )
  
  return {
    qcms: data,
    isLoading,
    isError: error,
    mutate, // Pour invalider le cache
  }
}

// Utilisation dans composant
export function QCMList({ enseignantId }: { enseignantId: string }) {
  const { qcms, isLoading, mutate } = useQCMList(enseignantId)
  
  const handleDelete = async (id: string) => {
    await qcmService.delete(id)
    mutate() // Revalider le cache
  }
  
  if (isLoading) return <LoadingSkeleton />
  
  return (
    <div>
      {qcms?.map(qcm => (
        <QCMCard key={qcm.id} qcm={qcm} onDelete={handleDelete} />
      ))}
    </div>
  )
}
```

**Règle:** TOUJOURS utiliser SWR pour les requêtes API. Ne pas utiliser `useEffect` + `fetch` directement.

#### Zustand pour State Global

```typescript
// shared/stores/qcmStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface QCMStore {
  selectedQCM: QCM | null
  setSelectedQCM: (qcm: QCM | null) => void
  filters: {
    status: string
    matiere: string
  }
  setFilters: (filters: Partial<QCMStore['filters']>) => void
}

export const useQCMStore = create<QCMStore>()(
  persist(
    (set) => ({
      selectedQCM: null,
      setSelectedQCM: (qcm) => set({ selectedQCM: qcm }),
      filters: {
        status: 'all',
        matiere: 'all',
      },
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),
    }),
    {
      name: 'qcm-storage',
    }
  )
)
```

**Règle:** Utiliser Zustand pour l'état global (filtres, sélections, préférences utilisateur). SWR pour les données serveur.

### 3. Nuqs - State dans l'URL

```typescript
// features/qcm/components/QCMList.tsx
'use client'

import { parseAsString, useQueryState } from 'nuqs'

export function QCMList() {
  // State synchronisé avec l'URL
  const [status, setStatus] = useQueryState(
    'status',
    parseAsString.withDefault('all')
  )
  const [matiere, setMatiere] = useQueryState(
    'matiere',
    parseAsString.withDefault('all')
  )
  
  // Les filtres sont dans l'URL - partageable !
  const { qcms } = useQCMList({ status, matiere })
  
  return (
    <div>
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="all">Tous</option>
        <option value="actif">Actifs</option>
        <option value="brouillon">Brouillons</option>
      </select>
      
      {qcms?.map(qcm => <QCMCard key={qcm.id} qcm={qcm} />)}
    </div>
  )
}
```

**Règle:** Utiliser Nuqs pour les filtres et états partageables via URL. Permet de partager des liens avec l'état préservé.

### 4. Better-Auth - Authentification

```typescript
// core/lib/auth.ts
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './db'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24, // 1 jour
  },
})

// app/api/auth/[...better-auth]/route.ts
import { auth } from '@/core/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)

// Utilisation dans composants
'use client'
import { useSession } from 'better-auth/react'

export function UserProfile() {
  const { data: session, isPending } = useSession()
  
  if (isPending) return <LoadingSkeleton />
  if (!session) return <div>Non connecté</div>
  
  return <div>Bonjour {session.user.name}</div>
}
```

**Règle:** Utiliser Better-Auth pour l'authentification. Plus simple et moderne que NextAuth.js.

### 5. Next-safe-action - Actions Sécurisées

```typescript
// features/qcm/actions/qcm.actions.ts
'use server'

import { actionClient } from '@/core/lib/safe-action'
import { z } from 'zod'
import { qcmService } from '@/shared/services/api/qcm.service'

const createQCMSchema = z.object({
  titre: z.string().min(3).max(200),
  description: z.string().optional(),
  duree_minutes: z.number().min(5).max(300),
  questions: z.array(z.any()).min(1),
})

export const createQCMAction = actionClient
  .schema(createQCMSchema)
  .action(async ({ parsedInput, ctx }) => {
    // ctx contient la session utilisateur
    if (!ctx.session) {
      throw new Error('Non authentifié')
    }
    
    const qcm = await qcmService.create({
      ...parsedInput,
      enseignant_id: ctx.session.user.id,
    })
    
    return { success: true, qcm }
  })

// Utilisation dans composant
'use client'
import { useAction } from 'next-safe-action/hooks'
import { createQCMAction } from '@/features/qcm/actions/qcm.actions'

export function QCMForm() {
  const { execute, isPending, result } = useAction(createQCMAction)
  
  const handleSubmit = (data: FormData) => {
    execute({
      titre: data.get('titre') as string,
      description: data.get('description') as string,
      duree_minutes: Number(data.get('duree_minutes')),
      questions: [],
    })
  }
  
  return (
    <form action={handleSubmit}>
      {/* ... */}
      {result?.serverError && (
        <div className="text-red-500">{result.serverError}</div>
      )}
    </form>
  )
}
```

**Règle:** Utiliser Next-safe-action pour toutes les mutations (création, modification, suppression). Validation automatique avec Zod.

### 6. React-Email - Emails

```typescript
// emails/QCMGenerated.tsx
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
} from '@react-email/components'

interface QCMGeneratedEmailProps {
  qcmTitle: string
  qcmId: string
  userName: string
}

export function QCMGeneratedEmail({
  qcmTitle,
  qcmId,
  userName,
}: QCMGeneratedEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Text style={title}>QCM Généré avec Succès</Text>
            <Text style={text}>Bonjour {userName},</Text>
            <Text style={text}>
              Votre QCM "{qcmTitle}" a été généré avec succès.
            </Text>
            <Button
              style={button}
              href={`${process.env.NEXT_PUBLIC_APP_URL}/enseignant/qcm/${qcmId}`}
            >
              Voir le QCM
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// app/api/emails/send/route.ts
import { render } from '@react-email/components'
import { QCMGeneratedEmail } from '@/emails/QCMGenerated'
import { sendEmail } from '@/core/lib/email'

export async function POST(request: Request) {
  const { to, qcmTitle, qcmId, userName } = await request.json()
  
  const emailHtml = await render(
    QCMGeneratedEmail({ qcmTitle, qcmId, userName })
  )
  
  await sendEmail({
    to,
    subject: 'QCM Généré avec Succès',
    html: emailHtml,
  })
  
  return Response.json({ success: true })
}
```

**Règle:** Utiliser React-Email pour créer des emails en React. Plus maintenable que les templates HTML.

### 7. Inngest - Workflows

```typescript
// inngest/functions/qcm-generation.ts
import { inngest } from '@/core/lib/inngest'

export const qcmGenerationWorkflow = inngest.createFunction(
  { id: 'qcm-generation' },
  { event: 'qcm/generate.requested' },
  async ({ event, step }) => {
    // Étape 1: Extraire le texte du document
    const text = await step.run('extract-text', async () => {
      return await extractTextFromDocument(event.data.documentId)
    })
    
    // Étape 2: Générer les questions (peut prendre du temps)
    const questions = await step.run('generate-questions', async () => {
      return await generateQuestionsWithAI(text, event.data.numQuestions)
    })
    
    // Étape 3: Sauvegarder le QCM
    const qcm = await step.run('save-qcm', async () => {
      return await saveQCM({
        ...event.data,
        questions,
      })
    })
    
    // Étape 4: Envoyer notification
    await step.run('send-notification', async () => {
      await sendNotification({
        userId: event.data.userId,
        message: `QCM "${qcm.title}" généré avec succès`,
      })
    })
    
    return { qcmId: qcm.id }
  }
)

// Déclencher le workflow
import { inngest } from '@/core/lib/inngest'

export async function triggerQCMGeneration(data: {
  documentId: string
  numQuestions: number
  userId: string
}) {
  await inngest.send({
    name: 'qcm/generate.requested',
    data,
  })
}
```

**Règle:** Utiliser Inngest pour les workflows complexes (génération QCM, notifications, exports). Plus robuste que des tâches séquentielles.

### 8. React Hotkeys

```typescript
// features/qcm/components/ExamPlayer.tsx
'use client'

import { useHotkeys } from 'react-hotkeys-hook'

export function ExamPlayer({ exam, onSubmit }: ExamPlayerProps) {
  // Raccourcis clavier
  useHotkeys('ctrl+s', (e) => {
    e.preventDefault()
    handleSave()
  })
  
  useHotkeys('ctrl+enter', (e) => {
    e.preventDefault()
    onSubmit()
  })
  
  useHotkeys('n', () => {
    goToNextQuestion()
  }, { enableOnFormTags: true })
  
  useHotkeys('p', () => {
    goToPreviousQuestion()
  }, { enableOnFormTags: true })
  
  return (
    <div>
      {/* ... */}
      <div className="text-sm text-gray-500">
        Raccourcis: Ctrl+S (sauvegarder), Ctrl+Enter (soumettre), N (suivant), P (précédent)
      </div>
    </div>
  )
}
```

**Règle:** Ajouter des raccourcis clavier pour améliorer l'UX, surtout pour les examens.

### 9. AI SDK (Vercel) - Intégration IA

```typescript
// core/lib/ai.ts
import { openai } from '@ai-sdk/openai'
import { generateText, streamText } from 'ai'

export async function generateQuestionFromText(text: string) {
  const { text: question } = await generateText({
    model: openai('gpt-4'),
    prompt: `Génère une question de QCM à partir de ce texte: ${text}`,
    temperature: 0.7,
  })
  
  return question
}

// Utilisation dans Server Action
'use server'
import { generateQuestionFromText } from '@/core/lib/ai'

export async function generateQCMAction(text: string) {
  const question = await generateQuestionFromText(text)
  return { question }
}

// Streaming (pour affichage progressif)
'use client'
import { useChat } from 'ai/react'

export function QCMGenerator() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
  })
  
  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>{m.content}</div>
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit">Générer</button>
      </form>
    </div>
  )
}
```

**Règle:** Utiliser AI SDK pour les intégrations IA côté frontend. Supporte streaming et plusieurs providers.

### 10. Configuration Next.js

```typescript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configuration pour App Router
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  
  // Images optimization
  images: {
    domains: ['localhost', process.env.NEXT_PUBLIC_APP_URL],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Compression
  compress: true,
  
  // Proxy vers Flask backend
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.BACKEND_URL}/:path*`,
      },
    ]
  },
  
  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

### 11. Middleware - Protection des Routes

```typescript
// middleware.ts (racine)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/core/lib/auth'

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })
  
  const { pathname } = request.nextUrl
  
  // Routes publiques
  const publicRoutes = ['/', '/login', '/register', '/about']
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }
  
  // Pas authentifié → redirection login
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Protection par rôle
  const roleRoutes = {
    enseignant: ['/enseignant'],
    etudiant: ['/etudiant'],
    admin: ['/admin'],
  }
  
  const userRole = session.user.role
  for (const [role, routes] of Object.entries(roleRoutes)) {
    if (routes.some((route) => pathname.startsWith(route))) {
      if (userRole !== role && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
```

### 12. TypeScript Strict

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Règle:** TOUJOURS utiliser TypeScript en mode strict. Pas de `any` sauf cas exceptionnel avec commentaire.

### 13. shadcn/ui Components

```typescript
// shared/components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/utils/cn"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

**Règle:** Utiliser shadcn/ui pour tous les composants UI. Copier les composants dans `shared/components/ui/` et les personnaliser si nécessaire.

## Checklist de Code Review

Avant de soumettre du code, vérifier:

- [ ] Server Components utilisés par défaut
- [ ] `'use client'` uniquement si nécessaire
- [ ] SWR utilisé pour toutes les requêtes API
- [ ] Zustand pour state global uniquement
- [ ] Nuqs pour les filtres partageables
- [ ] Next-safe-action pour les mutations
- [ ] Types TypeScript stricts (pas de `any`)
- [ ] Composants shadcn/ui utilisés
- [ ] Middleware protège les routes
- [ ] Images optimisées avec `next/image`
- [ ] Erreurs gérées avec error boundaries
- [ ] Loading states avec Suspense

## Commandes Utiles

```bash
# Démarrer en développement
npm run dev

# Build production
npm run build

# Linting
npm run lint

# Tests
npm run test

# Ajouter composant shadcn/ui
npx shadcn@latest add button

# Type checking
npm run type-check
```



