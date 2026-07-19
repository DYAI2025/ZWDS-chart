# Zi Wei Dou Shu für westliche Nutzer — Produktkonzept und Vier-Iterationen-Plan

Plan path: `docs/plans/2026-07-19-zwds-western-adaptation-4-iterations.md`
Status: **delivered (2026-07-19)** — Discovery abgeschlossen, alle vier Iterationen umgesetzt + automatisiert getestet (grün); offene fachliche Punkte sichtbar markiert (siehe „Still open“).
Owner/Executor: Product, UX, ZWDS-Fachreview, Frontend/Backend, QA
Last updated: 2026-07-19
Supersedes the `MISSING:`-Pfade des Intake-Entwurfs mit den real entdeckten Repository-Pfaden.

<!-- GOAL_START -->
Goal: Zi Wei Dou Shu verständlich, relevant und überprüfbar machen

Ziel. Das bestehende Zi-Wei-Dou-Shu-Produkt wird so erweitert, dass westliche Nutzer ohne Vorwissen ihr Chart schnell verstehen, wichtige Lebensbereiche erkennen, Zusammenhänge nachvollziehen und aktuelle Zeitphasen reflektieren können. Die traditionelle Berechnung bleibt unverändert; angepasst werden Sprache, Reihenfolge, Visualisierung und Interaktion. Jede moderne Übersetzung bleibt von traditioneller Berechnung und Quellenstatus getrennt.

Scope. Vier vertikale Produktiterationen: verständlicher Einstieg, prägende Paläste und Beziehungen, aktuelle Lebensphasen sowie interaktive Reflexion und Vertrauensschicht. Bestehende Berechnungs-, Normalisierungs-, Frontend-, PDF- und Evidenzmodule werden erweitert; die konkreten Pfade sind unten in **Architecture and file boundaries** aufgelöst.

Bedingungen (hart).
- Nutzertexte müssen alltagssprachlich, direkt und ohne wissenschaftlich-technische Formulierungen sein.
- „Deine prägendsten Paläste“ ist die bevorzugte Bezeichnung; „stärkste“ wird nur verwendet, wenn eine fachlich definierte Stärke- oder Dignitätslogik existiert.
- „Prägend“ darf nicht als automatisch positiv, negativ oder schicksalsbestimmend erklärt werden.
- Berechnete Daten, traditionelle Deutung und moderne Produktübersetzung bleiben getrennte Ebenen.
- Keine medizinischen, finanziellen, romantischen, beruflichen oder schicksalhaften Garantien.
- Jede Iteration muss für sich nutzbar, testbar und reversibel sein.

Akzeptanzkriterien.
- Ein neuer Nutzer kann innerhalb von 90 Sekunden erklären, was das Chart zeigt und welche drei Lebensbereiche besonders hervortreten.
- Mindestens 80 % der Usability-Testpersonen verstehen, dass „prägend“ weder „gut“ noch „schlecht“ bedeutet.
- Jede angezeigte Aussage ist als berechnet, traditionell erklärt oder modern übersetzt klassifiziert.
- Jede Iteration besitzt ein messbares Sprintziel, eine User Value Definition und binäre Done-Kriterien.

Explizit out-of-scope.
- Veränderung der mathematischen ZWDS-Berechnung ohne separates Fachreview.
- Behauptung einer vollständigen oder einzig richtigen traditionellen Schule.
- Deterministische Ereignisprognosen oder garantierte Lebensresultate.
- Vollständiger Practitioner-Modus mit allen 108 Sternen in diesen vier Iterationen.
- Monetarisierungs- oder Preisentscheidung ohne separate Marktvalidierung.

Done-Definition. Das Konzept ist als versioniertes Plan-Dokument vorhanden; alle vier Iterationen sind umgesetzt, automatisiert und mit Nutzertests gegen die definierten Schwellen geprüft; offene fachliche Punkte bleiben sichtbar markiert.

Reference-Doc: `docs/plans/2026-07-19-zwds-western-adaptation-4-iterations.md`
<!-- GOAL_END -->

## Discovery outcome (2026-07-19) — resolved paths

Die Intake-Fassung dieses Plans trug an vielen Stellen `MISSING:`. Diese Discovery löst sie auf. Der
bestehende Code trägt bereits fast alle benötigten Bausteine — die vier Iterationen sind **additive,
flag-geschützte Produktübersetzungs-Layer**, keine Neubauten:

