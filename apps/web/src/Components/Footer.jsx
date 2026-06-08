import { FaFacebook, FaTwitter, FaLinkedin, FaGithub } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      id="footer"
      className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200/50 dark:border-white/5 font-inter transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand col */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-tr from-cyan-500/10 to-indigo-500/10 rounded-lg border border-cyan-500/20 dark:border-cyan-500/10">
                <img
                  src="/logo.svg"
                  alt="itms logo"
                  className="w-5 h-5"
                  onError={(event) => {
                    event.currentTarget.src = "/favicon.svg";
                  }}
                />
              </div>
              <span className="text-lg font-poppins font-extrabold tracking-tight bg-gradient-to-r from-cyan-600 to-indigo-600 dark:from-cyan-400 dark:to-indigo-400 bg-clip-text text-transparent">
                ITMS
              </span>
            </div>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
              Intelligent traffic management solutions powered by edge computer vision for modern municipalities.
            </p>
          </div>

          {/* Product col */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Product</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">Features</Link></li>
              <li><Link to="/case-study" className="hover:text-slate-900 dark:hover:text-white transition-colors">Case Studies</Link></li>
            </ul>
          </div>

          {/* Company col */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/#about" className="hover:text-slate-900 dark:hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/#contact" className="hover:text-slate-900 dark:hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Legal col */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/security" className="hover:text-slate-900 dark:hover:text-white transition-colors">Security</Link></li>
              <li><Link to="/compliance" className="hover:text-slate-900 dark:hover:text-white transition-colors">Compliance</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-200/50 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400">
            &copy; 2026 ITMS Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" aria-label="Facebook" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <FaFacebook size={18} />
            </a>
            <a href="#" aria-label="Twitter" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <FaTwitter size={18} />
            </a>
            <a href="#" aria-label="LinkedIn" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <FaLinkedin size={18} />
            </a>
            <a href="#" aria-label="GitHub" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <FaGithub size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}