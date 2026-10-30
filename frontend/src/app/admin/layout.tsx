"use client";

import { useState, useEffect } from "react";
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
  X,
  CloudRain,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [notification, setNotification] = useState<{title: string, message: string} | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const eventSourceAlerts = new EventSource(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/alerts/stream`);
    const eventSourceSos = new EventSource(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/sos/stream`);

    const handleMessage = (event: MessageEvent) => {
        try {
            const data = JSON.parse(event.data);
            const title = "🚨 New Rescue Operation!";
            const message = data.type ? `${data.type} Alert at ${data.location}` : `SOS Emergency: ${data.notes || 'User generated alert'}`;
            
            setNotification({ title, message });

            if ("Notification" in window && Notification.permission === "granted") {
               new Notification(title, { body: message });
            }
            
            setTimeout(() => setNotification(null), 8000);
        } catch (e) {
            console.error("Error parsing SSE data:", e);
        }
    };

    eventSourceAlerts.onmessage = handleMessage;
    eventSourceSos.onmessage = handleMessage;

    return () => {
        eventSourceAlerts.close();
        eventSourceSos.close();
    };
  }, []);

  const links = [
    { href: "/admin", label: "Overview", icon: Activity },
    { href: "/admin/iot", label: "IoT Monitor", icon: Radio },
    { href: "/admin/rescue", label: "Rescue Ops", icon: Radio },
    { href: "/admin/map", label: "Live Map", icon: Map },
    { href: "/admin/weather", label: "Weather AI", icon: CloudRain },
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
          <div className="flex items-center gap-3">
             <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                <Image src="/AasraSewa_Logo.jpeg" alt="Logo" fill className="object-cover" />
             </div>
             <AnimatePresence>
               {isOpen && (
                 <motion.h1 
                   initial={{ opacity: 0, width: 0 }}
                   animate={{ opacity: 1, width: "auto" }}
                   exit={{ opacity: 0, width: 0 }}
                   className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400 whitespace-nowrap overflow-hidden"
                 >
                   AasraSewa
                 </motion.h1>
               )}
             </AnimatePresence>
          </div>
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
      <main className="flex-1 overflow-auto p-4 lg:p-8 relative">
        <AnimatePresence>
            {notification && (
                <motion.div 
                   initial={{ opacity: 0, y: -20, x: 20 }}
                   animate={{ opacity: 1, y: 0, x: 0 }}
                   exit={{ opacity: 0, y: -20, x: 20 }}
                   className="fixed top-8 right-8 z-50 bg-red-600 text-white p-4 rounded-xl shadow-2xl flex items-start gap-3 max-w-sm"
                >
                    <AlertTriangle className="w-6 h-6 shrink-0" />
                    <div>
                        <h4 className="font-bold text-lg leading-tight mb-1">{notification.title}</h4>
                        <p className="text-red-100 text-sm leading-snug">{notification.message}</p>
                    </div>
                    <button onClick={() => setNotification(null)} className="ml-2 hover:bg-red-700 p-1 rounded-full bg-red-600/50">
                        <X className="w-4 h-4" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
        {children}
      </main>
    </div>
  );
}
