import { mechanicResult } from "../src/engine/mechanics";
import { defaultTrials } from "../src/engine/mechanics";
import { policyFor, runMechanic } from "../src/engine/simulate";
import type { MechanicId } from "../src/engine/types";

interface Options {
  mechanic: MechanicId;
  seed: number;
  difficulty: number;
  trials: number;
  strategy: string;
  json: boolean;
  out: string | null;
  help: boolean;
}

const MECHANICS: readonly MechanicId[] = ["nback", "gonogo", "reasoning"];

function parse(argv: string[]): Options {
  const options: Options = {
    mechanic: "nback",
    seed: 42,
    difficulty: 2,
    trials: 0,
    strategy: "optimal",
    json: false,
    out: null,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--json") options.json = true;
    else if (arg === "--mechanic" && next) {
      if (!MECHANICS.includes(next as MechanicId)) {
        throw new Error(`Unknown mechanic '${next}'. Use nback, gonogo or reasoning.`);
      }
      options.mechanic = next as MechanicId;
      index += 1;
    } else if (arg === "--seed" && next) {
      options.seed = Number(next);
      index += 1;
    } else if (arg === "--difficulty" && next) {
      options.difficulty = Number(next);
      index += 1;
    } else if (arg === "--trials" && next) {
      options.trials = Number(next);
      index += 1;
    } else if (arg === "--strategy" && next) {
      if (!["optimal", "random", "always", "never"].includes(next)) {
        throw new Error("Unknown strategy. Use optimal, random, always or never.");
      }
      options.strategy = next;
      index += 1;
    } else if (arg === "--out" && next) {
      options.out = next;
      index += 1;
    } else {
      throw new Error(`Unknown argument '${arg}'`);
    }
  }
  if (!Number.isInteger(options.seed)) throw new Error("--seed must be an integer");
  if (!Number.isInteger(options.difficulty) || options.difficulty < 1 || options.difficulty > 3) {
    throw new Error("--difficulty must be 1, 2 or 3");
  }
  return options;
}

function help(): void {
  console.log(`Usage: npm run ai:simulate -- [options]

  --mechanic <nback|gonogo|reasoning>   default: nback
  --seed <integer>                      default: 42
  --difficulty <1|2|3>                  default: 2
  --trials <integer>                    default: mechanic default
  --strategy <optimal|random|always|never>  default: optimal
  --json                                print the full result as JSON
  --out <path>                          write the full result to a file
`);
}

async function main(): Promise<number> {
  const options = parse(process.argv.slice(2));
  if (options.help) {
    help();
    return 0;
  }
  const trials = options.trials > 0 ? options.trials : defaultTrials(options.mechanic, options.difficulty);
  const run = runMechanic(
    options.mechanic,
    options.seed,
    options.difficulty,
    trials,
    policyFor(options.strategy, options.seed),
  );
  const result = mechanicResult(run.state);
  const payload = {
    mechanic: options.mechanic,
    seed: options.seed,
    difficulty: options.difficulty,
    trials,
    strategy: options.strategy,
    steps: run.steps,
    completed: run.completed,
    actions: run.actions.length,
    result,
  };
  const text = JSON.stringify(payload, null, 2);
  if (options.out) {
    const { writeFile } = await import("node:fs/promises");
    await writeFile(options.out, `${text}\n`, "utf8");
  }
  if (options.json) console.log(text);
  else {
    console.log(
      `${options.mechanic} seed=${options.seed} strategy=${options.strategy} ` +
        `completed=${run.completed} steps=${run.steps}`,
    );
    console.log(result.summary);
  }
  return run.completed ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    console.error("Fix: run with --help to see the accepted arguments.");
    process.exit(2);
  });
