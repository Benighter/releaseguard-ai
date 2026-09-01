export const demoStoreHtml = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Northstar Store — Release Candidate</title>
    <style>
      *{box-sizing:border-box}body{margin:0;background:#f4f0e8;color:#17202d;font:16px/1.5 Inter,system-ui,sans-serif}.shell{width:min(980px,calc(100% - 32px));margin:auto;padding:28px 0 60px}header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #d8d1c5;padding-bottom:20px}.brand{font-weight:900;font-size:22px}.badge{font-size:12px;border:1px solid #bcb4a8;border-radius:999px;padding:5px 10px}.layout{display:grid;grid-template-columns:1fr 380px;gap:28px;margin-top:36px}.product{background:#dce7f4;border-radius:24px;min-height:430px;display:grid;place-items:center;font-size:86px}.checkout{background:white;border:1px solid #ddd6ca;border-radius:20px;padding:24px;box-shadow:0 20px 45px #28354a12}h1{font-size:34px;line-height:1.05;margin:0 0 10px}p{color:#5f6874}label{display:block;font-size:12px;font-weight:800;margin:18px 0 6px}input{width:100%;border:1px solid #cfc7bb;border-radius:10px;padding:12px;font:inherit}.total{display:flex;justify-content:space-between;font-weight:850;margin:24px 0}button{width:100%;border:0;border-radius:12px;padding:14px;background:#17202d;color:white;font-weight:850}button:disabled{background:#aeb3b9;color:#e9eaec}.status{min-height:24px;margin-top:12px;font-size:13px;font-weight:750}.error{color:#b42318}.success{color:#138a4b}@media(max-width:760px){.layout{grid-template-columns:1fr}.product{min-height:220px}}
    </style>
  </head>
  <body>
    <div class="shell">
      <header><div class="brand">Northstar Store</div><div id="version" class="badge"></div></header>
      <div class="layout">
        <section><div class="product">🎧</div><h1>Studio headphones</h1><p>A seeded checkout candidate used to demonstrate ReleaseGuard's real API and browser checks.</p></section>
        <section class="checkout">
          <h2>Guest checkout</h2>
          <label for="email">Email</label><input id="email" value="judge@example.com" />
          <label for="card">Test card</label><input id="card" value="4242 4242 4242 4242" />
          <div class="total"><span>Total</span><span>$129.00</span></div>
          <button id="place-order">Place order</button>
          <div id="status" class="status" aria-live="polite"></div>
        </section>
      </div>
    </div>
    <script>
      const params = new URLSearchParams(location.search);
      const version = params.get('version') || '2.8.0-rc.1';
      const broken = version.endsWith('rc.1');
      const button = document.getElementById('place-order');
      const status = document.getElementById('status');
      document.getElementById('version').textContent = version;
      if (broken) {
        button.disabled = true;
        status.className = 'status error';
        status.textContent = 'Payment details accepted, but ordering is unavailable.';
        console.error('checkout-ui: currencyCode binding missing');
      }
      button.addEventListener('click', async () => {
        status.textContent = 'Submitting order…';
        const response = await fetch('/demo/api/checkout?version=' + encodeURIComponent(version), {method:'POST'});
        if (response.ok) {
          status.className = 'status success';
          status.textContent = 'Order accepted';
        } else {
          const payload = await response.json();
          status.className = 'status error';
          status.textContent = payload.error;
        }
      });
    </script>
  </body>
</html>`;
