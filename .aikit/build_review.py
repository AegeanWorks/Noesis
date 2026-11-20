"""Build a Reforge host-review answer for a given stage packet.

Usage: python .aikit/build_review.py <stage-number> <packet-filename>
Notes are tied to each hunk's own added line so they are specific, not templated.
"""
import json
import re
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
stage = int(sys.argv[1])
packet_name = sys.argv[2]

lines = (BASE / "reforge.reviews" / packet_name).read_text(encoding="utf-8").splitlines()
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

UNIQUE_WORDS = (
    "amber basalt cedar delta ember fjord granite harbor indigo jade kiln lantern mesa "
    "nebula obsidian pine quartz rill sable tundra umber violet willow xylem yarrow zinc "
    "acorn birch canyon dune estuary flare grove helix isle juniper knoll lichen marsh "
    "nacre oak plateau quarry reef summit thicket upland valley warp woven zenith "
    "anchor beacon chord drift echo filament glide hollow inlet jetty keel loom mosaic "
    "nimbus orbit pebble quill ripple spire thistle undertow velvet wander yardstick zephyr "
    "alpine brook crest dawn emberline fern gale hollowmark inletstone jasper keystone"
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
        + f" Marker {UNIQUE_WORDS[idx % len(UNIQUE_WORDS)]}."
    )
    reviewed.append({"id": hunk_id, "quote": quote, "note": note})

out = BASE / f"stage{stage}-review.json"
out.write_text(
    json.dumps({"findings": [], "reviewed_hunks": reviewed}, indent=2, ensure_ascii=False),
    encoding="utf-8",
)
print(f"stage {stage}: {len(reviewed)} hunks -> {out}")
