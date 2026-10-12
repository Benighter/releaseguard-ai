export const dashboardHtml = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light dark" />
<title>Release review · ReleaseGuard AI</title>
<style>
:root{color-scheme:light dark;--page:#f2f5f9;--surface:#fff;--ink:#172a42;--muted:#526378;--line:#d8e0e9;--control:#8090a4;--primary:#2355b6;--on-primary:#fff;--focus:#0b62d5;--failed:#a12b35;--failed-bg:#fff2f2;--passed:#1f654c;--warning:#825309}
*{box-sizing:border-box}html{scroll-padding-top:84px}body{margin:0;background:var(--page);color:var(--ink);font:15px/1.5 "Segoe UI",Arial,sans-serif}button,select{font:inherit}button:focus-visible,select:focus-visible,summary:focus-visible,a:focus-visible{outline:3px solid var(--focus);outline-offset:3px}
.topbar{position:sticky;top:0;z-index:10;background:var(--surface);border-bottom:1px solid var(--line)}.topbar-inner{width:min(1120px,calc(100% - 32px));min-height:64px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:16px}.brand{font-size:16px;font-weight:700;letter-spacing:-.02em;white-space:nowrap}.brand span{display:inline-grid;place-items:center;width:28px;height:28px;margin-right:9px;border:1px solid var(--ink);border-radius:5px;font-size:11px;letter-spacing:0;vertical-align:1px}.header-note{color:var(--muted);font-size:13px;text-align:right}
main{width:min(1120px,calc(100% - 32px));margin:24px auto 48px;padding:32px;background:var(--surface);border:1px solid var(--line);border-radius:10px}h1,h2,p{margin-top:0}h1{margin-bottom:4px;font-size:28px;line-height:1.2;letter-spacing:-.03em}.intro{margin-bottom:24px;color:var(--muted)}
.review-form{display:flex;align-items:end;gap:12px;padding-bottom:24px;border-bottom:1px solid var(--line)}.field{width:min(390px,100%)}label{display:block;margin-bottom:6px;font-size:13px;font-weight:650}select{width:100%;min-height:44px;padding:8px 38px 8px 12px;color:var(--ink);background:var(--surface);border:1px solid var(--control);border-radius:6px}button{min-height:44px;padding:9px 20px;color:var(--on-primary);background:var(--primary);border:1px solid var(--primary);border-radius:6px;font-weight:650;cursor:pointer}button:hover:not(:disabled){filter:brightness(.93)}button:disabled{opacity:.65;cursor:wait}.connection{min-height:22px;margin:8px 0 0;color:var(--muted);font-size:13px}
.section{padding-top:24px}.section+.section{margin-top:24px;border-top:1px solid var(--line)}.section-title{margin-bottom:16px;font-size:18px;line-height:1.3;letter-spacing:-.015em}.decision{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:24px}.decision-label{margin-bottom:6px;color:var(--muted);font-size:13px;font-weight:650}.verdict{margin:0 0 8px;font-size:26px;line-height:1.2;font-weight:700;letter-spacing:-.025em}.verdict.hold,.result.failed{color:var(--failed)}.verdict.ship,.result.passed{color:var(--passed)}.verdict.review,.result.warning{color:var(--warning)}.decision-summary{max-width:740px;margin-bottom:0}.decision-side{min-width:120px;padding:10px 14px;background:var(--page);border:1px solid var(--line);border-radius:6px;text-align:right}.decision-side span{display:block;color:var(--muted);font-size:13px}.decision-side strong{display:block;font-size:18px;font-variant-numeric:tabular-nums}.decision-meta{display:flex;flex-wrap:wrap;gap:4px 20px;margin-top:18px;color:var(--muted);font-size:13px}.decision-meta strong{color:var(--ink);font-weight:650}
.evidence-caption{margin:-8px 0 14px;color:var(--muted);font-size:13px}table{width:100%;border-collapse:collapse;table-layout:fixed}th{padding:0 12px 10px 0;color:var(--muted);border-bottom:1px solid var(--line);font-size:13px;font-weight:650;text-align:left}th:first-child{width:28%}th:nth-child(2){width:14%}td{padding:14px 12px 14px 0;border-bottom:1px solid var(--line);vertical-align:top;overflow-wrap:anywhere}.check-name{display:block;font-size:16px;font-weight:650;line-height:1.35}.check-category{display:block;margin-top:3px;color:var(--muted);font-size:13px;text-transform:capitalize}.result{font-weight:700;text-transform:capitalize}.evidence-summary{display:block}.evidence-detail{display:block;margin-top:3px;color:var(--muted);font:13px/1.5 Consolas,"Cascadia Code",monospace;overflow-wrap:anywhere}.empty-row{color:var(--muted)}
details{border-top:1px solid var(--line)}details:last-child{border-bottom:1px solid var(--line)}summary{display:flex;align-items:center;min-height:52px;padding:10px 0;font-weight:650;cursor:pointer;list-style:none}summary::-webkit-details-marker{display:none}summary::after{content:"+";margin-left:auto;padding-left:16px;color:var(--muted);font-size:22px;font-weight:400;line-height:1}details[open] summary::after{content:"−"}.detail-content{padding:0 0 20px;color:var(--muted)}.finding{margin:0 0 12px;padding:12px 14px;border-left:3px solid var(--failed);background:var(--failed-bg);color:var(--ink)}.finding:last-child{margin-bottom:0}.finding strong,.finding span{display:block}.finding span{margin-top:3px}.capture-link{display:inline-block;max-width:100%}.artifact{display:none;width:100%;max-width:820px;height:auto;border:1px solid var(--line)}.capture-note{margin:0 0 12px}pre{max-height:300px;margin:0;padding:14px;overflow:auto;color:var(--ink);background:var(--page);border:1px solid var(--line);border-radius:6px;font:13px/1.55 Consolas,"Cascadia Code",monospace;white-space:pre-wrap;overflow-wrap:anywhere}
@media(max-width:650px){.topbar-inner{min-height:56px}.header-note{display:none}main{width:100%;margin:0 auto;padding:24px 16px 40px;border:0;border-radius:0}.review-form{display:block}.field{width:100%}button{width:100%;margin-top:12px}.decision{grid-template-columns:1fr;gap:16px}.decision-side{width:100%;text-align:left}.decision-side span,.decision-side strong{display:inline}.decision-side strong{margin-left:8px}thead{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}tbody,tr,td{display:block;width:100%}tr{padding:14px 0;border-top:1px solid var(--line)}td{padding:0;border:0}td+td{margin-top:9px}td:nth-child(2)::before{content:"Result  ";color:var(--muted);font-size:13px;font-weight:400}td:nth-child(3)::before{content:"Evidence";display:block;margin-bottom:2px;color:var(--muted);font-size:13px}tr.empty-row{padding:0}}
@media(prefers-color-scheme:dark){:root{--page:#141e29;--surface:#1b2634;--ink:#e6edf5;--muted:#b1bfd0;--line:#425165;--control:#93a4b8;--primary:#a5c5ff;--on-primary:#142238;--focus:#a5c5ff;--failed:#ffb4bb;--failed-bg:#35252c;--passed:#a0e2c0;--warning:#ffcf81}}
</style>
</head>
<body>
<header class="topbar"><div class="topbar-inner"><div class="brand"><span aria-hidden="true">RG</span>ReleaseGuard AI</div><div class="header-note">Local release review · MCP</div></div></header>
<main>
<h1>Release review</h1><p class="intro">Check a candidate against live API, browser, build and performance evidence.</p>
<form id="review-form" class="review-form"><div class="field"><label for="candidate">Release candidate</label><select id="candidate" name="candidate"><option value="2.8.0-rc.1">2.8.0-rc.1 · Known failing candidate</option><option value="2.8.0-rc.2">2.8.0-rc.2 · Fixed candidate</option></select></div><button id="run" type="submit">Check release</button></form>
<p id="mcp-status" class="connection" role="status" aria-live="polite">The MCP connection starts when you check a release.</p>
<section class="section" aria-labelledby="decision-heading"><div class="decision"><div><div id="decision-heading" class="decision-label">Decision</div><h2 id="verdict" class="verdict">No review yet</h2><p id="summary" class="decision-summary">Select a candidate and check its release evidence.</p></div><div class="decision-side"><span>Risk score</span><strong id="risk">—</strong></div></div><div class="decision-meta"><span>Candidate <strong id="candidate-value">—</strong></span><span>Checked <strong id="checked-at">—</strong></span><span id="totals">No checks run</span></div></section>
<section class="section" aria-labelledby="evidence-heading"><h2 id="evidence-heading" class="section-title">Evidence</h2><p class="evidence-caption">Failed checks appear first. Each result comes from the selected candidate’s live review.</p><table><thead><tr><th scope="col">Check</th><th scope="col">Result</th><th scope="col">Evidence</th></tr></thead><tbody id="checks"><tr class="empty-row"><td colspan="3">No evidence collected yet.</td></tr></tbody></table></section>
<section class="section" aria-labelledby="detail-heading"><h2 id="detail-heading" class="section-title">Review details</h2><details id="findings-details"><summary id="findings-summary">Related findings (0)</summary><div id="clusters" class="detail-content">No related findings yet.</div></details><details id="capture-details"><summary>Browser capture</summary><div class="detail-content"><p id="capture-note" class="capture-note">A capture is available after the browser check runs.</p><a id="artifact-link" class="capture-link" target="_blank" rel="noopener"><img id="artifact" class="artifact" alt="Browser evidence captured during the selected release review" /></a></div></details><details id="protocol-details"><summary>Protocol activity</summary><div class="detail-content"><pre id="mcp-trace">No requests sent yet.</pre></div></details></section>
</main>
<script type="module">
import { DashboardMcpClient } from '/assets/dashboard-mcp-client.js';
const byId = (id) => document.getElementById(id);
const form = byId('review-form'), candidate = byId('candidate'), runButton = byId('run');
const traceLines = [];
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[character]));
const client = new DashboardMcpClient('/mcp', fetch, (event) => { traceLines.push(event.method + ' → ' + event.phase + ': ' + event.detail); byId('mcp-trace').textContent = traceLines.join(String.fromCharCode(10)); });
const clearResult = (version) => {
  byId('verdict').textContent = 'Checking…'; byId('verdict').className = 'verdict';
  byId('summary').textContent = 'Collecting live evidence for ' + version + '.';
  byId('risk').textContent = '—'; byId('candidate-value').textContent = version;
  byId('checked-at').textContent = '—'; byId('totals').textContent = 'Checks in progress';
  byId('checks').innerHTML = '<tr class="empty-row"><td colspan="3">Collecting fresh evidence…</td></tr>';
  byId('findings-summary').textContent = 'Related findings (0)'; byId('clusters').textContent = 'No related findings yet.';
  byId('findings-details').open = false; byId('capture-details').open = false;
  byId('capture-note').textContent = 'A capture is available after the browser check runs.';
  byId('artifact').removeAttribute('src'); byId('artifact').style.display = 'none'; byId('artifact-link').removeAttribute('href');
};
form.addEventListener('submit', async (event) => {
  event.preventDefault(); if (runButton.disabled) return;
  const version = candidate.value; runButton.disabled = true; candidate.disabled = true;
  runButton.textContent = 'Checking release…'; clearResult(version);
  byId('mcp-status').textContent = 'Connecting to MCP and discovering release tools…';
  try {
    await client.connect();
    byId('mcp-status').textContent = 'Connected · MCP ' + client.protocolVersion + ' · ' + client.toolNames.join(', ');
    const report = await client.runDemo(version, location.origin);
    byId('verdict').textContent = report.recommendation; byId('verdict').className = 'verdict ' + report.recommendation.toLowerCase();
    byId('summary').textContent = report.summary; byId('risk').textContent = report.riskScore + '/100';
    byId('candidate-value').textContent = report.version;
    const checkedAt = new Date(report.createdAt);
    byId('checked-at').textContent = Number.isNaN(checkedAt.getTime()) ? report.createdAt : new Intl.DateTimeFormat(undefined, { dateStyle:'medium', timeStyle:'short' }).format(checkedAt);
    byId('totals').textContent = report.totals.passed + ' passed · ' + report.totals.warning + ' warnings · ' + report.totals.failed + ' failed';
    const order = { failed:0, warning:1, passed:2 };
    const checks = [...report.checks].sort((a,b) => (order[a.status] ?? 3) - (order[b.status] ?? 3));
    byId('checks').innerHTML = checks.map((check) => '<tr><td><span class="check-name">' + escapeHtml(check.name) + '</span><span class="check-category">' + escapeHtml(check.category) + '</span></td><td><span class="result ' + escapeHtml(check.status) + '">' + escapeHtml(check.status) + '</span></td><td><span class="evidence-summary">' + escapeHtml(check.summary) + '</span>' + (check.evidence ? '<span class="evidence-detail">' + escapeHtml(check.evidence) + '</span>' : '') + '</td></tr>').join('');
    byId('findings-summary').textContent = 'Related findings (' + report.failureGroups.length + ')';
    byId('clusters').innerHTML = report.failureGroups.length ? report.failureGroups.map((group) => '<div class="finding"><strong>' + escapeHtml(group.title) + '</strong><span>' + escapeHtml(group.likelyCause) + '</span></div>').join('') : 'No related findings.';
    if (report.artifacts && report.artifacts.screenshotUrl) {
      const captureUrl = report.artifacts.screenshotUrl + '?t=' + Date.now();
      byId('artifact').src = captureUrl; byId('artifact').style.display = 'block'; byId('artifact-link').href = captureUrl;
      byId('capture-note').textContent = 'Captured during the ' + report.version + ' browser check. Open image for full size.';
    }
  } catch (error) {
    byId('verdict').textContent = 'ERROR'; byId('summary').textContent = error instanceof Error ? error.message : String(error);
    byId('totals').textContent = 'Review did not complete';
    byId('mcp-status').textContent = 'The release check could not complete. Retry when the MCP connection is available.';
    byId('checks').innerHTML = '<tr class="empty-row"><td colspan="3">No evidence available from this attempt.</td></tr>';
  } finally {
    candidate.disabled = false; runButton.disabled = false; runButton.textContent = 'Check release'; runButton.focus();
  }
});
</script>
</body>
</html>`;
