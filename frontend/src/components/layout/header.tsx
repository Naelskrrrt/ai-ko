"use client";

import {
  Navbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Divider } from "@heroui/divider";
import NextLink from "next/link";
import Image from "next/image";
import clsx from "clsx";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { siteConfig } from "@/core/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { ThemeColorSwitch } from "@/components/theme-color-switch";
import { Logo, MenuIcon } from "@/components/icons";
import { useAuth } from "@/core/providers/AuthProvider";

interface HeaderProps {
  onSidebarToggle?: () => void;
  showSidebarToggle?: boolean;
  title?: string;
  subtitle?: string;
}

export const Header = ({
  onSidebarToggle,
  showSidebarToggle = false,
  title,
  subtitle,
}: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatRole = (role?: string): string => {
    const roleMap: Record<string, string> = {
      admin: "Administrateur",
      etudiant: "Étudiant",
      enseignant: "Enseignant",
    };
    return roleMap[role || ""] || role || "Utilisateur";
  };

  return (
    <Navbar
      className="layout-header layout-header-height border-b-2 border-divider/60 bg-background/80 backdrop-blur-md shadow-sm"
      isMenuOpen={isMenuOpen}
      maxWidth="full"
      position="sticky"
      onMenuOpenChange={setIsMenuOpen}
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        {showSidebarToggle && (
          <NavbarItem className="lg:hidden">
            <Button
              isIconOnly
              aria-label="Toggle sidebar"
              className="text-default-700 hover:bg-default-100 dark:hover:bg-default-50"
              size="lg"
              variant="light"
              onPress={onSidebarToggle}
            >
              <MenuIcon className="w-6 h-6" />
            </Button>
          </NavbarItem>
        )}

        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-2" href="/">
            <Logo size={80} />
          </NextLink>
        </NavbarBrand>

        {/* Titre et sous-titre si fournis, sinon navigation */}
        {title ? (
          <div className="hidden lg:flex flex-col ml-2">
            <h1 className="text-xl font-bold">{title}</h1>
            {subtitle && <p className="text-sm text-default-500">{subtitle}</p>}
          </div>
        ) : (
          <ul className="hidden lg:flex gap-4 justify-start ml-2">
            {siteConfig.navItems.map((item) => (
              <NavbarItem key={item.href}>
                <NextLink
                  className={clsx(
                    "data-[active=true]:text-theme-primary data-[active=true]:font-medium",
                    "text-foreground hover:text-theme-primary transition-colors",
                  )}
                  href={item.href}
                >
                  {item.label}
                </NextLink>
              </NavbarItem>
            ))}
          </ul>
        )}
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="flex items-center gap-2">
          <ThemeColorSwitch />
          <ThemeSwitch />
        </NavbarItem>

        {!loading && user ? (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                className="bg-theme-primary/10 dark:bg-theme-primary/20 text-theme-primary hover:bg-theme-primary/20 dark:hover:bg-theme-primary/30"
                size="sm"
                startContent={
                  <div className="w-6 h-6 rounded-full bg-theme-primary/20 flex items-center justify-center text-xs font-semibold text-theme-primary">
                    {getInitials(user.name || user.email || "")}
                  </div>
                }
                variant="flat"
              >
                {user.name}
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="User menu">
              {/* Section info utilisateur */}
              <DropdownItem
                key="user-info"
                isReadOnly
                textValue="User info"
                className="h-auto py-3 cursor-default"
              >
                <div className="flex items-center gap-3 w-full">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.name || user.email || "User"}
                        className="rounded-full object-cover"
                        width={40}
                        height={40}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-theme-primary/20 flex items-center justify-center text-sm font-semibold text-theme-primary">
                        {getInitials(user.name || user.email || "")}
                      </div>
                    )}
                  </div>
                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {user.name || user.email}
                    </p>
                    <p className="text-xs text-default-500 truncate">
                      {user.email}
                    </p>
                    <p className="text-xs text-default-400">
                      {formatRole(user.role)}
                    </p>
                  </div>
                  {/* Bouton navigation */}
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => router.push("/profile")}
                    className="flex-shrink-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </DropdownItem>

              {/* Divider */}
              <DropdownItem key="divider" isReadOnly textValue="divider">
                <Divider />
              </DropdownItem>

              {/* Items existants */}
              {user?.role === "etudiant" ? (
                <DropdownItem
                  key="matieres"
                  onPress={() => {
                    // Le modal sera géré par le layout étudiant
                    const event = new CustomEvent("open-matieres-modal");

                    window.dispatchEvent(event);
                  }}
                >
                  Mes matières
                </DropdownItem>
              ) : null}
              <DropdownItem
                key="logout"
                className="text-danger"
                color="danger"
                onPress={handleLogout}
              >
                Déconnexion
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <>
            <NavbarItem>
              <Button
                as={NextLink}
                className="bg-theme-primary/10 dark:bg-theme-primary/20 text-theme-primary hover:bg-theme-primary/20 dark:hover:bg-theme-primary/30"
                href="/login"
                size="sm"
                variant="flat"
              >
                Login
              </Button>
            </NavbarItem>
            <NavbarItem>
              <Button
                as={NextLink}
                className="bg-theme-primary/10 dark:bg-theme-primary/20 text-theme-primary hover:bg-theme-primary/20 dark:hover:bg-theme-primary/30"
                href="/register"
                size="sm"
                variant="flat"
              >
                S'inscrire
              </Button>
            </NavbarItem>
          </>
        )}
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <div className="flex items-center gap-2">
          <ThemeColorSwitch />
          <ThemeSwitch />
        </div>
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          <div className="flex flex-col gap-2 mt-4">
            {/* Navigation principale dans le menu mobile */}
            {siteConfig.navItems.map((item, index) => (
              <NavbarMenuItem key={`${item.label}-${index}`}>
                <NextLink
                  className={clsx(
                    "w-full text-foreground hover:text-theme-primary transition-colors",
                    index === 0 && "text-theme-primary",
                  )}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </NextLink>
              </NavbarMenuItem>
            ))}

            {/* Liens sidebar supplémentaires si on est sur une page dashboard */}
            {showSidebarToggle && (
              <>
                {/* Sidebar nav items supprimés - plus de navigation spéciale */}
              </>
            )}

            {/* Divider */}
            <div className="border-t border-divider my-2" />

            {/* Boutons dans le menu mobile */}
            {!user ? (
              <>
                <NavbarMenuItem>
                  <NextLink
                    className="w-full text-theme-primary font-semibold hover:text-theme-primary/80 transition-colors"
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </NextLink>
                </NavbarMenuItem>
                <NavbarMenuItem>
                  <NextLink
                    className="w-full text-foreground hover:text-theme-primary transition-colors"
                    href="/register"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    S'inscrire
                  </NextLink>
                </NavbarMenuItem>
              </>
            ) : (
              <NavbarMenuItem>
                <button
                  className="w-full text-left text-danger hover:text-danger/80 transition-colors"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                >
                  Déconnexion
                </button>
              </NavbarMenuItem>
            )}
          </div>
        </div>
      </NavbarMenu>
    </Navbar>
  );
};
