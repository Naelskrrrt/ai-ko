"use client";

import { FC } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Button } from "@heroui/button";
import clsx from "clsx";

import { useColorTheme } from "@/core/hooks/useColorTheme";

export interface ThemeColorSwitchProps {
  className?: string;
}

/**
 * Composant pastille pour changer le thème de couleur
 * Affiche une pastille colorée dans la navbar
 * Supporte plusieurs thèmes de couleur extensibles
 */
export const ThemeColorSwitch: FC<ThemeColorSwitchProps> = ({ className }) => {
  const { colorTheme, setColorTheme, currentTheme, availableThemes, isLoaded } =
    useColorTheme();

  // Ne rien afficher pendant le chargement pour éviter le flash
  if (!isLoaded) {
    return (
      <div className="w-8 h-8 rounded-full bg-default-100 animate-pulse" />
    );
  }

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          isIconOnly
          aria-label="Changer le thème de couleur"
          className={clsx(
            "w-8 h-8 min-w-8 p-0",
            "transition-all duration-200",
            "hover:scale-110 hover:shadow-md",
            className,
          )}
          size="sm"
          style={{
            backgroundColor: currentTheme.badgeColor,
          }}
          title={`Thème actuel: ${currentTheme.name}`}
          variant="flat"
        >
          {/* Pastille vide - la couleur est définie par le style */}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Sélectionner un thème de couleur"
        selectedKeys={[colorTheme]}
        selectionMode="single"
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0];

          if (selected && typeof selected === "string") {
            setColorTheme(selected as any);
          }
        }}
      >
        {availableThemes.map((theme) => (
          <DropdownItem
            key={theme.id}
            description={theme.description}
            startContent={
              <div
                className="w-4 h-4 rounded-full border border-default-300"
                style={{ backgroundColor: theme.badgeColor }}
              />
            }
          >
            {theme.name}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};
