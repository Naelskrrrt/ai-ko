'use client'

import * as React from 'react'
import { Card, CardBody } from '@heroui/card'
import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import { Select, SelectItem } from '@heroui/select'
import { Search, Plus } from 'lucide-react'

interface FilterOption {
  key: string
  label: string
  value: string
}

interface ListPageLayoutProps {
  title: string
  description?: string
  searchPlaceholder?: string
  searchValue: string
  onSearchChange: (value: string) => void
  addButtonLabel: string
  onAddClick: () => void
  filters?: Array<{
    label: string
    value: string | null
    options: FilterOption[]
    onChange: (value: string | null) => void
    placeholder?: string
  }>
  children: React.ReactNode
  headerActions?: React.ReactNode
  contentWrapperClassName?: string
}

export function ListPageLayout({
  title,
  description,
  searchPlaceholder = 'Rechercher...',
  searchValue,
  onSearchChange,
  addButtonLabel,
  onAddClick,
  filters = [],
  children,
  headerActions,
  contentWrapperClassName = '',
}: ListPageLayoutProps) {
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && (
            <p className="text-default-500">{description}</p>
          )}
        </div>
        {headerActions}
      </div>

      {/* Recherche et bouton d'ajout */}
      <Card>
        <CardBody className="flex flex-row gap-4">
          <Input
            placeholder={searchPlaceholder}
            startContent={<Search className="w-4 h-4" />}
            value={searchValue}
            onValueChange={onSearchChange}
            className="flex-1"
          />
          <Button
            className="bg-theme-primary text-white hover:bg-theme-primary/90"
            startContent={<Plus className="w-4 h-4" />}
            onPress={onAddClick}
          >
            {addButtonLabel}
          </Button>
        </CardBody>
      </Card>

      {/* Filtres et contenu */}
      <Card>
        <CardBody className="flex flex-col gap-4">
          {filters.length > 0 && (
            <div className={`grid grid-cols-1 ${filters.length === 1 ? 'md:grid-cols-1' : filters.length === 2 ? 'md:grid-cols-2' : filters.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-4`}>
              {filters.map((filter, index) => (
                <Select
                  key={index}
                  label={filter.label}
                  placeholder={filter.placeholder || `Tous les ${filter.label.toLowerCase()}`}
                  selectedKeys={filter.value ? [filter.value] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string
                    filter.onChange(selectedKey || null)
                  }}
                >
                  {filter.options.map((option) => (
                    <SelectItem key={option.key} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </Select>
              ))}
            </div>
          )}
          <div className={`flex-1 ${contentWrapperClassName || 'rounded-lg border border-slate-50'}`}>
            {children}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

