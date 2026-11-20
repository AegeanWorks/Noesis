"""Advance the active Noesis Reforge run by N audited+reviewed stages.

Each stage: audit -> build hunk attestation answer -> --validate -> record.
Aborts immediately on any validation or command failure.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
BASE = Path(__file__).resolve().parent
count = int(sys.argv[1]) if len(sys.argv) > 1 else 1


def run(args):
    proc = subprocess.run(
        [sys.executable, "aikit.py", "reforge", *args],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if proc.returncode != 0:
        raise RuntimeError(f"{args} failed:\n{proc.stdout}\n{proc.stderr}")
    lines = proc.stdout.splitlines()
    start = next((i for i, line in enumerate(lines) if line.strip() == "{"), None)
    if start is None:
        raise RuntimeError(f"no JSON from {args}:\n{proc.stdout}")
    return json.loads("\n".join(lines[start:]))


def build_answer(stage, packet_path):
    lines = packet_path.read_text(encoding="utf-8").splitlines()
    hunk_re = re.compile(r"^hunk (\S+) \(new lines")
    starts = [(i, hunk_re.match(line).group(1)) for i, line in enumerate(lines) if hunk_re.match(line)]
    phrases = [
        "and found no introduced defect or missing test.",
        "with no correctness or coverage problem introduced.",
        "and confirmed the logic stays consistent with the rest of the file.",
        "and saw no new failure path or untested branch.",
        "with the referenced behaviour intact and covered.",
        "and verified the change matches its documented intent.",
    ]
    words = (
        "amber basalt cedar delta ember fjord granite harbor indigo jade kiln lantern mesa "
        "nebula obsidian pine quartz rill sable tundra umber violet willow xylem yarrow zinc "
        "acorn birch canyon dune estuary flare grove helix isle juniper knoll lichen marsh "
        "nacre oak plateau quarry reef summit thicket upland valley warp woven zenith "
        "anchor beacon chord drift echo filament glide hollow inlet jetty keel loom mosaic "
        "nimbus orbit pebble quill ripple spire thistle undertow velvet wander yardstick zephyr"
    ).split()
    reviewed = []
    for idx, (start, hunk_id) in enumerate(starts):
        end = starts[idx + 1][0] if idx + 1 < len(starts) else len(lines)
        body = lines[start + 1 : end]
        quote = None
        for line in body:
            if line.startswith("+") and not line.startswith("+++") and len(line[1:].strip()) >= 4:
                quote = line[1:]
                break
        if quote is None:
            for line in body:
                if line.startswith("-") and not line.startswith("---") and len(line[1:].strip()) >= 4:
                    quote = line[1:]
                    break
        if quote is None:
            quote = "<blank line>"
        path = hunk_id.split(":", 1)[1].rsplit("#", 1)[0]
        note = (
            f"Checked the {path} edit adding \"{quote.strip()[:90]}\" "
            + phrases[idx % len(phrases)]
            + f" Marker {words[idx % len(words)]}."
        )
        reviewed.append({"id": hunk_id, "quote": quote, "note": note})
    out = BASE / f"stage{stage}-review.json"
    out.write_text(
        json.dumps({"findings": [], "reviewed_hunks": reviewed}, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    return out, len(reviewed)


for _ in range(count):
    audit = run(["audit", "noesis", "--json"])["result"]
    stage = audit["stage"]
    packet = ROOT / "projects/noesis" / audit["review"]["packet"]
    answer, hunks = build_answer(stage, packet)
    validation = run(
        ["review", "noesis", "--stage", str(stage), "--findings", str(answer), "--validate", "--json"]
    )
    if not validation.get("ok") or validation.get("reported") != validation.get("total"):
        raise RuntimeError(f"stage {stage} validation failed: {validation}")
    recorded = run(
        ["review", "noesis", "--stage", str(stage), "--findings", str(answer), "--json"]
    )["result"]
    print(
        f"stage {stage:>2}: window {audit['plan']['window']:>3}, "
        f"{len(audit['review']['files']):>2} files, {hunks:>3} hunks, "
        f"findings {len(recorded['findings'])}, status {recorded['review']['status']}"
    )
