/* Demonstration only — no third-party tracking. Adrian Speyer; LICENSE.md. */
window.LightweightConsentConfig = {
  policyUrl: 'cookie-policy.html',
  adapters: ['analytics', 'marketing'].map(function (category) {
    return {
      id: 'demo-' + category,
      category: category,
      start: function () { document.getElementById('demo-' + category).textContent = 'on'; },
      stop: function () { document.getElementById('demo-' + category).textContent = 'off'; }
    };
  })
};
