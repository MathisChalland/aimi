import {
  SidebarProvider,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  Sidebar,
} from "@/components/ui/sidebar";
import { Brain, CreditCard, MessageSquare, User } from "lucide-react";

const sidebarData = {
  personal: {
    name: "Personal",
    items: [
      { name: "Account", icon: User, value: "account" },
      { name: "Billing", icon: CreditCard, value: "billing" },
    ],
  },
  companion: {
    name: "Companion",
    items: [
      { name: "Chat", icon: MessageSquare, value: "chat" },
      { name: "Memory", icon: Brain, value: "memory" },
    ],
  },
};

interface Props {
  openTab: string;
  setOpenTab: (tab: string) => void;
  children?: React.ReactNode;
}

export function SettingsDialogSidebar({
  openTab,
  setOpenTab,
  children,
}: Props) {
  return (
    <SidebarProvider className="max-h-full min-h-full items-start">
      <Sidebar collapsible="none" className="hidden md:flex">
        <SidebarContent>
          {Object.entries(sidebarData).map(([key, group]) => (
            <SidebarGroup key={key}>
              <SidebarGroupLabel>{group.name}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        onClick={() => setOpenTab(item.value)}
                        isActive={item.value === openTab}
                      >
                        <item.icon />
                        <span>{item.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </Sidebar>
      {children}
    </SidebarProvider>
  );
}
