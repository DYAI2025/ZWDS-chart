import fs from 'node:fs';
import path from 'node:path';

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const sourceFiles = walk('src').filter((file) => /\.(ts|tsx)$/.test(file));
const failures = [];
// Browser bundle guard: genuinely-invalid aliases that must never leak into src/. HUA_QU is
// intentionally NOT banned here — the FE (src/) still legitimately uses HUA_QU pending its own later
// migration to the real canonical HUA_QUAN; this server-contract increment leaves the FE untouched.
// HUA_QUAN (the real canonical id) is likewise allowed in src/.
const forbiddenBrowserAliases = /\b(?:ZI_NV|PU_YI|WU_STEM)\b/;
// Golden fixture guard: the fixture was re-founded on the REAL FuFirE contract (HUA_QUAN canonical),
// so guard it against regression to the now-fabricated HUA_QU alias. The \b boundary keeps
// \bHUA_QU\b from matching inside HUA_QUAN.
const forbiddenFixtureAliases = /\b(?:ZI_NV|PU_YI|HUA_QU|WU_STEM)\b/;
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (/from\s+['"].*server\//.test(content)) failures.push(`${file}: browser imports server code`);
  if (/FUFIRE_(?:API_KEY|BASE_URL|AUTH)/.test(content)) failures.push(`${file}: browser contains FuFirE secret/upstream token`);
  if (/\/v1\/calculate\/zwds|metadata\/zwds\/rulesets/.test(content)) failures.push(`${file}: browser contains FuFirE endpoint`);
  if (forbiddenBrowserAliases.test(content)) failures.push(`${file}: non-canonical alias ID`);
}
const serverFiles = walk('server').filter((file) => file.endsWith('.mjs'));
for (const file of serverFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (/console\.log\(.*(?:birth|location|placeQuery)/i.test(content)) failures.push(`${file}: possible PII log`);
}
const fixture = fs.readFileSync('tests/fixtures/fufire/zwds-core-seed-shanghai-1984.json', 'utf8');
if (forbiddenFixtureAliases.test(fixture)) failures.push('golden fixture contains non-canonical alias ID');
if (failures.length) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Architecture gates passed for ${sourceFiles.length} browser and ${serverFiles.length} server files.\n`);
}