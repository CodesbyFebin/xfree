import React from "react";
import { CheckCircle2, ExternalLink, Github, HardDrive, ShieldCheck, Terminal, XCircle } from "lucide-react";

interface InstaServerPageProps {
  onGoHome: () => void;
}

const repo = "https://github.com/CodesbyFebin/instaserver";

const TOOLS: Array<[string, string]> = [
  ["deploy_pod", "Main tool. Create-if-missing, upload files, install deps, (re)start, open a public URL, verify it answers."],
  ["list_pods / get_pod", "List all pods, or get one pod's status and public URL."],
  ["manage_pod", "start / stop / restart / reload."],
  ["delete_pod", "Remove a pod's container, volume, and tunnel."],
  ["exec_command", "Run a shell command inside a pod."],
  ["get_logs", "Recent stdout/stderr from the pod's app."],
  ["list_files / read_file / write_file", "Inspect and edit files without a full redeploy."],
];

const PRESETS: Array<[string, string, string]> = [
  ["static", "nginx:alpine", "Serves uploaded files as-is. Entry: index.html."],
  ["nodejs", "node:20-alpine", "Runs npm install if package.json is present, then node <entry>. Entry: server.js / index.js / app.js."],
  ["python", "python:3.12-alpine", "Runs pip install -r requirements.txt if present, then python <entry>. Entry: main.py / app.py / server.py."],
];

export const InstaServerPage: React.FC<InstaServerPageProps> = () => {
  return (
    <div className="space-y-10">
      <header className="rounded-3xl border border-cyan-500/20 bg-slate-900/70 p-6 sm:p-9">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-cyan-300">
          <HardDrive className="h-4 w-4" /> Free, open-source deploy tooling
        </div>
        <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-tight text-white sm:text-5xl">
          InstaServer — a free, open-source alternative to InstaPods and Vercel
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-7 text-slate-300">
          InstaServer is an MCP server that gives an AI agent the same kind of deploy tools InstaPods offers —{" "}
          <code className="rounded bg-slate-950/60 px-1.5 py-0.5 text-cyan-300">deploy_pod</code>,{" "}
          <code className="rounded bg-slate-950/60 px-1.5 py-0.5 text-cyan-300">exec_command</code>,{" "}
          <code className="rounded bg-slate-950/60 px-1.5 py-0.5 text-cyan-300">get_logs</code>, file read/write — except every
          "pod" is a real Docker container running on your own machine, with a public HTTPS URL from a free Cloudflare quick
          tunnel. No account, no signup, no payment method, no platform-imposed rate limit.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={repo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
          >
            <Github className="h-4 w-4" /> View source on GitHub <ExternalLink className="h-4 w-4" />
          </a>
          <a
            href={`${repo}#install`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-500"
          >
            <Terminal className="h-4 w-4" /> Installation instructions
          </a>
        </div>
      </header>

      <section aria-labelledby="why-instaserver" className="space-y-4">
        <h2 id="why-instaserver" className="text-2xl font-black text-white sm:text-3xl">
          Why this exists
        </h2>
        <p className="max-w-4xl text-sm leading-6 text-slate-300">
          Centralized platforms are convenient until their free tier throttles you. A burst of a dozen pushes in an hour can
          trip a build-rate limit and silently freeze production deploys for days, with no obvious signal it happened — the
          kind of incident that shows up first as a search-ranking cliff, not a dashboard alert. InstaServer trades platform
          convenience for owning the whole stack: your machine, your Docker engine, your uptime, no ceiling.
        </p>
        <p className="max-w-4xl text-sm leading-6 text-slate-400">
          Trade-off, stated plainly: your machine has to be on for a pod to be reachable, and the free Cloudflare quick
          tunnel is explicitly best-effort — Cloudflare's own words are "no uptime guarantee." This is the right tool for
          local development, demos, side projects, and internal tools, not a drop-in replacement for production hosting of a
          business-critical site with an SLA.
        </p>
      </section>

      <section aria-labelledby="quick-start" className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 sm:p-8">
          <h2 id="quick-start" className="text-2xl font-black text-white">
            Quick start
          </h2>
          <ol className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
            {[
              "Install the runtime: brew install colima docker cloudflared, then colima start.",
              "Clone the repo, npm install, npm run build.",
              "Register it: claude mcp add instaserver -- node /path/to/instaserver/dist/index.js",
              "Call deploy_pod with your files — get back a live public URL.",
            ].map((item, index) => (
              <li key={item} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-xs font-black text-cyan-300">
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </article>

        <aside className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 sm:p-8" aria-label="What you get for free">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-emerald-300">
            <ShieldCheck className="h-4 w-4" /> What you get, for $0
          </div>
          <h2 className="mt-3 text-2xl font-black text-white">No account, anywhere</h2>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
            {[
              "Persistent Docker containers with named volumes",
              "Public HTTPS URLs via Cloudflare quick tunnels",
              "Shell access (exec_command) into any pod",
              "File read/write without a full redeploy",
              "No build-minute quota, no deploy-rate limit",
              "MIT licensed — fork it, extend it, self-host it",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section aria-labelledby="presets" className="space-y-5">
        <div>
          <h2 id="presets" className="text-2xl font-black text-white sm:text-3xl">
            Runtime presets
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
            Three presets ship today. Extending <code className="text-cyan-300">src/presets.ts</code> for another runtime is
            a small, contained change.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {PRESETS.map(([name, image, body]) => (
            <article key={name} className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">{image}</div>
              <h3 className="mt-3 text-lg font-bold text-white">{name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="tool-surface" className="space-y-4">
        <h2 id="tool-surface" className="text-2xl font-black text-white sm:text-3xl">
          MCP tool surface
        </h2>
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <tbody>
              {TOOLS.map(([tool, desc], i) => (
                <tr key={tool} className={i % 2 === 0 ? "bg-slate-900/60" : "bg-slate-900/30"}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-cyan-300">{tool}</td>
                  <td className="px-4 py-3 text-slate-300">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="limitations" className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 sm:p-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-amber-300">
          <XCircle className="h-4 w-4" /> Read before relying on this
        </div>
        <h2 className="mt-3 text-2xl font-black text-white">Limitations, stated honestly</h2>
        <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
          {[
            "Your machine needs to be on and awake for pods to be reachable.",
            "Free Cloudflare quick tunnels are best-effort — no SLA, hostnames occasionally need a retry.",
            "No custom domains, no multi-region, no built-in TLS beyond what the tunnel provides.",
            "This is not a production hosting replacement for a business-critical site with an uptime commitment.",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
