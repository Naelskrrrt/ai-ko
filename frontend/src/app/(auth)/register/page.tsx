"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

// Interface pour les erreurs backend
interface BackendFieldErrors {
  name?: string[];
  email?: string[];
  password?: string[];
  [key: string]: string[] | undefined;
}

interface BackendError {
  response?: {
    data?: {
      message?: string;
      errors?: BackendFieldErrors;
    };
    status?: number;
  };
  message?: string;
}

// Critères de validation du mot de passe
const passwordCriteria = {
  minLength: (value: string) => value.length >= 8,
  hasUppercase: (value: string) => /[A-Z]/.test(value),
  hasLowercase: (value: string) => /[a-z]/.test(value),
  hasNumber: (value: string) => /[0-9]/.test(value),
  hasSpecial: (value: string) =>
    /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/.test(value),
};

const passwordCriteriaMessages = {
  minLength: "Au moins 8 caractères",
  hasUppercase: "Une lettre majuscule",
  hasLowercase: "Une lettre minuscule",
  hasNumber: "Un chiffre",
  hasSpecial: "Un caractère spécial (!@#$%...)",
};

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .max(255, "Le nom ne doit pas dépasser 255 caractères"),
    email: z
      .string()
      .email("Format d'email invalide")
      .max(255, "L'email ne doit pas dépasser 255 caractères"),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .max(128, "Le mot de passe ne doit pas dépasser 128 caractères")
      .refine((val) => /[A-Z]/.test(val), {
        message: "Le mot de passe doit contenir au moins une majuscule",
      })
      .refine((val) => /[a-z]/.test(val), {
        message: "Le mot de passe doit contenir au moins une minuscule",
      })
      .refine((val) => /[0-9]/.test(val), {
        message: "Le mot de passe doit contenir au moins un chiffre",
      })
      .refine((val) => /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/.test(val), {
        message: "Le mot de passe doit contenir au moins un caractère spécial",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setBackendFieldErrors] =
    useState<BackendFieldErrors>({});
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
    watch,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange", // Validation en temps réel
  });

  // Observer le mot de passe pour l'indicateur de force
  const watchPassword = watch("password", "");
  const watchConfirmPassword = watch("confirmPassword", "");

  // Calculer la force du mot de passe
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: "", color: "" };

    let score = 0;

    if (passwordCriteria.minLength(password)) score++;
    if (passwordCriteria.hasUppercase(password)) score++;
    if (passwordCriteria.hasLowercase(password)) score++;
    if (passwordCriteria.hasNumber(password)) score++;
    if (passwordCriteria.hasSpecial(password)) score++;

    if (score <= 2) return { score, label: "Faible", color: "bg-danger" };
    if (score <= 3) return { score, label: "Moyen", color: "bg-warning" };
    if (score <= 4) return { score, label: "Fort", color: "bg-success" };

    return { score, label: "Très fort", color: "bg-success" };
  };

  const passwordStrength = getPasswordStrength(watchPassword);

  // Fonction pour mapper les erreurs backend vers react-hook-form
  const handleBackendErrors = (err: BackendError) => {
    const responseData = err.response?.data;
    const status = err.response?.status;

    // Réinitialiser les erreurs précédentes
    setBackendFieldErrors({});
    setError(null);

    // Gérer les erreurs de validation par champ
    if (responseData?.errors) {
      const fieldErrors = responseData.errors;

      setBackendFieldErrors(fieldErrors);

      // Mapper les erreurs vers react-hook-form pour une meilleure intégration
      Object.entries(fieldErrors).forEach(([field, messages]) => {
        if (
          messages &&
          messages.length > 0 &&
          (field === "name" || field === "email" || field === "password")
        ) {
          setFormError(field as keyof RegisterFormValues, {
            type: "server",
            message: messages[0],
          });
        }
      });
    }

    // Gérer le message d'erreur principal
    if (responseData?.message) {
      const message = responseData.message;

      // Erreur email déjà utilisé
      if (
        message.toLowerCase().includes("email") &&
        message.toLowerCase().includes("utilisé")
      ) {
        setFormError("email", {
          type: "server",
          message: "Cet email est déjà associé à un compte",
        });
        setError(null);

        return;
      }

      // Autres erreurs générales
      setError(message);
    } else if (status === 400) {
      setError(
        "Données de formulaire invalides. Veuillez vérifier vos informations.",
      );
    } else if (status === 500) {
      setError(
        "Une erreur serveur s'est produite. Veuillez réessayer plus tard.",
      );
    } else if (err.message) {
      // Erreur réseau ou autre
      if (
        err.message.includes("Network Error") ||
        err.message.includes("timeout")
      ) {
        setError(
          "Impossible de contacter le serveur. Vérifiez votre connexion internet.",
        );
      } else {
        setError("Une erreur s'est produite lors de l'inscription.");
      }
    } else {
      setError("Une erreur inattendue s'est produite.");
    }
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    setBackendFieldErrors({});

    try {
      const response = await registerUser(data.name, data.email, data.password);

      // Stocker l'ID utilisateur temporairement pour le parcours d'onboarding
      if (response?.user?.id) {
        if (typeof window !== "undefined") {
          localStorage.setItem("onboarding_userId", response.user.id);

          // Vérifier si on a un token dans la réponse
          if (response?.token) {
            localStorage.setItem("onboarding_token", response.token);
          }

          // Le token devrait aussi être dans auth_token (stocké par AuthProvider)
          const authToken = localStorage.getItem("auth_token");

          if (authToken && !response?.token) {
            localStorage.setItem("onboarding_token", authToken);
          }
        }

        // Rediriger vers le parcours d'onboarding au lieu de /login
        router.push("/onboarding/role-selection");
      }
    } catch (err: unknown) {
      handleBackendErrors(err as BackendError);
    } finally {
      setIsLoading(false);
    }
  };

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
            <h1 className="text-2xl font-bold">Inscription</h1>
            <p className="text-sm text-default-500">
              Créez un compte pour commencer à utiliser AI-KO
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
                {...register("name")}
                errorMessage={errors.name?.message}
                isInvalid={!!errors.name}
                label="Nom"
                placeholder="Votre nom"
                type="text"
                variant="bordered"
              />

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

              {/* Indicateur de force du mot de passe */}
              {watchPassword && (
                <div className="space-y-2">
                  {/* Barre de progression */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-default-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{
                          width: `${(passwordStrength.score / 5) * 100}%`,
                        }}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        passwordStrength.score <= 2
                          ? "text-danger"
                          : passwordStrength.score <= 3
                            ? "text-warning"
                            : "text-success"
                      }`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>

                  {/* Liste des critères */}
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    {Object.entries(passwordCriteriaMessages).map(
                      ([key, message]) => {
                        const isValid =
                          passwordCriteria[
                            key as keyof typeof passwordCriteria
                          ](watchPassword);

                        return (
                          <div key={key} className="flex items-center gap-1.5">
                            <span
                              className={`flex-shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                                isValid
                                  ? "bg-success text-white"
                                  : "bg-default-200 text-default-400"
                              }`}
                            >
                              {isValid ? (
                                <svg
                                  className="w-2 h-2"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    clipRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    fillRule="evenodd"
                                  />
                                </svg>
                              ) : (
                                <span className="w-1 h-1 bg-current rounded-full" />
                              )}
                            </span>
                            <span
                              className={
                                isValid ? "text-success" : "text-default-400"
                              }
                            >
                              {message}
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              )}

              <Input
                {...register("confirmPassword")}
                endContent={
                  <button
                    aria-label={
                      isConfirmPasswordVisible
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                    className="focus:outline-none"
                    type="button"
                    onClick={() =>
                      setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
                    }
                  >
                    {isConfirmPasswordVisible ? (
                      <EyeOff className="w-4 h-4 text-default-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-default-400" />
                    )}
                  </button>
                }
                errorMessage={errors.confirmPassword?.message}
                isInvalid={!!errors.confirmPassword}
                label="Confirmer le mot de passe"
                placeholder="••••••••"
                type={isConfirmPasswordVisible ? "text" : "password"}
                variant="bordered"
              />

              {/* Indicateur de correspondance des mots de passe */}
              {watchConfirmPassword && (
                <div className="flex items-center gap-1.5 text-xs">
                  {watchPassword === watchConfirmPassword ? (
                    <>
                      <span className="flex-shrink-0 w-3.5 h-3.5 rounded-full bg-success text-white flex items-center justify-center">
                        <svg
                          className="w-2 h-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            clipRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            fillRule="evenodd"
                          />
                        </svg>
                      </span>
                      <span className="text-success">
                        Les mots de passe correspondent
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="flex-shrink-0 w-3.5 h-3.5 rounded-full bg-danger text-white flex items-center justify-center">
                        <svg
                          className="w-2 h-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            clipRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            fillRule="evenodd"
                          />
                        </svg>
                      </span>
                      <span className="text-danger">
                        Les mots de passe ne correspondent pas
                      </span>
                    </>
                  )}
                </div>
              )}

              <Button
                className="w-full bg-theme-primary text-white hover:bg-theme-primary/90"
                isLoading={isLoading}
                size="lg"
                type="submit"
              >
                {isLoading ? "Chargement..." : "Continuer"}
              </Button>
            </form>
          </CardBody>
        </Card>

        <p className="text-center text-sm text-default-500">
          Déjà un compte ?{" "}
          <Link
            className="text-theme-primary hover:text-theme-primary/80"
            href="/login"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
