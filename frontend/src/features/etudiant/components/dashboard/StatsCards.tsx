"use client";

import useSWR from "swr";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { FileText, TrendingUp, Award, Clock } from "lucide-react";

import { etudiantService } from "../../services/etudiant.service";

interface StatsCardsProps {
  userId: string;
}

export function StatsCards({ userId }: StatsCardsProps) {
  const { data: stats, isLoading } = useSWR(
    userId ? ["etudiant-stats", userId] : null,
    () => etudiantService.getStats(userId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      errorRetryCount: 0,
      shouldRetryOnError: false,
    },
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-20 bg-default-100" />
            <CardBody className="h-16 bg-default-100" />
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Examens passés",
      value: stats?.examens_passes || 0,
      icon: FileText,
      color: "text-theme-primary",
      bgColor: "bg-theme-primary/10",
    },
    {
      title: "Moyenne générale",
      value: `${stats?.moyenne_generale?.toFixed(2) || 0}/20`,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success-50",
    },
    {
      title: "Taux de réussite",
      value: `${stats?.taux_reussite || 0}%`,
      icon: Award,
      color: "text-secondary",
      bgColor: "bg-secondary-50",
    },
    {
      title: "Examens en attente",
      value: stats?.examens_en_attente || 0,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.title} className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
              <h3 className="text-sm font-medium text-default-500">
                {card.title}
              </h3>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardBody className="px-4 pb-4 pt-0">
              <div className="text-2xl font-bold">{card.value}</div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
