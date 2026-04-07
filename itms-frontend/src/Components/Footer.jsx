import { FaFacebook, FaTwitter, FaLinkedin, FaGithub } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      id="footer"
      className="bg-gradient-to-r from-indigo-200/70 via-cyan-200/60 to-indigo-200/70 
      text-slate-950/80 
      dark:bg-gradient-to-r dark:from-slate-950/85 dark:via-slate-900/80 dark:to-indigo-950/85 
      dark:text-gray-300 py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10 dark:border-white/5 backdrop-blur-xl"
    >
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-800 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/50">
                <div className="w-5 h-5 border-2 border-white rounded-full"></div>
              </div>
              <span className="text-xl font-semibold bg-gradient-to-r from-sky-600 to-purple-500 bg-clip-text text-transparent">ITMS</span>
            </div>
            <p className="text-sm text-slate-950 dark:text-gray-500">
              Intelligent traffic management solutions for modern cities.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-950 dark:text-cyan-400 mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/#features" className="hover:text-slate-950 dark:hover:text-cyan-400 transition-colors">Features</Link></li>
              <li><a href="#" className="hover:text-slate-950 dark:hover:text-cyan-400 transition-colors">Solutions</a></li>
              <li><Link to="/case-study" className="hover:text-slate-950 dark:hover:text-cyan-400 transition-colors">Case Studies</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-950 dark:text-cyan-400 mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#about" className="hover:text-slate-950 dark:hover:text-cyan-400 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-slate-950 dark:hover:text-cyan-400 transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-950 dark:text-cyan-400 mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="hover:text-slate-950 dark:hover:text-cyan-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-slate-950 dark:hover:text-cyan-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="/security" className="hover:text-slate-950 dark:hover:text-cyan-400 transition-colors">Security</Link></li>
              <li><Link to="/compliance" className="hover:text-slate-950 dark:hover:text-cyan-400 transition-colors">Compliance</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-950 dark:text-gray-500">
            (c) 2026 ITMS. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-950 dark:hover:text-cyan-400 transition-colors hover:scale-110 transform duration-200">
              <FaFacebook className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-slate-950 dark:hover:text-cyan-400 transition-colors hover:scale-110 transform duration-200">
              <FaTwitter className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-slate-950 dark:hover:text-cyan-400 transition-colors hover:scale-110 transform duration-200">
              <FaLinkedin className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-slate-950 dark:hover:text-cyan-400 transition-colors hover:scale-110 transform duration-200">
              <FaGithub className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}