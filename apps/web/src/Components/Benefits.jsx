import { Check } from "lucide-react";
import { motion } from "framer-motion";


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
    <section id="benefits" className="py-24 px-4 sm:px-6 lg:px-8 bg-theme-bg text-theme-text-primary transition-colors duration-300 relative overflow-hidden">
      {/* Dynamic backdrop decor */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-10 w-96 h-96 bg-theme-accent/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-theme-accent-alt/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
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
              <span className="text-xs font-bold uppercase tracking-widest text-theme-accent">Impact Analysis</span>
              <h2 className="text-3xl sm:text-4xl font-poppins font-extrabold tracking-tight">
                Empowering Cities & <br />
                <span className="bg-gradient-to-r from-theme-accent to-theme-accent-alt bg-clip-text text-transparent">
                  Transportation Networks
                </span>
              </h2>
            </div>
            
            <p className="text-base sm:text-lg text-theme-text-secondary leading-relaxed font-inter">
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
                  <div className="flex-shrink-0 w-6 h-6 bg-theme-accent/10 text-theme-accent rounded-full flex items-center justify-center mt-0.5 border border-theme-accent/25">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm sm:text-base text-theme-text-secondary font-medium font-inter">
                    {benefit}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right panel: Grid image assets */}
          <motion.div 
            className="grid grid-cols-2 gap-4 lg:col-span-6"
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="rounded-2xl overflow-hidden border border-theme-border shadow-sm aspect-[4/3] bg-theme-card/20 backdrop-blur-sm p-4 flex flex-col justify-between">
              <div className="flex justify-between items-center pb-2 border-b border-theme-border/30">
                <span className="text-xs font-bold text-theme-text-primary font-mono uppercase tracking-wider">Delay Reductions</span>
                <span className="text-[10px] font-bold text-theme-success font-mono px-2 py-0.5 bg-theme-success/10 rounded-full">-34.8% Max</span>
              </div>
              <div className="flex-1 min-h-0 relative mt-4">
                <svg className="w-full h-full" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="200" y2="20" stroke="var(--theme-border)" strokeWidth="0.5" opacity="0.2" />
                  <line x1="0" y1="50" x2="200" y2="50" stroke="var(--theme-border)" strokeWidth="0.5" opacity="0.2" />
                  <line x1="0" y1="80" x2="200" y2="80" stroke="var(--theme-border)" strokeWidth="0.5" opacity="0.2" />
                  
                  {/* Themed Gradient Area under Curve */}
                  <defs>
                    <linearGradient id="chart-area-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--theme-accent)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="var(--theme-accent)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M 0,85 Q 35,70 70,45 T 140,25 T 200,10 L 200,100 L 0,100 Z" fill="url(#chart-area-gradient)" />
                  
                  {/* Themed Curve Line */}
                  <path d="M 0,85 Q 35,70 70,45 T 140,25 T 200,10" stroke="var(--theme-accent)" strokeWidth="2.5" strokeLinecap="round" />
                  
                  {/* Moving tracker dot */}
                  <circle cx="140" cy="25" r="4" fill="var(--theme-accent-alt)" className="animate-ping" />
                  <circle cx="140" cy="25" r="3" fill="var(--theme-accent)" />
                </svg>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden border border-theme-border shadow-sm aspect-[4/3] bg-theme-card/20 backdrop-blur-sm p-4 flex flex-col justify-between">
              <div className="flex justify-between items-center pb-2 border-b border-theme-border/30">
                <span className="text-xs font-bold text-theme-text-primary font-mono uppercase tracking-wider">AI Signal Phase</span>
                <span className="text-[10px] font-bold text-theme-accent font-mono px-2 py-0.5 bg-theme-accent/10 rounded-full">Phase-A Active</span>
              </div>
              <div className="flex-1 flex items-center justify-center mt-2">
                <svg className="w-20 h-20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Outer Ring */}
                  <circle cx="50" cy="50" r="44" stroke="var(--theme-border)" strokeWidth="2" strokeDasharray="4 4" opacity="0.4" />
                  <circle cx="50" cy="50" r="44" stroke="var(--theme-accent)" strokeWidth="1" strokeDasharray="40 120" className="origin-center animate-[spin_10s_linear_infinite]" />
                  
                  {/* Central Node */}
                  <circle cx="50" cy="50" r="28" fill="var(--theme-bg)" stroke="var(--theme-border)" strokeWidth="1" opacity="0.8" />
                  
                  {/* Signal Lights */}
                  <circle cx="50" cy="36" r="6" fill="var(--theme-error)" className="animate-pulse" />
                  <circle cx="50" cy="50" r="6" fill="var(--theme-warning)" opacity="0.2" />
                  <circle cx="50" cy="64" r="6" fill="var(--theme-success)" opacity="0.2" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
