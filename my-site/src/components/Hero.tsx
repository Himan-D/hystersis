export function Hero() {
  return (
    <section className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white px-6 text-center">
      <span className="text-sm font-semibold tracking-widest uppercase text-indigo-400 mb-4">
        Welcome
      </span>
      <h1 className="text-5xl sm:text-7xl font-bold leading-tight text-balance mb-6">
        Build something <span className="text-indigo-400">remarkable</span>
      </h1>
      <p className="text-lg sm:text-xl text-slate-400 max-w-2xl text-pretty mb-10">
        A fast, modern landing page built with React, Vite, and Tailwind CSS.
        Fully typed, zero config, ready to ship.
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <a
          href="#features"
          className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl font-semibold transition-colors duration-200"
        >
          Get started
        </a>
        <a
          href="#about"
          className="px-8 py-3 border border-slate-600 hover:border-indigo-400 hover:text-indigo-400 rounded-xl font-semibold transition-colors duration-200"
        >
          Learn more
        </a>
      </div>
    </section>
  )
}
