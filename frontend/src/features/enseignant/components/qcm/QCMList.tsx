'use client'

import * as React from 'react'
import { Card, CardBody } from '@heroui/card'
import { Button } from '@heroui/button'
import { Chip } from '@heroui/chip'
import { Select, SelectItem } from '@heroui/select'
import { Input } from '@heroui/input'
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Eye,
  Send,
  Link,
} from 'lucide-react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { parseAsString, useQueryState } from 'nuqs'
import { qcmService } from '../../services/qcm.service'
import type { QCM } from '../../types/enseignant.types'
import { CreateQCMModal } from './CreateQCMModal'
import { useDisclosure } from '@heroui/modal'
import { ListPageLayout } from '@/shared/components/layout/ListPageLayout'
import { useToast } from '@/hooks/use-toast'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'

interface QCMListProps {
  userId: string
}

export function QCMList({ userId }: QCMListProps) {
  const router = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isDeleteConfirmOpen, onOpen: onDeleteConfirmOpen, onClose: onDeleteConfirmClose } = useDisclosure()
  const [qcmToDelete, setQcmToDelete] = React.useState<string | null>(null)
  const { toast } = useToast()

  // Filtres dans l'URL avec nuqs
  const [statusFilter, setStatusFilter] = useQueryState(
    'status',
    parseAsString.withDefault('all')
  )
  const [matiereFilter, setMatiereFilter] = useQueryState(
    'matiere',
    parseAsString.withDefault('all')
  )
  const [searchQuery, setSearchQuery] = React.useState('')

  // Récupérer les QCMs
  const { data, isLoading, error, mutate } = useSWR(
    ['enseignant-qcms-list', userId, statusFilter, matiereFilter],
    () =>
      qcmService.getQCMs({
        status: statusFilter === 'all' ? undefined : (statusFilter as any),
        matiere: matiereFilter === 'all' ? undefined : matiereFilter,
        limit: 100,
      })
  )

  const qcms = data?.data || []

  // Filtrer localement par recherche
  const filteredQCMs = React.useMemo(() => {
    if (!searchQuery) return qcms

    const query = searchQuery.toLowerCase()
    return qcms.filter(
      (qcm) =>
        qcm.titre.toLowerCase().includes(query) ||
        qcm.matiere?.toLowerCase().includes(query) ||
        qcm.description?.toLowerCase().includes(query)
    )
  }, [qcms, searchQuery])

  // Matières uniques pour le filtre
  const matieres = React.useMemo(() => {
    const uniqueMatieres = new Set(qcms.map((q) => q.matiere).filter(Boolean))
    return Array.from(uniqueMatieres)
  }, [qcms])

  const handleDelete = (id: string) => {
    setQcmToDelete(id)
    onDeleteConfirmOpen()
  }

  const confirmDelete = async () => {
    if (!qcmToDelete) return
    try {
      await qcmService.deleteQCM(qcmToDelete)
      mutate() // Revalider le cache SWR
      setQcmToDelete(null)
    } catch (error) {
      console.error('Erreur suppression QCM:', error)
      alert('Erreur lors de la suppression du QCM')
    }
  }

  const handlePublish = async (id: string) => {
    try {
      await qcmService.publishQCM(id)
      mutate() // Revalider le cache SWR
    } catch (error) {
      console.error('Erreur publication QCM:', error)
      alert('Erreur lors de la publication du QCM')
    }
  }

  const handleCopyLink = async (qcmId: string) => {
    try {
      const link = qcmService.getShareableLink(qcmId)
      await navigator.clipboard.writeText(link)
      toast({
        title: 'Lien copié',
        description: 'Le lien du QCM a été copié dans le presse-papier',
        variant: 'success',
      })
    } catch (error) {
      console.error('Erreur copie lien:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de copier le lien',
        variant: 'error',
      })
    }
  }

  const getStatusColor = (status: QCM['status']) => {
    switch (status) {
      case 'published':
        return 'success'
      case 'draft':
        return 'warning'
      case 'archived':
        return 'default'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: QCM['status']) => {
    switch (status) {
      case 'published':
        return 'Publié'
      case 'draft':
        return 'Brouillon'
      case 'archived':
        return 'Archivé'
      default:
        return status
    }
  }

  return (
    <>
      {/* Modal de création de QCM */}
      <CreateQCMModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={(qcmId) => {
          mutate()
          onClose()
        }}
      />

      <ListPageLayout
        title="Mes QCMs"
        description="Gérez vos questionnaires à choix multiples"
        searchPlaceholder="Rechercher un QCM..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        addButtonLabel="Nouveau QCM"
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
              { key: 'draft', label: 'Brouillons', value: 'draft' },
              { key: 'published', label: 'Publiés', value: 'published' },
              { key: 'archived', label: 'Archivés', value: 'archived' },
            ],
          },
          {
            label: 'Matière',
            value: matiereFilter === 'all' ? null : matiereFilter,
            placeholder: 'Toutes les matières',
            onChange: (value) => setMatiereFilter(value || 'all'),
            options: [
              { key: 'all', label: 'Toutes les matières', value: 'all' },
              ...matieres.map((matiere) => ({
                key: matiere,
                label: matiere,
                value: matiere,
              })),
            ],
          },
        ]}
      >
        {/* Liste des QCMs */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <Card>
                <CardBody>
                  <div className="h-24 bg-default-200 rounded-lg" />
                </CardBody>
              </Card>
            </div>
          ))}
        </div>
      ) : error ? (
        <Card className="border-none shadow-sm">
          <CardBody className="text-center py-8 text-danger">
            Erreur lors du chargement des QCMs
          </CardBody>
        </Card>
      ) : filteredQCMs.length === 0 ? (
        <Card className="border-none shadow-sm">
          <CardBody className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-default-300" />
            <h3 className="text-lg font-semibold mb-2">Aucun QCM trouvé</h3>
            <p className="text-default-500 mb-4">
              {searchQuery || statusFilter !== 'all' || matiereFilter !== 'all'
                ? 'Aucun QCM ne correspond à vos critères de recherche'
                : 'Commencez par créer votre premier QCM'}
            </p>
            <Button
              color="primary"
              variant="flat"
              startContent={<Plus className="w-4 h-4" />}
              onPress={onOpen}
            >
              Créer un QCM
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredQCMs.map((qcm) => (
            <Card key={qcm.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardBody>
                <div className="flex items-start gap-4">
                  {/* Icône */}
                  <div className="bg-primary/10 rounded-lg p-3">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>

                  {/* Informations */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">
                          {qcm.titre}
                        </h3>
                        {qcm.description && (
                          <p className="text-sm text-default-500 mt-1 line-clamp-2">
                            {qcm.description}
                          </p>
                        )}
                      </div>
                      <Chip
                        size="sm"
                        color={getStatusColor(qcm.status)}
                        variant="flat"
                      >
                        {getStatusLabel(qcm.status)}
                      </Chip>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-default-500 mb-3">
                      <span>{qcm.matiere || 'Non spécifiée'}</span>
                      <span>•</span>
                      <span>{qcm.nombreQuestions} questions</span>
                      {qcm.duree && (
                        <>
                          <span>•</span>
                          <span>{qcm.duree} min</span>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        startContent={<Eye className="w-3 h-3" />}
                        onPress={() => router.push(`/enseignant/qcm/${qcm.id}`)}
                      >
                        Voir
                      </Button>
                      {qcm.status === 'published' && (
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          startContent={<Link className="w-3 h-3" />}
                          onPress={() => handleCopyLink(qcm.id)}
                        >
                          Copier le lien
                        </Button>
                      )}
                      {qcm.status === 'draft' && (
                        <Button
                          size="sm"
                          color="success"
                          variant="flat"
                          startContent={<Send className="w-3 h-3" />}
                          onPress={() => handlePublish(qcm.id)}
                        >
                          Publier
                        </Button>
                      )}
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        startContent={<Trash2 className="w-3 h-3" />}
                        onPress={() => handleDelete(qcm.id)}
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
    </>
  )
}
