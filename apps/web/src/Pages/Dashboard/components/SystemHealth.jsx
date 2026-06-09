import React from "react";
import { ShieldCheck, HardDrive, Cpu, Video } from "lucide-react";
import { StatusBadge } from "../../../Components/StatusBadge";
import { themes } from "../../../design-system/tokens";

export default function SystemHealth({ isDarkMode, cameras, isSidebar = false }) {
  const t = themes.getThemeClasses(isDarkMode);

  const activeCamerasCount = cameras?.filter((c) => c.status === "Online").length || 0;
  const totalCamerasCount = cameras?.length || 0;

  const services = [
    {
      name: "API Gateway",
      icon: ShieldCheck,
      status: "online",
      text: "CONNECTED",
      detail: "Latency: 14ms",
    },
    {
      name: "Database Cluster",
      icon: HardDrive,
      status: "online",
      text: "CONNECTED",
      detail: "Sync: 100%",
    },
    {
      name: "AI Inference Engine",
      icon: Cpu,
      status: "live",
      text: "PROCESSING",
      detail: "Load: 18%",
    },
    {
      name: "Camera Network",
      icon: Video,
      status: activeCamerasCount > 0 ? "online" : "warning",
      text: activeCamerasCount > 0 ? "ONLINE" : "NO ACTIVE FEEDS",
      detail: `${activeCamerasCount}/${totalCamerasCount} Online`,
    },
  ];

  return (
    <div className={`p-6 ${t.card}`}>
      <div className="space-y-1 mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
          Node Reliability
        </p>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          System Health Monitor
        </h3>
      </div>

      <div className={`grid gap-4 ${isSidebar ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
        {services.map((srv) => {
          const IconComp = srv.icon;
          return (
            <div
              key={srv.name}
              className={`p-4 rounded-xl border ${t.border} bg-white/40 dark:bg-black/20 flex ${
                isSidebar ? "flex-col items-start gap-3" : "items-center justify-between"
              } transition-all duration-300 hover:scale-[1.01]`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/10 rounded-lg text-cyan-500 dark:text-cyan-400 border border-cyan-500/15 flex-shrink-0">
                  <IconComp size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                    {srv.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">
                    {srv.detail}
                  </p>
                </div>
              </div>
              <StatusBadge status={srv.status} text={srv.text} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
