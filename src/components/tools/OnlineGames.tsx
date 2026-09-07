import React, { useState, useEffect, useCallback, useRef } from "react";
import { ToolDefinition } from "../../types";
import { RotateCcw, Trophy } from "lucide-react";

interface OnlineGamesProps {
  tool: ToolDefinition;
  onSaveHistory: (input: string, output: string) => void;
}

const EMOJI_SET = ["🚀", "🎯", "⚡", "🔥", "💎", "🌟", "🎮", "🧩"];
const WORD_LIST = ["JAVASCRIPT", "DEVELOPER", "BROWSER", "PRIVACY", "SITEMAP", "REGEX", "KEYBOARD", "FUNCTION", "VARIABLE", "COMPONENT"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function MemoryMatch({ onSaveHistory }: { onSaveHistory: OnlineGamesProps["onSaveHistory"] }) {
  const [cards, setCards] = useState<{ id: number; symbol: string; flipped: boolean; matched: boolean }[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [best, setBest] = useState<number | null>(() => {
    try {
      const v = localStorage.getItem("xfree_memory_best");
      return v ? Number(v) : null;
    } catch {
      return null;
    }
  });

  const newGame = useCallback(() => {
    const pairs = shuffle([...EMOJI_SET, ...EMOJI_SET]).map((symbol, id) => ({ id, symbol, flipped: false, matched: false }));
    setCards(pairs);
    setSelected([]);
    setMoves(0);
  }, []);

  useEffect(() => newGame(), [newGame]);

  const handleFlip = (id: number) => {
    if (selected.length === 2) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const nextCards = cards.map((c) => (c.id === id ? { ...c, flipped: true } : c));
    const nextSelected = [...selected, id];
    setCards(nextCards);
    setSelected(nextSelected);

    if (nextSelected.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = nextSelected.map((sid) => nextCards.find((c) => c.id === sid)!);
      if (a.symbol === b.symbol) {
        setTimeout(() => {
          setCards((prev) => prev.map((c) => (c.id === a.id || c.id === b.id ? { ...c, matched: true } : c)));
          setSelected([]);
        }, 400);
      } else {
        setTimeout(() => {
          setCards((prev) => prev.map((c) => (c.id === a.id || c.id === b.id ? { ...c, flipped: false } : c)));
          setSelected([]);
        }, 700);
      }
    }
  };

  const won = cards.length > 0 && cards.every((c) => c.matched);
  useEffect(() => {
    if (won) {
      if (best === null || moves < best) {
        setBest(moves);
        try {
          localStorage.setItem("xfree_memory_best", String(moves));
        } catch {}
      }
      onSaveHistory("memory-match", `won in ${moves} moves`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>Moves: <span className="text-white font-mono font-bold">{moves}</span></span>
        {best !== null && <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-amber-400" /> Best: <span className="text-white font-mono font-bold">{best}</span></span>}
        <button onClick={newGame} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs cursor-pointer">
          <RotateCcw className="w-3.5 h-3.5" /> New Game
        </button>
      </div>
      {won && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-bold text-center">🎉 Solved in {moves} moves!</div>}
      <div className="grid grid-cols-4 gap-2">
        {cards.map((c) => (
          <button
            key={c.id}
            onClick={() => handleFlip(c.id)}
            className={`aspect-square rounded-xl text-2xl flex items-center justify-center cursor-pointer transition-all ${
              c.flipped || c.matched ? "bg-emerald-500/20 border border-emerald-500/40" : "bg-zinc-800 border border-zinc-700 hover:bg-zinc-750"
            } ${c.matched ? "opacity-50" : ""}`}
          >
            {c.flipped || c.matched ? c.symbol : ""}
          </button>
        ))}
      </div>
    </div>
  );
}

function QuickMath({ onSaveHistory }: { onSaveHistory: OnlineGamesProps["onSaveHistory"] }) {
  const [problem, setProblem] = useState(() => genProblem());
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function genProblem() {
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;
    const ops = ["+", "-", "×"] as const;
    const op = ops[Math.floor(Math.random() * ops.length)];
    const result = op === "+" ? a + b : op === "-" ? a - b : a * b;
    return { text: `${a} ${op} ${b}`, result };
  }

  useEffect(() => {
    if (!running) return;
    if (timeLeft <= 0) {
      setRunning(false);
      onSaveHistory("quick-math", `scored ${score}`);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, timeLeft]);

  const start = () => {
    setScore(0);
    setTimeLeft(30);
    setRunning(true);
    setProblem(genProblem());
    setAnswer("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const submit = () => {
    if (!running) return;
    const correct = Number(answer) === problem.result;
    setFeedback(correct ? "correct" : "wrong");
    if (correct) setScore((s) => s + 1);
    setProblem(genProblem());
    setAnswer("");
    setTimeout(() => setFeedback(null), 300);
  };

  return (
    <div className="space-y-4 text-center">
      {!running ? (
        <div className="py-8 space-y-3">
          {timeLeft === 0 && <p className="text-lg font-bold text-white">Final score: {score}</p>}
          <button onClick={start} className="px-6 py-3 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-sm cursor-pointer">
            {timeLeft === 0 ? "Play Again" : "Start 30s Challenge"}
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Score: <span className="text-white font-mono font-bold">{score}</span></span>
            <span>Time: <span className="text-white font-mono font-bold">{timeLeft}s</span></span>
          </div>
          <div className={`p-8 rounded-xl border ${feedback === "correct" ? "bg-emerald-500/10 border-emerald-500/40" : feedback === "wrong" ? "bg-rose-500/10 border-rose-500/40" : "bg-zinc-950 border-zinc-800"}`}>
            <div className="text-3xl font-mono font-bold text-white mb-4">{problem.text} = ?</div>
            <input
              ref={inputRef}
              type="number"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              autoFocus
              className="w-32 p-2 text-center text-lg rounded-lg bg-zinc-900 border border-zinc-700 text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        </>
      )}
    </div>
  );
}

function WordScramble({ onSaveHistory }: { onSaveHistory: OnlineGamesProps["onSaveHistory"] }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [scrambled, setScrambled] = useState("");
  const [guess, setGuess] = useState("");
  const [solved, setSolved] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const scramble = useCallback((word: string) => {
    let s = word;
    while (s === word) s = shuffle(word.split("")).join("");
    return s;
  }, []);

  useEffect(() => {
    setScrambled(scramble(WORD_LIST[wordIndex]));
  }, [wordIndex, scramble]);

  const submit = () => {
    const correct = guess.trim().toUpperCase() === WORD_LIST[wordIndex];
    setFeedback(correct ? "correct" : "wrong");
    if (correct) {
      setSolved((s) => s + 1);
      onSaveHistory("word-scramble", `solved ${solved + 1}`);
      setTimeout(() => {
        setWordIndex((i) => (i + 1) % WORD_LIST.length);
        setGuess("");
        setFeedback(null);
      }, 700);
    } else {
      setTimeout(() => setFeedback(null), 500);
    }
  };

  return (
    <div className="space-y-4 text-center">
      <div className="text-xs text-zinc-400">Solved: <span className="text-white font-mono font-bold">{solved}</span></div>
      <div className={`p-8 rounded-xl border ${feedback === "correct" ? "bg-emerald-500/10 border-emerald-500/40" : feedback === "wrong" ? "bg-rose-500/10 border-rose-500/40" : "bg-zinc-950 border-zinc-800"}`}>
        <div className="text-3xl font-mono font-bold tracking-[0.3em] text-emerald-300 mb-4">{scrambled}</div>
        <input
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Your guess..."
          className="w-56 p-2 text-center text-lg rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
        />
      </div>
      <button onClick={submit} className="px-5 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs cursor-pointer">
        Check Answer
      </button>
    </div>
  );
}

export const OnlineGames: React.FC<OnlineGamesProps> = ({ tool, onSaveHistory }) => {
  const [activeGame, setActiveGame] = useState<"memory" | "math" | "scramble">("memory");

  return (
    <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        {([
          ["memory", "Memory Match"],
          ["math", "Quick Math"],
          ["scramble", "Word Scramble"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveGame(id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeGame === id ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {activeGame === "memory" && <MemoryMatch onSaveHistory={onSaveHistory} />}
      {activeGame === "math" && <QuickMath onSaveHistory={onSaveHistory} />}
      {activeGame === "scramble" && <WordScramble onSaveHistory={onSaveHistory} />}
    </div>
  );
};
