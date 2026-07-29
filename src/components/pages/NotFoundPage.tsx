import React from "react";

interface Props {
  onGoHome: () => void;
  path?: string;
}

export const NotFoundPage: React.FC<Props> = ({ onGoHome, path }) => (
  <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
    <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight">404</h1>
    <p className="text-slate-300 text-base">
      {path ? <>Nothing lives at <code className="text-cyan-300">{path}</code>.</> : "Page not found."}
    </p>
    <p className="text-slate-400 text-sm">
      The tool or page you're looking for isn't published. Try the homepage to browse indexable tools.
    </p>
    <button
      onClick={onGoHome}
      className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl cursor-pointer transition-colors"
    >
      Back to home
    </button>
  </div>
);
