import { useState, useCallback, useEffect, useRef } from "react";

const LEET_MAP: Record<string, string> = {
  A: "4", a: "4",
  B: "8", b: "8",
  C: "C", c: "c",
  D: "D", d: "d",
  E: "3", e: "3",
  F: "F", f: "f",
  G: "9", g: "9",
  H: "H", h: "h",
  I: "1", i: "1",
  J: "J", j: "j",
  K: "K", k: "k",
  L: "1", l: "1",
  M: "M", m: "m",
  N: "N", n: "n",
  O: "0", o: "0",
  P: "P", p: "p",
  Q: "Q", q: "q",
  R: "2", r: "2",
  S: "5", s: "5",
  T: "7", t: "7",
  U: "U", u: "u",
  V: "V", v: "v",
  W: "W", w: "w",
  X: "X", x: "x",
  Y: "Y", y: "y",
  Z: "2", z: "2",
};

const LEET_TABLE = Object.entries(LEET_MAP).filter(([k]) => k === k.toUpperCase());

function toLeet(text: string): string {
  return text.split("").map((ch) => LEET_MAP[ch] ?? ch).join("");
}

const REVERSE_MAP: Record<string, string> = {
  "4": "A",
  "8": "B",
  "3": "E",
  "9": "G",
  "1": "I",   // ambiguous: I or L — I is far more common
  "0": "O",
  "2": "R",   // ambiguous: R or Z — R is far more common
  "5": "S",
  "7": "T",
};

function fromLeet(text: string): string {
  return text.split("").map((ch) => REVERSE_MAP[ch] ?? ch).join("").toUpperCase();
}

const EXAMPLES = ["HACKER", "1337 SKULLS", "ELITE", "GAME OVER"];

const RANDOM_PHRASES = [
  "HACK THE PLANET",
  "GAME OVER MAN",
  "ACCESS DENIED",
  "NO MERCY",
  "SKULL SQUAD",
  "ZERO COOL",
  "DARK SIDE",
  "LEVEL UP",
  "DEATH MATCH",
  "POWER SURGE",
  "GHOST IN THE MACHINE",
  "CODE RED",
  "SYSTEM FAILURE",
  "NIGHT CRAWLER",
  "ROGUE AGENT",
];

interface HistoryItem {
  id: number;
  original: string;
  leet: string;
  ts: string;
}

let historyCounter = 0;

function SkullImg({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/skull.png"
      alt="skull"
      width={size}
      height={size}
      className={`inline-block ${className}`}
      style={{ imageRendering: "pixelated", objectFit: "contain" }}
    />
  );
}