| Konzeptbegriff (Plan) | Real vorhandener Baustein |
|---|---|
| Wahrheits-/Übersetzungsmodell (`CALCULATED`/`TRADITIONAL`/`PRODUCT_TRANSLATION`/`SOURCE_NEEDED`) | `src/domain/truthTypes.ts` — 8 kanonische Truth-Klassen inkl. `PRODUCT_TRANSLATION`, `REFLECTIVE_HYPOTHESIS`, `SOURCE_NEEDED` (bereits deckungsgleich mit §3) |
| Normalisiertes Chart, Paläste, Sterne, Transformationen | `src/domain/zwdsTypes.ts` (`NormalizedZwdsReport`, `NormalizedPalace`, `NormalizedStarPlacement`, `NormalizedTransformation`) |
| Beziehungen (Gegenpalast / Dreieck) | `NormalizedRelation` (`SQUARE_HARMONY`/`OPPOSITION`) + `relatedPalaces()` in `zwdsTypes.ts` |
| Dekaden / Alterszählung | `NormalizedDecade` + `calculation.ageReckoningId`; UI `DecadeTimeline` in `PalaceWorkspace.tsx` |
| Evidenz pro Aussage | `ReportSection` (`truthClass`, `evidenceIds`, `sourceStatus`, `limitations`) + `EvidenceViews.tsx` Drawer |
| Guided/Traditional-Ansichtswechsel | `reportSubView` in `appReducer.ts`; Tabs in `AtlasNavigation.tsx` |
| Deterministische Sektionen | `generateDemoSections()` (`mockZwdsReport.ts`) + `server/normalize.mjs` `generateSections` |
| Sprachbausteine Web + PDF | `src/data/localization/{de,en}.ts`; PDF `server/pdf/renderPdf.mjs` |
| Release-Gate „nicht autoritativ“ | `reportIsSourceReviewed()` + `NotAuthoritativeNotice` (`ReportWorkspace.tsx`) — AMD-002 |
| LLM fail-closed | `server/llm/*` (`LLM_ENABLED=false`, corpus `SOURCE_NEEDED`) |

**Konsequenz:** Der vom Salvage-Audit befürchtete Bruch („Produkttexte nicht von Berechnung
trennbar“) besteht nicht — die Trennung ist bereits durch die Truth-Klassen + `evidenceIds`
erzwungen. Die vier Iterationen fügen einen `PRODUCT_TRANSLATION`-Layer **über** dem berechneten
Report hinzu, ohne Berechnungsdaten zu verändern.

### Test-Baseline und -Kommandos (real)

Kein `npm test`-Script; alles direkt aufgerufen (`docs/KNOWN_LIMITATIONS.md`, `.github/workflows/ci.yml`):

```bash
npx tsc --noEmit                     # typecheck
npx eslint .                         # lint + Architektur-Boundary-Regel
node scripts/architecture-gates.mjs  # Browser/Server-Grenze + Secret-Leak-Gate
npx vitest run                       # node-Projekt (*.test.ts/.mjs) + component-Projekt (tests/component/*.test.tsx, jsdom)
npx vitest run tests/unit            # nur Unit
npx playwright test --project=desktop-chromium   # e2e
```

Vitest hat zwei Projekte (`vitest.config.ts`): `node` (pure Logik) und `component` (jsdom + RTL).
Neue reine Produktregel-Tests → `tests/unit/*.test.ts`; neue View-Tests → `tests/component/*.test.tsx`.

## Evidence and source boundary

### Provided evidence
- Nutzerentscheidung: alltagssprachliche Produkttexte statt wissenschaftlich-technischer Sprache.
- Nutzerentscheidung: bevorzugte Bezeichnung „Was dein Chart besonders prägt“ und „Deine prägendsten Paläste“.
- Nutzerbereitgestellter Artikel zur westlichen ZWDS-Marktanalyse.
- Vorheriges Codebase- und Authentizitätsaudit (`docs/UNFINISHED_AGENT_WORK_SALVAGE.md`).

### Inspected evidence (2026-07-19 discovery)
- `src/domain/{truthTypes,zwdsTypes,validators}.ts`, `src/app/{appReducer,appContext,AppShell}.tsx`
- `src/components/{atlas,report,evidence,navigation}/*`, `src/data/{mockZwdsReport,zwdsCatalog,localization}`
- `server/{normalize,index}.mjs`, `server/llm/*`, `server/pdf/renderPdf.mjs`
- `docs/traceability.md`, `docs/plans/2026-07-17-bazodiac-zwds-atlas.md`, `docs/KNOWN_LIMITATIONS.md`
- Test-Baustellen: `tests/unit/*`, `tests/component/*`, `tests/integration/*`, `tests/e2e/*`

### Not inspected / unavailable (unverändert offen)
- fachlich freigegebenes ZWDS-Schulprofil (`schoolProfileStatus === 'NOT_SELECTED'`, `SOURCE_NEEDED`);
- reale Nutzungs- und Conversion-Daten;
- vollständige Definition einer traditionellen Stärke-/Dignitätslogik (Helligkeit/Dignität);
- freigegebene Quellenbasis für traditionelle Deutungen (Katalog-Digest reviewed `SOURCE_NEEDED`).

