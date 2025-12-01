"use client";

import type { Question } from "../../types/examens.types";

import * as React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { RadioGroup, Radio } from "@heroui/radio";
import { Textarea } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { HelpCircle } from "lucide-react";

interface QuestionDisplayProps {
  question: Question;
  reponse: any;
  onReponseChange: (questionId: string, reponse: any) => void;
  numero: number;
  total: number;
  showAide?: boolean; // Si false, n'affiche pas l'aide (explication) pendant l'examen
}

export function QuestionDisplay({
  question,
  reponse,
  onReponseChange,
  numero,
  total,
  showAide = false, // Par défaut, ne pas afficher l'aide pendant l'examen
}: QuestionDisplayProps) {
  // Normaliser la réponse : si c'est un objet, extraire la valeur
  const getReponseValue = (): any => {
    if (!reponse) return null;
    // Si c'est un objet avec 'texte' ou 'reponse', extraire la valeur
    if (typeof reponse === "object" && !Array.isArray(reponse)) {
      if ("texte" in reponse) {
        return reponse.texte;
      }
      if ("reponse" in reponse) {
        return reponse.reponse;
      }

      // Si c'est un objet mais sans propriété connue, retourner null
      return null;
    }

    return reponse;
  };

  const reponseValue = getReponseValue();

  const handleQCMChange = (value: string) => {
    onReponseChange(question.id, value);
  };

  const handleVraiFauxChange = (value: string) => {
    onReponseChange(question.id, value === "true");
  };

  const handleTexteLibreChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    onReponseChange(question.id, e.target.value);
  };

  // Normaliser les options : s'assurer qu'elles sont des chaînes
  const normalizeOptions = (options: any[]): string[] => {
    if (!options || !Array.isArray(options)) {
      return [];
    }

    return options.map((opt) => {
      if (typeof opt === "string") {
        return opt;
      }
      if (typeof opt === "object" && opt !== null) {
        // Extraire le texte de l'objet
        return opt.texte || opt.text || String(opt);
      }

      return String(opt);
    });
  };

  const normalizedOptions = normalizeOptions(question.options || []);

  const renderQuestionContent = () => {
    switch (question.type_question) {
      case "qcm":
        return (
          <RadioGroup
            classNames={{
              wrapper: "gap-3",
            }}
            value={reponseValue || ""}
            onValueChange={handleQCMChange}
          >
            {normalizedOptions.map((option, index) => (
              <Radio
                key={index}
                classNames={{
                  base: "inline-flex m-0 bg-default-100 hover:bg-default-200 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-lg gap-4 p-4 border-2 border-transparent data-[selected=true]:border-theme-primary",
                  label: "text-sm",
                }}
                value={option}
              >
                {option}
              </Radio>
            ))}
          </RadioGroup>
        );

      case "vrai_faux":
        return (
          <RadioGroup
            classNames={{
              wrapper: "gap-3",
            }}
            value={
              reponseValue === true
                ? "true"
                : reponseValue === false
                  ? "false"
                  : ""
            }
            onValueChange={handleVraiFauxChange}
          >
            <Radio
              classNames={{
                base: "inline-flex m-0 bg-default-100 hover:bg-default-200 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-lg gap-4 p-4 border-2 border-transparent data-[selected=true]:border-theme-primary",
              }}
              value="true"
            >
              Vrai
            </Radio>
            <Radio
              classNames={{
                base: "inline-flex m-0 bg-default-100 hover:bg-default-200 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-lg gap-4 p-4 border-2 border-transparent data-[selected=true]:border-theme-primary",
              }}
              value="false"
            >
              Faux
            </Radio>
          </RadioGroup>
        );

      case "texte_libre":
        return (
          <Textarea
            classNames={{
              input: "text-sm",
            }}
            minRows={4}
            placeholder="Saisissez votre réponse ici..."
            value={typeof reponseValue === "string" ? reponseValue : ""}
            onChange={handleTexteLibreChange}
          />
        );

      default:
        return <p className="text-danger">Type de question non supporté</p>;
    }
  };

  const isAnswered = () => {
    if (question.type_question === "texte_libre") {
      const textValue = typeof reponseValue === "string" ? reponseValue : "";

      return textValue && textValue.trim().length > 0;
    }

    return (
      reponseValue !== null && reponseValue !== undefined && reponseValue !== ""
    );
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="flex gap-3 justify-between items-start">
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-2">
            <Chip
              className="bg-theme-primary/10 text-theme-primary border-theme-primary/20"
              size="sm"
              variant="flat"
            >
              Question {numero}/{total}
            </Chip>
            <Chip color="default" size="sm" variant="flat">
              {question.points} point{question.points > 1 ? "s" : ""}
            </Chip>
            {isAnswered() && (
              <Chip color="success" size="sm" variant="flat">
                Répondu
              </Chip>
            )}
          </div>
          <h3 className="text-lg font-semibold">{question.enonce}</h3>
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        {/* Aide (explication) - affichée uniquement si showAide est true (après soumission) */}
        {showAide && question.aide && (
          <div className="flex items-start gap-2 p-3 bg-theme-primary/10 border border-theme-primary/20 rounded-lg">
            <HelpCircle className="h-5 w-5 text-theme-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-theme-primary-700">{question.aide}</p>
          </div>
        )}

        {renderQuestionContent()}
      </CardBody>
    </Card>
  );
}
