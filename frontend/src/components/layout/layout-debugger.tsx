"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Eye, EyeOff } from "lucide-react";

import { useUnifiedLayout } from "@/core/hooks/useUnifiedLayout";

/**
 * Composant de debug pour visualiser la configuration de layout actuelle
 * À utiliser uniquement en développement
 */
export const LayoutDebugger = () => {
  const [isVisible, setIsVisible] = useState(false);
  const layoutConfig = useUnifiedLayout();

  // Ne rien afficher en production
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  if (!isVisible) {
    return (
      <Button
        isIconOnly
        className="fixed bottom-4 right-4 z-50 opacity-50 hover:opacity-100 bg-theme-primary text-white"
        size="sm"
        variant="flat"
        onPress={() => setIsVisible(true)}
      >
        <Eye className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 max-h-96 overflow-auto">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center w-full">
          <h3 className="text-sm font-semibold">Layout Debug</h3>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={() => setIsVisible(false)}
          >
            <EyeOff className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="space-y-3 text-xs">
          <div>
            <span className="font-medium text-default-700">Layout Type:</span>
            <span
              className={`ml-2 px-2 py-1 rounded text-xs ${
                layoutConfig.layoutType === "sidebar"
                  ? "bg-theme-primary/20 text-theme-primary"
                  : layoutConfig.layoutType === "auth"
                    ? "bg-warning/20 text-warning"
                    : "bg-default/20 text-default-700"
              }`}
            >
              {layoutConfig.layoutType}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-between">
              <span className="text-default-600">Header:</span>
              <span
                className={
                  layoutConfig.hasHeader ? "text-success" : "text-danger"
                }
              >
                {layoutConfig.hasHeader ? "✓" : "✗"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-default-600">Footer:</span>
              <span
                className={
                  layoutConfig.hasFooter ? "text-success" : "text-danger"
                }
              >
                {layoutConfig.hasFooter ? "✓" : "✗"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-default-600">Sidebar:</span>
              <span
                className={
                  layoutConfig.hasSidebar ? "text-success" : "text-danger"
                }
              >
                {layoutConfig.hasSidebar ? "✓" : "✗"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-default-600">Toggle:</span>
              <span
                className={
                  layoutConfig.showSidebarToggle
                    ? "text-success"
                    : "text-danger"
                }
              >
                {layoutConfig.showSidebarToggle ? "✓" : "✗"}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-divider">
            <div className="text-default-600 text-xs">
              <strong>Layout Dimensions:</strong>
            </div>
            <div className="mt-1 space-y-1 text-xs text-default-500">
              <div>Header: clamp(3.5rem, 8vh, 5rem)</div>
              <div>Footer: clamp(2.5rem, 6vh, 4rem)</div>
              <div>Sidebar: clamp(240px, 18vw, 320px)</div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default LayoutDebugger;
