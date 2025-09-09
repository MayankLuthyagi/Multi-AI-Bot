"use client";
import { useState } from "react";
import { Navbar } from "./Mobile/navbar";
import { ChatInput } from "./chatInput";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [overlayOpen, setOverlayOpen] = useState(false);

  return (
    <>
      <Navbar open={overlayOpen} setOpen={setOverlayOpen} />
      <div className="flex flex-col lg:flex-row">{children}</div>
      {!overlayOpen && <ChatInput />}
    </>
  );
}