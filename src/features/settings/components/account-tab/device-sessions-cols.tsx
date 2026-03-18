import { type ColumnDef } from "@tanstack/react-table";
import { type LucideIcon } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { AsyncButton } from "@/components/basic/async-action-button";

export interface DeviceSessionItem {
  id: string;
  token: string;
  device: {
    name: string;
    icon: LucideIcon;
  };
  updatedAt: Date;
}

interface Props {
  current?: string | null;
  revokeSession: (token: string) => Promise<void>;
}
export function getSessionCols({ current, revokeSession }: Props) {
  const columns: ColumnDef<DeviceSessionItem>[] = [
    {
      id: "device",
      header: "Device",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <row.original.device.icon className="text-muted-foreground h-5 w-5" />
          <div className="flex flex-col">
            <span className="font-medium">{row.original.device.name}</span>
            {row.original.token === current && (
              <span className="text-xs text-blue-500">This Device</span>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "last-active",
      header: "Last active",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {format(row.original.updatedAt, "PP")}
        </span>
      ),
    },
    {
      id: "location",
      header: "Location",
      cell: () => <span className="text-muted-foreground">-</span>,
    },
    {
      id: "log-out",
      header: "",
      cell: ({ row }) =>
        row.original.token !== current && (
          <div className="flex justify-end">
            <RevokeSessionButton
              revokeSession={() => revokeSession(row.original.token)}
            />
          </div>
        ),
      size: 95,
    },
  ];

  return columns;
}

function RevokeSessionButton({
  revokeSession,
}: {
  revokeSession: () => Promise<void>;
}) {
  const [isRevoking, setIsRevoking] = useState(false);

  const handleRevoke = async () => {
    setIsRevoking(true);
    await revokeSession();
    setIsRevoking(false);
  };

  return (
    <AsyncButton
      variant="ghost"
      size="sm"
      className="text-muted-foreground"
      onClick={() => handleRevoke()}
      isLoading={isRevoking}
    >
      Log out
    </AsyncButton>
  );
}