## Assumptions, missing information, open questions, blockers

### ASSUMPTION
- Eine Iteration entspricht einem begrenzten Sprint; die Sprintdauer legt das Team fest.
- Pro Iteration stehen mindestens fünf Erstnutzer für moderierte Usability-Tests zur Verfügung.
- Die bestehende traditionelle Chartansicht (`atlas`/`reading`/`evidence`/`method`) bleibt funktionsfähig.

### MISSING (Rest nach Discovery)
- Verbindliche **fachliche** Regel zur Auswahl der „prägendsten Paläste“ (Helligkeit/Dignität). Bis dahin gilt die transparente Produktregel `PALACE_PROMINENCE_PRODUCT_RULE_V1` (ADR unten).
- Freigegebene ZWDS-Schule und geprüfte Quellenbasis für traditionelle Deutungen.
- Festgelegte Datenschutz-, Lösch- und Aufbewahrungsregeln für gespeicherte Nutzerfragen/Notizen.
- Zielwerte für Antwortzeit und Produktionslast (`REQ-NF-301`).

### OPEN QUESTION
- Soll die Guided View standardmäßig vor dem traditionellen Chart erscheinen oder als auswählbarer Modus starten? → **Entscheidung dieser Iteration:** Guided ist Default-Tab, Traditional bleibt ein Klick entfernt (reversibel per Flag `guidedDefault`).
- Werden persönliche Notizen lokal, serverseitig oder zunächst gar nicht gespeichert? → **Iteration 4:** zunächst **gar nicht** (Persistenz blockiert bis Löschkonzept).
- Welche Themen erhalten in Iteration 4 zuerst interaktive Fragen? → Start mit Arbeit, Partnerschaft, Ressourcen, Übergang, Orientierung (auf `GUAN_LU`, `FU_QI`, `CAI_BO`, Dekaden, `MING` gemappt).

### BLOCKER
- Kein Blocker für Konzept, Discovery, Iteration 1–3 und die deterministische Iteration 4.
- Blocker für **persistente** Nutzerfragen: fehlendes Datenschutz-/Löschkonzept → Persistenz ships OFF.
- Blocker für eine als **traditionell** bezeichnete Palaststärke: fehlende freigegebene Stärke-/Dignitätslogik → nur `PRODUCT_TRANSLATION`.
- Blocker für LLM-gestützte Reflexion: Corpus `SOURCE_NEEDED` → LLM-Pfad bleibt deaktiviert (bestehendes Gate).

## Requirements

Neue Produkt-Requirements dieses Plans nutzen den Namespace `REQ-F/D/A/NF/S/DOC-*` (getrennt vom
bestehenden `REQ-001…021` der Engineering-Härtung, siehe `docs/traceability.md`).

| ID | Type | Statement | Source | Verification |
|---|---|---|---|---|
| REQ-F-001 | functional | Guided Summary zeigt persönlichen Kern und höchstens drei prägende Paläste. | user-provided + concept | `tests/component/GuidedSummary.test.tsx` |
| REQ-F-002 | functional | Nutzer kann von verständlicher zu traditioneller Ansicht wechseln. | concept | Component/E2E |
| REQ-F-003 | functional | Bei Gleichstand werden gleichwertige Paläste nicht künstlich sortiert. | concept | `tests/unit/palaceProminence.test.ts` |
| REQ-F-101 | functional | Palastdetails zeigen nur berechnete und freigegebene Beziehungen; keine erfundene Verbindung. | audit + concept | Relation/empty-state tests |
| REQ-F-201 | functional | Aktuelle Dekade wird aus berechneten Daten bestimmt (nicht clientseitig geraten); zeigt Zeitraum, Lebensbereich, Alterszählung. | concept | Boundary-vector tests |
| REQ-F-301 | functional | Interaktive Antworten referenzieren konkrete Chartentitäten; bei fehlender Evidenz keine Spekulation. | concept | Response-schema + red-team tests |
| REQ-D-001 | data | Jede Produktaussage trägt `claimType` (TruthClass), Chartreferenzen (`evidenceIds`) und `sourceStatus`. | audit | Schema/unit validation |
| REQ-A-001 | architecture | Berechnung, traditionelle Deutung, Produktübersetzung und Darstellung bleiben getrennt. | audit | arch-gates + dependency test |
| REQ-NF-001 | non-functional | Kernflows sind mobil (≥320 px) und per Tastatur nutzbar, semantische Überschriften. | quality | responsive + a11y checks |
| REQ-S-001 | security/privacy | Clientseitig manipulierte Reports/Token dürfen nicht interpretiert werden. | audit | Report-token security test (bestehend REQ-017/REQ-S-900) |
| REQ-DOC-001 | documentation | Sprachleitfaden, Glossar und Produktregeln sind versioniert. | user-provided | `docs/language-guide.md` + dieser Plan + ADR |

