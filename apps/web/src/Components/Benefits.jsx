import { Check } from "lucide-react";
import { motion } from "framer-motion";
import graphImage from "../assets/Graph.jpg";
import lightsImage from "../assets/Lights.jpg";
import profileImage from "../assets/profile.png";

const benefits = [
  "Reduce traffic congestion and average commute times",
  "Minimize vehicle idling to lower emission footprints",
  "Improve municipal and public transit predictability",
  "Optimize priority lanes for emergency vehicle dispatch",
  "Leverage persistent flow data for smart urban planning",
  "Increase intersection safety through dynamic incident logging"
];

const listContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const listItem = {
  hidden: { opacity: 0, x: -15 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25 } }
};

export default function Benefits() {
  return (
    <section id="benefits" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden">
      {/* Dynamic backdrop decor */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-10 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          
          {/* Left panel: Bullet points benefits */}
          <motion.div 
            className="space-y-8 lg:col-span-6"
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">Impact Analysis</span>
              <h2 className="text-3xl sm:text-4xl font-poppins font-extrabold tracking-tight">
                Empowering Cities & <br />
                <span className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-indigo-500 dark:from-cyan-400 dark:via-indigo-300 dark:to-indigo-400 bg-clip-text text-transparent">
                  Transportation Networks
                </span>
              </h2>
            </div>
            
            <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-inter">
              By collecting telemetry and orchestrating signal nodes, our platform achieves verified efficiency metrics across dense corridors.
            </p>
            
            <motion.div 
              className="space-y-4"
              variants={listContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              {benefits.map((benefit, index) => (
                <motion.div 
                  key={index} 
                  variants={listItem}
                  className="flex items-start gap-3.5 group"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 rounded-full flex items-center justify-center mt-0.5 border border-cyan-500/25 dark:border-cyan-500/10">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm sm:text-base text-slate-700 dark:text-slate-300 font-medium font-inter">
                    {benefit}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right panel: Grid image assets */}
          <motion.div 
            className="grid grid-cols-12 gap-4 lg:col-span-6"
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="col-span-6 space-y-4">
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm aspect-[4/3] bg-slate-900/10">
                <img
                  src={graphImage}
                  alt="Traffic analytics graph"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm aspect-[4/3] bg-slate-900/10">
                <img
                  src={lightsImage}
                  alt="City traffic lights"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="col-span-6 flex flex-col justify-center">
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm aspect-[3/4] bg-slate-900/10">
                <img
                  src={profileImage}
                  alt="Traffic analytics display"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
