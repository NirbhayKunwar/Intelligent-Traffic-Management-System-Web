import { Check } from "lucide-react";
import { motion } from "framer-motion";
import graphImage from "../assets/Graph.jpg";
import lightsImage from "../assets/Lights.jpg";
import profileImage from "../assets/profile.png";

// Benefits component showcasing the advantages of the intelligent traffic management system
const MotionDiv = motion.div;

// List of benefits to display
const benefits = [
  "Reduce traffic congestion and travel times",
  "Lower vehicle emissions and environmental impact",
  "Improve public transportation efficiency",
  "Enhance emergency vehicle response times",
  "Provide data-driven insights for urban planning",
  "Increase road safety and reduce accidents"
];

// Animation variants for the benefits list
const listContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Animation variants for each benefit item
const listItem = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
};

// Benefits component definition
export default function Benefits() {
  return (
    <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-cyan-50 to-indigo-100 text-slate-950 dark:bg-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 dark:text-slate-100 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-10 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <MotionDiv 
            className="space-y-6"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold">
              <span className="bg-gradient-to-r from-sky-600 to-purple-600
               bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                Transform Your City's
              </span>
              <br />
              <span className="text-slate-950 dark:text-white">Transportation Network</span>
            </h2>
            <p className="text-xl text-slate-950 dark:text-gray-400">
              Our intelligent traffic management system empowers cities to create 
              more efficient, sustainable, and livable urban environments.
            </p>
            
            <MotionDiv 
              className="space-y-4"
              variants={listContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              {benefits.map((benefit, index) => (
                <MotionDiv 
                  key={index} 
                  variants={listItem}
                  className="flex items-start gap-3 group"
                >
                  <MotionDiv 
                    className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center mt-0.5 shadow-lg shadow-cyan-500/30"
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Check className="w-4 h-4 text-white" />
                  </MotionDiv>
                  <span className="text-slate-950 dark:text-gray-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">{benefit}</span>
                </MotionDiv>
              ))}
            </MotionDiv>
          </MotionDiv>

          <MotionDiv 
            className="grid grid-cols-2 gap-4"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="space-y-4">
              <MotionDiv 
                className="rounded-xl overflow-hidden shadow-lg border-2 border-cyan-500/20 shadow-cyan-500/20 aspect-[4/3]"
                whileHover={{ scale: 1.05, borderColor: "rgba(6, 182, 212, 0.5)" }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src={graphImage}
                  alt="Traffic analytics graph"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </MotionDiv>
              <MotionDiv 
                className="rounded-xl overflow-hidden shadow-lg border-2 border-purple-500/20 shadow-purple-500/20 aspect-[4/3]"
                whileHover={{ scale: 1.05, borderColor: "rgba(168, 85, 247, 0.5)" }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src={lightsImage}
                  alt="City traffic lights"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </MotionDiv>
            </div>
            <div className="space-y-4">
              <MotionDiv 
                className="rounded-xl overflow-hidden shadow-lg border-2 border-pink-500/20 shadow-pink-500/20 aspect-[4/3]"
                whileHover={{ scale: 1.05, borderColor: "rgba(236, 72, 153, 0.5)" }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src={profileImage}
                  alt="Traffic analytics display"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </MotionDiv>
            </div>
          </MotionDiv>
        </div>
      </div>
    </section>
  );
}




