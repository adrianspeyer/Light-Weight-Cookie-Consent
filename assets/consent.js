/* Lightweight Consent: first-party preferences and explicitly configured adapters. */
(function (root) {
    'use strict';
    const denied = () => ({ necessary: true, analytics: false, marketing: false });
    function categories(value, gpc) {
        return { necessary: true, analytics: value?.analytics === true, marketing: !gpc && value?.marketing === true };
    }
    function chooseLanguage(available, candidates, fallback) {
        for (const candidate of [...candidates, fallback, 'en']) {
            if (typeof candidate !== 'string') continue;
            const normalized = candidate.toLowerCase();
            const exact = available.find(code => code.toLowerCase() === normalized);
            if (exact) return exact;
            const base = available.find(code => code.toLowerCase() === normalized.split('-')[0]);
            if (base) return base;
        }
        return available[0];
    }
    function validateConsent(record, revision, gpc, now = Date.now()) {
        if (!record || record.revision !== revision || !record.categories ||
            typeof record.categories.analytics !== 'boolean' || typeof record.categories.marketing !== 'boolean' ||
            !Number.isFinite(Date.parse(record.expiresAt)) || Date.parse(record.expiresAt) <= now) return null;
        return { ...record, categories: categories(record.categories, gpc) };
    }
    function resolveEndpoint(value, scriptUrl, pageOrigin) {
        const endpoint = new URL(value || '../save_consent.php', scriptUrl);
        if (endpoint.origin !== pageOrigin || !/^https?:$/.test(endpoint.protocol) || endpoint.username || endpoint.password) throw new Error('Consent endpoint must be same-origin HTTP(S), without credentials.');
        return endpoint;
    }
    const core = { categories, chooseLanguage, validateConsent, resolveEndpoint };
    if (typeof module === 'object' && module.exports) { module.exports = core; return; }
    if (root.LightweightConsent) return;
    const scriptUrl = document.currentScript?.src;
    if (!scriptUrl) return;
    const config = root.LightweightConsentConfig || {};
    const strings = {
        en: { languageName: 'English', title: 'Your privacy choices', description: 'Optional cookies and similar technologies are off until you choose. You can change or withdraw your choices at any time.', necessary: 'Necessary (always on)', necessaryDescription: 'Required to save these choices and operate essential website functions.', analytics: 'Analytics', analyticsDescription: 'Measure website use. Optional.', marketing: 'Marketing', marketingDescription: 'Advertising and related tracking. Optional.', accept: 'Accept all', reject: 'Reject optional', save: 'Save preferences', withdraw: 'Withdraw consent', manage: 'Privacy choices', close: 'Close', policy: 'Read our cookie policy', language: 'Language', loading: 'Loading your saved choices…', saved: 'Your choices have been saved.', error: 'We could not load or save your choices. Optional tracking remains off until your choice is confirmed. Please try again.', retry: 'Retry', gpc: 'Global Privacy Control is enabled. Marketing remains off.', receipt: 'Consent receipt', adapterError: 'Your choice was saved, but a configured service could not be updated. Reloading the page.' },
        fr: { languageName: 'Français', title: 'Vos choix de confidentialité', description: 'Les témoins et technologies facultatifs restent désactivés jusqu’à votre choix. Vous pouvez modifier ou retirer votre consentement à tout moment.', necessary: 'Nécessaires (toujours actifs)', necessaryDescription: 'Requis pour conserver vos choix et assurer les fonctions essentielles du site.', analytics: 'Analyse', analyticsDescription: 'Mesurer l’utilisation du site. Facultatif.', marketing: 'Marketing', marketingDescription: 'Publicité et suivi connexe. Facultatif.', accept: 'Tout accepter', reject: 'Refuser les facultatifs', save: 'Enregistrer les préférences', withdraw: 'Retirer le consentement', manage: 'Choix de confidentialité', close: 'Fermer', policy: 'Lire notre politique sur les témoins', language: 'Langue', loading: 'Chargement de vos choix…', saved: 'Vos choix ont été enregistrés.', error: 'Impossible de charger ou d’enregistrer vos choix. Le suivi facultatif reste désactivé jusqu’à la confirmation de votre choix. Veuillez réessayer.', retry: 'Réessayer', gpc: 'Le contrôle global de confidentialité est activé. Le marketing reste désactivé.', receipt: 'Reçu de consentement', adapterError: 'Votre choix est enregistré, mais un service configuré n’a pas pu être mis à jour. Rechargement de la page.' }
    };
    for (const [code, values] of Object.entries(config.translations || {})) {
        if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(code) || !values || typeof values !== 'object') continue;
        // Only complete translations are selectable; avoid silently mixed-language notices.
        if (Object.keys(strings.en).every(key => typeof values[key] === 'string' && values[key].trim())) strings[code] = { ...values };
    }
    let language = chooseLanguage(Object.keys(strings), [config.language, document.documentElement.lang, ...(navigator.languages || [navigator.language])], config.fallbackLanguage);
    let endpoint;
    try {
        endpoint = resolveEndpoint(config.endpoint, scriptUrl, location.origin);
    } catch (error) { console.error('Lightweight Consent:', error.message); return; }
    let gpc = navigator.globalPrivacyControl === true;
    let csrfToken = null, revision = null, consent = null, busy = false, initialized = false, priorFocus = null;
    let desired = denied();
    let recoveryRequired = false;
    try { recoveryRequired = sessionStorage.getItem('lwca-recovery-required') === '1'; } catch (_) {}
    try { recoveryRequired = recoveryRequired || localStorage.getItem('lwca-recovery-required') === '1'; } catch (_) {}
    const active = new Map();
    const adapters = Array.isArray(config.adapters) ? config.adapters.filter(a => a && typeof a.id === 'string' && ['analytics', 'marketing'].includes(a.category) && typeof a.start === 'function' && typeof a.stop === 'function') : [];
    let panel, status, manage, expiryTimer, checkboxes = {}, actionButtons = [];
    function el(tag, text, attrs) {
        const node = document.createElement(tag);
        if (text !== undefined) node.textContent = text;
        for (const [name, value] of Object.entries(attrs || {})) node.setAttribute(name, value);
        return node;
    }
    function say(key) { status.lang = language; status.textContent = strings[language][key] || key; }
    function button(text, action) {
        const node = el('button', text, { type: 'button' });
        node.addEventListener('click', action); actionButtons.push(node); return node;
    }
    function setBusy(value) {
        busy = value;
        for (const node of actionButtons) node.disabled = value;
        for (const [category, node] of Object.entries(checkboxes)) node.disabled = value || category === 'necessary' || (category === 'marketing' && gpc);
        panel.setAttribute('aria-busy', String(value));
    }
    function openPreferences() {
        if (!panel) return;
        priorFocus = document.activeElement; panel.hidden = false;
        desired = consent && !recoveryRequired ? categories(consent.categories, gpc) : denied();
        render(); panel.querySelector('h2').focus();
    }
    function close() { panel.hidden = true; (priorFocus?.isConnected ? priorFocus : manage).focus(); }
    function render() {
        const t = strings[language]; panel.replaceChildren(); panel.lang = language; actionButtons = []; checkboxes = {};
        manage.textContent = t.manage; manage.lang = language;
        panel.append(el('h2', t.title, { id: 'lwca-title', tabindex: '-1' }), el('p', t.description));
        const languageLabel = el('label', t.language + ' ');
        const select = el('select', undefined, { 'aria-label': t.language });
        for (const code of Object.keys(strings)) { const option = el('option', strings[code].languageName, { value: code }); option.selected = code === language; select.append(option); }
        select.addEventListener('change', () => { language = select.value; render(); panel.querySelector('select').focus(); });
        languageLabel.append(select); panel.append(languageLabel);
        const fieldset = el('fieldset'); fieldset.append(el('legend', t.title));
        for (const category of ['necessary', 'analytics', 'marketing']) {
            const label = el('label', undefined, { class: 'lwca-category' });
            const input = el('input', undefined, { type: 'checkbox', 'aria-describedby': 'lwca-' + category + '-description' });
            input.checked = desired[category]; input.disabled = category === 'necessary' || (category === 'marketing' && gpc);
            input.addEventListener('change', () => { desired[category] = input.checked; });
            checkboxes[category] = input;
            label.append(input, el('span', t[category])); fieldset.append(label, el('p', t[category + 'Description'], { id: 'lwca-' + category + '-description', class: 'lwca-detail' }));
        }
        panel.append(fieldset);
        if (gpc) panel.append(el('p', t.gpc));
        if (config.policyUrl) {
            try {
                const policy = new URL(config.policyUrl, location.href);
                if (policy.origin === location.origin || policy.protocol === 'https:') panel.append(el('a', t.policy, { href: policy.href }));
            } catch (_) { /* Invalid links are omitted. */ }
        }
        const actions = el('div', undefined, { class: 'lwca-actions' });
        actions.append(button(t.reject, () => save('reject_all', denied())), button(t.accept, () => save('accept_all', categories({ analytics: true, marketing: true }, gpc))), button(t.save, () => save('save_preferences', desired)));
        panel.append(actions);
        if (consent) panel.append(button(t.withdraw, () => save('withdraw', denied())));
        panel.append(button(t.close, close));
        if (!initialized) panel.append(button(t.retry, initialize));
        if (consent?.receiptId) panel.append(el('p', t.receipt + ': ' + consent.receiptId, { class: 'lwca-detail' }));
        const attribution = el('p', undefined, { class: 'lwca-detail' });
        attribution.append(el('a', 'Light Weight Cookie Consent · Adrian Speyer', { href: 'https://github.com/adrianspeyer/Light-Weight-Cookie-Consent', target: '_blank', rel: 'noopener noreferrer' }));
        panel.append(attribution);
        setBusy(busy);
    }
    function stopActive() {
        for (const adapter of active.values()) { try { adapter.stop(); } catch (error) { console.error('Lightweight Consent adapter stop failed:', adapter.id); } }
        const hadActive = active.size > 0; active.clear(); return hadActive;
    }
    function latchDenial() {
        recoveryRequired = true;
        let remembered = false;
        try { sessionStorage.setItem('lwca-recovery-required', '1'); remembered = true; } catch (_) {}
        try { localStorage.setItem('lwca-recovery-required', '1'); remembered = true; } catch (_) {}
        return remembered;
    }
    function failClosed(forceReload = false) {
        const remembered = latchDenial();
        const hadActive = stopActive();
        // Preserve failure state across reload so old saved acceptance cannot restart SDKs.
        if ((hadActive || forceReload) && remembered) location.reload();
    }
    function scheduleExpiry() {
        clearTimeout(expiryTimer);
        if (!consent) return;
        const remaining = Date.parse(consent.expiresAt) - Date.now();
        expiryTimer = setTimeout(() => {
            if (Date.parse(consent.expiresAt) > Date.now()) { scheduleExpiry(); return; }
            stopActive(); location.reload();
        }, Math.max(1, Math.min(remaining, 2147483647)));
    }
    function apply(next) {
        if (recoveryRequired) return;
        const removed = [...active.values()].some(a => !next[a.category]);
        if (removed) { stopActive(); location.reload(); return; }
        for (const adapter of adapters) {
            if (next[adapter.category] && !active.has(adapter.id)) {
                active.set(adapter.id, adapter);
                try { adapter.start(); }
                catch (error) { say('adapterError'); console.error('Lightweight Consent adapter start failed:', adapter.id); failClosed(); return; }
            }
        }
    }
    async function request(options) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
            const response = await fetch(endpoint.href, { credentials: 'same-origin', cache: 'no-store', ...options, signal: controller.signal });
            if (!response.ok) throw new Error('Consent HTTP ' + response.status);
            const data = await response.json();
            if (!data || typeof data !== 'object') throw new Error('Invalid consent response');
            return data;
        } finally { clearTimeout(timeout); }
    }
    async function initialize() {
        if (busy) return;
        setBusy(true); say('loading');
        try {
            const data = await request({ method: 'GET' });
            if (typeof data.csrfToken !== 'string' || !data.csrfToken || typeof data.revision !== 'string') throw new Error('Invalid consent configuration');
            csrfToken = data.csrfToken; revision = data.revision;
            gpc = gpc || data.gpc === true;
            consent = validateConsent(data.consent, revision, gpc); scheduleExpiry();
            if (!config.language && consent?.language && strings[consent.language]) language = consent.language;
            initialized = true; desired = consent && !recoveryRequired ? consent.categories : denied();
            panel.hidden = !!consent && !recoveryRequired; render(); status.textContent = '';
            if (recoveryRequired) say('error');
            if (consent) apply(consent.categories);
            else if (stopActive()) location.reload();
        } catch (error) {
            initialized = false; panel.hidden = false; render(); say('error');
            failClosed();
        } finally { setBusy(false); }
    }
    async function save(action, value) {
        if (busy) return;
        if (!initialized || !csrfToken) { say('error'); return; }
        const next = categories(value, gpc);
        const downgrade = !!consent && ['analytics', 'marketing'].some(key => consent.categories[key] && !next[key]);
        if (downgrade || action === 'withdraw') { latchDenial(); stopActive(); }
        setBusy(true);
        try {
            const data = await request({ method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken }, body: JSON.stringify({ revision, language, categories: next, action, gpc }) });
            gpc = gpc || data.consent?.gpc === true;
            const expected = categories(next, gpc);
            const saved = validateConsent(data.consent, revision, gpc);
            if (!saved || saved.categories.analytics !== expected.analytics || saved.categories.marketing !== expected.marketing) throw new Error('Unconfirmed consent');
            consent = saved; desired = saved.categories; recoveryRequired = false; scheduleExpiry();
            try { sessionStorage.removeItem('lwca-recovery-required'); } catch (_) {}
            try { localStorage.removeItem('lwca-recovery-required'); } catch (_) {}
            say('saved'); close();
            try { localStorage.setItem('lwca-consent-updated', String(Date.now()) + Math.random()); } catch (_) {}
            if (!downgrade) apply(saved.categories);
            // Revocation also reloads when trackers were started outside our adapters.
            if (downgrade || action === 'withdraw') location.reload();
        } catch (error) {
            say('error'); panel.hidden = false;
            // Fail closed for this document; never report a failed write as saved.
            failClosed(downgrade || action === 'withdraw');
        } finally { setBusy(false); }
    }
    root.LightweightConsent = { openPreferences, withdraw: () => save('withdraw', denied()), getConsent: () => consent && !recoveryRequired ? JSON.parse(JSON.stringify(consent)) : null };
    function mount() {
        const stylesheet = el('link', undefined, { rel: 'stylesheet', href: new URL('consent.css', scriptUrl).href });
        document.head.append(stylesheet);
        const host = el('div', undefined, { id: 'lwca-widget' });
        panel = el('section', undefined, { id: 'lwca-panel', role: 'dialog', 'aria-labelledby': 'lwca-title' });
        manage = el('button', strings[language].manage, { type: 'button', id: 'lwca-manage', 'aria-controls': 'lwca-panel' });
        manage.addEventListener('click', openPreferences);
        status = el('p', undefined, { id: 'lwca-status', role: 'status', 'aria-live': 'polite', lang: language });
        panel.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
        host.append(panel, manage, status); document.body.append(host); render(); initialize();
        root.addEventListener('storage', event => { if (event.key === 'lwca-consent-updated' || event.key === 'lwca-recovery-required') { stopActive(); location.reload(); } });
        root.addEventListener('pageshow', event => { if (event.persisted) { stopActive(); location.reload(); } });
        // Refresh server choices after another tab changes consent.
        document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') initialize(); });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();
})(typeof window !== 'undefined' ? window : globalThis);