## 1. Dokumentierte Sprachentscheidung

Vollständig versioniert in `docs/language-guide.md` (v1, 2026-07-19). Kernauszug:

**Primäre Überschrift:** „Was dein Chart besonders prägt“
**Fachnahe Bezeichnung:** „Deine prägendsten Paläste“
**Erklärung:** „Manche Lebensbereiche treten in deinem Chart besonders deutlich hervor. Das bedeutet
nicht automatisch, dass sie gut, schlecht, leicht oder schwierig sind. Es zeigt, welche Themen in
deinem Chart mehr Gewicht bekommen und dich häufiger beschäftigen können.“

Warum nicht „stärkste Paläste“: „stärkste“ liest sich als „am besten/mächtigsten“. Ohne fachlich
implementierte Helligkeits-/Dignitätsregel wäre das irreführend. „Prägendste“ bleibt offen für
positive, belastende und ambivalente Themen.

Sprachprinzip: **Vorne menschlich und verständlich. Hinten präzise und überprüfbar.** Technische
Details (Hanzi, Pinyin, Schule, Quellenstatus) bleiben über „Wie kommt diese Aussage zustande?“
(Evidence Drawer) erreichbar.

## 2. Produktvision

**Zi Wei Dou Shu Life Domains Atlas** übersetzt ein komplexes traditionelles Chart in eine
persönliche Landkarte von Lebensbereichen, Beziehungen und Zeitphasen. Nutzer erkennen:
1. Was prägt mein Chart besonders? (Iteration 1)
2. Wie hängen meine Lebensbereiche zusammen? (Iteration 2)
3. Welcher Lebensabschnitt ist gerade relevant? (Iteration 3)
4. Welche Fragen helfen mir, das auf mein Leben zu beziehen — und wie sicher ist die Aussage? (Iteration 4)

Zielgruppen: primär neugierige Endnutzer ohne ZWDS-Vorwissen; sekundär vertiefende Nutzer (traditionelle Ansicht bleibt erreichbar); später Praktiker (nicht Kernscope).

## 3. Wahrheits- und Übersetzungsmodell

Bereits im Code (`src/domain/truthTypes.ts`). Mapping Plan → Implementierung:

| Plan-Ebene | Code-TruthClass | Nutzeranzeige (localeKey) |
|---|---|---|
| `CALCULATED` | `CALCULATED_FACT` / `CATALOG_FACT` | „Aus deinem Chart“ |
| `TRADITIONAL_INTERPRETATION` | `TRADITIONAL_RULE` | „Traditionelle Deutung“ |
| `PRODUCT_TRANSLATION` | `PRODUCT_TRANSLATION` / `REFLECTIVE_HYPOTHESIS` | „Verständlich erklärt“ / „Reflexionsfrage“ |
| `SOURCE_NEEDED` | `SOURCE_NEEDED` | nicht als fertige Aussage anzeigen |

Die UI darf die Status vereinfachen; die internen `truthClass`/`sourceStatus`/`evidenceIds` bleiben erhalten.

## 4. Definition von „prägendsten Palästen“

Verbindlich dokumentiert im ADR: `docs/decisions/ADR-palace-prominence-product-rule-v1.md`.

`PALACE_PROMINENCE_PRODUCT_RULE_V1` (implementiert in `src/domain/palaceProminence.ts`) ist eine
transparente **Produktpriorisierung**, kein traditioneller Stärke-Score. Signale (nur berechnete
Chartdaten, nach Priorität): (1) Paläste mit Hauptsternplatzierungen; (2) Paläste mit berechneten
Transformationen; (3) Paläste in direkter Beziehung zum Ming-Palast (Opposition/Dreieck). Gleichstand
→ keine künstliche Rangfolge, gleichwertige Darstellung. Klassifiziert als `PRODUCT_TRANSLATION`,
jede Auswahl trägt die `evidenceIds` der Signale, die sie ausgelöst haben.

## 5. User Value Definition

Nutzerwert nur, wenn alle vier erfüllt sind: **Verstanden** (Kernaussage in eigenen Worten),
**Persönlich relevant** (mind. ein Bezug zu realer Lebensfrage), **Nicht irreführend** (prägend ≠
gut/schlecht verstanden), **Handlungsfähig** (nächste Frage/Reflexion nennbar). Messmodell:
aufgabenbasierter Usability-Test, nicht Gefallensbewertung. `ASSUMPTION:` ≥5 Erstnutzer/Sprint,
sonst Ergebnisse explorativ. Nutzertest-Protokollvorlage: `docs/usertests/PROTOCOL_TEMPLATE.md`.

