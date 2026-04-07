import { Brain, Camera, BarChart3, Zap, Shield, Cloud } from "lucide-react";
import { motion } from "framer-motion";

// Features component showcasing the key features of the intelligent traffic management system
const MotionDiv = motion.div;

// List of features to display
const features = [
  {
    icon: Camera,
    title: "Computer Vision",
    description: "Advanced cameras and sensors detect vehicles, pedestrians, and traffic incidents instantly."
  },
  {
    icon: BarChart3,
    title: "Real-Time Dashboard",
    description: "Monitor traffic flow, congestion levels, and system performance from a centralized dashboard."
  },
  {
    icon: Shield,
    title: "Incident Detection",
    description: "Automatic detection of accidents, breakdowns, and hazards with instant alert notifications."
  },
  {
    icon: Cloud,
    title: "Cloud Integration",
    description: "Scalable cloud infrastructure ensures reliable performance and data accessibility."
  }
];

// Animation variants for the features list
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Animation variants for each feature item
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Features component definition
export default function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-cyan-50 to-indigo-100 text-slate-950 dark:bg-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 dark:text-slate-100 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto relative z-10">
        <MotionDiv 
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-sky-600 to-purple-600 
                  bg-clip-text text-transparent">
              Cutting-Edge Features
            </span>
          </h2>
          <p className="text-xl text-slate-950 dark:text-gray-400">
            Our intelligent traffic management system combines advanced technology 
            with practical solutions to transform urban mobility.
          </p>
        </MotionDiv>

        <MotionDiv 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <MotionDiv 
                key={index} 
                variants={item}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className={`group relative overflow-hidden p-6 rounded-xl 
                bg-gradient-to-br from-white/60 via-gray-100/20 to-white/60
                dark:from-black/60 dark:via-gray-900/20 dark:to-black/60 
                ring-1 ring-gray-500/20 dark:ring-purple-500/20
                hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 
                transition-all duration-300 backdrop-blur-xl 
                ${index === features.length - 1 ? "lg:col-start-2 flex " : ""}
                `}
              >
                <div className="pointer-events-none absolute -top-10 left-1/4 h-16 w-40 -rotate-12 bg-white/70 blur-xl opacity-80 dark:opacity-0"></div>
                <div className="pointer-events-none absolute top-8 right-6 h-1 w-24 bg-white/60 blur-sm opacity-70 dark:opacity-0"></div>


                <div className="relative z-10">
                  <MotionDiv 
                    className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg flex items-center justify-center mb-4 border border-cyan-500/30 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all"
                    whileHover={{ scale: 1.1, rotate: 5, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon className="w-6 h-6 text-sky-600 group-hover:text-purple-500 transition-colors" />
                  </MotionDiv>
                  <h3 className="text-xl font-semibold text-slate-950 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-950 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
                
              </MotionDiv>
            );
          })}
        </MotionDiv>
      </div>
    </section>
  );
}




