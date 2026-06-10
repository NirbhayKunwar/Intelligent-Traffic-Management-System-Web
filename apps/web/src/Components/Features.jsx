import { Camera, BarChart3, Shield, Cloud } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Camera,
    title: "Computer Vision Detection",
    description: "Real-time edge detection of vehicle volume, average velocities, and active accidents using optimized YOLO models."
  },
  {
    icon: BarChart3,
    title: "Operations Command Center",
    description: "Monitor real-time system health, view streaming video telemetry, and update camera metadata from one interface."
  },
  {
    icon: Shield,
    title: "Physics-Based Incident Alerts",
    description: "Automatic incident analysis verifying sudden speed drops, erratic angle shifts, and vehicle proximity risk factors."
  },
  {
    icon: Cloud,
    title: "Cloud Telemetry Integration",
    description: "Exposes standardized Prometheus metrics for system monitoring and integrates third-party Cloudinary content."
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function Features() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-theme-bg text-theme-text-primary transition-colors duration-300 relative overflow-hidden">
      {/* Decorative grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:6rem_6rem] opacity-20 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-20"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <span className="text-xs font-bold uppercase tracking-widest text-theme-accent">Core Architecture</span>
          <h2 className="text-3xl sm:text-4xl font-poppins font-extrabold tracking-tight mt-2 mb-4">
            Platform Capabilities
          </h2>
          <p className="text-base sm:text-lg text-theme-text-secondary font-inter">
            Integrating advanced vehicle tracking telemetry and computer vision models for next-generation municipal fleet intelligence.
          </p>
        </motion.div>

        <motion.div 
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div 
                key={index} 
                variants={item}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="relative overflow-hidden p-6 rounded-2xl bg-theme-card border border-theme-border shadow-sm backdrop-blur-md transition-all duration-200"
              >
                <div className="w-12 h-12 bg-gradient-to-tr from-theme-accent/10 to-theme-accent-alt/10 rounded-xl flex items-center justify-center mb-5 border border-theme-accent/20">
                  <Icon className="w-5 h-5 text-theme-accent" />
                </div>
                <h3 className="text-lg font-poppins font-bold text-theme-text-primary mb-2.5">
                  {feature.title}
                </h3>
                <p className="text-sm text-theme-text-secondary leading-relaxed font-inter">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
