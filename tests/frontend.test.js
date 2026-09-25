const { test } = require('node:test');
const assert = require('node:assert/strict');
const { categories, chooseLanguage, validateConsent } = require('../assets/consent.js');
test('optional permissions require literal true; GPC denies marketing', () => {
    assert.deepEqual(categories({analytics: 'true', marketing: 1}, false), {necessary:true,analytics:false,marketing:false});
    assert.deepEqual(categories({analytics: true, marketing: true}, true), {necessary:true,analytics:true,marketing:false});
});
test('language priority supports explicit, site, browser region, fallback', () => {
    assert.equal(chooseLanguage(['en','fr'], ['fr','en'], 'en'), 'fr');
    assert.equal(chooseLanguage(['en','fr'], ['xx','fr-CA'], 'en'), 'fr');
    assert.equal(chooseLanguage(['en','fr'], ['xx'], 'fr'), 'fr');
    assert.equal(chooseLanguage(['en','fr-CA','fr'], ['FR-ca'], 'en'), 'fr-CA');
});
test('expired, malformed and outdated consent cannot enable trackers', () => {
    const record = {revision:'v2',categories:{analytics:true,marketing:true},expiresAt:'2030-01-01T00:00:00Z'};
    assert.equal(validateConsent(record,'v3',false),null);
    assert.equal(validateConsent({...record,expiresAt:'2000-01-01T00:00:00Z'},'v2',false),null);
    assert.equal(validateConsent({...record,expiresAt:'invalid'},'v2',false),null);
    assert.equal(validateConsent({...record,categories:{analytics:'true',marketing:true}},'v2',false),null);
    assert.equal(validateConsent(record,'v2',true).categories.marketing,false);
    assert.equal(validateConsent(record,'v2',false).categories.analytics,true);
});
test('endpoint resolution accepts only same-origin HTTP(S) without embedded credentials', () => {
    const {resolveEndpoint} = require('../assets/consent.js');
    const script = 'https://example.test/cookies/assets/consent.js';
    assert.equal(resolveEndpoint(undefined, script, 'https://example.test').href, 'https://example.test/cookies/save_consent.php');
    assert.equal(resolveEndpoint('/api/consent',script,'https://example.test').pathname,'/api/consent');
    for (const url of ['https://evil.test/api', 'javascript:alert(1)', 'data:application/json,{}', 'https://user:pass@example.test/api', 'http://example.test/api']) {
        assert.throws(() => resolveEndpoint(url,script,'https://example.test'));
    }
});
test('missing and primitive receipt shapes remain denied', () => {
    for (const record of [null,undefined,{},'accepted',true,{revision:'v1',categories:null},{revision:'v1',categories:{analytics:false,marketing:false}}]) {
        assert.equal(validateConsent(record,'v1',false),null);
    }
});
