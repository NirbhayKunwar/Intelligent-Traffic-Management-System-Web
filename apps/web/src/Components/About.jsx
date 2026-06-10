import { motion } from "framer-motion";
import { Lightbulb, Target, Users } from "lucide-react";

const aboutPoints = [
  {
    icon: Target,
    title: "Our Mission",
    description: "Provide live signal telemetry and AI hazard verification to cut down incident dispatch times."
  },
  {
    icon: Lightbulb,
    title: "Our Vision",
    description: "Orchestrate real-time traffic nodes to lower idling emission thresholds across modern city networks."
  },
  {
    icon: Users,
    title: "Who We Serve",
    description: "Municipal operations centers, dispatch operators, city planners, and civic road authorities."
  }
];

export default function About() {
  return (
    <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 bg-theme-bg text-theme-text-primary transition-colors duration-300 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:6rem_6rem] opacity-20 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="max-w-3xl mx-auto text-center mb-20"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <span className="text-xs font-bold uppercase tracking-widest text-theme-accent">Platform Scope</span>
          <h2 className="text-3xl sm:text-4xl font-poppins font-extrabold tracking-tight mt-2 mb-4">
            Command Operations
          </h2>
          <p className="text-base sm:text-lg text-theme-text-secondary leading-relaxed font-inter">
            ITMS connects visual data sensors and tracking parameters to coordinate signal timing, streamline incident verification, and improve traffic safety at city scale.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {aboutPoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={point.title}
                className="relative overflow-hidden p-6 rounded-2xl bg-theme-card border border-theme-border shadow-sm backdrop-blur-md transition-all duration-200"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-theme-accent/10 to-theme-accent-alt/10 border border-theme-accent/20 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-theme-accent" />
                </div>
                <h3 className="text-lg font-poppins font-bold text-theme-text-primary mb-2.5">
                  {point.title}
                </h3>
                <p className="text-sm text-theme-text-secondary leading-relaxed font-inter">
                  {point.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
