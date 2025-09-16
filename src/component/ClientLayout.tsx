"use client";
import { useState } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Navbar } from "./navbar";
import { ChatInput } from "./chatInput";
import { Sidebar } from "./sidebar";
import { ModelProvider } from "../context/ModelContext";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [overlayOpen, setOverlayOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  // Define routes and their specific requirements
  const isLoginPage = pathname === "/login";
  const isHomePage = pathname === "/";
  const isChatPage = pathname === "/chat" || pathname === "/dashboard";
  const isAdminPage = pathname === "/admin";

  // Sidebar should only show on chat/dashboard page when authenticated
  const shouldShowSidebar = isChatPage && session;

  // ChatInput is now integrated into ChatContainer, so we don't need to render it separately
  const shouldShowChatInput = false;

  // Fix layout classes to prevent black space
  let containerClasses = "";
  if (isLoginPage) {
    containerClasses = "flex flex-col lg:flex-row"; // Login page handles its own layout
  } else if (shouldShowSidebar) {
    containerClasses = "flex flex-col lg:flex-row pt-16 lg:pl-64"; // Chat page with sidebar
  } else {
    containerClasses = "flex flex-col lg:flex-row pt-16 min-h-screen w-full"; // All other pages full width
  }

  return (
    <ModelProvider>
      <Navbar open={overlayOpen} setOpen={setOverlayOpen} />
      {shouldShowSidebar && <Sidebar />}
      <div className={containerClasses}>
        {children}
      </div>
      {shouldShowChatInput && <ChatInput />}
    </ModelProvider>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LayoutContent>
        {children}
      </LayoutContent>
    </SessionProvider>
  );
}