import fs from 'node:fs';
import path from 'node:path';

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const sourceFiles = walk('src').filter((file) => /\.(ts|tsx)$/.test(file));
const failures = [];
const forbiddenAliases = /\b(?:ZI_NV|PU_YI|HUA_QUAN|WU_STEM)\b/;
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (/from\s+['"].*server\//.test(content)) failures.push(`${file}: browser imports server code`);
  if (/FUFIRE_(?:API_KEY|BASE_URL|AUTH)/.test(content)) failures.push(`${file}: browser contains FuFirE secret/upstream token`);
  if (/\/v1\/calculate\/zwds|metadata\/zwds\/rulesets/.test(content)) failures.push(`${file}: browser contains FuFirE endpoint`);
  if (forbiddenAliases.test(content)) failures.push(`${file}: non-canonical alias ID`);
}
const serverFiles = walk('server').filter((file) => file.endsWith('.mjs'));
for (const file of serverFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (/console\.log\(.*(?:birth|location|placeQuery)/i.test(content)) failures.push(`${file}: possible PII log`);
}
const fixture = fs.readFileSync('tests/fixtures/fufire/zwds-core-seed-shanghai-1984.json', 'utf8');
if (forbiddenAliases.test(fixture)) failures.push('golden fixture contains non-canonical alias ID');
if (failures.length) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Architecture gates passed for ${sourceFiles.length} browser and ${serverFiles.length} server files.\n`);
}