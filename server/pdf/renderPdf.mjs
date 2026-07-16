import puppeteer from 'puppeteer-core';

const PALACE_LABELS = {
  MING: ['命宮','Lebenspalast','Life Palace'], XIONG_DI: ['兄弟宮','Geschwisterpalast','Siblings Palace'],
  FU_QI: ['夫妻宮','Partnerpalast','Spouse Palace'], ZI_NU: ['子女宮','Kinderpalast','Children Palace'],
  CAI_BO: ['財帛宮','Vermögenspalast','Wealth Palace'], JI_E: ['疾厄宮','Körperpalast','Health Palace'],
  QIAN_YI: ['遷移宮','Bewegungspalast','Travel Palace'], JIAO_YOU: ['交友宮','Freundespalast','Friends Palace'],
  GUAN_LU: ['官祿宮','Wirkungspalast','Career Palace'], TIAN_ZHAI: ['田宅宮','Besitzpalast','Property Palace'],
  FU_DE: ['福德宮','Innere-Haltung-Palast','Fortune Palace'], FU_MU: ['父母宮','Elternpalast','Parents Palace'],
};
const STAR_HANZI = { ZI_WEI:'紫微',TIAN_JI:'天機',TAI_YANG:'太陽',WU_QU:'武曲',TIAN_TONG:'天同',LIAN_ZHEN:'廉貞',TIAN_FU:'天府',TAI_YIN:'太陰',TAN_LANG:'貪狼',JU_MEN:'巨門',TIAN_XIANG:'天相',TIAN_LIANG:'天梁',QI_SHA:'七殺',PO_JUN:'破軍',YOU_BI:'右弼',WEN_CHANG:'文昌' };
const TRANSFORM_HANZI = { HUA_LU:'化祿',HUA_QU:'化權',HUA_KE:'化科',HUA_JI:'化忌' };
const GRID = { SI:[1,1],WU:[2,1],WEI:[3,1],SHEN:[4,1],CHEN:[1,2],YOU:[4,2],MAO:[1,3],XU:[4,3],YIN:[1,4],CHOU:[2,4],ZI:[3,4],HAI:[4,4] };

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));

export function renderReportHtml(report, locale = 'en-US') {
  const isDe = locale === 'de-DE';
  const placements = new Map(report.stars.map((placement) => [placement.placementId, placement]));
  const cells = report.palaces.map((palace) => {
    const label = PALACE_LABELS[palace.palaceId] ?? ['',palace.palaceId,palace.palaceId];
    const [col,row] = GRID[palace.branchId];
    const stars = palace.placementIds.map((id) => placements.get(id)).filter(Boolean);
    return `<section class="palace" style="grid-column:${col};grid-row:${row}">
      <b>${escapeHtml(isDe ? label[1] : label[2])}</b><span class="hanzi">${label[0]}</span>
      <small>${escapeHtml(palace.stemId)} · ${escapeHtml(palace.branchId)}${palace.isMing ? ' · MING' : ''}${palace.isShen ? ' · SHEN' : ''}</small>
      <div>${stars.length ? stars.map((p) => `<span class="star"><span class="hanzi">${STAR_HANZI[p.starId] ?? '?'}</span> ${escapeHtml(p.starId)} ${p.transformationTypes.map((t) => `<i class="hanzi">${TRANSFORM_HANZI[t] ?? '?'}</i>`).join('')}</span>`).join('') : `<em>${isDe ? 'Keine Kernsterne' : 'No core stars'}</em>`}</div>
    </section>`;
  }).join('');
  const warningRows = report.quality.warnings.map((warning) => `<li><code>${escapeHtml(warning.code)}</code> ${escapeHtml(warning.message)}</li>`).join('');
  return `<!doctype html><html lang="${isDe ? 'de' : 'en'}"><head><meta charset="utf-8"><style>
    @page{size:A4;margin:14mm 14mm 20mm}*{box-sizing:border-box}body{font:11px Manrope,Arial,sans-serif;color:#202322;background:#fff}h1,h2{font-family:Georgia,serif;margin:0 0 8mm}h1{font-size:28px}h2{font-size:18px;margin-top:8mm}.meta{display:grid;grid-template-columns:1fr 1fr;gap:3mm;border-block:1px solid #aaa;padding:4mm 0;margin-bottom:6mm}.chart{display:grid;grid-template:repeat(4,42mm)/repeat(4,1fr);gap:1mm;page-break-inside:avoid}.palace{border:1px solid #777;padding:3mm;display:flex;flex-direction:column;gap:1mm;overflow:hidden}.palace>b{font-size:10px}.hanzi{font-family:"Noto Serif TC","Source Han Serif TW",serif}.palace>.hanzi{font-size:19px}.palace small{color:#555}.star{display:block;margin-top:1mm}.center{grid-column:2/4;grid-row:2/4;border:1px solid #b08a48;padding:8mm;display:flex;flex-direction:column;justify-content:center;text-align:center}.limits{page-break-inside:avoid}code{font-size:9px}.source{font-weight:bold}.footer-note{margin-top:8mm;border-top:1px solid #aaa;padding-top:3mm;color:#555}
  </style></head><body>
    <h1>BaZodiac · Zi Wei Dou Shu Atlas</h1>
    <div class="meta"><div><b>Ruleset</b><br>${escapeHtml(report.calculation.rulesetId)} · ${escapeHtml(report.calculation.rulesetVersion)}</div><div><b>${isDe ? 'Quellenstatus' : 'Source status'}</b><br><span class="source">${escapeHtml(report.calculation.sourceStatus)}</span></div><div><b>Fingerprint</b><br><code>${escapeHtml(report.calculation.chartFingerprint)}</code></div><div><b>${isDe ? 'Datenmodus' : 'Data mode'}</b><br>${escapeHtml(report.calculation.dataMode)}</div></div>
    <div class="chart">${cells}<section class="center"><b>MING · ${escapeHtml(report.anchors.mingBranchId)}</b><b>SHEN · ${escapeHtml(report.anchors.shenBranchId)}</b><p>${escapeHtml(report.anchors.bureauId)} · ${report.anchors.bureauNumber}</p></section></div>
    <section class="limits"><h2>${isDe ? 'Zehnjährige Themenfenster' : 'Ten-year theme windows'}</h2><p>${report.decades ? report.decades.map((d) => `${d.ageStart}–${d.ageEnd}: ${escapeHtml(d.palaceId)}`).join(' · ') : '—'}</p></section>
    <section><h2>${isDe ? 'Quellen- und Methodengrenzen' : 'Source and method limits'}</h2><ul>${warningRows}</ul></section>
    <p class="footer-note">${isDe ? 'Nicht prognostischer, evidenzgebundener Bericht.' : 'Non-predictive, evidence-bound report.'}</p>
  </body></html>`;
}

export async function renderPdf(report, locale, executablePath) {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox','--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(renderReportHtml(report, locale), { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    return await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `<div style="font-size:8px;width:100%;padding:0 14mm;display:flex;justify-content:space-between;color:#555"><span>${escapeHtml(report.calculation.chartFingerprint)} · ${escapeHtml(report.calculation.sourceStatus)}</span><span class="pageNumber"></span></div>`,
      margin: { top: '14mm', right: '14mm', bottom: '20mm', left: '14mm' },
    });
  } finally {
    await browser.close();
  }
}