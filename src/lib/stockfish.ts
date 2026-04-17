export interface PositionEvaluation {
  fen: string;
  depth: number;
  type: "cp" | "mate";
  rawValue: number;
  whiteAdvantage: number;
  whiteChance: number;
  blackChance: number;
}

interface PendingAnalysis {
  fen: string;
  resolve: (evaluation: PositionEvaluation) => void;
  reject: (error: Error) => void;
  latest?: PositionEvaluation;
}

type EngineFlavor = "lite-single" | "asm";

interface EngineCandidate {
  flavor: EngineFlavor;
  scriptPath: string;
  wasmPath?: string;
}

const ENGINE_CANDIDATES: EngineCandidate[] = [
  {
    flavor: "lite-single",
    scriptPath: `${import.meta.env.BASE_URL}stockfish/stockfish-18-lite-single.js`,
    wasmPath: `${import.meta.env.BASE_URL}stockfish/stockfish-18-lite-single.wasm`,
  },
  {
    flavor: "asm",
    scriptPath: `${import.meta.env.BASE_URL}stockfish/stockfish-18-asm.js`,
  },
];

function getEnginePath(candidate: EngineCandidate) {
  const scriptUrl = new URL(candidate.scriptPath, window.location.href).toString();

  if (!candidate.wasmPath) {
    return scriptUrl;
  }

  const wasmUrl = new URL(candidate.wasmPath, window.location.href).toString();
  return `${scriptUrl}#${encodeURIComponent(wasmUrl)},worker`;
}

let sharedEngine: StockfishEngine | null = null;

export function getStockfishEngine() {
  sharedEngine ??= new StockfishEngine();
  return sharedEngine;
}

export function scoreToChance(whiteAdvantage: number) {
  const scaled = 1 / (1 + Math.exp(-whiteAdvantage / 1.6));
  return Math.max(0.02, Math.min(0.98, scaled));
}

export function normalizeAdvantage(type: "cp" | "mate", value: number) {
  if (type === "mate") {
    return value > 0 ? 12 : -12;
  }

  return Math.max(-12, Math.min(12, value / 100));
}

function getTurnFromFen(fen: string) {
  const [, turn] = fen.split(" ");
  return turn === "b" ? "b" : "w";
}

export class StockfishEngine {
  private worker: Worker | null = null;
  private ready = false;
  private readyPromise: Promise<void> | null = null;
  private pending: PendingAnalysis | null = null;
  private engineFlavor: EngineFlavor | null = null;

  async ensureReady() {
    if (this.ready) {
      return;
    }

    if (this.readyPromise) {
      return this.readyPromise;
    }

    this.readyPromise = this.startWorkerWithFallback();

    await this.readyPromise;

    this.worker?.addEventListener("message", (event) => {
      this.handleMessage(String(event.data));
    });
  }

  async analyze(fen: string, depth = 10): Promise<PositionEvaluation> {
    await this.ensureReady();

    if (!this.worker) {
      throw new Error("Stockfish er ikke tilgjengelig.");
    }

    if (this.pending) {
      this.worker.postMessage("stop");
      this.pending.reject(new Error("Analysis superseded"));
      this.pending = null;
    }

    return new Promise<PositionEvaluation>((resolve, reject) => {
      const analysisTimeout = window.setTimeout(() => {
        this.pending = null;
        reject(new Error("Stockfish svarte ikke i tide."));
      }, 12000);

      this.pending = {
        fen,
        resolve: (evaluation) => {
          window.clearTimeout(analysisTimeout);
          resolve(evaluation);
        },
        reject,
      };

      this.worker?.postMessage(`position fen ${fen}`);
      this.worker?.postMessage(`go depth ${depth}`);
    });
  }

  private handleMessage(line: string) {
    if (!this.pending) {
      return;
    }

    if (line.startsWith("info")) {
      const parsed = parseInfoLine(line, this.pending.fen);
      if (parsed) {
        this.pending.latest = parsed;
      }
      return;
    }

    if (line.startsWith("bestmove")) {
      const fallback =
        this.pending.latest ??
        buildEvaluation(this.pending.fen, 0, "cp", 0);
      this.pending.resolve(fallback);
      this.pending = null;
    }
  }

  private async startWorkerWithFallback() {
    let lastError: Error | null = null;

    for (const candidate of ENGINE_CANDIDATES) {
      try {
        await this.startWorker(candidate);
        this.engineFlavor = candidate.flavor;
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Stockfish kunne ikke startes.");
        this.teardownWorker(lastError);
      }
    }

    throw lastError ?? new Error("Stockfish kunne ikke startes.");
  }

  private async startWorker(candidate: EngineCandidate) {
    this.worker = new Worker(getEnginePath(candidate), { type: "classic", name: `stockfish-${candidate.flavor}` });

    await new Promise<void>((resolve, reject) => {
      if (!this.worker) {
        reject(new Error("Kunne ikke starte Stockfish."));
        return;
      }

      const readyTimeout = window.setTimeout(() => {
        cleanup();
        reject(new Error("Stockfish brukte for lang tid på å starte."));
      }, candidate.flavor === "asm" ? 16000 : 12000);

      const cleanup = () => {
        window.clearTimeout(readyTimeout);
        this.worker?.removeEventListener("message", handleMessage);
        this.worker?.removeEventListener("error", handleError);
      };

      const handleMessage = (event: MessageEvent<string>) => {
        const line = String(event.data);
        if (line === "readyok") {
          cleanup();
          this.ready = true;
          resolve();
        }
      };

      const handleError = () => {
        cleanup();
        reject(new Error("Stockfish kunne ikke lastes."));
      };

      this.worker.addEventListener("message", handleMessage);
      this.worker.addEventListener("error", handleError);

      this.worker.postMessage("uci");
      this.worker.postMessage("setoption name UCI_ShowWDL value false");
      this.worker.postMessage("isready");
    });
  }

  private teardownWorker(error?: Error) {
    if (this.pending) {
      this.pending.reject(error ?? new Error("Stockfish-stillingen ble avbrutt."));
      this.pending = null;
    }

    this.worker?.terminate();
    this.worker = null;
    this.ready = false;
    this.readyPromise = null;
    this.engineFlavor = null;
  }
}

function parseInfoLine(line: string, fen: string): PositionEvaluation | null {
  const depthMatch = line.match(/\bdepth (\d+)/);
  const cpMatch = line.match(/\bscore cp (-?\d+)/);
  const mateMatch = line.match(/\bscore mate (-?\d+)/);

  if (!depthMatch || (!cpMatch && !mateMatch)) {
    return null;
  }

  const depth = Number(depthMatch[1]);

  if (cpMatch) {
    return buildEvaluation(fen, depth, "cp", Number(cpMatch[1]));
  }

  return buildEvaluation(fen, depth, "mate", Number(mateMatch?.[1] ?? 0));
}

function buildEvaluation(
  fen: string,
  depth: number,
  type: "cp" | "mate",
  rawValue: number,
): PositionEvaluation {
  const turn = getTurnFromFen(fen);
  const engineAdvantage = normalizeAdvantage(type, rawValue);
  const whiteAdvantage = turn === "w" ? engineAdvantage : -engineAdvantage;
  const whiteChance = scoreToChance(whiteAdvantage);

  return {
    fen,
    depth,
    type,
    rawValue,
    whiteAdvantage,
    whiteChance,
    blackChance: 1 - whiteChance,
  };
}