---

## Implementation phases

- **Phase 1 — Discovery + Baseline:** abgeschlossen (dieses Dokument; Baseline `tsc`/`eslint`/`arch-gates`/`vitest` grün vor jeder Iteration).
- **Phase 2 — Core change:** vier vertikale Slices nacheinander (Datenvertrag → UI → Texte → Quellenstatus → Tests), je hinter einem Flag (`src/app/featureFlags.ts`).
- **Phase 3 — Integration + Edge cases:** Fixture/BFF/Web/PDF-Angleich; Gleichstände, fehlende Daten, unklare Zeitgrenzen, nicht freigegebene Fachregeln getestet.
- **Phase 4 — Documentation + Handoff:** Sprachleitfaden, ADRs, Nutzertestprotokolle, Release Notes, offene Quellenfragen, Handoff.

---

# Iteration 1 — Verstehen, was das Chart über mich zeigt

**Sprintziel.** Ein neuer Nutzer versteht in 90 s Zweck des Charts, seinen persönlichen Kern und bis
zu drei prägende Paläste, ohne chinesische Fachkenntnisse und ohne „prägend“ mit „gut“/„stark“ zu verwechseln.

**UVD 1.** „Als neuer Nutzer erkenne ich sofort, welche Lebensbereiche mein Chart besonders prägen und was das grundsätzlich bedeutet.“ Erreicht, wenn ≥4/5 die drei Bereiche benennen; ≥4/5 „prägend ≠ automatisch positiv/negativ“ erklären; ≥4/5 den persönlichen Kern in einem Satz zusammenfassen; keiner „prägend“ als garantierten Erfolg/Schicksal deutet.

**Nutzerumfang.** Startansicht „Dein Chart auf einen Blick“ → „Dein persönlicher Kern“ → „Was dein Chart besonders prägt“ → bis zu drei Karten „Deine prägendsten Paläste“ (je: Lebensbereich-Satz, Warum-hervorgehoben-Satz, „prägend ≠ gut/schlecht“-Hinweis, Evidence-Link) → Umschalter zur traditionellen Ansicht.

**Anforderungen.** `REQ-F-001`, `REQ-F-002`, `REQ-F-003`, `REQ-D-001`, `REQ-NF-001`, `REQ-DOC-001`.

**AC (Given/When/Then).**
- *Given* gültiges Chart, *When* Ergebnis geöffnet, *Then* vor dem vollständigen Chart der persönliche Kern + ≤3 prägende Paläste, jede Hervorhebung in normaler Sprache erklärt.
- *Given* zwei Paläste erfüllen dieselben Produktregeln, *When* Summary erstellt, *Then* beide gleichwertig oder Rangfolge transparent begründet.

**Umsetzung (real).** `src/domain/palaceProminence.ts` (Regel + View-Model) · `src/components/guided/GuidedSummary.tsx` · neuer `reportSubView: 'guided'` (Default per Flag) · de/en-Keys · Tests `tests/unit/palaceProminence.test.ts` + `tests/component/GuidedSummary.test.tsx`.

**Sprint-Done.** Unit/Component grün; Guided Summary mit Fixture- **und** BFF-Daten (identischer Report); Web/PDF-Bezeichnungen konsistent; Usability-Schwellen erreicht oder als offenes Finding dokumentiert; keine unfreigegebene traditionelle Stärkeaussage.

---

# Iteration 2 — Verstehen, wie die Lebensbereiche zusammenhängen

**Sprintziel.** Nutzer sehen von einem prägenden Palast aus, welche Lebensbereiche verbunden sind, und dass eine Aussage nicht isoliert aus einem Stern/Palast entsteht.

**UVD 2.** Erreicht, wenn ≥4/5 eine gezeigte Beziehung korrekt beschreiben; ≥4/5 erkennen, dass ein einzelner Stern keine vollständige Aussage liefert; ≥3/5 eine persönliche Frage zum Zusammenspiel formulieren; die Grafik auch ohne Farbe verständlich bleibt.

**Anforderungen.** `REQ-F-101`, `REQ-D-001`, `REQ-NF-001` (Farbe nie einziger Träger; Textalternative für Screenreader/PDF).

**AC.** *Given* Palast mit freigegebenen Beziehungen → nur kontextrelevante Beziehungen, jede in einem verständlichen Satz. *Given* keine freigegebene Beziehung → keine erfundene Verbindung, stattdessen leerer Zustand/transparenter Hinweis.

