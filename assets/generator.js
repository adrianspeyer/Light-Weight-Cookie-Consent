/* Light Weight Cookie Consent — Adrian Speyer; see LICENSE.md. */
'use strict';
document.getElementById('generator').addEventListener('submit', function (event) {
  event.preventDefault();
  const status = document.getElementById('result-status');
  try {
    const base = new URL(document.getElementById('base').value);
    const policy = new URL(document.getElementById('policy').value);
    if (base.protocol !== 'https:' || policy.protocol !== 'https:' || base.username || base.password || policy.username || policy.password) throw new Error('Use HTTPS URLs without embedded credentials.');
    if (base.search || base.hash) throw new Error('The installation URL must not contain a query or fragment.');
    if (!base.pathname.endsWith('/')) base.pathname += '/';
    const config = { endpoint: new URL('save_consent.php', base).href, policyUrl: policy.href, fallbackLanguage: 'en', adapters: [] };
    const language = document.getElementById('language').value;
    if (language) config.language = language;
    document.getElementById('settings').value = 'window.LightweightConsentConfig = ' + JSON.stringify(config, null, 2).replace(/</g, '\\u003c') + ';\n';
    const attribute = (value) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    document.getElementById('snippet').value = '<script src="' + attribute(new URL('consent-settings.js', base).href) + '" defer></script>\n<script src="' + attribute(new URL('assets/consent.js', base).href) + '" defer></script>';
    status.textContent = 'Generated. Save the settings file and deploy it on the same origin as your website. Configure and test tracker adapters before release.';
  } catch (error) {
    document.getElementById('settings').value = '';
    document.getElementById('snippet').value = '';
    status.textContent = error.message;
  }
});
