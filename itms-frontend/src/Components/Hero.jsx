import { motion } from "framer-motion";
import pic1Traffic from "../assets/Pic1_traffic.jpg";

// Hero component showcasing the main headline and call-to-action for the intelligent traffic management system
const MotionDiv = motion.div;
const MotionH1 = motion.h1;
const MotionP = motion.p;

// Hero component definition
export default function Hero() {
    return (
    <section id="hero" className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-slate-50 via-cyan-50 to-indigo-100 text-slate-950 dark:bg-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 dark:text-slate-100">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 -z-10"></div>

      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-500/15 dark:bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/15 dark:bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <MotionDiv
              className="inline-block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 
                    bg-gradient-to-r from-cyan-500/10 to-purple-500/10 
                    dark:from-cyan-500/20 dark:to-purple-500/20 
                    border border-cyan-600/30 dark:border-cyan-500/50 
                    text-sky-950 dark:text-cyan-300 rounded-full text-sm shadow-lg shadow-cyan-500/20">
                <span className="w-2 h-2 bg-cyan-800 rounded-full animate-pulse 
                      shadow-lg shadow-cyan-400/50"></span>
                Next-Generation Traffic Solutions
              </span>
            </MotionDiv>

            <MotionH1
              className="text-5xl lg:text-6xl font-bold leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-600 
                    bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                Intelligent Traffic Management
              </span>
              <br />
              <span className="text-slate-950 dark:text-gray-400">for Modern Cities</span>
            </MotionH1>

            <MotionP
              className="text-xl text-slate-950 dark:text-gray-200 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Reduce congestion with our advanced traffic management system. Enable real-time monitoring for smarter urban mobility.
            </MotionP>
        </div>
          <MotionDiv
            className="relative flex justify-center lg:justify-end"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <MotionDiv
              className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-2xl blur-xl opacity-50"
              animate={{ rotate: [3, 5, 3] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            ></MotionDiv>
            <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-xl aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-cyan-500/30 shadow-cyan-500/50">
              <img
                src={pic1Traffic}
                alt="Traffic intersection aerial view"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
          </MotionDiv>
        </div>
      </div>
    </section>
  );
}




