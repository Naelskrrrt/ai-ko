"use client";

import * as React from "react";

import { useAuth } from "@/core/providers/AuthProvider";
import { OnboardingGuard } from "@/components/guards/OnboardingGuard";
import { StatsCards } from "@/features/enseignant/components/dashboard/StatsCards";
import { RecentQCMs } from "@/features/enseignant/components/dashboard/RecentQCMs";
import { UpcomingSessions } from "@/features/enseignant/components/dashboard/UpcomingSessions";

export default function EnseignantDashboardPage() {
  const { user } = useAuth();
  const userId = user?.id || "";

  return (
    <OnboardingGuard>
      <div className="space-y-6">
        {/* Statistiques */}
        <StatsCards userId={userId} />

        {/* QCMs Récents & Sessions Programmées */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentQCMs userId={userId} />
          <UpcomingSessions userId={userId} />
        </div>
      </div>
    </OnboardingGuard>
  );
}
