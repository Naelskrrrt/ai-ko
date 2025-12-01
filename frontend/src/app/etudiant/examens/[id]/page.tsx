"use client";

import * as React from "react";
import { use } from "react";

import { useAuth } from "@/core/providers/AuthProvider";
import { ExamenDetails } from "@/features/etudiant/components/examens/ExamenDetails";

interface ExamPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ExamPage({ params }: ExamPageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const userId = user?.id || "";

  return <ExamenDetails examId={id} userId={userId} />;
}
