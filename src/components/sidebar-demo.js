"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "./ui/sidebar";
import {
  IconBriefcase,
  IconFileText,
  IconUser,
  IconSettings,
  IconLogout,
  IconHome,
  IconClipboardList,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";

export default function SidebarDemo({ currentPage, onPageChange, user, onLogout }) {
  const links = [
    {
      label: "Dashboard",
      href: "#",
      icon: (
        <IconHome className="h-5 w-5 shrink-0 text-black dark:text-black" />
      ),
      onClick: () => onPageChange('home'),
      active: currentPage === 'home'
    },
    {
      label: "CV Generator",
      href: "#",
      icon: (
        <IconFileText className="h-5 w-5 shrink-0 text-black dark:text-black" />
      ),
      onClick: () => onPageChange('generator'),
      active: currentPage === 'generator'
    },
    {
      label: "Job Tracker",
      href: "#",
      icon: (
        <IconClipboardList className="h-5 w-5 shrink-0 text-black dark:text-black" />
      ),
      onClick: () => onPageChange('tracking'),
      active: currentPage === 'tracking'
    },
    {
      label: "Profile",
      href: "#",
      icon: (
        <IconUser className="h-5 w-5 shrink-0 text-black dark:text-black" />
      ),
      onClick: () => onPageChange('profile'),
      active: currentPage === 'profile'
    },
  ];
  
  const [open, setOpen] = useState(false);
  
  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {open ? <Logo /> : <LogoIcon />}
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>
        </div>
        <div>
          <SidebarLink
            link={{
              label: user?.firstName ? `${user.firstName} ${user.lastName}` : "User",
              href: "#",
              icon: (
                <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                  {user?.firstName ? user.firstName.charAt(0).toUpperCase() : "U"}
                </div>
              ),
              onClick: () => onPageChange('profile')
            }}
          />
          {user && (
            <SidebarLink
              link={{
                label: "Logout",
                href: "#",
                icon: (
                  <IconLogout className="h-5 w-5 shrink-0 text-black dark:text-black" />
                ),
                onClick: onLogout
              }}
            />
          )}
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

export const Logo = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <div className="h-6 w-6 shrink-0 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
        <IconFileText className="h-4 w-4 text-white" />
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-bold text-lg whitespace-pre text-black dark:text-white"
      >
        TrackApply
      </motion.span>
    </a>
  );
};

export const LogoIcon = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <div className="h-6 w-6 shrink-0 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
        <IconFileText className="h-4 w-4 text-white" />
      </div>
    </a>
  );
}; 