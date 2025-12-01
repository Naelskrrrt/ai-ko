"use client";

import type { ReponseDetail } from "../../types/notes.types";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { CheckCircle, XCircle, HelpCircle } from "lucide-react";

interface FeedbackPanelProps {
  reponse: ReponseDetail;
}

export function FeedbackPanel({ reponse }: FeedbackPanelProps) {
  const getStatusIcon = () => {
    if (reponse.est_correcte) {
      return <CheckCircle className="h-5 w-5 text-success" />;
    }

    return <XCircle className="h-5 w-5 text-danger" />;
  };

  const getStatusChip = () => {
    if (reponse.est_correcte) {
      return (
        <Chip color="success" size="sm" variant="flat">
          Correct
        </Chip>
      );
    }

    return (
      <Chip color="danger" size="sm" variant="flat">
        Incorrect
      </Chip>
    );
  };

  const formatReponse = (rep: any): string => {
    if (Array.isArray(rep)) {
      return rep.join(", ");
    }
    if (typeof rep === "boolean") {
      return rep ? "Vrai" : "Faux";
    }

    return String(rep || "-");
  };

  return (
    <Card
      className={`border-2 ${reponse.est_correcte ? "border-success-200 bg-success-50/30" : "border-danger-200 bg-danger-50/30"}`}
    >
      <CardHeader className="flex gap-3 justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">
                Question {reponse.question_numero}
              </p>
              {getStatusChip()}
            </div>
            <p className="text-xs text-default-500">
              {reponse.points_obtenus} / {reponse.points_max} points
            </p>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-4 pt-0">
        {/* Énoncé */}
        <div>
          <h4 className="text-sm font-semibold mb-1">Énoncé :</h4>
          <p className="text-sm text-default-700">{reponse.question_enonce}</p>
        </div>

        {/* Votre réponse */}
        <div>
          <h4 className="text-sm font-semibold mb-1">Votre réponse :</h4>
          <div
            className={`p-2 rounded-lg ${reponse.est_correcte ? "bg-success-100/50" : "bg-danger-100/50"}`}
          >
            <p className="text-sm">{formatReponse(reponse.reponse_etudiant)}</p>
          </div>
        </div>

        {/* Réponse correcte (si incorrecte) */}
        {!reponse.est_correcte && reponse.reponse_correcte !== undefined && (
          <div>
            <h4 className="text-sm font-semibold mb-1 text-success">
              Réponse correcte :
            </h4>
            <div className="p-2 rounded-lg bg-success-100/50 border border-success-200">
              <p className="text-sm text-success-700">
                {formatReponse(reponse.reponse_correcte)}
              </p>
            </div>
          </div>
        )}

        {/* Feedback */}
        {reponse.feedback && (
          <div className="flex items-start gap-2 p-3 bg-theme-primary/10 border border-theme-primary/20 rounded-lg">
            <HelpCircle className="h-5 w-5 text-theme-primary mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-theme-primary mb-1">
                Feedback :
              </h4>
              <p className="text-sm text-theme-primary-700">
                {reponse.feedback}
              </p>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
