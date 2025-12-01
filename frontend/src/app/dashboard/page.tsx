"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import {
  Battery,
  TrendingUp,
  Users,
  ShoppingCart,
  FileText,
  Settings,
  Bell,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Globe,
  Shield,
  Target,
  Layers,
} from "lucide-react";

import { DashboardContentArea } from "@/components/layout/content-area";

/**
 * Page dashboard générique - Template de base
 * Le layout avec sidebar est géré automatiquement par le système de layout conditionnel
 * Contient des exemples de cartes et de composants réutilisables
 */
export default function GeneralDashboard() {
  return (
    <DashboardContentArea
      subtitle="Tableau de bord principal avec test de scroll"
      title="Bienvenue sur votre Dashboard"
    >
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-md dark:hover:shadow-lg transition-shadow">
          <CardBody className="text-center">
            <TrendingUp className="w-8 h-8 text-theme-primary mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-theme-primary">+15.2%</h3>
            <p className="text-sm text-default-600 dark:text-default-400">
              Croissance mensuelle
            </p>
          </CardBody>
        </Card>

        <Card className="hover:shadow-md dark:hover:shadow-lg transition-shadow">
          <CardBody className="text-center">
            <Users className="w-8 h-8 text-theme-secondary mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-theme-secondary">1,247</h3>
            <p className="text-sm text-default-600 dark:text-default-400">
              Utilisateurs actifs
            </p>
          </CardBody>
        </Card>

        <Card className="hover:shadow-md dark:hover:shadow-lg transition-shadow">
          <CardBody className="text-center">
            <ShoppingCart className="w-8 h-8 text-theme-accent mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-theme-accent">€89,420</h3>
            <p className="text-sm text-default-600 dark:text-default-400">
              Revenus ce mois
            </p>
          </CardBody>
        </Card>

        <Card className="hover:shadow-md dark:hover:shadow-lg transition-shadow">
          <CardBody className="text-center">
            <Activity className="w-8 h-8 text-theme-primary mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-theme-primary">98.5%</h3>
            <p className="text-sm text-default-600 dark:text-default-400">
              Temps de disponibilité
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Contenu principal du dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Exemple de carte - Statistiques */}
        <Card className="hover:shadow-md dark:hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-theme-primary" />
              <h3 className="font-semibold">Statistiques</h3>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-default-600 dark:text-default-400 mb-4">
              Visualisez vos données et métriques principales.
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Ventes totales</span>
                <span className="font-semibold text-theme-primary">+12.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Nouveaux clients</span>
                <span className="font-semibold text-theme-secondary">
                  +8.2%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Taux de conversion</span>
                <span className="font-semibold text-theme-accent">3.4%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Rétention client</span>
                <span className="font-semibold text-theme-primary">87.3%</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Exemple de carte - Actions rapides */}
        <Card className="hover:shadow-md dark:hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-theme-secondary" />
              <h3 className="font-semibold">Actions rapides</h3>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-default-600 dark:text-default-400 mb-4">
              Accédez rapidement aux fonctionnalités principales.
            </p>
            <div className="space-y-2">
              <button className="w-full p-3 rounded-lg bg-theme-primary/10 dark:bg-theme-primary/20 text-theme-primary text-sm font-medium hover:bg-theme-primary/20 dark:hover:bg-theme-primary/30 transition-colors text-left">
                📊 Générer rapport mensuel
              </button>
              <button className="w-full p-3 rounded-lg bg-theme-secondary/10 dark:bg-theme-secondary/20 text-theme-secondary text-sm font-medium hover:bg-theme-secondary/20 dark:hover:bg-theme-secondary/30 transition-colors text-left">
                📧 Envoyer newsletter
              </button>
              <button className="w-full p-3 rounded-lg bg-theme-accent/10 dark:bg-theme-accent/20 text-theme-accent text-sm font-medium hover:bg-theme-accent/20 dark:hover:bg-theme-accent/30 transition-colors text-left">
                ⚙️ Paramètres système
              </button>
              <button className="w-full p-3 rounded-lg bg-theme-primary/10 dark:bg-theme-primary/20 text-theme-primary text-sm font-medium hover:bg-theme-primary/20 dark:hover:bg-theme-primary/30 transition-colors text-left">
                🔄 Synchroniser données
              </button>
            </div>
          </CardBody>
        </Card>

        {/* Exemple de carte - Notifications */}
        <Card className="hover:shadow-md dark:hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-theme-accent" />
                <h3 className="font-semibold">Notifications</h3>
              </div>
              <span className="bg-danger text-white text-xs px-2 py-1 rounded-full ml-2">
                3
              </span>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="p-3 bg-danger/10 dark:bg-danger/20 rounded-lg border-l-4 border-danger">
                <p className="text-sm font-medium text-danger">
                  Alerte système
                </p>
                <p className="text-xs text-danger/80 mt-1">
                  Utilisation CPU élevée détectée
                </p>
              </div>
              <div className="p-3 bg-warning/10 dark:bg-warning/20 rounded-lg border-l-4 border-warning">
                <p className="text-sm font-medium text-warning">
                  Maintenance programmée
                </p>
                <p className="text-xs text-warning/80 mt-1">
                  Prévue demain à 2h00
                </p>
              </div>
              <div className="p-3 bg-success/10 dark:bg-success/20 rounded-lg border-l-4 border-success">
                <p className="text-sm font-medium text-success">
                  Sauvegarde terminée
                </p>
                <p className="text-xs text-success/80 mt-1">
                  Données sauvegardées avec succès
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Section graphiques et analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="hover:shadow-md dark:hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-theme-primary" />
              <h3 className="font-semibold">Répartition des ventes</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-theme-primary rounded-full" />
                  <span className="text-sm">Produit A</span>
                </div>
                <span className="text-sm font-medium">45%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-theme-secondary rounded-full" />
                  <span className="text-sm">Produit B</span>
                </div>
                <span className="text-sm font-medium">30%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-theme-accent rounded-full" />
                  <span className="text-sm">Produit C</span>
                </div>
                <span className="text-sm font-medium">15%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-default-400 rounded-full" />
                  <span className="text-sm">Autres</span>
                </div>
                <span className="text-sm font-medium">10%</span>
              </div>
              <div className="mt-4 p-4 bg-default-100 dark:bg-default-50 rounded-lg">
                <p className="text-sm text-default-600 dark:text-default-400">
                  📈 Évolution positive sur les 3 derniers mois
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="hover:shadow-md dark:hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-theme-secondary" />
              <h3 className="font-semibold">Planning de la semaine</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-theme-primary/10 dark:bg-theme-primary/20 rounded-lg">
                <div className="text-theme-primary font-bold text-sm">LUN</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Réunion équipe</p>
                  <p className="text-xs text-color-secondary">9h00 - 10h30</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-theme-secondary/10 dark:bg-theme-secondary/20 rounded-lg">
                <div className="text-theme-secondary font-bold text-sm">
                  MAR
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Présentation client</p>
                  <p className="text-xs text-color-secondary">14h00 - 16h00</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-theme-accent/10 dark:bg-theme-accent/20 rounded-lg">
                <div className="text-theme-accent font-bold text-sm">MER</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Formation équipe</p>
                  <p className="text-xs text-color-secondary">10h00 - 12h00</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-theme-primary/10 dark:bg-theme-primary/20 rounded-lg">
                <div className="text-theme-primary font-bold text-sm">JEU</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Revue de code</p>
                  <p className="text-xs text-color-secondary">15h00 - 17h00</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Section projet et tâches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="hover:shadow-md dark:hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-theme-primary" />
              <h3 className="font-semibold">Projets en cours</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="p-4 border-l-4 border-theme-primary bg-theme-primary/10 dark:bg-theme-primary/20">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-theme-primary">
                    Refonte UI/UX
                  </h4>
                  <span className="text-xs bg-theme-primary text-white px-2 py-1 rounded">
                    En cours
                  </span>
                </div>
                <p className="text-sm text-color-secondary mb-2">
                  Amélioration de l'interface utilisateur
                </p>
                <div className="w-full bg-default-200 dark:bg-default-500 rounded-full h-2">
                  <div
                    className="bg-theme-primary h-2 rounded-full"
                    style={{ width: "75%" }}
                  />
                </div>
                <p className="text-xs text-color-tertiary mt-1">75% complété</p>
              </div>

              <div className="p-4 border-l-4 border-success bg-success/10 dark:bg-success/20">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-success">API v2.0</h4>
                  <span className="text-xs bg-success text-white px-2 py-1 rounded">
                    Terminé
                  </span>
                </div>
                <p className="text-sm text-color-secondary mb-2">
                  Nouvelle version de l'API REST
                </p>
                <div className="w-full bg-default-200 dark:bg-default-500 rounded-full h-2">
                  <div
                    className="bg-success h-2 rounded-full"
                    style={{ width: "100%" }}
                  />
                </div>
                <p className="text-xs text-color-tertiary mt-1">
                  100% complété
                </p>
              </div>

              <div className="p-4 border-l-4 border-theme-secondary bg-theme-secondary/10 dark:bg-theme-secondary/20">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-theme-secondary">
                    Tests automatisés
                  </h4>
                  <span className="text-xs bg-theme-secondary text-white px-2 py-1 rounded">
                    En attente
                  </span>
                </div>
                <p className="text-sm text-color-secondary mb-2">
                  Mise en place des tests E2E
                </p>
                <div className="w-full bg-default-200 dark:bg-default-500 rounded-full h-2">
                  <div
                    className="bg-theme-secondary h-2 rounded-full"
                    style={{ width: "25%" }}
                  />
                </div>
                <p className="text-xs text-color-tertiary mt-1">25% complété</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="hover:shadow-md dark:hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-theme-primary" />
                <h3 className="font-semibold">Tâches du jour</h3>
              </div>
              <span className="text-xs bg-theme-primary/10 dark:bg-theme-primary/20 text-theme-primary px-2 py-1 rounded-full">
                6/10
              </span>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  checked
                  readOnly
                  className="w-4 h-4 text-success bg-default-100 dark:bg-default-700 border-default-300 dark:border-default-600 rounded"
                  type="checkbox"
                />
                <span className="text-sm line-through text-color-tertiary">
                  Réviser le code du module auth
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  checked
                  readOnly
                  className="w-4 h-4 text-success bg-default-100 dark:bg-default-700 border-default-300 dark:border-default-600 rounded"
                  type="checkbox"
                />
                <span className="text-sm line-through text-color-tertiary">
                  Mettre à jour la documentation
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  checked
                  readOnly
                  className="w-4 h-4 text-success bg-default-100 dark:bg-default-700 border-default-300 dark:border-default-600 rounded"
                  type="checkbox"
                />
                <span className="text-sm line-through text-color-tertiary">
                  Tester les nouvelles fonctionnalités
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  readOnly
                  className="w-4 h-4 text-theme-primary bg-default-100 dark:bg-default-700 border-default-300 dark:border-default-600 rounded"
                  type="checkbox"
                />
                <span className="text-sm">
                  Optimiser les performances de la base de données
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  readOnly
                  className="w-4 h-4 text-theme-primary bg-default-100 dark:bg-default-700 border-default-300 dark:border-default-600 rounded"
                  type="checkbox"
                />
                <span className="text-sm">Configurer le pipeline CI/CD</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  readOnly
                  className="w-4 h-4 text-theme-primary bg-default-100 dark:bg-default-700 border-default-300 dark:border-default-600 rounded"
                  type="checkbox"
                />
                <span className="text-sm">
                  Préparer la démonstration client
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  readOnly
                  className="w-4 h-4 text-theme-primary bg-default-100 dark:bg-default-700 border-default-300 dark:border-default-600 rounded"
                  type="checkbox"
                />
                <span className="text-sm">Analyser les logs de production</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  checked
                  readOnly
                  className="w-4 h-4 text-success bg-default-100 dark:bg-default-700 border-default-300 dark:border-default-600 rounded"
                  type="checkbox"
                />
                <span className="text-sm line-through text-color-tertiary">
                  Réunion hebdomadaire équipe
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  checked
                  readOnly
                  className="w-4 h-4 text-success bg-default-100 dark:bg-default-700 border-default-300 dark:border-default-600 rounded"
                  type="checkbox"
                />
                <span className="text-sm line-through text-color-tertiary">
                  Mise à jour des dépendances
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  checked
                  readOnly
                  className="w-4 h-4 text-success bg-default-100 dark:bg-default-700 border-default-300 dark:border-default-600 rounded"
                  type="checkbox"
                />
                <span className="text-sm line-through text-color-tertiary">
                  Backup des données critiques
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Section outils et ressources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-md dark:hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-theme-secondary" />
              <h3 className="font-semibold">Outils</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 hover:bg-color-secondary dark:hover:bg-color-tertiary rounded-lg cursor-pointer">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-theme-primary" />
                  <span className="text-sm">Monitoring</span>
                </div>
                <span className="text-xs text-success">●</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-color-secondary dark:hover:bg-color-tertiary rounded-lg cursor-pointer">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-theme-secondary" />
                  <span className="text-sm">Sécurité</span>
                </div>
                <span className="text-xs text-success">●</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-color-secondary dark:hover:bg-color-tertiary rounded-lg cursor-pointer">
                <div className="flex items-center gap-3">
                  <Layers className="w-4 h-4 text-theme-accent" />
                  <span className="text-sm">Logs</span>
                </div>
                <span className="text-xs text-warning">●</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-color-secondary dark:hover:bg-color-tertiary rounded-lg cursor-pointer">
                <div className="flex items-center gap-3">
                  <Battery className="w-4 h-4 text-theme-primary" />
                  <span className="text-sm">Performances</span>
                </div>
                <span className="text-xs text-danger">●</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="hover:shadow-md dark:hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-theme-primary" />
              <h3 className="font-semibold">Équipe</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-theme-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">JD</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">John Doe</p>
                  <p className="text-xs text-color-tertiary">
                    Développeur Frontend
                  </p>
                </div>
                <span className="text-xs text-success">●</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-theme-secondary rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">AS</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Alice Smith</p>
                  <p className="text-xs text-color-tertiary">Designer UI/UX</p>
                </div>
                <span className="text-xs text-success">●</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-theme-accent rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">BJ</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Bob Johnson</p>
                  <p className="text-xs text-color-tertiary">DevOps Engineer</p>
                </div>
                <span className="text-xs text-default-400 dark:text-default-500">
                  ●
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-theme-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">CM</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Clara Martin</p>
                  <p className="text-xs text-color-tertiary">Product Manager</p>
                </div>
                <span className="text-xs text-success">●</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="hover:shadow-md dark:hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-theme-accent" />
              <h3 className="font-semibold">Ressources</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="p-3 bg-theme-primary/10 dark:bg-theme-primary/20 rounded-lg cursor-pointer hover:bg-theme-primary/20 dark:hover:bg-theme-primary/30 transition-colors">
                <p className="text-sm font-medium text-theme-primary">
                  📚 Documentation
                </p>
                <p className="text-xs text-default-600 dark:text-default-400">
                  Guide complet du projet
                </p>
              </div>
              <div className="p-3 bg-theme-secondary/10 dark:bg-theme-secondary/20 rounded-lg cursor-pointer hover:bg-theme-secondary/20 dark:hover:bg-theme-secondary/30 transition-colors">
                <p className="text-sm font-medium text-theme-secondary">
                  🎯 Roadmap
                </p>
                <p className="text-xs text-default-600 dark:text-default-400">
                  Feuille de route 2024
                </p>
              </div>
              <div className="p-3 bg-theme-accent/10 dark:bg-theme-accent/20 rounded-lg cursor-pointer hover:bg-theme-accent/20 dark:hover:bg-theme-accent/30 transition-colors">
                <p className="text-sm font-medium text-theme-accent">
                  🔧 API Reference
                </p>
                <p className="text-xs text-default-600 dark:text-default-400">
                  Documentation technique
                </p>
              </div>
              <div className="p-3 bg-theme-primary/10 dark:bg-theme-primary/20 rounded-lg cursor-pointer hover:bg-theme-primary/20 dark:hover:bg-theme-primary/30 transition-colors">
                <p className="text-sm font-medium text-theme-primary">
                  📊 Analytics
                </p>
                <p className="text-xs text-default-600 dark:text-default-400">
                  Rapports détaillés
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Section détaillée - Test de contenu long */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Battery className="w-5 h-5 text-theme-primary" />
              <h3 className="font-semibold">Informations détaillées</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-6 text-sm text-default-600 dark:text-default-400">
              <div>
                <h4 className="font-medium text-foreground mb-3">
                  À propos de cette interface
                </h4>
                <p className="mb-4">
                  Bienvenue sur votre dashboard principal. Cette interface vous
                  permet de gérer et visualiser vos données de manière
                  centralisée. Elle a été conçue pour être à la fois puissante
                  et intuitive, offrant un accès rapide à toutes les
                  fonctionnalités essentielles de votre application.
                </p>
                <p className="mb-4">
                  Le système de layout conditionnel s'adapte automatiquement
                  selon votre contexte de navigation, garantissant une
                  expérience utilisateur optimale sur tous types d'appareils. La
                  sidebar se masque intelligemment sur mobile et se déploie sur
                  desktop pour maximiser l'espace disponible.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">
                    Fonctionnalités principales :
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-theme-primary mt-1">•</span>
                      <span>
                        Interface moderne et responsive avec design adaptatif
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-theme-primary mt-1">•</span>
                      <span>
                        Navigation intuitive avec sidebar contextuelle
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-theme-primary mt-1">•</span>
                      <span>
                        Personnalisation avancée des thèmes et layouts
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-theme-primary mt-1">•</span>
                      <span>Système de notifications en temps réel</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-theme-primary mt-1">•</span>
                      <span>Analytics intégrés et reporting automatisé</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-theme-primary mt-1">•</span>
                      <span>Gestion des droits utilisateurs par rôles</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">
                    Avantages techniques :
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-success mt-1">•</span>
                      <span>
                        Performance optimisée avec Next.js 14 et React 18
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success mt-1">•</span>
                      <span>Sécurité renforcée avec authentification JWT</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success mt-1">•</span>
                      <span>Support multi-plateforme (Web, Mobile, PWA)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success mt-1">•</span>
                      <span>API REST documentée avec Swagger/OpenAPI</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success mt-1">•</span>
                      <span>
                        Cache intelligent et optimisations automatiques
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success mt-1">•</span>
                      <span>Tests automatisés E2E et unitaires</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-r from-theme-primary/10 to-theme-secondary/10 dark:from-theme-primary/20 dark:to-theme-secondary/20 p-4 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">
                  🚀 Nouveautés récentes
                </h4>
                <ul className="space-y-1 text-sm">
                  <li>• Intégration du mode sombre automatique</li>
                  <li>• Nouveau système de widgets personnalisables</li>
                  <li>• API v2.0 avec performances améliorées de 40%</li>
                  <li>• Support des PWA et notifications push</li>
                  <li>• Dashboard analytics en temps réel</li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-success" />
              <h3 className="font-semibold">Activité récente</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="relative">
                {/* Timeline */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-divider dark:bg-divider" />

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="relative z-10 w-8 h-8 bg-success rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Déploiement en production
                      </p>
                      <p className="text-xs text-color-secondary">
                        Version 2.1.0 déployée avec succès
                      </p>
                      <p className="text-xs text-color-tertiary">
                        Il y a 2 heures
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="relative z-10 w-8 h-8 bg-theme-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">🔄</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Synchronisation des données
                      </p>
                      <p className="text-xs text-color-secondary">
                        Base de données mise à jour automatiquement
                      </p>
                      <p className="text-xs text-color-tertiary">
                        Il y a 4 heures
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="relative z-10 w-8 h-8 bg-warning rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">⚠️</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Alerte performance</p>
                      <p className="text-xs text-color-secondary">
                        Pic d'utilisation détecté et résolu
                      </p>
                      <p className="text-xs text-color-tertiary">
                        Il y a 6 heures
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="relative z-10 w-8 h-8 bg-theme-secondary rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">📊</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Rapport mensuel généré
                      </p>
                      <p className="text-xs text-color-secondary">
                        Analytics et métriques disponibles
                      </p>
                      <p className="text-xs text-color-tertiary">
                        Il y a 8 heures
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="relative z-10 w-8 h-8 bg-danger rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">🔒</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Mise à jour sécurité
                      </p>
                      <p className="text-xs text-color-secondary">
                        Correctifs de sécurité appliqués
                      </p>
                      <p className="text-xs text-color-tertiary">
                        Hier à 14:30
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="relative z-10 w-8 h-8 bg-default-400 dark:bg-default-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">👥</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Nouveau membre d'équipe
                      </p>
                      <p className="text-xs text-default-600 dark:text-default-400">
                        Sarah Martin a rejoint l'équipe développement
                      </p>
                      <p className="text-xs text-default-500 dark:text-default-500">
                        Hier à 09:15
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="relative z-10 w-8 h-8 bg-theme-secondary/80 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">🎉</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Milestone atteint</p>
                      <p className="text-xs text-color-secondary">
                        10,000 utilisateurs actifs ce mois
                      </p>
                      <p className="text-xs text-color-tertiary">
                        Il y a 2 jours
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="relative z-10 w-8 h-8 bg-theme-primary/70 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">🔧</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Maintenance programmée
                      </p>
                      <p className="text-xs text-color-secondary">
                        Optimisation des serveurs terminée
                      </p>
                      <p className="text-xs text-color-tertiary">
                        Il y a 3 jours
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Section finale avec contenu supplémentaire pour le scroll */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-theme-primary" />
              <h3 className="font-semibold">
                Analyse de performance détaillée
              </h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-theme-primary/10 dark:bg-theme-primary/20 rounded-lg">
                  <h4 className="font-semibold text-theme-primary mb-2">
                    Temps de réponse
                  </h4>
                  <p className="text-2xl font-bold text-theme-primary">147ms</p>
                  <p className="text-sm text-theme-primary/80">
                    Moyenne sur 7 jours
                  </p>
                  <div className="mt-2 text-xs text-theme-primary/70">
                    📈 Amélioration de 23% ce mois
                  </div>
                </div>

                <div className="p-4 bg-success/10 dark:bg-success/20 rounded-lg">
                  <h4 className="font-semibold text-success mb-2">
                    Disponibilité
                  </h4>
                  <p className="text-2xl font-bold text-success">99.97%</p>
                  <p className="text-sm text-success/80">Uptime mensuel</p>
                  <div className="mt-2 text-xs text-success/70">
                    ✅ Objectif SLA atteint
                  </div>
                </div>

                <div className="p-4 bg-theme-secondary/10 dark:bg-theme-secondary/20 rounded-lg">
                  <h4 className="font-semibold text-theme-secondary mb-2">
                    Charge CPU
                  </h4>
                  <p className="text-2xl font-bold text-theme-secondary">34%</p>
                  <p className="text-sm text-theme-secondary/80">
                    Utilisation moyenne
                  </p>
                  <div className="mt-2 text-xs text-theme-secondary/70">
                    ⚡ Optimisation recommandée
                  </div>
                </div>
              </div>

              <div className="p-6 bg-default-100 dark:bg-default-50 rounded-lg">
                <h4 className="font-semibold text-foreground mb-4">
                  📊 Métriques détaillées
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-default-600 dark:text-default-400">
                      Requêtes/min
                    </p>
                    <p className="font-bold text-lg text-foreground">2,847</p>
                  </div>
                  <div>
                    <p className="text-default-600 dark:text-default-400">
                      Erreurs 4xx
                    </p>
                    <p className="font-bold text-lg text-warning">0.3%</p>
                  </div>
                  <div>
                    <p className="text-default-600 dark:text-default-400">
                      Erreurs 5xx
                    </p>
                    <p className="font-bold text-lg text-danger">0.02%</p>
                  </div>
                  <div>
                    <p className="text-default-600 dark:text-default-400">
                      Cache Hit
                    </p>
                    <p className="font-bold text-lg text-success">94.2%</p>
                  </div>
                </div>
              </div>

              <div className="bg-theme-primary/10 dark:bg-theme-primary/20 p-6 rounded-lg">
                <h4 className="font-semibold text-theme-primary mb-3">
                  🎯 Recommandations d'optimisation
                </h4>
                <ul className="space-y-2 text-sm text-default-700 dark:text-default-300">
                  <li>
                    • Mettre en place un CDN pour les ressources statiques
                  </li>
                  <li>
                    • Optimiser les requêtes de base de données les plus lentes
                  </li>
                  <li>• Implémenter le lazy loading pour les images</li>
                  <li>• Configurer la compression gzip/brotli pour les API</li>
                  <li>
                    • Ajouter des index sur les tables fréquemment interrogées
                  </li>
                  <li>• Mettre en cache les réponses API non critiques</li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Footer du dashboard avec informations système */}
      <Card className="mb-8">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-default-600 dark:text-default-400">
            <div>
              <h4 className="font-medium text-foreground mb-2">
                🖥️ Informations système
              </h4>
              <ul className="space-y-1">
                <li>Version: 2.1.0</li>
                <li>Environnement: Production</li>
                <li>Dernière mise à jour: 27/09/2024</li>
                <li>Node.js: 20.10.0</li>
                <li>Next.js: 14.2.0</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">
                📡 Connectivité
              </h4>
              <ul className="space-y-1">
                <li>
                  API Status:{" "}
                  <span className="text-success font-medium">Opérationnel</span>
                </li>
                <li>
                  Base de données:{" "}
                  <span className="text-success font-medium">Connectée</span>
                </li>
                <li>
                  Cache Redis:{" "}
                  <span className="text-success font-medium">Actif</span>
                </li>
                <li>
                  CDN:{" "}
                  <span className="text-success font-medium">Opérationnel</span>
                </li>
                <li>
                  Monitoring:{" "}
                  <span className="text-success font-medium">En ligne</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">🔒 Sécurité</h4>
              <ul className="space-y-1">
                <li>
                  SSL: <span className="text-success font-medium">Valide</span>
                </li>
                <li>
                  Certificat:{" "}
                  <span className="text-success font-medium">
                    Expire dans 89 jours
                  </span>
                </li>
                <li>
                  Firewall:{" "}
                  <span className="text-success font-medium">Actif</span>
                </li>
                <li>
                  DDoS Protection:{" "}
                  <span className="text-success font-medium">Activée</span>
                </li>
                <li>
                  Dernière sauvegarde:{" "}
                  <span className="text-success font-medium">Il y a 2h</span>
                </li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>
    </DashboardContentArea>
  );
}
