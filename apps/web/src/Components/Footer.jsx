import { FaFacebook, FaTwitter, FaLinkedin, FaGithub } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      id="footer"
      className="bg-theme-bg text-theme-text-secondary py-16 px-4 sm:px-6 lg:px-8 border-t border-theme-border font-inter transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand col */}
          <div className="col-span-1 sm:col-span-2 md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-tr from-theme-accent/15 to-theme-accent-alt/15 rounded-lg border border-theme-accent/20">
                <svg className="w-5 h-5" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="footer-logo-gradient" x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="var(--theme-accent)" />
                      <stop offset="100%" stopColor="var(--theme-accent-alt)" />
                    </linearGradient>
                  </defs>
                  <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#footer-logo-gradient)" />
                  <circle cx="32" cy="32" r="14" stroke="white" stroke-width="4" fill="none" />
                </svg>
              </div>
              <span className="text-lg font-poppins font-extrabold tracking-tight bg-gradient-to-r from-theme-accent to-theme-accent-alt bg-clip-text text-transparent">
                ITMS
              </span>
            </div>
            <p className="text-sm text-theme-text-secondary max-w-xs leading-relaxed">
              Intelligent traffic management solutions powered by edge computer vision for modern municipalities.
            </p>
          </div>

          {/* Product col */}
          <div>
            <h3 className="text-xs font-semibold text-theme-text-primary uppercase tracking-wider mb-4">Product</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/#features" className="hover:text-theme-text-primary transition-colors">Features</Link></li>
              <li><Link to="/case-study" className="hover:text-theme-text-primary transition-colors">Case Studies</Link></li>
            </ul>
          </div>

          {/* Company col */}
          <div>
            <h3 className="text-xs font-semibold text-theme-text-primary uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/#about" className="hover:text-theme-text-primary transition-colors">About Us</Link></li>
              <li><Link to="/#contact" className="hover:text-theme-text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Legal col */}
          <div>
            <h3 className="text-xs font-semibold text-theme-text-primary uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/privacy" className="hover:text-theme-text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-theme-text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/security" className="hover:text-theme-text-primary transition-colors">Security</Link></li>
              <li><Link to="/compliance" className="hover:text-theme-text-primary transition-colors">Compliance</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-theme-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-theme-text-secondary/70">
            &copy; 2026 ITMS Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" aria-label="Facebook" className="text-theme-text-secondary/70 hover:text-theme-text-primary transition-colors">
              <FaFacebook size={18} />
            </a>
            <a href="#" aria-label="Twitter" className="text-theme-text-secondary/70 hover:text-theme-text-primary transition-colors">
              <FaTwitter size={18} />
            </a>
            <a href="#" aria-label="LinkedIn" className="text-theme-text-secondary/70 hover:text-theme-text-primary transition-colors">
              <FaLinkedin size={18} />
            </a>
            <a href="#" aria-label="GitHub" className="text-theme-text-secondary/70 hover:text-theme-text-primary transition-colors">
              <FaGithub size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}