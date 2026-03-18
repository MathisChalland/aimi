import { type ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface SettingsContentProps {
  children?: ReactNode;
}
function SettingsContent({ children }: SettingsContentProps) {
  return <div className="flex w-full flex-col gap-12">{children}</div>;
}

interface SettingsGroupProps {
  children?: ReactNode;
  title: string;
  className?: string;
}
function SettingsGroup({ title, children, className }: SettingsGroupProps) {
  return (
    <div className="flex w-full flex-col">
      <div>
        <p className="mb-3 text-base font-medium">{title}</p>
        <Separator className="mb-4" />
      </div>
      <div className={cn("flex flex-col gap-5", className)}>{children}</div>
    </div>
  );
}

interface SettingProps {
  title: string;
  customTitle?: ReactNode;
  description?: string;
  children?: ReactNode;
  className?: string;
}

function Setting({
  title,
  description,
  children: setting,
  className,
  customTitle,
}: SettingProps) {
  return (
    <div className="flex w-full items-center justify-between gap-3">
      <div className="space-y-2">
        {customTitle ?? <p className="text-sm font-medium">{title}</p>}
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      <div className={cn("flex justify-end", className)}>{setting}</div>
    </div>
  );
}

export { SettingsContent, SettingsGroup, Setting };
