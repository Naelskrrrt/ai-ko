"use client";

import type { User } from "@/shared/types/admin.types";

import { Shield, GraduationCap, User as UserIcon } from "lucide-react";

interface RoleChangeMenuProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onRoleChange: (role: string) => void;
}

export function RoleChangeMenu({
  user,
  isOpen,
  onClose,
  onRoleChange,
}: RoleChangeMenuProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="button"
      tabIndex={0}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
    >
      <div
        className="absolute right-20 top-1/2 -translate-y-1/2 bg-white dark:bg-content1 rounded-lg shadow-lg border border-divider p-2 min-w-[180px]"
        role="button"
        tabIndex={0}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onClose();
          }
        }}
      >
        <div className="text-sm font-semibold text-default-500 px-2 py-1 mb-1">
          Changer le rôle
        </div>
        <button
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-default-100 transition-colors ${
            user.role === "admin" ? "bg-default-100" : ""
          }`}
          onClick={() => {
            onRoleChange("admin");
            onClose();
          }}
        >
          <Shield className="w-4 h-4 text-danger" />
          <span>Admin</span>
        </button>
        <button
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-default-100 transition-colors ${
            user.role === "enseignant" ? "bg-default-100" : ""
          }`}
          onClick={() => {
            onRoleChange("enseignant");
            onClose();
          }}
        >
          <GraduationCap className="w-4 h-4 text-theme-primary" />
          <span>Enseignant</span>
        </button>
        <button
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-default-100 transition-colors ${
            user.role === "etudiant" ? "bg-default-100" : ""
          }`}
          onClick={() => {
            onRoleChange("etudiant");
            onClose();
          }}
        >
          <UserIcon className="w-4 h-4 text-secondary" />
          <span>Étudiant</span>
        </button>
      </div>
    </div>
  );
}
