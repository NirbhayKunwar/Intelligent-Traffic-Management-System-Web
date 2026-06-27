import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
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
        <div className="max-w-3xl mx-auto text-center space-y-8">
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
            className="text-lg text-theme-text-secondary leading-relaxed max-w-2xl mx-auto font-inter"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            Streamline signal operations, detect accidents with computer vision, and monitor traffic congestion through an operational Command Center dashboard.
          </motion.p>
 
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
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
      </div>
    </section>
  );
}
