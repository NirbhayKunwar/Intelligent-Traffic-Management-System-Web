import { motion } from "framer-motion";
import { ArrowRight, Activity, Cpu, Shield, Users } from "lucide-react";
import { Link } from "react-router-dom";


export default function Hero() {
  return (
    <section 
      id="hero" 
      className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-theme-bg text-theme-text-primary transition-colors duration-300"
    >
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-theme-bg via-theme-bg to-theme-accent-alt/10 -z-10"></div>
      
      {/* Modern Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 -z-10"></div>
 
      {/* Decorative blurred blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-theme-accent/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-theme-accent-alt/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }}></div>
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
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-theme-accent/10 border border-theme-accent/20 text-theme-accent rounded-full text-xs font-semibold shadow-sm">
                <span className="w-2 h-2 bg-theme-accent rounded-full animate-pulse"></span>
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
              <span className="bg-gradient-to-r from-theme-accent to-theme-accent-alt bg-clip-text text-transparent">
                Traffic Intelligence
              </span> <br />
              for Smart Cities.
            </motion.h1>
 
            <motion.p
              className="text-lg text-theme-text-secondary leading-relaxed max-w-xl mx-auto lg:mx-0 font-inter"
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
                className="w-full sm:w-auto h-12 inline-flex items-center justify-center px-6 rounded-xl bg-gradient-to-r from-theme-accent to-theme-accent-alt hover:brightness-110 text-white font-semibold text-sm shadow-md hover:shadow-lg transition duration-200 gap-2"
              >
                Access Dashboard
                <ArrowRight size={16} />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto h-12 inline-flex items-center justify-center px-6 rounded-xl border border-theme-border bg-theme-card/40 text-theme-text-secondary font-semibold text-sm hover:bg-theme-card/85 transition duration-200"
              >
                Explore Features
              </a>
            </motion.div>
          </div>
 
          {/* Right: Mock Dashboard Visualization / Preview */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-theme-accent/20 to-theme-accent-alt/20 rounded-3xl blur-xl opacity-40 -z-10"
              animate={{ rotate: [3, 8, 3] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            ></motion.div>
 
            <motion.div 
              className="relative w-full max-w-lg aspect-[4/3] rounded-2xl overflow-hidden border border-theme-border shadow-2xl bg-theme-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="w-full h-full relative bg-theme-card/30 backdrop-blur-sm">
                <svg className="w-full h-full" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Grid Lines background */}
                  <g opacity="0.15">
                    <line x1="50" y1="0" x2="50" y2="300" stroke="var(--theme-border)" strokeWidth="1" />
                    <line x1="100" y1="0" x2="100" y2="300" stroke="var(--theme-border)" strokeWidth="1" />
                    <line x1="150" y1="0" x2="150" y2="300" stroke="var(--theme-border)" strokeWidth="1" />
                    <line x1="200" y1="0" x2="200" y2="300" stroke="var(--theme-border)" strokeWidth="1" />
                    <line x1="250" y1="0" x2="250" y2="300" stroke="var(--theme-border)" strokeWidth="1" />
                    <line x1="300" y1="0" x2="300" y2="300" stroke="var(--theme-border)" strokeWidth="1" />
                    <line x1="350" y1="0" x2="350" y2="300" stroke="var(--theme-border)" strokeWidth="1" />
                    
                    <line x1="0" y1="50" x2="400" y2="50" stroke="var(--theme-border)" strokeWidth="1" />
                    <line x1="0" y1="100" x2="400" y2="100" stroke="var(--theme-border)" strokeWidth="1" />
                    <line x1="0" y1="150" x2="400" y2="150" stroke="var(--theme-border)" strokeWidth="1" />
                    <line x1="0" y1="200" x2="400" y2="200" stroke="var(--theme-border)" strokeWidth="1" />
                    <line x1="0" y1="250" x2="400" y2="250" stroke="var(--theme-border)" strokeWidth="1" />
                  </g>

                  {/* Intersections (Roads) */}
                  <path d="M 0,150 L 400,150 M 200,0 L 200,300" stroke="var(--theme-border)" strokeWidth="24" strokeLinecap="round" opacity="0.3" />
                  <path d="M 0,150 L 400,150 M 200,0 L 200,300" stroke="var(--theme-bg)" strokeWidth="1" strokeDasharray="6 6" opacity="0.5" />

                  {/* Flow Particles (Cars) moving on roads */}
                  <path d="M 0,146 L 400,146" fill="none" stroke="var(--theme-accent)" strokeWidth="2.5" strokeDasharray="8 35" strokeDashoffset="100" className="animate-[dash_6s_linear_infinite]" />
                  <path d="M 400,154 L 0,154" fill="none" stroke="var(--theme-accent-alt)" strokeWidth="2.5" strokeDasharray="10 40" strokeDashoffset="-120" className="animate-[dash_5s_linear_infinite]" />
                  <path d="M 196,0 L 196,300" fill="none" stroke="var(--theme-accent)" strokeWidth="2.5" strokeDasharray="6 30" strokeDashoffset="90" className="animate-[dash_8s_linear_infinite]" />
                  <path d="M 204,300 L 204,0" fill="none" stroke="var(--theme-accent-alt)" strokeWidth="2.5" strokeDasharray="12 45" strokeDashoffset="-150" className="animate-[dash_7s_linear_infinite]" />

                  {/* Glowing Radar scan in the center */}
                  <circle cx="200" cy="150" r="80" fill="none" stroke="var(--theme-accent)" strokeWidth="1" opacity="0.1" />
                  <circle cx="200" cy="150" r="50" fill="none" stroke="var(--theme-accent)" strokeWidth="1.2" opacity="0.2" />
                  <circle cx="200" cy="150" r="20" fill="none" stroke="var(--theme-accent)" strokeWidth="1.5" opacity="0.3" />

                  {/* Rotating Sweeping radar line */}
                  <line x1="200" y1="150" x2="270" y2="110" stroke="var(--theme-accent)" strokeWidth="2" strokeLinecap="round" opacity="0.8" className="origin-[200px_150px] animate-[spin_5s_linear_infinite]" />

                  {/* Signal Node lights */}
                  <circle cx="200" cy="150" r="8" fill="var(--theme-success)" className="animate-pulse" />
                  <circle cx="200" cy="138" r="4" fill="var(--theme-error)" opacity="0.7" />
                  <circle cx="200" cy="162" r="4" fill="var(--theme-warning)" opacity="0.7" />
                </svg>
              </div>
 
              {/* Floating Glassmorphic Alert */}
              <div className="absolute top-4 left-4 p-3 bg-theme-card/90 border border-theme-border rounded-xl backdrop-blur-md max-w-xs space-y-1.5 shadow-lg">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                  Incident Alert
                </span>
                <p className="text-xs font-semibold text-theme-text-primary">Accident detected at Zone-04</p>
                <p className="text-[10px] text-theme-text-secondary font-medium">Confidence: 94.2% • Responding</p>
              </div>
 
              {/* Floating KPI card */}
              <div className="absolute bottom-4 right-4 p-3.5 bg-theme-card/90 border border-theme-border rounded-xl backdrop-blur-md min-w-[150px] shadow-lg flex items-center gap-3">
                <div className="p-2 bg-theme-accent/10 rounded-lg text-theme-accent border border-theme-accent/20">
                  <Activity size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-theme-text-secondary uppercase tracking-widest">Congestion Index</p>
                  <p className="text-base font-mono font-bold text-theme-text-primary">Moderate (42%)</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
