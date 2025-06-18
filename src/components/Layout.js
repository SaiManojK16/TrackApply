import React, { useState } from 'react';
import { Sidebar, SidebarBody, SidebarLink } from './ui/sidebar';
import { IconArrowLeft, IconBrandTabler, IconSettings, IconUserBolt, IconHome2 } from '@tabler/icons-react';
import { cn } from '../lib/utils';

const links = [
  {
    label: 'Dashboard',
    href: '/',
    icon: <IconHome2 className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
  },
  {
    label: 'Job Tracker',
    href: '/tracker',
    icon: <IconBrandTabler className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: <IconUserBolt className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <IconSettings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
  },
  {
    label: 'Logout',
    href: '/logout',
    icon: <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
  },
];

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-hidden rounded-md border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-800',
        'h-screen'
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
      <main className="flex-1 p-4 md:p-10 overflow-y-auto bg-white dark:bg-neutral-900">
        {children}
      </main>
    </div>
  );
} 