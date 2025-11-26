"use client";

import * as React from "react";
import { useState, useCallback } from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

let toastListeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];
let toastTimeouts: Map<string, NodeJS.Timeout> = new Map();

function notify() {
  toastListeners.forEach((listener) => listener([...toasts]));
}

export function dismissToast(id: string) {
  // Annuler le timeout si il existe
  const timeout = toastTimeouts.get(id);
  if (timeout) {
    clearTimeout(timeout);
    toastTimeouts.delete(id);
  }
  
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

export function toast({
  title,
  description,
  variant = "info",
}: {
  title: string;
  description?: string;
  variant?: ToastVariant;
}) {
  const id = Math.random().toString(36).substring(7);
  const newToast: Toast = { id, title, description, variant };
  
  toasts = [newToast, ...toasts].slice(0, 5);
  notify();

  const timeout = setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    toastTimeouts.delete(id);
    notify();
  }, 5000);
  
  toastTimeouts.set(id, timeout);

  return {
    id,
    dismiss: () => {
      dismissToast(id);
    },
  };
}

export function useToast() {
  const [state, setState] = useState<Toast[]>(toasts);

  React.useEffect(() => {
    toastListeners.push(setState);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== setState);
    };
  }, []);

  const showToast = useCallback(
    (props: { title: string; description?: string; variant?: ToastVariant }) => {
      toast(props);
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    dismissToast(id);
  }, []);

  return {
    toast: showToast,
    toasts: state,
    dismiss,
  };
}

