"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/trpc/react";
import { Bot, Check, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useConfirmationDialog } from "@/hooks/confirmation-dialog";

interface CompanionSwitcherProps {
  currentCompanionId: string;
  companionName?: string;
}

export function CompanionSwitcher({
  currentCompanionId,
  companionName = "Aimi",
}: CompanionSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const router = useRouter();
  const utils = api.useUtils();
  const { confirm } = useConfirmationDialog();

  const { data: companions } = api.chat.getCompanions.useQuery();

  const createCompanion = api.chat.createCompanion.useMutation({
    onSuccess: (created) => {
      setIsCreating(false);
      setNewName("");
      void utils.chat.getCompanions.invalidate();
      router.push(`/chat/${created.id}`);
    },
  });

  const renameCompanion = api.chat.renameCompanion.useMutation({
    onMutate: async ({ companionId, name }) => {
      await utils.chat.getCompanions.cancel();
      const previousCompanions = utils.chat.getCompanions.getData();
      utils.chat.getCompanions.setData(undefined, (old) =>
        old?.map((c) => (c.id === companionId ? { ...c, name } : c)),
      );

      const previousConversation = utils.chat.getUserConversation.getData({
        companionId,
      });
      if (previousConversation) {
        utils.chat.getUserConversation.setData({ companionId }, (old) => {
          if (!old) return old;
          return { ...old, companion: { ...old.companion, name } };
        });
      }

      return { previousCompanions, previousConversation };
    },
    onError: (_err, { companionId }, context) => {
      if (context?.previousCompanions) {
        utils.chat.getCompanions.setData(undefined, context.previousCompanions);
      }
      if (context?.previousConversation) {
        utils.chat.getUserConversation.setData(
          { companionId },
          context.previousConversation,
        );
      }
    },
  });

  const deleteCompanion = api.chat.deleteCompanion.useMutation({
    onSuccess: (_, variables) => {
      void utils.chat.getCompanions.invalidate();
      if (variables.companionId === currentCompanionId) {
        router.push("/chat");
      }
    },
  });

  const handleSwitch = (companionId: string) => {
    if (editingId || isCreating) return;
    setOpen(false);
    if (companionId !== currentCompanionId) {
      router.push(`/chat/${companionId}`);
    }
  };

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    createCompanion.mutate({ name: trimmed });
  };

  const commitRename = () => {
    const trimmed = editingName.trim();
    if (!editingId) return;
    if (!trimmed || trimmed === originalName) {
      setEditingId(null);
      return;
    }
    renameCompanion.mutate({ companionId: editingId, name: trimmed });
    setEditingId(null);
  };

  const handleDelete = async (companionId: string, name: string) => {
    setOpen(false);
    const confirmed = await confirm({
      title: `Delete ${name}?`,
      description:
        "This will permanently delete this companion, all conversations, and memories. This cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
    });
    if (confirmed) {
      deleteCompanion.mutate({ companionId });
    }
  };

  const startEditing = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
    setOriginalName(name);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 rounded-md px-2 py-1 transition-colors hover:bg-accent">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="size-4" />
            </AvatarFallback>
          </Avatar>
          <div className="text-left">
            <h1 className="text-sm font-semibold">{companionName}</h1>
            <p className="text-muted-foreground text-xs">Your AI companion</p>
          </div>
          <ChevronDown className="text-muted-foreground size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {companions?.map((c) =>
          editingId === c.id ? (
            <div key={c.id} className="flex items-center gap-2 px-2 py-1.5">
              {c.id === currentCompanionId ? (
                <Check className="text-primary size-4 shrink-0" />
              ) : (
                <span className="size-4 shrink-0" />
              )}
              <input
                className="h-5 w-full bg-transparent text-sm outline-none"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") {
                    commitRename();
                  }
                  if (e.key === "Escape") {
                    setEditingId(null);
                  }
                }}
                onBlur={() => setEditingId(null)}
                autoFocus
              />
            </div>
          ) : (
            <DropdownMenuItem
              key={c.id}
              className="group flex items-center"
              onSelect={(e) => {
                e.preventDefault();
                handleSwitch(c.id);
              }}
            >
              {c.id === currentCompanionId ? (
                <Check className="text-primary size-4 shrink-0" />
              ) : (
                <span className="size-4 shrink-0" />
              )}
              <span className="flex-1 truncate">{c.name}</span>
              <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-focus:opacity-100 group-data-[highlighted]:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(c.id, c.name);
                  }}
                  className="rounded p-1 hover:bg-primary/5"
                >
                  <Pencil className="size-3.5" />
                </button>
                {companions.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete(c.id, c.name);
                    }}
                    className="hover:text-destructive rounded p-1 hover:bg-primary/5"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </DropdownMenuItem>
          ),
        )}
        <DropdownMenuSeparator />
        {isCreating ? (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Plus className="text-muted-foreground size-4 shrink-0" />
            <input
              className="h-5 w-full bg-transparent text-sm outline-none"
              placeholder="Companion name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setIsCreating(false);
                  setNewName("");
                }
              }}
              onBlur={() => {
                setIsCreating(false);
                setNewName("");
              }
              }
              autoFocus
            />
          </div>
        ) : (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setIsCreating(true);
            }}
          >
            <Plus className="size-4" />
            <span>New companion</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
