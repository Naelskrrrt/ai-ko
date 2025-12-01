"use client";

import type { DashboardStats, UrgentAction } from "@/shared/types/admin.types";

import * as React from "react";
import {
  Users,
  FileQuestion,
  ClipboardList,
  UserCheck,
  GraduationCap,
  BookOpen,
  Settings,
  ArrowRight,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import NextLink from "next/link";

import { adminService } from "@/shared/services/api/admin.service";
import { useToast } from "@/hooks/use-toast";
import { UrgentActionsBar } from "@/components/admin/UrgentActionsBar";

export default function AdminDashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [urgentActions, setUrgentActions] = React.useState<UrgentAction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    fetchStats();
    fetchUrgentActions();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardStats();

      setStats(data);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description:
          error.response?.data?.message ||
          "Erreur lors du chargement des statistiques",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUrgentActions = async () => {
    try {
      const actions = await adminService.getUrgentActions();

      setUrgentActions(actions);
    } catch (error) {
      console.error("Erreur lors du chargement des actions urgentes:", error);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";

    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (
    role: string,
  ): "danger" | "default" | "secondary" | "warning" => {
    switch (role) {
      case "admin":
        return "danger";
      case "enseignant":
        return "default";
      case "etudiant":
        return "secondary";
      default:
        return "warning";
    }
  };

  const getStatusColor = (
    status: string,
  ): "success" | "default" | "secondary" | "warning" => {
    switch (status) {
      case "published":
        return "success";
      case "draft":
        return "secondary";
      case "archived":
        return "warning";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-default-500">Chargement...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-default-500">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Administration</h1>
          <p className="text-default-500">Vue d'ensemble du système</p>
        </div>
        <Button
          as={NextLink}
          className="bg-theme-primary text-white hover:bg-theme-primary/90"
          href="/admin/users"
        >
          Gérer les utilisateurs
        </Button>
      </div>

      {/* Barre d'actions urgentes */}
      <UrgentActionsBar actions={urgentActions} role="admin" />

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium">Total Utilisateurs</p>
            <Users className="h-4 w-4 text-default-500" />
          </CardHeader>
          <CardBody className="pt-0">
            <div className="text-2xl font-bold">{stats.metrics.totalUsers}</div>
            <p className="text-xs text-default-500">
              {stats.metrics.activeUsers} actifs
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium">Total QCM</p>
            <ClipboardList className="h-4 w-4 text-default-500" />
          </CardHeader>
          <CardBody className="pt-0">
            <div className="text-2xl font-bold">{stats.metrics.totalQcms}</div>
            <p className="text-xs text-default-500">Questionnaires créés</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium">Total Questions</p>
            <FileQuestion className="h-4 w-4 text-default-500" />
          </CardHeader>
          <CardBody className="pt-0">
            <div className="text-2xl font-bold">
              {stats.metrics.totalQuestions}
            </div>
            <p className="text-xs text-default-500">Questions disponibles</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium">Utilisateurs Actifs</p>
            <UserCheck className="h-4 w-4 text-default-500" />
          </CardHeader>
          <CardBody className="pt-0">
            <div className="text-2xl font-bold">
              {stats.metrics.activeUsers}
            </div>
            <p className="text-xs text-default-500">Comptes vérifiés</p>
          </CardBody>
        </Card>
      </div>

      {/* Navigation rapide */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardBody className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <Button
                as={NextLink}
                href="/admin/etudiants"
                isIconOnly
                variant="light"
                size="sm"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <h3 className="text-lg font-semibold mb-2">Gérer les Étudiants</h3>
            <p className="text-sm text-default-500">
              Créer, modifier et assigner des étudiants aux classes et matières
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Chip size="sm" color="secondary">
                {stats?.usersByRole?.etudiant || 0} étudiants
              </Chip>
            </div>
          </CardBody>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardBody className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <Button
                as={NextLink}
                href="/admin/professeurs"
                isIconOnly
                variant="light"
                size="sm"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <h3 className="text-lg font-semibold mb-2">Gérer les Professeurs</h3>
            <p className="text-sm text-default-500">
              Créer, modifier et assigner des professeurs aux matières
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Chip size="sm" color="default">
                {stats?.usersByRole?.enseignant || 0} professeurs
              </Chip>
            </div>
          </CardBody>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardBody className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <Button
                as={NextLink}
                href="/admin/ai-configs"
                isIconOnly
                variant="light"
                size="sm"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <h3 className="text-lg font-semibold mb-2">Configurations IA</h3>
            <p className="text-sm text-default-500">
              Gérer les modèles IA utilisés pour la génération de QCM
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Chip size="sm" color="success">
                Modèles actifs
              </Chip>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Utilisateurs par rôle */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Utilisateurs par Rôle</h3>
            <p className="text-sm text-default-500">
              Répartition des rôles dans le système
            </p>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {Object.entries(stats.usersByRole).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium capitalize">{role}</p>
                  </div>
                  <div className="ml-auto font-medium">{count}</div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* QCM par statut */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">QCM par Statut</h3>
            <p className="text-sm text-default-500">
              Répartition des QCM par état
            </p>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {Object.entries(stats.qcmsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex-1">
                    <Chip color={getStatusColor(status)} size="sm">
                      {status}
                    </Chip>
                  </div>
                  <div className="ml-auto font-medium">{count}</div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Derniers utilisateurs */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
              Derniers Utilisateurs Inscrits
            </h3>
            <p className="text-sm text-default-500">
              Les 5 utilisateurs les plus récents
            </p>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {stats.recentUsers.length === 0 ? (
                <p className="text-sm text-default-500 text-center py-4">
                  Aucun utilisateur
                </p>
              ) : (
                stats.recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-theme-primary/20 flex items-center justify-center text-xs font-semibold text-theme-primary">
                      {getInitials(user.name)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-default-500">{user.email}</p>
                    </div>
                    <Chip color={getRoleColor(user.role)} size="sm">
                      {user.role}
                    </Chip>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>

        {/* Derniers QCM */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Derniers QCM Créés</h3>
            <p className="text-sm text-default-500">
              Les 5 QCM les plus récents
            </p>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {stats.recentQcms.length === 0 ? (
                <p className="text-sm text-default-500 text-center py-4">
                  Aucun QCM
                </p>
              ) : (
                stats.recentQcms.map((qcm) => (
                  <div key={qcm.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{qcm.titre}</p>
                      <p className="text-xs text-default-500">
                        {qcm.nombreQuestions} questions • Par{" "}
                        {qcm.createur?.name || "Inconnu"}
                      </p>
                    </div>
                    <Chip color={getStatusColor(qcm.status)} size="sm">
                      {qcm.status}
                    </Chip>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
