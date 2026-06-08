import { motion } from "framer-motion";
import { Lightbulb, Target, Users } from "lucide-react";

// The GTS component is a call-to-action section that encourages users to get started with the ITMS platform.
const MotionDiv = motion.div;

// It features a visually appealing design with gradients, animations, and a clear message.
const aboutPoints = [
  {
    icon: Target,
    title: "Our Mission",
    description:
      "Build safer and faster roads by using real-time data, AI, and adaptive traffic control.",
  },
  {
    icon: Lightbulb,
    title: "Our Vision",
    description:
      "Help cities become cleaner, less congested, and more connected for every commuter.",
  },
  {
    icon: Users,
    title: "Who We Serve",
    description:
      "Municipal teams, traffic authorities, emergency services, and public transport networks.",
  },
];

export default function About() {
  return (
    <section
      id="about"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-cyan-50 to-indigo-100 text-slate-950 dark:bg-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 dark:text-slate-100 relative overflow-hidden"
    >
      <div className="absolute inset-0">
        <div className="absolute top-10 left-1/3 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto relative z-10">
        <MotionDiv
          className="max-w-4xl mx-auto text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl font-bold mb-5">
            <span className="bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent">
              About ITMS
            </span>
          </h2>
          <p className="text-lg text-slate-950 dark:text-gray-300 leading-relaxed">
            ITMS (Intelligent Traffic Management System) is designed
            to modernize urban mobility. We combine sensor data, predictive
            analytics, and automation to optimize traffic flow, reduce delays, and
            improve road safety at city scale.
          </p>
        </MotionDiv>

        <div className="grid md:grid-cols-3 gap-6">
          {aboutPoints.map((point) => {
            const Icon = point.icon;
            return (
              <MotionDiv
                key={point.title}
                className="group relative overflow-hidden p-6 rounded-xl 
                bg-gradient-to-br from-white/60 via-gray-100/20 to-white/60
                dark:from-black/60 dark:via-gray-900/20 dark:to-black/60 
                ring-1 ring-gray-500/20 dark:ring-purple-500/20
                hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 backdrop-blur-xl"
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <div className="pointer-events-none absolute -top-10 left-1/4 h-16 w-40 -rotate-12 bg-white/70 blur-xl opacity-80 dark:opacity-0"></div>
                <div className="pointer-events-none absolute top-8 right-6 h-1 w-24 bg-white/60 blur-sm opacity-70 dark:opacity-0"></div>

                <div className="relative z-10">
                  <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-sky-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-950 dark:text-white mb-2">{point.title}</h3>
                  <p className="text-slate-950 dark:text-gray-400">{point.description}</p>
                </div>
              </MotionDiv>
            );
          })}
        </div>
      </div>
    </section>
  );
}




