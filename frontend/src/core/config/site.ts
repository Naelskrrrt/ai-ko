/**
 * Configuration générale du site - Template Frontend
 * À personnaliser selon votre projet
 */

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Your App Name", // À personnaliser
  description: "Your app description here", // À personnaliser

  // Navigation principale
  navItems: [
    {
      label: "Admin",
      href: "/admin",
    },
  ],

  // Menu mobile/dropdown
  navMenuItems: [
    {
      label: "Logout",
      href: "/logout",
    },
  ],

  // Pages qui utilisent le layout avec sidebar
  sidebarPages: [
    "/admin",
  ],

  // Navigation dans la sidebar (pour utilisateurs non-admin - vide pour l'instant)
  sidebarNavItems: [
    {
      label: "Administration",
      href: "/admin",
      icon: "settings",
      primary: true,
      roles: ["admin"],
    },
  ],

  // Navigation spécifique admin dans la sidebar
  adminSidebarNavItems: [
    {
      label: "Dashboard",
      href: "/admin",
      icon: "dashboard",
      primary: true,
    },
    {
      label: "Utilisateurs",
      href: "/admin/users",
      icon: "team",
      primary: false,
    },
  ],

  // Navigation spécifique étudiant dans la sidebar
  etudiantSidebarNavItems: [
    {
      label: "Tableau de bord",
      href: "/etudiant",
      icon: "dashboard",
      primary: true,
    },
    {
      label: "QCMs disponibles",
      href: "/etudiant/qcms",
      icon: "file",
      primary: false,
    },
    {
      label: "Mes examens",
      href: "/etudiant/examens",
      icon: "book",
      primary: false,
    },
    {
      label: "Mes notes",
      href: "/etudiant/notes",
      icon: "file",
      primary: false,
    },
  ],

  // Navigation spécifique enseignant dans la sidebar
  enseignantSidebarNavItems: [
    {
      label: "Tableau de bord",
      href: "/enseignant",
      icon: "dashboard",
      primary: true,
    },
    {
      label: "Mes QCMs",
      href: "/enseignant/qcm",
      icon: "file",
      primary: false,
    },
    {
      label: "Sessions d'examen",
      href: "/enseignant/sessions",
      icon: "calendar",
      primary: false,
    },
    {
      label: "Profil",
      href: "/profile",
      icon: "profile",
      primary: false,
    },
  ],

  // Configuration du thème (optionnel - peut être géré par Tailwind/HeroUI)
  theme: {
    primary: "#3b82f6", // Bleu par défaut
    secondary: "#64748b", // Gris ardoise
    accent: "#10b981", // Vert
    warning: "#f59e0b", // Orange
    danger: "#ef4444", // Rouge
    success: "#22c55e", // Vert succès
    background: "#f8fafc", // Gris très clair
    surface: "#ffffff", // Blanc
    text: {
      primary: "#1e293b",
      secondary: "#64748b",
      muted: "#94a3b8",
    },
  },

  // Configuration spécifique à votre organisation (optionnel)
  organization: {
    name: "Your Organization", // À personnaliser
    sector: "Your Sector", // À personnaliser
    logo: "/logo.png", // Chemin vers votre logo
    colors: {
      primary: "#3b82f6", // Couleur principale
      secondary: "#64748b", // Couleur secondaire
    },
  },
};
