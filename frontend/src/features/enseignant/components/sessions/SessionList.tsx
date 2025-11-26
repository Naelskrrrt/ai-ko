'use client'

import * as React from 'react'
import { Card, CardBody } from '@heroui/card'
import { Button } from '@heroui/button'
import { Chip } from '@heroui/chip'
import { Select, SelectItem } from '@heroui/select'
import { Input } from '@heroui/input'
import {
  Calendar,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Play,
  Square,
  Clock,
} from 'lucide-react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { parseAsString, useQueryState } from 'nuqs'
import { sessionService } from '../../services/session.service'
import type { SessionExamen } from '../../types/enseignant.types'
import { CreateSessionModal } from './CreateSessionModal'
import { useDisclosure } from '@heroui/modal'
import { ListPageLayout } from '@/shared/components/layout/ListPageLayout'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'

interface SessionListProps {
  userId: string
}

export function SessionList({ userId }: SessionListProps) {
  const router = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isDeleteConfirmOpen, onOpen: onDeleteConfirmOpen, onClose: onDeleteConfirmClose } = useDisclosure()
  const { isOpen: isTerminerConfirmOpen, onOpen: onTerminerConfirmOpen, onClose: onTerminerConfirmClose } = useDisclosure()
  const [sessionToDelete, setSessionToDelete] = React.useState<string | null>(null)
  const [sessionToTerminer, setSessionToTerminer] = React.useState<string | null>(null)

  // Filtres dans l'URL avec nuqs
  const [statusFilter, setStatusFilter] = useQueryState(
    'status',
    parseAsString.withDefault('all')
  )
  const [searchQuery, setSearchQuery] = React.useState('')

  // Récupérer les sessions
  const { data, isLoading, error, mutate } = useSWR(
    ['enseignant-sessions-list', userId, statusFilter],
    () =>
      sessionService.getSessions({
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 100,
      })
  )

  const sessions = data?.data || []

  // Filtrer localement par recherche
  const filteredSessions = React.useMemo(() => {
    if (!searchQuery) return sessions

    const query = searchQuery.toLowerCase()
    return sessions.filter(
      (session) =>
        session.titre.toLowerCase().includes(query) ||
        session.description?.toLowerCase().includes(query) ||
        session.qcm?.titre.toLowerCase().includes(query)
    )
  }, [sessions, searchQuery])

  const handleDelete = (id: string) => {
    setSessionToDelete(id)
    onDeleteConfirmOpen()
  }

  const confirmDelete = async () => {
    if (!sessionToDelete) return
    try {
      await sessionService.deleteSession(sessionToDelete)
      mutate()
      setSessionToDelete(null)
    } catch (error) {
      console.error('Erreur suppression session:', error)
      alert('Erreur lors de la suppression de la session')
    }
  }

  const handleDemarrer = async (id: string) => {
    try {
      await sessionService.demarrerSession(id)
      mutate()
    } catch (error) {
      console.error('Erreur démarrage session:', error)
      alert('Erreur lors du démarrage de la session')
    }
  }

  const handleTerminer = (id: string) => {
    setSessionToTerminer(id)
    onTerminerConfirmOpen()
  }

  const confirmTerminer = async () => {
    if (!sessionToTerminer) return
    try {
      await sessionService.terminerSession(sessionToTerminer)
      mutate()
      setSessionToTerminer(null)
    } catch (error) {
      console.error('Erreur fin session:', error)
      alert('Erreur lors de la terminaison de la session')
    }
  }

  const getStatusColor = (status: SessionExamen['status']) => {
    switch (status) {
      case 'en_cours':
        return 'success'
      case 'programmee':
        return 'primary'
      case 'terminee':
        return 'default'
      case 'annulee':
        return 'danger'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: SessionExamen['status']) => {
    switch (status) {
      case 'en_cours':
        return 'En cours'
      case 'programmee':
        return 'Programmée'
      case 'terminee':
        return 'Terminée'
      case 'annulee':
        return 'Annulée'
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <>
      {/* Modal de création de session */}
      <CreateSessionModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={() => {
          mutate()
          onClose()
        }}
      />

      <ListPageLayout
        title="Mes Sessions"
        description="Gérez vos sessions d'examen"
        searchPlaceholder="Rechercher une session..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        addButtonLabel="Nouvelle Session"
        onAddClick={onOpen}
        contentWrapperClassName="p-4"
        filters={[
          {
            label: 'Statut',
            value: statusFilter === 'all' ? null : statusFilter,
            placeholder: 'Tous les statuts',
            onChange: (value) => setStatusFilter(value || 'all'),
            options: [
              { key: 'all', label: 'Tous les statuts', value: 'all' },
              { key: 'programmee', label: 'Programmées', value: 'programmee' },
              { key: 'en_cours', label: 'En cours', value: 'en_cours' },
              { key: 'terminee', label: 'Terminées', value: 'terminee' },
              { key: 'annulee', label: 'Annulées', value: 'annulee' },
            ],
          },
        ]}
      >
        {/* Liste des sessions */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <Card>
                <CardBody>
                  <div className="h-32 bg-default-200 rounded-lg" />
                </CardBody>
              </Card>
            </div>
          ))}
        </div>
      ) : error ? (
        <Card className="border-none shadow-sm">
          <CardBody className="text-center py-8 text-danger">
            Erreur lors du chargement des sessions
          </CardBody>
        </Card>
      ) : filteredSessions.length === 0 ? (
        <Card className="border-none shadow-sm">
          <CardBody className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-default-300" />
            <h3 className="text-lg font-semibold mb-2">Aucune session trouvée</h3>
            <p className="text-default-500 mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'Aucune session ne correspond à vos critères de recherche'
                : 'Commencez par créer votre première session d\'examen'}
            </p>
            
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <Card
              key={session.id}
              className="border-none shadow-sm hover:shadow-md transition-shadow"
            >
              <CardBody>
                <div className="flex items-start gap-4">
                  {/* Icône */}
                  <div className="bg-primary/10 rounded-lg p-3">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>

                  {/* Informations */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">
                          {session.titre}
                        </h3>
                        {session.description && (
                          <p className="text-sm text-default-500 mt-1 line-clamp-2">
                            {session.description}
                          </p>
                        )}
                      </div>
                      <Chip
                        size="sm"
                        color={getStatusColor(session.status)}
                        variant="flat"
                      >
                        {getStatusLabel(session.status)}
                      </Chip>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-default-500 mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>Début: {formatDate(session.dateDebut)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>Durée: {session.dureeMinutes} min</span>
                      </div>
                      {session.qcm && (
                        <div className="col-span-2">
                          <span className="font-medium">QCM:</span> {session.qcm.titre}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="flat"
                        startContent={<Eye className="w-3 h-3" />}
                        onPress={() => router.push(`/enseignant/sessions/${session.id}`)}
                      >
                        Voir
                      </Button>
                      {/* <Button
                        size="sm"
                        variant="flat"
                        startContent={<Edit className="w-3 h-3" />}
                        onPress={() =>
                          router.push(`/enseignant/sessions/${session.id}/edit`)
                        }
                      >
                        Modifier
                      </Button> */}
                      {session.status === 'programmee' && (
                        <Button
                          size="sm"
                          color="success"
                          variant="flat"
                          startContent={<Play className="w-3 h-3" />}
                          onPress={() => handleDemarrer(session.id)}
                        >
                          Démarrer
                        </Button>
                      )}
                      {session.status === 'en_cours' && (
                        <Button
                          size="sm"
                          color="warning"
                          variant="flat"
                          startContent={<Square className="w-3 h-3" />}
                          onPress={() => handleTerminer(session.id)}
                        >
                          Terminer
                        </Button>
                      )}
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        startContent={<Trash2 className="w-3 h-3" />}
                        onPress={() => handleDelete(session.id)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
      </ListPageLayout>

      {/* Modal de confirmation de suppression */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          onDeleteConfirmClose()
          setSessionToDelete(null)
        }}
        onConfirm={confirmDelete}
        title="Supprimer la session"
        message="Êtes-vous sûr de vouloir supprimer cette session ?"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        confirmColor="danger"
        variant="danger"
      />

      {/* Modal de confirmation de terminaison */}
      <ConfirmDialog
        isOpen={isTerminerConfirmOpen}
        onClose={() => {
          onTerminerConfirmClose()
          setSessionToTerminer(null)
        }}
        onConfirm={confirmTerminer}
        title="Terminer la session"
        message="Êtes-vous sûr de vouloir terminer cette session ?"
        confirmLabel="Terminer"
        cancelLabel="Annuler"
        confirmColor="warning"
        variant="warning"
      />
    </>
  )
}
