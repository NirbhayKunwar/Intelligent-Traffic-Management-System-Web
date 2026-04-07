import { Link } from "react-router-dom";
// This component serves as a template for legal documents such as the Privacy Policy and Terms of Service. It takes in props for the title, last updated date, introduction, and sections of the document, and renders them in a styled layout with a gradient background, borders, shadows, and responsive design. The component also includes a link to navigate back to the home page.
export default function LegalTemplate({ title, updated, intro, sections }) {
  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 pt-24 pb-16 sm:pt-28 md:pt-32 bg-gradient-to-br from-slate-50 via-cyan-50 to-indigo-100 dark:bg-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white">
              {title}
            </h1>
            <p className="text-sm text-slate-800 dark:text-gray-400 mt-2">
              Last updated: {updated}
            </p>
          </div>
          <Link
            to="/"
            className="text-sm text-slate-900 hover:text-slate-900 dark:text-cyan-300 dark:hover:text-cyan-200"
          >
            Back to Home
          </Link>
        </div>
{/* Main content area with gradient background, borders, shadows, and sections for the legal document. Each section includes a heading and body text, styled for readability and dark mode support. Decorative elements are included for visual interest. */}
        <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-white/70 via-slate-50/40 to-indigo-50/60 dark:from-slate-900/70 dark:via-slate-900/40 dark:to-slate-950/70 border border-white/50 dark:border-cyan-500/30 shadow-2xl shadow-cyan-500/10 dark:shadow-cyan-500/20 backdrop-blur-xl">
          <div className="pointer-events-none absolute -top-10 left-1/4 h-16 w-40 -rotate-12 bg-white/70 blur-2xl opacity-80 dark:bg-white/10"></div>
          <div className="pointer-events-none absolute top-8 right-6 h-1 w-24 bg-white/60 blur-sm opacity-70 dark:bg-white/20"></div>
{/* Content area with introduction and sections of the legal document, styled for readability and dark mode support. Each section includes a heading and body text, with spacing for visual separation. */}
          <div className="relative z-10 space-y-8">
            <p className="text-slate-900 dark:text-gray-300 leading-relaxed">
              {intro}
            </p>
{/* Mapping over the sections prop to render each section with its heading and body text. Each section is styled for readability and dark mode support, with spacing for visual separation. */}
            {sections.map((section) => (
              <div key={section.heading} className="space-y-3">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {section.heading}
                </h2>
                {section.body.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-slate-900 dark:text-gray-300 leading-relaxed"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}