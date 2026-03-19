"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
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

type ConfirmationDialogOptions = {
  title: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
} & (
  | { description: string; content?: never }
  | { content: React.ReactNode; description?: never }
);

const ConfirmationDialogContext = createContext<{
  confirm: (options: ConfirmationDialogOptions) => Promise<boolean>;
} | null>(null);

export function ConfirmationDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [options, setOptions] = useState<ConfirmationDialogOptions | null>(
    null,
  );
  const resolveRef = useRef<(value: boolean) => void>(null);

  const confirm = useCallback((opts: ConfirmationDialogOptions) => {
    setOptions(opts);
    return new Promise<boolean>((res) => {
      resolveRef.current = res;
    });
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      resolveRef.current?.(false);
      setOptions(null);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    setOptions(null);
  }, []);

  return (
    <ConfirmationDialogContext.Provider value={{ confirm }}>
      {children}
      <AlertDialog open={options !== null} onOpenChange={handleOpenChange}>
        {options && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{options.title}</AlertDialogTitle>
              {options.description ? (
                <AlertDialogDescription>
                  {options.description}
                </AlertDialogDescription>
              ) : (
                <div className="text-muted-foreground text-sm">
                  {options.content}
                </div>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-row space-x-2">
              <AlertDialogCancel className="w-full flex-1">
                {options.cancelText ?? "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction
                variant={options.variant}
                className={`mt-2 w-full flex-1 sm:mt-0`}
                onClick={handleConfirm}
              >
                {options.confirmText ?? "Confirm"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </ConfirmationDialogContext.Provider>
  );
}

export const useConfirmationDialog = () => {
  const context = useContext(ConfirmationDialogContext);
  if (!context) {
    throw new Error(
      "useConfirmationDialog must be used within ConfirmationDialogProvider",
    );
  }
  return context;
};
