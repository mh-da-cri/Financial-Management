"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AlertOptions {
  title: string;
  description?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean; // Nếu false thì chỉ hiện nút OK (giống alert thường)
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<AlertOptions>({ title: "" });

  const showAlert = (options: AlertOptions) => {
    setConfig({
      confirmText: "Đồng ý",
      cancelText: "Hủy",
      showCancel: false, // Mặc định chỉ hiện nút OK
      ...options,
    });
    setOpen(true);
  };

  const handleConfirm = () => {
    if (config.onConfirm) config.onConfirm();
    setOpen(false);
  };

  const handleCancel = () => {
    if (config.onCancel) config.onCancel();
    setOpen(false);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{config.title}</AlertDialogTitle>
            {config.description && (
              <AlertDialogDescription>{config.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            {config.showCancel && (
              <AlertDialogCancel onClick={handleCancel}>
                {config.cancelText}
              </AlertDialogCancel>
            )}
            <AlertDialogAction onClick={handleConfirm}>
              {config.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}