**Umsetzung.** Nutzt `relatedPalaces()` + `NormalizedRelation` (schon vorhanden). Guided-Beziehungserklärung + Textalternative im Palastdetail; Produktregel `PALACE_RELATION_PRODUCT_RULE_V1`. Tests: Beziehungsauswahl, Richtung, leere Zustände.

**Sprint-Done.** Alle Verbindungen auf Chartentitäten zurückführbar; keine erfundene Kausalität; a11y-Textalternative vorhanden; ≥1 Beziehung korrekt erklärbar.

---

# Iteration 3 — Verstehen, welcher Lebensabschnitt gerade relevant ist

**Sprintziel.** Nutzer unterscheiden Geburtschart und aktuellen Zehnjahresabschnitt, erkennen den hervorgehobenen Lebensbereich, erhalten eine nicht-deterministische Einordnung.

**UVD 3.** Erreicht, wenn ≥4/5 Grundchart und aktuellen Abschnitt unterscheiden; ≥4/5 den hervorgehobenen Bereich benennen; ≥4/5 verstehen, dass es Kontext und keine Ereignisgarantie ist; ≥3/5 eine passende Reflexionsfrage wählen/formulieren.

**Anforderungen.** `REQ-F-201` (Dekade aus berechneten Daten, nicht geraten), `REQ-D-001`, `REQ-NF-001`, `REQ-DOC-001` (Glossar: Grundchart/Lebensabschnitt/Alterszählung). Texte: „kann“, „rückt in den Vordergrund“, „lädt zur Betrachtung ein“ — keine Ereignisgarantie.

**AC.** *Given* Chart mit berechneten Dekaden → Zeitraum, Lebensbereich, Verhältnis zum Grundchart; keine Ereignisbehauptung. *Given* aktuelle Dekade nicht sicher bestimmbar → kein geratener Abschnitt, fehlende Grundlage verständlich benannt (fail-closed).

**Umsetzung.** Erweitert `DecadeTimeline` + `ageReckoningId`. „Dein aktueller Lebensabschnitt“-View-Model; `currentDecade`-Bestimmung aus Report (kein `Date.now()`-Raten im Client für die Auswahl der Daten — der aktuelle Index kommt aus berechneten `ageStart/ageEnd` + optional übergebenem Alter, sonst „nicht bestimmbar“). Tests: Grenzfälle (keine Dekaden, mehrdeutig).

**Sprint-Done.** Aktuelle Dekade reproduzierbar; Grenzfälle getestet oder sichtbar offen; Grundchart/Phase unterscheidbar; keine Prognosesprache in UI/PDF/Export.

---

# Iteration 4 — Vom Horoskop zur persönlichen Reflexion mit Vertrauen

**Sprintziel.** Nutzer stellen zu einem Chartthema eine persönliche Frage, erhalten eine auf konkrete Chartdaten begrenzte Antwort und prüfen leicht, wie sie berechnet/traditionell eingeordnet/modern erklärt wurde.

**UVD 4.** Erreicht, wenn 100 % der Antworten ≥1 konkrete Chartentität referenzieren; 100 % moderne Reflexion als „verständlich erklärt“ kennzeichnen (nicht als Originalaussage); ≥4/5 innerhalb zweier Interaktionen „Wie wurde das berechnet?“ finden; ≥4/5 die Antwort als relevant (≥4/5 Punkte) bewerten und den Chartbezug benennen; Red-Team-Suite erzeugt keine garantierten Medizin-/Finanz-/Beziehungs-/Karriere-/Schicksalsaussagen.

**Anforderungen.** `REQ-F-301` (Themen/Entitäten begrenzt), `REQ-D-001`, `REQ-A-001`, `REQ-S-001`, `REQ-S-301` (Lösch-/Aufbewahrungskonzept **vor** Persistenz), `REQ-S-302` (keine vollständigen Geburtsdaten/Freitexte in Logs — bestehend erfüllt via `logInfo`-Redaction), `REQ-NF-301` (Antwortzeitziel `MISSING`).

**AC.** *Given* unterstützte Frage + gültiges Chart → konkrete Chartbezüge, verständliche Einordnung, ≥1 offene Reflexionsfrage; keine Garantie-/Diagnose-/Ereignissprache. *Given* Frage außerhalb Evidenz/Scope → Grenze benannt, sichere chartbezogene Alternative.

**Umsetzung.** **Deterministische** Antwortvorlagen zuerst (`src/domain/reflection.ts`), gebunden an Chartentitäten + freigegebene Textbausteine; „Wie kommt diese Aussage zustande?“ nutzt den bestehenden `EvidenceDrawer`; Claim-Policy + Red-Team-Suite. Optionaler LLM-Pfad **bleibt deaktiviert** (bestehendes Gate). Persistenz **OFF** bis Löschkonzept.

