"use client";

import type { UrgentAction } from "@/shared/types/admin.types";

import * as React from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { AlertCircle, Clock, TrendingDown, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface UrgentActionsBarProps {
  actions: UrgentAction[];
  role: "admin" | "professeur";
}

export function UrgentActionsBar({
  actions,
  role: _role,
}: UrgentActionsBarProps) {
  const router = useRouter();

  if (!actions || actions.length === 0) {
    return null;
  }

  const getIcon = (type: UrgentAction["type"]) => {
    switch (type) {
      case "critical":
        return TrendingDown;
      case "warning":
        return Clock;
      case "info":
        return AlertCircle;
      default:
        return AlertCircle;
    }
  };

  const getColorClasses = (type: UrgentAction["type"]) => {
    switch (type) {
      case "critical":
        return {
          border: "border-red-500",
          bg: "bg-red-50 dark:bg-red-950/20",
          icon: "text-red-600 dark:text-red-400",
          text: "text-red-900 dark:text-red-100",
        };
      case "warning":
        return {
          border: "border-amber-500",
          bg: "bg-amber-50 dark:bg-amber-950/20",
          icon: "text-amber-600 dark:text-amber-400",
          text: "text-amber-900 dark:text-amber-100",
        };
      case "info":
        return {
          border: "border-blue-500",
          bg: "bg-blue-50 dark:bg-blue-950/20",
          icon: "text-blue-600 dark:text-blue-400",
          text: "text-blue-900 dark:text-blue-100",
        };
      default:
        return {
          border: "border-gray-500",
          bg: "bg-gray-50 dark:bg-gray-950/20",
          icon: "text-gray-600 dark:text-gray-400",
          text: "text-gray-900 dark:text-gray-100",
        };
    }
  };

  const handleActionClick = (action: UrgentAction) => {
    if (action.actionUrl) {
      router.push(action.actionUrl);
    }
  };

  return (
    <div className="w-full mb-6 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-default-500 uppercase tracking-wider flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Actions Requises & Alertes
        </h3>
        <span className="text-xs text-default-400 font-medium">
          {actions.length} notification{actions.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => {
          const Icon = getIcon(action.type);
          const colors = getColorClasses(action.type);

          return (
            <Card
              key={action.id}
              isPressable
              className={`
                ${colors.border} ${colors.bg}
                border-l-4 shadow-sm hover:shadow-md transition-all cursor-pointer
              `}
              onPress={() => handleActionClick(action)}
            >
              <CardBody className="flex flex-row items-center gap-3 p-3">
                <div className="flex-shrink-0">
                  <Icon className={`w-5 h-5 ${colors.icon}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${colors.text} line-clamp-2`}
                  >
                    {action.message}
                  </p>
                  <p className="text-xs text-default-500 mt-0.5">
                    {action.timestamp}
                  </p>
                </div>

                {action.actionUrl && (
                  <div className="flex-shrink-0">
                    <Button
                      isIconOnly
                      color={action.type === "critical" ? "danger" : "primary"}
                      size="sm"
                      variant="light"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
