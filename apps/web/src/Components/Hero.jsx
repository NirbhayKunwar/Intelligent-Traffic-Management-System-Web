import { motion } from "framer-motion";
import { ArrowRight, Activity, Cpu, Shield, Users } from "lucide-react";
import { Link } from "react-router-dom";
import pic1Traffic from "../assets/pic1_traffic.jpg";

export default function Hero() {
  return (
    <section 
      id="hero" 
      className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-100 transition-colors duration-300"
    >
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 via-cyan-50/20 to-indigo-100/30 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/20 -z-10"></div>
      
      {/* Modern Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 -z-10"></div>

      {/* Decorative blurred blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }}></div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left: Headline & CTAs */}
          <div className="space-y-8 lg:col-span-6 text-center lg:text-left">
            <motion.div
              className="inline-block"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 dark:from-cyan-500/20 dark:to-indigo-500/20 border border-cyan-500/20 dark:border-cyan-500/40 text-cyan-700 dark:text-cyan-400 rounded-full text-xs font-semibold shadow-sm">
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                SaaS Smart Mobility Platform v1.2
              </span>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-poppins font-extrabold tracking-tight leading-tight"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              Next-Gen <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-indigo-500 dark:from-cyan-400 dark:via-indigo-300 dark:to-indigo-400 bg-clip-text text-transparent">
                Traffic Intelligence
              </span> <br />
              for Smart Cities.
            </motion.h1>

            <motion.p
              className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0 font-inter"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              Streamline signal operations, detect accidents with computer vision, and monitor traffic congestion through an operational Command Center dashboard.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Link
                to="/dashboard"
                className="w-full sm:w-auto h-12 inline-flex items-center justify-center px-6 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-md hover:shadow-lg transition duration-200 gap-2"
              >
                Access Dashboard
                <ArrowRight size={16} />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto h-12 inline-flex items-center justify-center px-6 rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100/50 dark:hover:bg-white/10 transition duration-200"
              >
                Explore Features
              </a>
            </motion.div>
          </div>

          {/* Right: Mock Dashboard Visualization / Preview */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 rounded-3xl blur-xl opacity-40 -z-10"
              animate={{ rotate: [3, 8, 3] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            ></motion.div>

            <motion.div 
              className="relative w-full max-w-lg aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl bg-slate-900"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <img
                src={pic1Traffic}
                alt="Traffic intersection aerial view"
                className="w-full h-full object-cover opacity-75"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>

              {/* Floating Glassmorphic Alert */}
              <div className="absolute top-4 left-4 p-3 bg-slate-900/80 border border-white/10 rounded-xl backdrop-blur-md max-w-xs space-y-1.5 shadow-lg">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                  Incident Alert
                </span>
                <p className="text-xs font-semibold text-white">Accident detected at Zone-04</p>
                <p className="text-[10px] text-slate-400 font-medium">Confidence: 94.2% • Responding</p>
              </div>

              {/* Floating KPI card */}
              <div className="absolute bottom-4 right-4 p-3.5 bg-slate-900/80 border border-white/10 rounded-xl backdrop-blur-md min-w-[150px] shadow-lg flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20">
                  <Activity size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Congestion Index</p>
                  <p className="text-base font-mono font-bold text-white">Moderate (42%)</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
