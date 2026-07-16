# Data Contract

`server/normalize.mjs` validates `zwds.raw.v1`: request/engine/generation metadata, ruleset metadata, normalized input, chronometry, calendar resolution, chart anchors, palace placement references, authoritative star placements, optional relations, decades, quality, provenance and derivation trace.

Unknown IDs, statuses or object fields fail strict parsing. Exactly twelve roles/branches are required. Placement IDs are unique, referenced exactly once and coordinate-consistent. Transformations belong to concrete placements; each core type occurs at most once. Ming/Shen branches must exist. Twelve decades must be input-sorted, contiguous and non-overlapping.

`fufire.zwds-evidence.v1` preserves placement IDs, transformations, ruleset/policy metadata, provenance, warning objects and derivation trace. Calculation, source and crosscheck status are separate. Unavailable hashes remain null with warning `RULESET_HASHES_UNAVAILABLE`.