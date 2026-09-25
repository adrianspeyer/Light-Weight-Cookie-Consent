/* No trackers are installed by default. Load this BEFORE assets/consent.js.
 * Configure only reviewed services, with one adapter per service:
 *
 * window.LightweightConsentConfig = {
 *   adapters: [{
 *     id: 'your-analytics', category: 'analytics',
 *     start: function () { // Install your reviewed tracking SDK here. },
 *     stop: function () { // Disable SDK; clear its accessible cookies/storage. }
 *   }]
 * };
 *
 * This file deliberately performs no network requests. Existing inline scripts,
 * tag managers, embeds and server-side tracking must also be gated. Removing a
 * script element does not stop an executed SDK; revocation reloads the page.
 */
