"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/core/providers/AuthProvider";

export default function ProfileRedirectPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      // Rediriger vers la page de profil appropriée selon le rôle
      switch (user.role) {
        case "admin":
          router.replace("/admin/profile");
          break;
        case "enseignant":
          router.replace("/enseignant/profile");
          break;
        case "etudiant":
          router.replace("/etudiant/profile");
          break;
        default:
          // Si le rôle n'est pas reconnu, rediriger vers le dashboard
          router.replace("/dashboard");
      }
    } else if (!loading && !user) {
      // Si pas d'utilisateur connecté, rediriger vers login
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Afficher un loader pendant la redirection
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-default-500">Redirection vers votre profil...</p>
      </div>
    </div>
  );
}