export default function App() {
  const [input, setInput] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("t") ?? "";
  });
  const [copied, setCopied] = useState(false);
  const [flash, setFlash] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copiedHistId, setCopiedHistId] = useState<number | null>(null);
  const [sharedLink, setSharedLink] = useState(false);
  const [focus, setFocus] = useState(false);
  const [light, setLight] = useState(false);
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [pasted, setPasted] = useState(false);
  const [displayedLeet, setDisplayedLeet] = useState("");
  const [typing, setTyping] = useState(false);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const leet = mode === "encode" ? toLeet(input) : fromLeet(input);
  const TWEET_LIMIT = 280;
  const TWEET_SUFFIX = "\n\n#1337Skulls #leet"; // 19 chars
  const tweetChars = leet.length + TWEET_SUFFIX.length;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("t")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocus(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("theme-light", light);
  }, [light]);

  useEffect(() => {
    if (animRef.current) clearTimeout(animRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!leet) {
      setDisplayedLeet("");
      setTyping(false);
      return;
    }

    setTyping(true);
    let idx = 0;
    animRef.current = setTimeout(() => {
      setDisplayedLeet("");
      intervalRef.current = setInterval(() => {
        idx++;
        setDisplayedLeet(leet.slice(0, idx));
        if (idx >= leet.length) {
          clearInterval(intervalRef.current!);
          setTyping(false);
        }
      }, 18);
    }, 260);

    return () => {
      if (animRef.current) clearTimeout(animRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [leet]);

  const saveToHistory = useCallback((orig: string, leetText: string) => {
    if (!orig.trim()) return;
    const now = new Date();
    const ts = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.original !== orig);
      return [{ id: ++historyCounter, original: orig, leet: leetText, ts }, ...filtered].slice(0, 10);
    });
  }, []);

  const handleCopy = useCallback(async () => {
    if (!leet) return;
    try {
      await navigator.clipboard.writeText(leet);
    } catch {
      const el = document.createElement("textarea");
      el.value = leet;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    saveToHistory(input, leet);
    setCopied(true);
    setFlash(true);
    setTimeout(() => setCopied(false), 1800);
    setTimeout(() => setFlash(false), 600);
  }, [leet, input, saveToHistory]);

  const handleHistoryCopy = useCallback(async (item: HistoryItem) => {
    try {
      await navigator.clipboard.writeText(item.leet);
    } catch {
      const el = document.createElement("textarea");
      el.value = item.leet;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedHistId(item.id);
    setTimeout(() => setCopiedHistId(null), 1400);
  }, []);

  const handleShare = useCallback(async () => {
    if (!input.trim()) return;
    const url = `${window.location.origin}${window.location.pathname}?t=${encodeURIComponent(input)}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setSharedLink(true);
    setTimeout(() => setSharedLink(false), 2000);
  }, [input]);

  const handleExample = (ex: string) => setInput(ex);

  const handleRandom = () => {
    const pool = RANDOM_PHRASES.filter((p) => p !== input);
    setInput(pool[Math.floor(Math.random() * pool.length)]);
  };

  const handleClear = () => {
    setInput("");
    setDisplayedLeet("");
    setTyping(false);
    if (animRef.current) clearTimeout(animRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const clearHistory = () => setHistory([]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setInput(text.trim());
        setPasted(true);
        setTimeout(() => setPasted(false), 1500);
      }
    } catch {
      // clipboard permission denied — user can paste manually
    }
  }, []);

  const handleTweet = useCallback(() => {
    if (!leet) return;
    const text = encodeURIComponent(`${leet}\n\n#1337Skulls #leet`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank", "noopener,noreferrer");
  }, [leet]);

  const CopyShareButtons = ({ compact = false }: { compact?: boolean }) => (
    <div className="flex gap-2 flex-wrap justify-end">
      <button
        className="skull-btn px-3 py-1 rounded text-xs"
        onClick={handleShare}
        disabled={!input.trim()}
        style={{ opacity: input.trim() ? 1 : 0.4, cursor: input.trim() ? "pointer" : "not-allowed" }}
      >
        {sharedLink ? "[ 11nk C0P13D! ]" : "[ 5H423 ]"}
      </button>
      <span className="flex items-center gap-1">
        <button
          className="skull-btn px-3 py-1 rounded text-xs"
          onClick={handleTweet}
          disabled={!leet || tweetChars > TWEET_LIMIT}
          style={{ opacity: (leet && tweetChars <= TWEET_LIMIT) ? 1 : 0.4, cursor: (leet && tweetChars <= TWEET_LIMIT) ? "pointer" : "not-allowed" }}
          title="Post to X / Twitter"
        >
          [ 7W337 ]
        </button>
        {leet && (
          <span
            className="text-xs tabular-nums"
            style={{
              color: tweetChars > TWEET_LIMIT
                ? "hsl(var(--destructive))"
                : tweetChars > 260
                ? "#f59e0b"
                : tweetChars > 240
                ? "#ca8a04"
                : "hsl(var(--muted-foreground))",
              opacity: tweetChars > 240 ? 1 : 0.45,
              fontFamily: "inherit",
            }}
            title={`Tweet will be ${tweetChars} of ${TWEET_LIMIT} characters`}
          >
            {tweetChars}/{TWEET_LIMIT}
          </span>
        )}
      </span>
      <button
        className={`skull-btn px-3 py-1 rounded text-xs flex items-center gap-1.5 ${copied ? "copied" : ""}`}
        onClick={handleCopy}
        disabled={!leet}
        style={{ opacity: leet ? 1 : 0.4, cursor: leet ? "pointer" : "not-allowed" }}
      >
        {copied ? <><SkullImg size={14} /> C0P13D!</> : "[ C0PY ]"}
      </button>
      {compact && (
        <button
          className="skull-btn px-3 py-1 rounded text-xs"
          onClick={() => setFocus(false)}
          title="Exit focus mode (Esc)"
        >
          [ 3X17 ]
        </button>
      )}
    </div>
  );

  return (
    <>
    {/* ── Focus mode overlay ── */}
    {focus && (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4 py-8"
        style={{ background: "hsl(var(--background))" }}
      >
        {/* top bar */}
        <div className="w-full max-w-lg flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <SkullImg size={28} />
            <span className="text-xs tracking-widest text-muted-foreground glow-dim uppercase">F0CU5 M0D3</span>
          </div>
          <button
            className="skull-btn px-3 py-1 rounded text-xs"
            onClick={() => setFocus(false)}
            title="Exit (Esc)"
          >
            [ 3X17 ]
          </button>
        </div>

        {/* input */}
        <div className="w-full max-w-lg mb-4">
          <label className="block text-xs uppercase tracking-widest mb-2 text-muted-foreground">// 1npu7</label>
          <textarea
            className="skull-input skull-border w-full rounded p-4 text-lg resize-none leading-relaxed"
            rows={5}
            placeholder="7yp3 4ny7H1n9..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>

        {/* divider */}
        <div className="flex items-center gap-2 text-muted-foreground select-none w-full max-w-lg mb-4">
          <div className="flex-1 border-t" style={{ borderColor: "hsl(var(--border))" }} />
          <span className="glow text-lg">▼</span>
          <div className="flex-1 border-t" style={{ borderColor: "hsl(var(--border))" }} />
        </div>

        {/* output */}
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs uppercase tracking-widest text-muted-foreground">// 0u7pu7</label>
            <CopyShareButtons compact />
          </div>
          <div
            className={`skull-border rounded p-4 leet-output text-lg leading-relaxed select-all ${flash ? "flash-copy" : ""} ${input ? "glow-dim" : ""}`}
            style={{
              background: "hsl(var(--muted))",
              color: input ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
              minHeight: "120px",
            }}
          >
            {displayedLeet
              ? <>{displayedLeet}{typing && <span style={{ opacity: 0.7, animation: "blink 1s step-end infinite" }}>█</span>}</>
              : <span className="opacity-40 text-sm">// 0u7pu7 w111 4pp342 H323...</span>}
          </div>
          {input && (
            <div className="text-xs text-muted-foreground flex justify-between px-0.5 mt-2">
              <span>{input.length} ch425 1npu7</span>
              <span>{leet.length} ch425 0u7pu7</span>
            </div>
          )}
        </div>

        <p className="mt-8 text-xs text-muted-foreground opacity-30 select-none tracking-widest">
          P2355 35C 70 3X17
        </p>
      </div>
    )}

    <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-4 py-8 md:py-12">

      {/* Header */}
      <header className="w-full max-w-lg text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <SkullImg size={44} className="rounded" />
          <img
            src="/logo1337skulls.png"
            alt="1337"
            className="h-16 md:h-20"
            style={{ imageRendering: "pixelated", objectFit: "contain" }}
          />
          <SkullImg size={44} className="rounded" />
        </div>
        <div className="text-sm glow-dim tracking-[0.25em] uppercase text-muted-foreground mt-1">
          73X7 93N324702
        </div>

        {/* Scrolling leet ticker */}
        <div
          className="mt-4 overflow-hidden w-full border-b border-t py-1.5"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <div className="ticker-inner text-xs text-muted-foreground select-none">
            {[...LEET_TABLE, ...LEET_TABLE].map(([k, v], i) => (
              <span key={i} className="mx-3 whitespace-nowrap">
                <span className="glow-dim">{k}</span>
                <span className="opacity-40 mx-1">=</span>
                <span style={{ color: "hsl(var(--primary))" }}>{v}</span>
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Main card */}
      <main className="w-full max-w-lg flex flex-col gap-4">

        {/* Mode toggle */}
        <div className="flex items-center gap-1 self-center skull-border rounded overflow-hidden text-xs">
          <button
            className="px-4 py-1.5 transition-all"
            style={{
              background: mode === "encode" ? "hsl(var(--primary))" : "transparent",
              color: mode === "encode" ? "hsl(var(--background))" : "hsl(var(--muted-foreground))",
              fontFamily: "inherit",
              border: "none",
              cursor: "pointer",
              letterSpacing: "0.15em",
            }}
            onClick={() => { setMode("encode"); setInput(""); }}
          >
            [ 3NC0D3 ]
          </button>
          <button
            className="px-4 py-1.5 transition-all"
            style={{
              background: mode === "decode" ? "hsl(var(--primary))" : "transparent",
              color: mode === "decode" ? "hsl(var(--background))" : "hsl(var(--muted-foreground))",
              fontFamily: "inherit",
              border: "none",
              cursor: "pointer",
              letterSpacing: "0.15em",
            }}
            onClick={() => { setMode("decode"); setInput(""); }}
          >
            [ D3C0D3 ]
          </button>
        </div>

        {/* Input */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs uppercase tracking-widest text-muted-foreground">
              {mode === "encode" ? "// 1npu7" : "// 1337 1npu7"}
            </label>
            <div className="flex gap-2">
              {input && (
                <button
                  className="skull-btn text-xs px-2 py-0.5 rounded"
                  onClick={handleClear}
                  title="Clear input"
                >
                  [ C1342 ]
                </button>
              )}
              <button
                className="skull-btn text-xs px-2 py-0.5 rounded"
                onClick={() => setFocus(true)}
                title="Enter focus mode"
              >
                [ F0CU5 ]
              </button>
            </div>
          </div>
          <textarea
            className="skull-input skull-border w-full rounded p-3 text-base resize-none leading-relaxed"
            rows={4}
            placeholder={mode === "encode" ? "7yp3 4ny7H1n9..." : "p4573 1337 73X7 H323..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
          {mode === "encode" && <div className="flex gap-2 flex-wrap mt-2">
            <button
              onClick={handleRandom}
              className="skull-btn text-xs px-2 py-0.5 rounded"
            >
              [ 2 4 N D 0 M ]
            </button>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => handleExample(ex)}
                className="text-xs px-2 py-0.5 rounded border cursor-pointer transition-all"
                style={{
                  borderColor: "hsl(var(--border))",
                  color: "hsl(var(--muted-foreground))",
                  background: "transparent",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(var(--primary))";
                  (e.currentTarget as HTMLButtonElement).style.color = "hsl(var(--primary))";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(var(--border))";
                  (e.currentTarget as HTMLButtonElement).style.color = "hsl(var(--muted-foreground))";
                }}
              >
                {ex}
              </button>
            ))}
          </div>}
          {mode === "decode" && (
            <div className="flex gap-2 mt-2">
              <button
                className="skull-btn text-xs px-3 py-0.5 rounded"
                onClick={handlePaste}
                title="Paste leet text from clipboard"
              >
                {pasted ? "[ P4573D! ]" : "[ P4573 ]"}
              </button>
              <span className="text-xs text-muted-foreground self-center opacity-50">
                — paste leet text, get plain english
              </span>
            </div>
          )}
        </section>

        {/* Divider */}
        <div className="flex items-center gap-2 text-muted-foreground select-none">
          <div className="flex-1 border-t" style={{ borderColor: "hsl(var(--border))" }} />
          <span className="glow text-lg">{mode === "encode" ? "▼" : "▲"}</span>
          <div className="flex-1 border-t" style={{ borderColor: "hsl(var(--border))" }} />
        </div>

        {/* Output */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs uppercase tracking-widest text-muted-foreground">
              {mode === "encode" ? "// 0u7pu7" : "// P141N 73X7"}
            </label>
            <CopyShareButtons />
          </div>
          <div
            className={`skull-border rounded p-3 leet-output text-base leading-relaxed transition-all select-all ${flash ? "flash-copy" : ""} ${input ? "glow-dim" : ""}`}
            style={{
              background: "hsl(var(--muted))",
              color: input ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
              minHeight: "96px",
            }}
          >
            {displayedLeet
              ? <>{displayedLeet}{typing && <span style={{ opacity: 0.7, animation: "blink 1s step-end infinite" }}>█</span>}</>
              : <span className="opacity-40 text-sm">{mode === "encode" ? "// 0u7pu7 w111 4pp342 H323..." : "// D3C0D3D 73X7 w111 4PP342 H323..."}</span>}
          </div>
        </section>

        {/* Char count */}
        {input && (
          <div className="text-xs text-muted-foreground flex justify-between px-0.5">
            <span>{input.length} ch42{input.length !== 1 ? "5" : ""} 1npu7</span>
            <span>{leet.length} ch42{leet.length !== 1 ? "5" : ""} 0u7pu7</span>
          </div>
        )}

        {/* History panel */}
        {history.length > 0 && (
          <section className="mt-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                // H1570ry ({history.length}/10)
              </div>
              <button
                onClick={clearHistory}
                className="text-xs cursor-pointer transition-colors"
                style={{ color: "hsl(var(--muted-foreground))", fontFamily: "inherit", background: "none", border: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--destructive))")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--muted-foreground))")}
              >
                [ C1342 ]
              </button>
            </div>
            <div
              className="skull-border rounded divide-y"
              style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))", divideColor: "hsl(var(--border))" }}
            >
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-2 px-3 py-2 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground truncate mb-0.5">
                      {item.original}
                    </div>
                    <div
                      className="text-sm font-mono truncate glow-dim"
                      style={{ color: "hsl(var(--primary))" }}
                    >
                      {item.leet}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                    <span className="text-xs text-muted-foreground opacity-50">{item.ts}</span>
                    <button
                      onClick={() => handleHistoryCopy(item)}
                      className="skull-btn text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {copiedHistId === item.id ? "✓" : "C0PY"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Leet reference table */}
        <section className="mt-2">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            // 1337 74813
          </div>
          <div
            className="skull-border rounded p-3 grid grid-cols-4 sm:grid-cols-6 gap-1.5"
            style={{ background: "hsl(var(--card))" }}
          >
            {LEET_TABLE.map(([k, v]) => (
              <div key={k} className="flex items-center gap-1 text-xs font-mono">
                <span className="text-muted-foreground w-4">{k}</span>
                <span className="text-muted-foreground opacity-50">=</span>
                <span style={{ color: "hsl(var(--primary))" }} className="glow-dim">{v}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-10 flex items-center gap-3 text-xs text-muted-foreground tracking-widest select-none">
        <span className="opacity-50 flex items-center gap-2">
          <SkullImg size={16} />
          1337 5ku115 — 73X7 93N324702
          <SkullImg size={16} />
        </span>
        <button
          className="skull-btn px-2 py-0.5 rounded opacity-60 hover:opacity-100 transition-opacity"
          onClick={() => setLight((l) => !l)}
          title="Toggle light/dark"
        >
          {light ? "[ D42K ]" : "[ 119H7 ]"}
        </button>
      </footer>
    </div>
    </>
  );
}
