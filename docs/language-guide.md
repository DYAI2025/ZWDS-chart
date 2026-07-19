# Sprachleitfaden & Glossar — BaZodiac Guided Views

Version: **v1** · 2026-07-19 · Owner: Product/UX
Scope: alle nutzersichtbaren Texte der Guided Views (Iterationen 1–4). Verbindlich für
`src/data/localization/{de,en}.ts` (Keys mit Präfix `guided.*`) und PDF.
Requirement: `REQ-DOC-001`, `REQ-DOC-900`.

## Sprachprinzip

> **Vorne menschlich und verständlich. Hinten präzise und überprüfbar.**

Die Oberfläche erklärt zuerst, was ein Ergebnis im Leben bedeuten *kann*. Technische Details
(Berechnung, Hanzi, Pinyin, Schule, Quellenstatus, Unsicherheit) bleiben über „Wie kommt diese
Aussage zustande?“ (Evidence Drawer) erreichbar — nie aufgedrängt, nie versteckt.

## Terminologie (intern → Nutzerbegriff)

| Intern / technisch | Nutzerbegriff (DE) | User term (EN) |
|---|---|---|
| Palace prominence / structural density | Was dein Chart besonders prägt | What stands out most in your chart |
| Most prominent palaces | Deine prägendsten Paläste | The life areas that shape your chart |
| Central axis (Ming/Shen) | Dein persönlicher Kern | Your personal core |
| Active decade context | Dein aktueller Lebensabschnitt | Your current life chapter |
| Transformation graph | Wie deine Lebensbereiche zusammenwirken | How your life areas interact |
| Palace atlas | Deine zwölf Lebensbereiche | Your twelve life areas |
| Evidence status | Wie sicher ist diese Aussage? | How certain is this? |
| Provenance | Wie wurde das berechnet? | How was this calculated? |
| School profile | Welche Methode liegt zugrunde? | Which method underlies this? |
| Temporal overlay | Was gerade zusätzlich auf dein Chart wirkt | What is additionally in effect right now |
| Product translation | Verständliche Erklärung | Plain-language explanation |
| Traditional view | Traditionelle Ansicht | Traditional view |

## Erlaubte Formulierungen

- „tritt besonders hervor“, „bekommt mehr Gewicht“, „kann dich häufiger beschäftigen“
- „rückt in den Vordergrund“, „lädt zur Betrachtung ein“, „kann bedeuten“
- „in deinem Chart“, „im aktuellen Abschnitt“, „ein Kontext, keine Vorhersage“
- „prägend bedeutet nicht automatisch gut oder schlecht“

## Verbotene Formulierungen (Content-Safety, vgl. REQ-020)

- Wertungen als Fakt: „stärkste“, „beste“, „schwächste“, „mächtigste“ (außer echte Dignitätslogik existiert)
- Garantien/Prognosen: „wird passieren“, „garantiert“, „dein Schicksal ist“, „du wirst“
- Domänen-Claims: medizinische, finanzielle, romantische, berufliche Diagnosen/Versprechen
- Mystische Autorität: „das Universum bestimmt“, „kosmische Wahrheit“, „vorbestimmt“
- „prägend“ als „gut“/„Erfolg“/„Schicksal“ ausgelegt

## „Prägend“ — verbindliche Erklärung

DE: „Manche Lebensbereiche treten in deinem Chart besonders deutlich hervor. Das bedeutet nicht
automatisch, dass sie gut, schlecht, leicht oder schwierig sind. Es zeigt, welche Themen in deinem
Chart mehr Gewicht bekommen und dich häufiger beschäftigen können.“

EN: „Some life areas stand out more clearly in your chart. That does not automatically mean they are
good, bad, easy or hard. It shows which themes carry more weight in your chart and may occupy you
more often.“

## Glossar (Iteration 3 — Alltagssprache)

- **Grundchart / Geburtschart** — die Landkarte, die aus deinem Geburtszeitpunkt berechnet wird und sich nicht ändert.
- **Lebensabschnitt / Dekade** — ein Zehn-Jahres-Fenster, in dem ein Lebensbereich mehr Aufmerksamkeit bekommt. Kein Ereignis, ein Schwerpunkt.
- **Alterszählung** — die Methode, mit der Alter den Abschnitten zugeordnet wird (im Chart als `ageReckoningId` hinterlegt). Wird sichtbar gemacht, nicht versteckt.

## Wahrheitsklassen für Nutzer (vgl. `src/domain/truthTypes.ts`)

| Klasse | Nutzeranzeige |
|---|---|
| `CALCULATED_FACT` / `CATALOG_FACT` | „Aus deinem Chart“ |
| `TRADITIONAL_RULE` | „Traditionelle Deutung“ |
| `PRODUCT_TRANSLATION` | „Verständlich erklärt“ |
| `REFLECTIVE_HYPOTHESIS` | „Reflexionsfrage“ |
| `SOURCE_NEEDED` | nicht als fertige Aussage anzeigen |

## Änderungsregeln

- Jede neue nutzersichtbare Formel kommt in DE **und** EN und referenziert eine Wahrheitsklasse.
- Verbotene Begriffe werden per Content-Safety-Test über `de.ts`/`en.ts` erzwungen (vgl. REQ-020).
- Änderungen an diesem Leitfaden erhöhen die Version und werden im Plan-Changelog vermerkt.
