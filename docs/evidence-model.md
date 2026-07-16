# Evidence Model

Stable IDs include `ruleset`, resolution/anchor/bureau entries, `palace.<ID>`, `placement.<original placement_id>`, `transformation.<TYPE>`, relations, `decade.<n>`, quality and provenance.

Every deterministic section contains rule ID/version, truth class, source status, evidence IDs, localization key and limitations. Unknown evidence rejects the section and emits `SECTION_EVIDENCE_REJECTED`; it is never silently displayed.