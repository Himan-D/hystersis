export function About() {
  return (
    <section id="about" className="bg-slate-900 py-24 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-16">
        <div className="flex-1">
          <span className="text-sm font-semibold tracking-widest uppercase text-indigo-400 mb-4 block">
            About
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-balance mb-6">
            Designed to get out of your way
          </h2>
          <p className="text-slate-400 leading-relaxed text-pretty mb-4">
            This starter gives you a solid foundation — React 19, Vite 8, TypeScript strict mode,
            and Tailwind CSS v4 — without any of the boilerplate you'll spend hours deleting.
          </p>
          <p className="text-slate-400 leading-relaxed text-pretty">
            Clone it, rename it, and start shipping. Everything is structured so it scales
            cleanly as your project grows.
          </p>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="size-64 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-8xl shadow-2xl">
            🚀
          </div>
        </div>
      </div>
    </section>
  )
}
