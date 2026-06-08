import { LogInIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// The GTS component is a call-to-action section that encourages users to get started with the ITMS platform. 
// It features a visually appealing design with gradients, animations, and a clear message. 
// The section includes a heading, a descriptive paragraph, and a prominent "Get Started" button that links to the signup page. 
// The use of motion components from Framer Motion adds smooth animations to the elements as they come into view, enhancing the user experience and drawing attention to the call-to-action. 
// The background includes subtle animated gradients to create a dynamic and engaging visual effect. 
// Overall, this component serves as an effective way to convert visitors into users by guiding them towards signing up for the platform.

const MotionDiv = motion.div;
const MotionH2 = motion.h2;
const MotionP = motion.p;

export default function GTS() {
  return (
    <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-cyan-50 to-indigo-100 text-slate-950 dark:bg-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 dark:text-slate-100 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/15 dark:bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
      </div>
{/* The GTS component is a call-to-action section that encourages users to get started with the ITMS platform. It features a visually appealing design with gradients, animations, and a clear message. The section includes a heading, a descriptive paragraph, and a prominent "Get Started" button that links to the signup page. The use of motion components from Framer Motion adds smooth animations to the elements as they come into view, enhancing the user experience and drawing attention to the call-to-action. The background includes subtle animated gradients to create a dynamic and engaging visual effect. Overall, this component serves as an effective way to convert visitors into users by guiding them towards signing up for the platform. */}
      <div className="container mx-auto relative z-10">
        <MotionDiv
          className="relative overflow-hidden rounded-3xl p-12 md:p-16 text-center bg-gradient-to-br from-white/60 via-cyan-50/30 to-purple-50/40 dark:from-slate-900/70 dark:via-slate-900/50 dark:to-indigo-950/70 border border-white/40 dark:border-cyan-500/25 ring-1 ring-white/20 dark:ring-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] shadow-2xl shadow-cyan-500/20 dark:shadow-cyan-500/30 backdrop-blur-xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 dark:from-cyan-500/10 dark:to-purple-500/10"></div>
          <div className="pointer-events-none absolute -top-12 left-1/4 h-20 w-56 -rotate-12 bg-white/70 blur-2xl opacity-80 dark:opacity-0"></div>
          <div className="pointer-events-none absolute top-10 right-10 h-1 w-28 bg-white/60 blur-sm opacity-70 dark:opacity-0"></div>

          <MotionH2
            className="text-4xl md:text-5xl font-bold mb-6 relative z-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-sky-600 via-purple-600 to-pink-600 
                  dark:from-sky-600 dark:via-purple-600 dark:to-pink-600 
                  bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]">
              Ready to Transform Your City&apos;s Traffic?
            </span>
          </MotionH2>

          <MotionP
            className="text-xl text-slate-950 dark:text-cyan-100 mb-8 max-w-2xl mx-auto relative z-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Partner with forward-thinking cities using ITMS to cut congestion, improve safety, and respond in real
            time.
          </MotionP>

          <MotionDiv
            className="flex flex-wrap justify-center gap-4 relative z-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <MotionDiv whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              
                <Link to="/signup" className="inline-flex items-center gap-2 rounded-md px-5 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white shadow-lg shadow-cyan-500/50 border-0">
                 <LogInIcon className="w-4 h-4" /> Get Started
               </Link> 

            </MotionDiv>
          </MotionDiv>
        </MotionDiv>
      </div>
    </section>
  );
}




