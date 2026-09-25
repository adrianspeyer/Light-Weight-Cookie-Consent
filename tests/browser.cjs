/* Opt-in real-server browser regression. Uses an installed Playwright package.
 * Run only against an isolated test installation: creates consent records.
 * CC_TEST_BASE_URL=http://127.0.0.1:8769 node tests/browser.cjs
 */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.env.CC_TEST_BASE_URL;
if (!base) throw new Error('Set CC_TEST_BASE_URL to an isolated configured test installation.');
(async () => {
  const browser = await chromium.launch({ headless: true });
  let passed = 0;
  async function scenario(name, fn, options = {}) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await fn(page, context);
      assert.deepEqual(errors, []);
      console.log('PASS ' + name); passed++;
    } finally { await context.close(); }
  }
  const go = page => page.goto(base + '/demo.html');
  const ready = page => page.getByRole('button', {name:'Accept all', exact:true}).waitFor({state:'visible'}).then(() => page.waitForFunction(() => !document.querySelector('#lwca-panel button').disabled));
  const indicator = async (page, category, value) => {
    await page.waitForFunction(({category,value}) => document.getElementById('demo-' + category)?.textContent === value, {category,value});
  };
  const saved = async page => { await page.waitForFunction(() => document.getElementById('lwca-panel').hidden); };
  try {
    await scenario('initial denial, acceptance, return visit and withdrawal', async page => {
      await go(page); await ready(page);
      await indicator(page,'analytics','off'); await indicator(page,'marketing','off');
      await page.getByRole('button',{name:'Accept all',exact:true}).click(); await saved(page);
      await indicator(page,'analytics','on'); await indicator(page,'marketing','on');
      await page.reload(); await indicator(page,'analytics','on');
      await page.getByRole('button',{name:'Privacy choices',exact:true}).click();
      await page.waitForTimeout(550);
      await page.getByRole('button',{name:'Withdraw consent',exact:true}).click();
      await page.waitForLoadState('load');
      await page.waitForTimeout(500);
      await indicator(page,'analytics','off'); await indicator(page,'marketing','off');
      await page.reload(); await indicator(page,'analytics','off');
    });
    await scenario('rejection persists', async page => {
      await go(page); await ready(page); await page.getByRole('button',{name:'Reject optional',exact:true}).click();
      await saved(page); await page.reload();
      await page.waitForFunction(() => window.LightweightConsent?.getConsent()?.categories.analytics === false);
      await indicator(page,'analytics','off'); await indicator(page,'marketing','off');
    });
    await scenario('category isolation', async page => {
      await go(page); await ready(page);
      await page.getByRole('checkbox',{name:'Analytics',exact:true}).check();
      await page.getByRole('button',{name:'Save preferences',exact:true}).click(); await saved(page);
      await indicator(page,'analytics','on'); await indicator(page,'marketing','off');
    });
    await scenario('failed acceptance does not activate adapters', async page => {
      await go(page); await ready(page);
      await page.route('**/save_consent.php', route => route.request().method() === 'POST' ? route.fulfill({status:503,json:{error:'test_failure'}}) : route.continue());
      await page.getByRole('button',{name:'Accept all',exact:true}).click();
      await page.waitForFunction(() => document.getElementById('lwca-status').textContent.includes('could not'));
      await indicator(page,'analytics','off'); await indicator(page,'marketing','off');
    });
    await scenario('failed withdrawal cannot restore old acceptance', async page => {
      await go(page); await ready(page); await page.getByRole('button',{name:'Accept all',exact:true}).click(); await saved(page);
      await indicator(page,'analytics','on'); await page.getByRole('button',{name:'Privacy choices',exact:true}).click();
      await page.route('**/save_consent.php', route => route.request().method() === 'POST' ? route.fulfill({status:503,json:{error:'test_failure'}}) : route.continue());
      await page.getByRole('button',{name:'Withdraw consent',exact:true}).click();
      await page.waitForTimeout(600); await page.reload();
      await page.waitForTimeout(400); await indicator(page,'analytics','off'); await indicator(page,'marketing','off');
      assert.equal(await page.locator('#lwca-panel').isVisible(), true);
      assert.equal(await page.evaluate(() => window.LightweightConsent.getConsent()), null);
    });
    await scenario('GPC prevents marketing acceptance', async (page,context) => {
      await context.addInitScript(() => Object.defineProperty(navigator,'globalPrivacyControl',{value:true}));
      await go(page); await ready(page);
      assert.equal(await page.getByRole('checkbox',{name:'Marketing',exact:true}).isDisabled(),true);
      await page.getByRole('button',{name:'Accept all',exact:true}).click(); await saved(page);
      await indicator(page,'analytics','on'); await indicator(page,'marketing','off');
    });
    await scenario('French language and mobile width', async page => {
      await page.route('**/demo.html', async route => {
        const response = await route.fetch();
        await route.fulfill({response,body:(await response.text()).replace('lang="en"','lang="fr"')});
      });
      await go(page);
      await page.getByRole('button',{name:'Tout accepter',exact:true}).waitFor();
      assert.equal(await page.locator('#lwca-panel').getAttribute('lang'),'fr');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
      await page.getByRole('combobox',{name:'Langue',exact:true}).selectOption('en');
      await page.getByRole('button',{name:'Accept all',exact:true}).waitFor();
    }, {viewport:{width:390,height:844}});
    await scenario('withdrawal propagates to another open tab', async (page, context) => {
      await go(page); await ready(page);
      await page.getByRole('button',{name:'Accept all',exact:true}).click(); await saved(page);
      const other = await context.newPage(); await go(other);
      await indicator(other,'analytics','on'); await indicator(other,'marketing','on');
      await page.getByRole('button',{name:'Privacy choices',exact:true}).click();
      await page.waitForTimeout(550);
      await page.getByRole('button',{name:'Withdraw consent',exact:true}).click();
      await other.waitForFunction(() => window.LightweightConsent?.getConsent()?.action === 'withdraw');
      await indicator(other,'analytics','off'); await indicator(other,'marketing','off');
      await other.reload();
      await other.waitForFunction(() => window.LightweightConsent?.getConsent()?.action === 'withdraw');
      await indicator(other,'analytics','off');
    });
    await scenario('header-only GPC denies marketing', async page => {
      await page.setExtraHTTPHeaders({'Sec-GPC':'1'});
      await go(page); await ready(page);
      assert.notEqual(await page.evaluate(() => navigator.globalPrivacyControl), true);
      assert.equal(await page.getByRole('checkbox',{name:'Marketing',exact:true}).isDisabled(),true);
      await page.getByRole('button',{name:'Accept all',exact:true}).click(); await saved(page);
      await indicator(page,'analytics','on'); await indicator(page,'marketing','off');
      assert.equal(await page.evaluate(() => window.LightweightConsent.getConsent().gpc),true);
    });
    for (const invalidation of ['expired receipt', 'stale revision']) {
      await scenario(invalidation + ' cannot start trackers', async page => {
        await go(page); await ready(page);
        await page.getByRole('button',{name:'Accept all',exact:true}).click(); await saved(page);
        await indicator(page,'analytics','on');
        await page.route('**/save_consent.php', async route => {
          if (route.request().method() !== 'GET') return route.continue();
          const response = await route.fetch(); const data = await response.json();
          assert.ok(data.consent, 'test needs an accepted receipt');
          if (invalidation === 'expired receipt') data.consent.expiresAt = '2000-01-01T00:00:00Z';
          else data.consent.revision = 'outdated-test-revision';
          await route.fulfill({response,json:data});
        });
        await page.reload(); await ready(page);
        await indicator(page,'analytics','off'); await indicator(page,'marketing','off');
        assert.equal(await page.evaluate(() => window.LightweightConsent.getConsent()),null);
      });
    }
    await scenario('observed requests stay gated by category and withdrawal', async page => {
      const pings = [];
      await page.route('**/tests/*-ping', route => {
        pings.push(new URL(route.request().url()).pathname);
        return route.fulfill({status:204,body:''});
      });
      await page.route('**/assets/demo.js', async route => {
        const response = await route.fetch();
        const code = await response.text();
        await route.fulfill({response,body:code.replace(
          "start: function () {", "start: function () { fetch('/tests/' + category + '-ping');"
        )});
      });
      await go(page); await ready(page);
      assert.deepEqual(pings,[]);
      await page.getByRole('button',{name:'Reject optional',exact:true}).click(); await saved(page);
      await page.reload();
      await page.waitForFunction(() => window.LightweightConsent?.getConsent()?.action === 'reject_all');
      assert.deepEqual(pings,[]);
      await page.getByRole('button',{name:'Privacy choices',exact:true}).click();
      await page.getByRole('checkbox',{name:'Analytics',exact:true}).check();
      await page.waitForTimeout(550);
      await page.getByRole('button',{name:'Save preferences',exact:true}).click(); await saved(page);
      await page.waitForFunction(() => document.getElementById('demo-analytics').textContent === 'on');
      await page.waitForTimeout(100);
      assert.deepEqual(pings,['/tests/analytics-ping']);
      await page.getByRole('button',{name:'Privacy choices',exact:true}).click();
      await page.waitForTimeout(550);
      await page.getByRole('button',{name:'Withdraw consent',exact:true}).click();
      await page.waitForTimeout(600);
      await page.waitForFunction(() => window.LightweightConsent?.getConsent()?.action === 'withdraw');
      await page.reload();
      await page.waitForFunction(() => window.LightweightConsent?.getConsent()?.action === 'withdraw');
      await indicator(page,'analytics','off'); await indicator(page,'marketing','off');
      assert.deepEqual(pings,['/tests/analytics-ping']);
    });
    await scenario('generator emits inert settings and ordered scripts', async page => {
      await page.goto(base + '/generator.html');
      await page.locator('#base').fill('https://example.com/consent/');
      await page.locator('#policy').fill('https://example.com/cookies');
      await page.getByRole('button',{name:'Generate installation'}).click();
      assert.match(await page.locator('#settings').inputValue(), /"adapters": \[\]/);
      assert.match(await page.locator('#snippet').inputValue(), /consent-settings\.js.*defer><\/script>\n<script.*assets\/consent\.js/);
    });
    console.log(passed + ' browser scenarios passed');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
