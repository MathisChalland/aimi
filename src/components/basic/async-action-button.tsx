import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";

interface Props {
  isLoading?: boolean;
  variant?: "default" | "destructive" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

export function AsyncButton({
  isLoading,
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & Props) {
  return (
    <Button
      {...props}
      className={className}
      variant={variant}
      size={size}
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      disabled={isLoading || props.disabled}
    >
      {isLoading ? (
        <LoaderCircle className="mx-auto animate-spin" />
      ) : (
        props.children
      )}
    </Button>
  );
}
