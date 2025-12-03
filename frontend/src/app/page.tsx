"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { useTheme } from "next-themes";
import { useIsSSR } from "@react-aria/ssr";
import {
  Brain,
  FileCheck,
  BarChart3,
  Sparkles,
  Clock,
  Users,
  GraduationCap,
  CheckCircle2,
  Zap,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";

import { title, subtitle } from "@/components/primitives";
import { Logo } from "@/components/icons";
import { useAuth } from "@/core/providers/AuthProvider";

export default function Home() {
  const { theme } = useTheme();
  const isSSR = useIsSSR();
  const router = useRouter();
  const { user, loading } = useAuth();

  // Rediriger les utilisateurs connectés vers leur dashboard
  useEffect(() => {
    if (loading) return;

    if (user) {
      let redirectPath = "/";

      if (user.role === "admin") {
        redirectPath = "/admin";
      } else if (user.role === "etudiant") {
        redirectPath = "/etudiant";
      } else if (user.role === "enseignant") {
        redirectPath = "/enseignant";
      }

      router.replace(redirectPath);
    }
  }, [user, loading, router]);

  // Afficher un loader pendant la vérification ou la redirection
  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-default-50 to-default-100 dark:from-default-950 dark:to-default-900">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto" />
          <p className="text-default-500">
            {loading ? "Vérification..." : "Redirection..."}
          </p>
        </div>
      </div>
    );
  }

  // Pendant l'hydratation, utiliser le thème par défaut pour éviter les erreurs d'hydratation
  const logoSrc =
    isSSR || theme === "dark"
      ? "/logo-capt_dark-mode.png"
      : "/logo-capt_light-mode.png";

  const features = [
    {
      icon: Brain,
      title: "Génération IA de QCM",
      description:
        "Générez automatiquement des questions à choix multiples à partir de vos documents (PDF, DOCX, TXT) grâce à l'intelligence artificielle Hugging Face.",
      iconBg: "bg-theme-primary-100 dark:bg-theme-primary-900/30",
      iconColor: "text-theme-primary-600 dark:text-theme-primary-400",
      titleColor: "text-theme-primary-700 dark:text-theme-primary-400",
    },
    {
      icon: FileCheck,
      title: "Correction Automatique",
      description:
        "Correction instantanée des QCM et questions ouvertes avec analyse sémantique avancée utilisant BERT et Sentence-BERT.",
      iconBg: "bg-theme-secondary-100 dark:bg-theme-secondary-900/30",
      iconColor: "text-theme-secondary-600 dark:text-theme-secondary-400",
      titleColor: "text-theme-secondary-700 dark:text-theme-secondary-400",
    },
    {
      icon: BarChart3,
      title: "Statistiques & Analytics",
      description:
        "Tableaux de bord détaillés pour enseignants et étudiants avec visualisation des performances et recommandations personnalisées.",
      iconBg: "bg-success-100 dark:bg-success-900/30",
      iconColor: "text-success-600 dark:text-success-400",
      titleColor: "text-success-700 dark:text-success-400",
    },
    {
      icon: Sparkles,
      title: "Feedback Personnalisé",
      description:
        "Recevez des retours détaillés sur vos réponses avec des recommandations de révision adaptées à votre niveau.",
      iconBg: "bg-warning-100 dark:bg-warning-900/30",
      iconColor: "text-warning-600 dark:text-warning-400",
      titleColor: "text-warning-700 dark:text-warning-400",
    },
  ];

  const stats = [
    { value: "80%", label: "Gain de temps", icon: Clock },
    { value: "88%", label: "Précision IA", icon: CheckCircle2 },
    { value: "500ms", label: "Correction rapide", icon: Zap },
    { value: "100%", label: "Sécurisé", icon: Shield },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-12 lg:py-20">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Colonne gauche - Contenu principal */}
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col space-y-6"
              initial={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Logo */}
              <div className="flex items-center gap-4 mb-2">
                <Logo size={100} />
              </div>

              <div>
                <span className="text-2xl font-bold">
                  L'Intelligence Artificielle au Service de l'Éducation
                </span>

                <div
                  className={subtitle({
                    class: "text-lg leading-relaxed mt-4",
                  })}
                >
                  Plateforme intelligente de génération, correction et
                  évaluation automatique d'exercices pédagogiques. Transformez
                  vos documents en QCM en quelques clics grâce à l'IA Hugging
                  Face.
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button
                  as={Link}
                  className="px-8 py-6 text-base font-semibold bg-theme-primary text-white hover:bg-theme-primary/90 shadow-lg hover:shadow-xl transition-all"
                  href="/login"
                  radius="full"
                  size="lg"
                >
                  Se connecter
                </Button>
                <Button
                  as={Link}
                  className="px-8 py-6 text-base font-semibold"
                  href="/register"
                  radius="full"
                  size="lg"
                  variant="bordered"
                >
                  Créer un compte
                </Button>
              </div>

              {/* Statistiques rapides */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center p-4 bg-gradient-to-br from-theme-primary-50 to-theme-secondary-100 dark:from-theme-primary-950/50 dark:to-theme-secondary-950/50 rounded-xl border-2 border-theme-primary-200 dark:border-theme-primary-800/50 shadow-sm hover:shadow-md transition-all hover:scale-105"
                    initial={{ opacity: 0, y: 20 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <stat.icon className="w-5 h-5 mx-auto mb-2 text-theme-primary-600 dark:text-theme-primary-400" />
                    <div className="text-2xl font-bold text-theme-primary-700 dark:text-theme-primary-300">
                      {stat.value}
                    </div>
                    <p className="text-xs font-medium text-theme-primary-600 dark:text-theme-primary-400 mt-1">
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Colonne droite - Features cards */}
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col space-y-4"
              initial={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5 }}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  animate={{ opacity: 1, y: 0 }}
                  initial={{ opacity: 0, y: 20 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <Card className="bg-gradient-to-r from-theme-primary-50 to-theme-secondary-50 dark:from-theme-primary-950/50 dark:to-theme-secondary-950/50 border-2 border-theme-primary-200 dark:border-theme-primary-800/50 hover:shadow-lg transition-all hover:scale-[1.02]">
                    <CardBody className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${feature.iconBg}`}>
                          <feature.icon
                            className={`w-6 h-6 ${feature.iconColor}`}
                          />
                        </div>
                        <div className="flex-1">
                          <h3
                            className={`text-lg font-semibold ${feature.titleColor} mb-2`}
                          >
                            {feature.title}
                          </h3>
                          <p className="text-sm text-default-600 dark:text-default-400 leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Pour qui ? */}
      <section className="py-16 px-4 bg-default-50 dark:bg-default-100">
        <div className="w-full max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2 className={title({ size: "md", class: "mb-4" })}>
              Pour qui est conçu{" "}
              <span className={title({ color: "secondary" })}>AI-KO</span> ?
            </h2>
            <p className={subtitle({ class: "max-w-2xl mx-auto" })}>
              Une solution adaptée à tous les acteurs de l'éducation
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: GraduationCap,
                title: "Pour les Enseignants",
                description:
                  "Créez des QCM en quelques minutes, suivez les performances de vos étudiants et obtenez des statistiques détaillées.",
                iconBg: "bg-theme-primary-100 dark:bg-theme-primary-900/30",
                iconColor: "text-theme-primary-600 dark:text-theme-primary-400",
                titleColor:
                  "text-theme-primary-700 dark:text-theme-primary-400",
              },
              {
                icon: Users,
                title: "Pour les Étudiants",
                description:
                  "Passez vos examens en ligne, recevez une correction instantanée et des feedbacks personnalisés pour progresser.",
                iconBg: "bg-theme-secondary-100 dark:bg-theme-secondary-900/30",
                iconColor:
                  "text-theme-secondary-600 dark:text-theme-secondary-400",
                titleColor:
                  "text-theme-secondary-700 dark:text-theme-secondary-400",
              },
              {
                icon: Shield,
                title: "Pour les Administrateurs",
                description:
                  "Gérez les utilisateurs, les matières, les niveaux et surveillez l'activité de la plateforme en temps réel.",
                iconBg: "bg-success-100 dark:bg-success-900/30",
                iconColor: "text-success-600 dark:text-success-400",
                titleColor: "text-success-700 dark:text-success-400",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <Card className="h-full bg-gradient-to-br from-theme-primary-50 to-theme-secondary-50 dark:from-theme-primary-950/50 dark:to-theme-secondary-950/50 border-2 border-theme-primary-200 dark:border-theme-primary-800/50 hover:shadow-xl transition-all">
                  <CardBody className="p-6 flex flex-col items-center justify-center">
                    <div
                      className={`inline-flex p-4 rounded-full ${item.iconBg} mb-4 w-fit`}
                    >
                      <item.icon className={`w-8 h-8 ${item.iconColor}`} />
                    </div>
                    <h3
                      className={`text-xl font-semibold ${item.titleColor} mb-3`}
                    >
                      {item.title}
                    </h3>
                    <p className="text-default-600 dark:text-default-400 text-center">
                      {item.description}
                    </p>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 px-4 border-t border-default-200 dark:border-default-800">
        <p className="text-sm text-default-500">
          Made with ❤️ by AI-KO Team - Système Intelligent d'Éducation
        </p>
      </footer>
    </div>
  );
}
