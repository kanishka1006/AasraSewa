"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Radio, 
  Map, 
  Users, 
  Activity, 
  Settings, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: "Overview", icon: Activity },
    { href: "/admin/rescue", label: "Rescue Ops", icon: Radio },
    { href: "/admin/map", label: "Live Map", icon: Map },
    { href: "/admin/users", label: "Band Users", icon: Users },
    { href: "/admin/settings", label: "System", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <motion.aside 
        initial={{ width: 280 }}
        animate={{ width: isOpen ? 280 : 80 }}
        className="bg-slate-900 text-white flex-shrink-0 relative hidden lg:flex flex-col duration-300 ease-in-out border-r border-slate-800"
      >
        <div className="p-6 flex items-center justify-between">
          <AnimatePresence>
            {isOpen && (
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400"
              >
                AasraSewa
              </motion.h1>
            )}
          </AnimatePresence>
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-slate-800 rounded-lg">
            <Menu className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <div className={`
                   flex items-center gap-4 px-4 py-3 rounded-xl transition-all cursor-pointer group
                   ${isActive ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}
                `}>
                  <link.icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  {isOpen && (
                    <motion.span 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="font-medium whitespace-nowrap"
                    >
                      {link.label}
                    </motion.span>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
           <button 
             onClick={() => { localStorage.clear(); window.location.href='/login' }}
             className="flex items-center gap-4 px-4 py-3 w-full text-left text-red-400 hover:bg-red-950/30 rounded-xl transition-all"
            >
             <LogOut className="w-6 h-6" />
             {isOpen && <span>Sign Out</span>}
           </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 lg:p-8">
        {children}
      </main>
    </div>
  );
}
