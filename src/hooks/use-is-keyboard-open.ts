import { useState, useEffect } from "react";

type UseDetectKeyboardOpen = {
  onOpen?: () => void;
  onClose?: () => void;
};

export const useIsKeyboardOpen = ({
  onOpen,
  onClose,
}: UseDetectKeyboardOpen): boolean => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(false);

  useEffect(() => {
    const initialHeight = window.innerHeight;

    const handleResize = () => {
      const heightDifference = initialHeight - window.innerHeight;
      setIsKeyboardOpen(heightDifference > 150);
      if (heightDifference > 150) {
        onOpen?.();
      } else {
        onClose?.();
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        const heightAtFocus = window.innerHeight;
        setTimeout(() => {
          const heightDifference = heightAtFocus - window.innerHeight;
          if (heightDifference > 150) {
            setIsKeyboardOpen(true);
            onOpen?.();
          }
        }, 300);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        setTimeout(() => {
          setIsKeyboardOpen(false);
          onClose?.();
        }, 100);
      }
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    handleResize();

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, [onOpen, onClose]);

  return isKeyboardOpen;
};
