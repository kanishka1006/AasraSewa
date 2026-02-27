"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export default function Notifications() {
  const [notification, setNotification] = useState<{title: string, message: string} | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const eventSourceAlerts = new EventSource(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/alerts/stream`);
    const eventSourceSos = new EventSource(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/sos/stream`);

    const handleMessage = (event: MessageEvent) => {
        try {
            const data = JSON.parse(event.data);
            const title = "🚨 New Rescue Operation Assigned!";
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

  return (
    <AnimatePresence>
        {notification && (
            <motion.div 
               initial={{ opacity: 0, y: -20, x: 20 }}
               animate={{ opacity: 1, y: 0, x: 0 }}
               exit={{ opacity: 0, y: -20, x: 20 }}
               className="fixed top-8 right-8 z-[9999] bg-red-600 text-white p-4 rounded-xl shadow-2xl flex items-start gap-3 max-w-sm"
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
  );
}
