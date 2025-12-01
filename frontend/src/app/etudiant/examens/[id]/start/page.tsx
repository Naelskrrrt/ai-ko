"use client";

import * as React from "react";
import { use } from "react";

import { useAuth } from "@/core/providers/AuthProvider";
import { ExamPlayer } from "@/features/etudiant/components/examens/ExamPlayer";

interface ExamStartPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ExamStartPage({ params }: ExamStartPageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const userId = user?.id || "";

  return (
    <div className="min-h-screen bg-default-50">
      <ExamPlayer examId={id} userId={userId} />
    </div>
  );
}