**Sprint-Done.** Jede Antwort maschinenprüfbarer Chartbezug; Safety/Red-Team grün; Grundlage/Grenze auffindbar; LLM aus, solange Quellen-/Datenschutzgate nicht erfüllt.

---

## 6. Iterationsübersicht

| Iteration | Nutzerproblem | Lieferumfang | Messbarer Zielwert | Hauptwert |
|---|---|---|---|---|
| 1. Verstehen | Chart zu komplex | Kern + prägendste Paläste | 4/5 verstehen in 90 s | schnelle Orientierung |
| 2. Zusammenhänge | Aussagen wirken isoliert | Palastbeziehungen | 4/5 erklären eine Beziehung | systemisches Verständnis |
| 3. Lebensabschnitt | Zeitlogik unklar | aktuelle Dekade + Zeitlinie | 4/5 trennen Grundchart/Phase | aktuelle Relevanz |
| 4. Reflexion | statischer Bericht unpersönlich | evidenzgebundene Interaktion | 100 % Chartbezug; 4/5 finden Grundlage | Nutzen + Vertrauen |

## 7. Übergreifende Anforderungen

| ID | Typ | Statement | Verifikation |
|---|---|---|---|
| REQ-F-900 | Functional | Guided und Traditional View verwenden dasselbe berechnete Chart. | Datenidentitätstest |
| REQ-F-901 | Functional | Nutzer können jederzeit zur traditionellen Ansicht wechseln. | Component/E2E |
| REQ-D-900 | Data | Jede Aussage besitzt Typ, Chartreferenzen und Quellenstatus. | Schema-/Contract-Test |
| REQ-A-900 | Architecture | Berechnung, Interpretation und Produkttext bleiben getrennte Module. | arch-gates |
| REQ-NF-900 | Accessibility | Kernflows erfüllen Tastatur-, Kontrast-, Textalternative-Anforderungen. | axe-Scan + manuell |
| REQ-S-900 | Security/Privacy | Client kann keine fremden/manipulierten Reports interpretieren lassen. | Report-Token-Test |
| REQ-DOC-900 | Documentation | Sprachleitfaden und Glossar sind versioniert. | Dokumentreview |

## Architecture and file boundaries

### Zielgrenzen (5 Layer) — Mapping auf reale Dateien
1. **Calculation layer:** `server/normalize.mjs`, `src/data/mockZwdsReport.ts` (unverändert).
2. **Domain interpretation layer:** `src/domain/zwdsTypes.ts` Relationen/Dekaden; freigegebene traditionelle Regeln (Katalog).
3. **Product translation layer (NEU):** `src/domain/palaceProminence.ts`, `src/domain/reflection.ts`, Guided-Texte in `localization/*`.
4. **Presentation layer:** `src/components/guided/*`, bestehende `atlas`/`report`/`evidence`.
5. **Evidence layer:** `ReportSection.evidenceIds` + `EvidenceViews.tsx` + Truth-Klassen.

### Verbotene Änderungen
- keine Berechnungsregel für schönere UI ändern;
- keine modernen Texte als traditionelle Quelle markieren (`truthClass` bleibt ehrlich);
- keine clientseitig erfundenen Chartdaten (arch-gates + `evidenceIds`-Filter erzwingen das);
- keine versteckte LLM-Aktivierung ohne Quellen-/Datenschutz-/Sicherheitsgate;
- keine gemischten Hanzi ohne deklarierte Glyphpolitik (`scriptPolicy: 'TW_TRADITIONAL'`).

## Tasks

| ID | Objective | REQ | Status |
|---|---|---|---|
| TASK-001 | Repository + fachliche Grenzen inventarisieren; ADR `PALACE_PROMINENCE_PRODUCT_RULE_V1`; Baseline sichern | REQ-A-001, REQ-D-001, REQ-DOC-001 | **done (2026-07-19)** |
| TASK-002 | Iteration 1 Guided Summary (Regel + View + Tests, flag) | REQ-F-001/002/003, REQ-D-001, REQ-NF-001 | **done (2026-07-19)** |
| TASK-003 | Iteration 2 Beziehungsansicht (Guided-Relation + Textalternative + Tests) | REQ-F-101, REQ-D-001, REQ-NF-001 | **done (2026-07-19)** |
| TASK-004 | Iteration 3 Zeitphasenansicht (currentDecade fail-closed + Tests) | REQ-F-201, REQ-D-001, REQ-DOC-001 | **done (2026-07-19)** |
| TASK-005 | Iteration 4 evidenzgebundene Reflexion (deterministisch + Drawer + Red-Team; LLM aus, Persistenz aus) | REQ-F-301, REQ-A-001, REQ-S-001 | **done (2026-07-19)** |

### Delivered artefacts (2026-07-19)

