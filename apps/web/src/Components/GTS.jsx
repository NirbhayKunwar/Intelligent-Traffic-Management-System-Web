import { LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function GTS() {
  return (
    <section id="contact" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          className="relative overflow-hidden rounded-3xl p-12 md:p-16 text-center bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/10 shadow-2xl backdrop-blur-xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-indigo-500/5 pointer-events-none"></div>

          <motion.div
            className="space-y-4 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">Deploy Today</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-poppins font-extrabold tracking-tight leading-tight">
              Ready to Orchestrate Your City&apos;s Traffic?
            </h2>
            <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-inter">
              Deploy our intelligent analytics engine to cut congestion ratios, monitor cameras, and respond to incidents in real-time.
            </p>
          </motion.div>

          <motion.div
            className="flex justify-center gap-4 mt-8"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Link 
              to="/signup" 
              className="h-12 inline-flex items-center justify-center px-6 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all gap-2"
            >
              <LogIn size={15} /> 
              Get Started Now
            </Link> 
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
