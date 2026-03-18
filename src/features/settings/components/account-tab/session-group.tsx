import { detectPlatform } from "@/lib/plattform-detect";
import { authClient, type Session } from "@/server/better-auth/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useGetSessionCols } from "./device-sessions-cols";
import { Setting, SettingsGroup } from "../settings-components";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/table";
import { useMemo } from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";

interface Props {
  session: Session | null;
}
export function DeviceSessionsGroup({ session }: Props) {
  const queryClient = useQueryClient();
  const { data: deviceSessions } = useQuery({
    queryKey: ["user-device-sessions"],
    queryFn: () => authClient.listSessions(),
    select: (result) =>
      result.data?.map((session) => {
        return {
          id: session.id,
          token: session.token,
          device: detectPlatform(session.userAgent),
          updatedAt: session.updatedAt,
        };
      }),
  });

  const sortedSessions = useMemo(() => {
    if (!deviceSessions || !session) return deviceSessions;
    return [...deviceSessions].sort((a, b) => {
      if (a.token === session.session.token) return -1;
      if (b.token === session.session.token) return 1;
      return 0;
    });
  }, [deviceSessions, session]);

  const revokeSession = async (token: string): Promise<void> => {
    await authClient.revokeSession({
      token: token,
      fetchOptions: {
        onError: () => {
          toast.error("Error loging out device");
        },
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: ["user-device-sessions"],
          });
        },
      },
    });
  };

  const revokeAllOtherSessions = async (): Promise<void> => {
    await authClient.revokeOtherSessions({
      fetchOptions: {
        onError: () => {
          toast.error("Error loging out other devices");
        },
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: ["user-device-sessions"],
          });
        },
      },
    });
  };

  const columns = useGetSessionCols({
    current: session?.session.token,
    revokeSession,
  });

  const table = useReactTable({
    data: sortedSessions ?? [],
    columns,
    getRowId: (row) => row.token,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
  });

  return (
    <SettingsGroup title="Devices">
      <Setting
        title="Log out of all devices"
        description="Log out of all other active sessions on other devices besides this one."
      >
        <Button
          variant="ghost"
          size="sm"
          disabled={!sortedSessions || sortedSessions.length < 2}
          onClick={revokeAllOtherSessions}
        >
          Log out of all devices
        </Button>
      </Setting>
      <DataTable table={table} fixedCols={["log-out"]} />
    </SettingsGroup>
  );
}
