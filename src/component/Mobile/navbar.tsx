"use client";
import React from "react";
type NavbarProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};
export const Navbar = ({ open, setOpen }: NavbarProps) => {
  return (
    <nav className="fixed top-0 w-full bg-[#0D0D0D] text-white p-4 lg:hidden block">
      <div className="flex items-center justify-between">
        <img className="w-8" src="https://chat.aifiesta.ai/static/images/logo/icon.png" alt="" />
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:text-accent-foreground h-10 w-10 hover:bg-accent justify-center p-0"
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu !w-5 !h-5"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
      {/* overlay */}
      <div
        className={`fixed inset-0 z-[9999] bg-black bg-opacity-95 transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ willChange: "transform" }}
      >
        <button
          className="absolute top-6 right-6 text-white text-3xl"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          &times;
        </button>
        <ul className="flex flex-col items-center justify-center h-full gap-8 text-2xl">
          <li><a href="#">Item 1</a></li>
          <li><a href="#">Item 2</a></li>
          <li><a href="#">Item 3</a></li>
        </ul>
      </div>
    </nav>
  );
};