export const dashboardHtml = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <title>ReleaseGuard AI</title>
    <style>
      :root { --ink:#f6f4ed; --muted:#a9b2bf; --panel:#111925; --line:#263345; --red:#ff5d5d; --amber:#f8bc53; --green:#65d68a; --blue:#79b8ff; }
      * { box-sizing:border-box; }
      body { margin:0; min-height:100vh; color:var(--ink); background:radial-gradient(circle at 15% 0%,#1b2b43 0,transparent 38%),#08101a; font:15px/1.5 Inter,ui-sans-serif,system-ui,sans-serif; }
      main { width:min(1180px,calc(100% - 32px)); margin:auto; padding:28px 0 56px; }
      header { display:flex; align-items:center; justify-content:space-between; gap:20px; margin-bottom:34px; }
      .brand { display:flex; align-items:center; gap:12px; font-weight:800; letter-spacing:.01em; }
      .shield { width:36px; height:40px; display:grid; place-items:center; border:1px solid #56749c; background:linear-gradient(160deg,#274464,#101c2b); clip-path:polygon(50% 0,96% 15%,88% 73%,50% 100%,12% 73%,4% 15%); }
      .protocol { color:var(--muted); font-size:13px; padding:7px 11px; border:1px solid var(--line); border-radius:999px; }
      .hero { display:grid; grid-template-columns:1.35fr .65fr; gap:28px; align-items:end; margin-bottom:26px; }
      h1 { margin:0; max-width:760px; font-size:clamp(42px,7vw,82px); line-height:.96; letter-spacing:-.055em; }
      h1 span { color:var(--blue); }
      .hero p { margin:0 0 8px; color:var(--muted); font-size:17px; }
      .actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}button { width:100%; border:0; border-radius:12px; padding:15px 18px; color:#08101a; background:linear-gradient(135deg,#98caff,#66aaff); font-weight:850; cursor:pointer; box-shadow:0 12px 34px #347ac833; }button.secondary{color:#dbe9f8;background:#1a2a3d;border:1px solid #36506e;box-shadow:none}
      button:disabled { opacity:.65; cursor:wait; }
      .grid { display:grid; grid-template-columns:.7fr 1.3fr; gap:18px; }
      .card { border:1px solid var(--line); background:linear-gradient(160deg,#121d2b,#0d151f); border-radius:18px; padding:22px; box-shadow:0 22px 55px #0004; }
      .eyebrow { color:var(--muted); text-transform:uppercase; font-size:11px; letter-spacing:.16em; font-weight:800; }
      .verdict { margin:8px 0 2px; font-size:58px; line-height:1; letter-spacing:-.06em; color:var(--blue); }
      .verdict.hold{color:var(--red)}.verdict.ship{color:var(--green)}.verdict.review{color:var(--amber)}
      .summary { color:#d2d8e2; }
      .score { display:flex; align-items:end; justify-content:space-between; margin:22px 0 9px; }
      .score strong { font-size:32px; }
      .meter { height:7px; overflow:hidden; border-radius:99px; background:#243140; }
      .meter > div { width:0; height:100%; border-radius:inherit; background:linear-gradient(90deg,var(--green),var(--amber),var(--red)); transition:width .7s ease; }
      .meta { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:20px; }
      .meta div { border:1px solid var(--line); border-radius:10px; padding:11px; }
      .meta strong,.meta span { display:block; }
      .meta span { color:var(--muted); font-size:11px; }
      .checks { display:grid; gap:10px; margin-top:14px; }
      .check { display:grid; grid-template-columns:12px 1fr auto; gap:12px; align-items:start; padding:13px 0; border-top:1px solid var(--line); }
      .dot { width:9px; height:9px; margin-top:6px; border-radius:50%; background:var(--green); box-shadow:0 0 16px currentColor; }
      .failed .dot { background:var(--red); } .warning .dot { background:var(--amber); }
      .check strong,.check small { display:block; }
      .check small { color:var(--muted); margin-top:3px; }
      .pill { padding:3px 8px; border:1px solid var(--line); border-radius:99px; color:var(--muted); font-size:11px; }
      .cluster { margin-top:12px; border-left:3px solid var(--red); padding:12px 14px; background:#24171c; border-radius:4px 12px 12px 4px; }
      .cluster b { color:#ffaaaa; }
      .empty { color:var(--muted); padding:40px 0; text-align:center; }
      .artifact{display:none;width:100%;margin-top:16px;border:1px solid var(--line);border-radius:12px}
      footer { display:flex; gap:18px; flex-wrap:wrap; color:var(--muted); font-size:12px; margin-top:18px; }
      @media(max-width:800px){ .hero,.grid{grid-template-columns:1fr} header{align-items:flex-start}.protocol{display:none}.verdict{font-size:46px} }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div class="brand"><div class="shield">RG</div><div>ReleaseGuard AI</div></div>
        <div class="protocol">MCP 2025-11-25+ · Streamable HTTP</div>
      </header>
      <section class="hero">
        <h1>Know before<br />you <span>ship.</span></h1>
        <div>
          <p>An evidence-first release agent that turns build, API, browser, visual, and performance checks into one defensible decision.</p>
          <div class="actions"><button id="run">Run failing RC.1</button><button id="run-fix" class="secondary">Verify fixed RC.2</button></div>
        </div>
      </section>
      <section class="grid">
        <article class="card">
          <div class="eyebrow">Release recommendation</div>
          <div id="verdict" class="verdict">READY</div>
          <p id="summary" class="summary">Run the demo assessment to generate a recommendation backed by individual checks.</p>
          <div class="score"><span class="eyebrow">Risk score</span><strong id="risk">—</strong></div>
          <div class="meter"><div id="meter"></div></div>
          <div id="meta" class="meta">
            <div><strong>—</strong><span>Passed</span></div><div><strong>—</strong><span>Warnings</span></div><div><strong>—</strong><span>Failed</span></div>
          </div>
          <div id="clusters"></div>
          <img id="artifact" class="artifact" alt="Browser evidence captured by ReleaseGuard" />
        </article>
        <article class="card">
          <div class="eyebrow">Evidence timeline</div>
          <div id="checks" class="checks"><div class="empty">No evidence collected yet.</div></div>
        </article>
      </section>
      <footer><span>Amazon Alexa+ primary track</span><span>AWS Builder mini-challenge</span><span>Deterministic verdict · optional Bedrock narrative</span></footer>
    </main>
    <script>
      const runButton = document.getElementById('run');
      const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[character]));
      const fixButton = document.getElementById('run-fix');
      const runAssessment = async (version, button) => {
        runButton.disabled = true; fixButton.disabled = true;
        const original = button.textContent; button.textContent = 'Running API + browser checks…';
        try {
          const response = await fetch('/api/live-demo?version=' + encodeURIComponent(version), { method: 'POST' });
          if (!response.ok) throw new Error('Assessment failed');
          const report = await response.json();
          document.getElementById('verdict').textContent = report.recommendation;
          document.getElementById('verdict').className = 'verdict ' + report.recommendation.toLowerCase();
          document.getElementById('summary').textContent = report.summary;
          document.getElementById('risk').textContent = report.riskScore + '/100';
          document.getElementById('meter').style.width = report.riskScore + '%';
          document.getElementById('meta').innerHTML = '<div><strong>' + report.totals.passed + '</strong><span>Passed</span></div><div><strong>' + report.totals.warning + '</strong><span>Warnings</span></div><div><strong>' + report.totals.failed + '</strong><span>Failed</span></div>';
          document.getElementById('checks').innerHTML = report.checks.map((check) => '<div class="check ' + check.status + '"><span class="dot"></span><div><strong>' + escapeHtml(check.name) + '</strong><small>' + escapeHtml(check.summary) + '</small><small>' + escapeHtml(check.evidence || '') + '</small></div><span class="pill">' + escapeHtml(check.category) + '</span></div>').join('');
          document.getElementById('clusters').innerHTML = report.failureGroups.map((group) => '<div class="cluster"><b>' + escapeHtml(group.id) + ' · ' + escapeHtml(group.severity.toUpperCase()) + '</b><div>' + escapeHtml(group.title) + '</div><small>' + escapeHtml(group.likelyCause) + '</small></div>').join('');
          const artifact = document.getElementById('artifact');
          if (report.artifacts && report.artifacts.screenshotUrl) { artifact.src = report.artifacts.screenshotUrl + '?t=' + Date.now(); artifact.style.display = 'block'; }
        } catch (error) {
          document.getElementById('summary').textContent = error.message;
        } finally {
          runButton.disabled = false; fixButton.disabled = false; button.textContent = original;
        }
      };
      runButton.addEventListener('click', () => runAssessment('2.8.0-rc.1', runButton));
      fixButton.addEventListener('click', () => runAssessment('2.8.0-rc.2', fixButton));
    </script>
  </body>
</html>`;
