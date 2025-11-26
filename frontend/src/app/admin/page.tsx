"use client";

import * as React from "react";
import { Users, FileQuestion, ClipboardList, UserCheck } from "lucide-react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import NextLink from "next/link";
import { adminService } from "@/shared/services/api/admin.service";
import type { DashboardStats } from "@/shared/types/admin.types";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors du chargement des statistiques",
        variant: "error",
      });
    } finally {
      setLoading(false);
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

  const getRoleColor = (role: string): "danger" | "default" | "secondary" | "warning" => {
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

  const getStatusColor = (status: string): "success" | "default" | "secondary" | "warning" => {
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
          href="/admin/users"
          className="bg-theme-primary text-white hover:bg-theme-primary/90"
        >
          Gérer les utilisateurs
        </Button>
      </div>

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
            <p className="text-xs text-default-500">
              Questionnaires créés
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium">Total Questions</p>
            <FileQuestion className="h-4 w-4 text-default-500" />
          </CardHeader>
          <CardBody className="pt-0">
            <div className="text-2xl font-bold">{stats.metrics.totalQuestions}</div>
            <p className="text-xs text-default-500">
              Questions disponibles
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium">Utilisateurs Actifs</p>
            <UserCheck className="h-4 w-4 text-default-500" />
          </CardHeader>
          <CardBody className="pt-0">
            <div className="text-2xl font-bold">{stats.metrics.activeUsers}</div>
            <p className="text-xs text-default-500">
              Comptes vérifiés
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Utilisateurs par rôle */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Utilisateurs par Rôle</h3>
            <p className="text-sm text-default-500">Répartition des rôles dans le système</p>
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
            <p className="text-sm text-default-500">Répartition des QCM par état</p>
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
            <h3 className="text-lg font-semibold">Derniers Utilisateurs Inscrits</h3>
            <p className="text-sm text-default-500">Les 5 utilisateurs les plus récents</p>
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
            <p className="text-sm text-default-500">Les 5 QCM les plus récents</p>
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
                        {qcm.nombreQuestions} questions • Par {qcm.createur?.name || "Inconnu"}
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