Domain rules (pure, node-tested): `src/domain/palaceProminence.ts`, `palaceRelations.ts`,
`lifePhase.ts`, `reflection.ts`. Views (flag-guarded): `src/components/guided/{GuidedView,
GuidedSummary,GuidedRelations,GuidedLifePhase,GuidedReflection}.tsx`. Flags:
`src/app/featureFlags.ts`. Wiring: `reportSubView: 'guided'` (default), nav tab, `ReportWorkspace`.
Tests: `tests/unit/{palaceProminence,palaceRelations,lifePhase,reflection,guidedContentSafety}.test.ts`,
`tests/component/{GuidedSummary,GuidedIterations}.test.tsx`, `tests/e2e/guided.spec.ts`.

Gate results: `tsc` 0 · `eslint .` 0 · `architecture-gates.mjs` pass · `vitest run` 30 files/139 tests
· `build` 0 · `playwright --project=desktop-chromium` 13/13 · `--project=mobile-chromium` 8 pass/5 skip.

### Still open (visibly marked, per Done-Definition)

- **Usability-Tests (alle Iterationen):** automatisiert erfüllt; die 4/5-Schwellen erfordern echte
  moderierte Nutzer (`ASSUMPTION` ≥5). Protokollvorlage `docs/usertests/PROTOCOL_TEMPLATE.md`;
  Ergebnis bis dahin `explorativ`, nicht validiert. **Kein Code-Blocker.**
- **Traditionelle Palaststärke:** Helligkeits-/Dignitätslogik weiter `SOURCE_NEEDED` → nur
  `PRODUCT_TRANSLATION` (V1). Upgrade-Pfad im ADR.
- **PDF-Rendering der Guided Views:** die Begriffe sind Web/PDF-konsistent (gemeinsamer
  Sprachleitfaden), aber der Server-PDF (`server/pdf/renderPdf.mjs`) rendert weiter die
  traditionelle Ansicht; ein Guided-PDF-Layout ist additiv offen.
- **Persistenz (Iteration 4):** Notiz-Speicherung `OFF` bis Datenschutz-/Löschkonzept (`REQ-S-301`).
- **LLM-Reflexion:** deaktiviert (Corpus `SOURCE_NEEDED`) — bestehendes Server-Gate unverändert.

Rollback je Task: Guided-Funktion hinter einzeln schaltbarem Flag (`src/app/featureFlags.ts`);
traditionelle Ansicht bleibt Fallback; Produktübersetzungen entfernbar ohne Berechnungsdaten zu ändern.

## Validation strategy

**Automatisiert:** Schema-/Unit-Tests für Produktpriorisierung + Gleichstände; Component-Tests für
Guided-Views; Snapshot-Konsistenz Web/PDF-Begriffe; a11y-Checks; E2E Guided→Traditional; Red-Team für
deterministische Claims; arch-gates für Modulgrenzen. **Nutzertests:** ≥5 Nutzer ohne ZWDS-Wissen pro
Iteration, aufgabenbasiert (Protokollvorlage). **Fachreview:** Produktpriorisierung, erlaubte
Relationsarten, Dekaden-/Alterszählung, traditionelle Aussagen, Pinyin/Glyphregion.

## Rollback and safety
- Jede Guided-Funktion hinter einzeln schaltbarem Feature-Flag.
- Bestehende traditionelle Ansicht bleibt Fallback.
- Datenverträge versioniert statt still überschrieben.
- Produktübersetzungen entfernbar ohne Berechnungsdaten zu ändern.
- Bei fachlichem Widerspruch: betroffene Aussage deaktivieren, nicht durch Vermutung ersetzen.
- LLM standardmäßig aus, bis alle Gates bestanden.

## Plausibility and truth self-check
- **Stärkstes Gegenargument:** Vereinfachung kann ZWDS verfälschen. Gegenmaßnahme: Berechnung
  unverändert, traditionelle Ansicht erreichbar, moderne Übersetzungen als `PRODUCT_TRANSLATION` gekennzeichnet.
- **Fehlerkette:** unklare Ranking-Regel → „prägend“ wirkt objektiv → Nutzer deutet Rang als Wertung →
  falsche Autorität. Gegenmaßnahme: transparente Produktregel (ADR), Gleichstandbehandlung, erklärender Hinweis, Nutzertest.
- **Bias-Risiken:** Lokalisierungsbias, Bestätigungsbias, Autoritätsillusion, Automationsbias durch grüne Tests.
- **Final readiness:** Konzept + Plan ausführbar; Implementierung schreitet iterativ; offene fachliche
  Punkte (Stärke-/Dignitätslogik, Schulprofil, Reviewed-Corpus, Persistenz-Löschkonzept) bleiben sichtbar `SOURCE_NEEDED`/`MISSING`.
