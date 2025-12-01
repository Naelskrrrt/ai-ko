"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Link } from "@heroui/link";
import { Eye, EyeOff } from "lucide-react";

import { useAuth } from "@/core/providers/AuthProvider";
import { Logo } from "@/components/icons";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Vérifier si l'utilisateur est déjà connecté et rediriger automatiquement
  useEffect(() => {
    // Attendre que le chargement soit terminé
    if (loading) return;

    // Si l'utilisateur est connecté, rediriger
    if (user) {
      let defaultRedirect = "/";

      if (user.role === "admin") {
        defaultRedirect = "/admin";
      } else if (user.role === "etudiant") {
        defaultRedirect = "/etudiant";
      } else if (user.role === "enseignant") {
        defaultRedirect = "/enseignant";
      }
      const redirectUrl = searchParams.get("redirect") || defaultRedirect;

      router.replace(redirectUrl);

      return;
    }

    // Vérifier aussi si un token existe dans les cookies (au cas où l'AuthProvider n'a pas encore chargé)
    if (typeof document !== "undefined") {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth_token="))
        ?.split("=")[1];

      // Si un token existe, l'AuthProvider devrait le détecter via refreshUser()
      // On attend un peu pour laisser l'AuthProvider se charger
      if (token) {
        // L'AuthProvider va automatiquement appeler refreshUser() qui va charger l'utilisateur
        // On ne fait rien ici, on attend que l'AuthProvider se charge
      }
    }
  }, [user, loading, router, searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(data.email, data.password);

      // Attendre un court instant pour que l'AuthProvider récupère l'utilisateur
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Rediriger selon le rôle (on va chercher l'utilisateur via l'API)
      const apiUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/api/auth/me`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            document.cookie
              .split("; ")
              .find((row) => row.startsWith("auth_token="))
              ?.split("=")[1]
          }`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        let redirectPath = "/";

        if (userData.role === "admin") {
          redirectPath = "/admin";
        } else if (userData.role === "etudiant") {
          redirectPath = "/etudiant";
        } else if (userData.role === "enseignant") {
          redirectPath = "/enseignant";
        }
        router.push(redirectPath);
      } else {
        // En cas d'erreur, rediriger vers la page d'accueil
        router.push("/");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const apiUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/api/auth/oauth/google`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      if (data.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (err) {
      setError("Erreur lors de la connexion avec Google");
    }
  };

  // Afficher un loader pendant la vérification de l'authentification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-default-50 to-default-100 dark:from-default-950 dark:to-default-900">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto" />
          <p className="text-default-500">Vérification de la session...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur est connecté, ne pas afficher le formulaire (redirection en cours)
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-default-50 to-default-100 dark:from-default-950 dark:to-default-900">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto" />
          <p className="text-default-500">Redirection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-default-50 to-default-100 dark:from-default-950 dark:to-default-900 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo size={80} />
          </div>
          <p className="text-default-500">Système Intelligent</p>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-1 pb-0">
            <h1 className="text-2xl font-bold">Connexion</h1>
            <p className="text-sm text-default-500">
              Connectez-vous à votre compte AI-KO
            </p>
          </CardHeader>
          <CardBody className="gap-4">
            {error && (
              <div className="p-3 text-sm text-danger bg-danger/10 rounded-lg border border-danger/20">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <Input
                {...register("email")}
                errorMessage={errors.email?.message}
                isInvalid={!!errors.email}
                label="Email"
                placeholder="votre@email.com"
                type="email"
                variant="bordered"
              />

              <Input
                {...register("password")}
                endContent={
                  <button
                    aria-label={
                      isPasswordVisible
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                    className="focus:outline-none"
                    type="button"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    {isPasswordVisible ? (
                      <EyeOff className="w-4 h-4 text-default-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-default-400" />
                    )}
                  </button>
                }
                errorMessage={errors.password?.message}
                isInvalid={!!errors.password}
                label="Mot de passe"
                placeholder="••••••••"
                type={isPasswordVisible ? "text" : "password"}
                variant="bordered"
              />

              <Button
                className="w-full bg-theme-primary text-white hover:bg-theme-primary/90"
                isLoading={isLoading}
                size="lg"
                type="submit"
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-divider" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-default-500">
                  Ou continuer avec
                </span>
              </div>
            </div>

            <Button
              className="w-full"
              disabled={isLoading}
              startContent={
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              }
              type="button"
              variant="bordered"
              onClick={handleGoogleLogin}
            >
              Continuer avec Google
            </Button>
          </CardBody>
        </Card>

        <p className="text-center text-sm text-default-500">
          Pas encore de compte ?{" "}
          <Link
            className="text-theme-primary hover:text-theme-primary/80"
            href="/register"
          >
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-default-50 to-default-100 dark:from-default-950 dark:to-default-900">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto" />
            <p className="text-default-500">Chargement...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
