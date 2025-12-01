"use client";

import * as React from "react";

import { useAuth } from "@/core/providers/AuthProvider";
import { ExamensList } from "@/features/etudiant/components/examens/ExamensList";

export default function ExamensPage() {
  const { user } = useAuth();
  const userId = user?.id || "";

  return (
    <div className="space-y-6">
      {/* Liste des examens */}
      <ExamensList userId={userId} />
    </div>
  );
}
