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
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } }
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
        <div className="space-y-16">
          {/* Header Area */}
          <motion.div 
            className="text-center max-w-3xl mx-auto space-y-4"
            initial={{ opacity: 0, y: -25 }}
            whileInView={{ opacity: 1, y: 0 }}
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
          </motion.div>
          
          {/* Benefits Grid */}
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
            variants={listContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {benefits.map((benefit, index) => (
              <motion.div 
                key={index} 
                variants={listItem}
                className="flex items-start gap-4 p-5 rounded-2xl border border-theme-border/50 bg-theme-card/10 backdrop-blur-xs hover:border-theme-accent/30 hover:bg-theme-card/25 transition-all duration-300 group"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-theme-accent/10 text-theme-accent rounded-full flex items-center justify-center border border-theme-accent/20 transition-transform duration-300 group-hover:scale-110">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-sm sm:text-base text-theme-text-secondary font-medium font-inter leading-relaxed">
                  {benefit}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
