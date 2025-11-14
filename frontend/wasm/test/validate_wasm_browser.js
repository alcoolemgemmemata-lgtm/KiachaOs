const puppeteer = require('puppeteer');

async function run() {
  const url = 'http://localhost:8080/wasm/test_runner.html';
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    page.on('console', msg => {
      console.log('PAGE:', msg.text());
    });
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait up to 30s for the window flag to be set by the test runner
    const ok = await page.waitForFunction(() => window.__KIACHA_WASM_OK__ === true, { timeout: 30000 }).catch(() => null);
    if (!ok) {
      const err = await page.evaluate(() => window.__KIACHA_WASM_ERROR__ || document.getElementById('out')?.textContent);
      console.error('Browser WASM validation failed:', err);
      process.exit(2);
    }

    const result = await page.evaluate(() => window.__KIACHA_WASM_RESULT__);
    console.log('Browser WASM validation passed:', result);
    await browser.close();
    process.exit(0);
  } catch (e) {
    console.error('Browser validation error:', e);
    try { await browser.close(); } catch (_) {}
    process.exit(1);
  }
}

run();
