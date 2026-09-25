#!/usr/bin/env python3
"""Destructive-to-test-data HTTP checks. Run ONLY against a disposable test install.
CC_TEST_BASE_URL and optionally CC_TEST_ADMIN_USER/CC_TEST_ADMIN_PASSWORD are read
from the process environment. No real credentials or database paths belong here.
"""
import http.cookiejar
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request

BASE = os.environ['CC_TEST_BASE_URL'].rstrip('/')
ORIGIN = urllib.parse.urlsplit(BASE)
ORIGIN = ORIGIN.scheme + '://' + ORIGIN.netloc
jar = http.cookiejar.CookieJar()
client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
checks = 0

def request(path, payload=None, headers=None, method=None):
    req = urllib.request.Request(BASE + path, data=payload, headers=headers or {}, method=method)
    try:
        response = client.open(req)
    except urllib.error.HTTPError as error:
        response = error
    return response.code, response.read().decode(), response.headers

def check(value, label):
    global checks
    checks += 1
    if not value:
        raise AssertionError(label)

def bootstrap(headers=None):
    status, body, _ = request('/save_consent.php', headers=headers)
    check(status == 200, 'bootstrap returns 200')
    return json.loads(body)

state = bootstrap()
check(state['consent'] is None, 'fresh visitor no consent')
check(state.get('gpc') is False, 'GPC signal returned')
check(any('HttpOnly' in c._rest for c in jar if c.name == 'cc_consent_session'), 'session HttpOnly')
data = dict(revision=state['revision'], language='fr-CA', categories=dict(necessary=True, analytics=True, marketing=True), action='accept_all', gpc=False)
headers = {'Content-Type':'application/json', 'Origin':ORIGIN, 'X-CSRF-Token':state['csrfToken']}
post = lambda d=data, h=headers: request('/save_consent.php', json.dumps(d).encode(), h)
status, _, _ = post(h={**headers,'X-CSRF-Token':'wrong'})
check(status == 403, 'bad csrf blocked')
status, _, _ = post(h={**headers,'Origin':'https://attacker.invalid'})
check(status == 403, 'cross-origin blocked')
status, _, _ = post(d={**data,'revision':'obsolete-revision'})
check(status == 409, 'old revision rejected')
status, _, _ = post(d={**data,'categories':dict(necessary=True,analytics='true',marketing=True)})
check(status == 422, 'invalid boolean rejected')
status, body, _ = post()
check(status == 200, 'accept succeeds')
accepted = json.loads(body)['consent']
check(accepted['categories']['marketing'] and accepted['categories']['analytics'], 'optional acceptance saved')
check(bootstrap()['consent']['receiptId'] == accepted['receiptId'], 'saved acceptance restored')
state = bootstrap({'Sec-GPC':'1'})
check(state['gpc'] and not state['consent']['categories']['marketing'], 'header GPC clamps existing acceptance')
check(bootstrap()['consent']['categories']['marketing'], 'GET did not rewrite evidence')
status, body, _ = post(d={**data,'action':'withdraw'})
check(status == 200, 'withdraw allowed immediately after accept')
withdrawn = json.loads(body)['consent']
check(withdrawn['receiptId'] == accepted['receiptId'], 'receipt stable across actions')
check(not withdrawn['categories']['marketing'] and not withdrawn['categories']['analytics'], 'withdraw denies all optional')
check(bootstrap()['consent']['action'] == 'withdraw', 'withdraw persists')
status, _, _ = request('/save_consent.php', method='DELETE')
check(status == 405, 'method restricted')
status, _, _ = request('/save_consent.php', b'x'*4097, headers)
check(status == 413, 'oversized body rejected')
status, _, _ = request('/save_consent.php', b'consent=accepted', {**headers,'Content-Type':'application/x-www-form-urlencoded'})
check(status == 415, 'legacy unprotected form rejected')
status, body, _ = request('/lwca/save_consent.php')
check(status == 200 and json.loads(body)['consent']['action']=='withdraw', 'compatibility URL delegates')

user = os.getenv('CC_TEST_ADMIN_USER')
password = os.getenv('CC_TEST_ADMIN_PASSWORD')
if user and password:
    status, body, _ = request('/lwca/admin_login.php')
    check(status == 200, 'login form available')
    csrf = re.search(r'name="csrf" value="([^"]+)"', body).group(1)
    cookie_before = next(c.value for c in jar if c.name == 'cc_admin_session')
    status, _, _ = request('/lwca/admin_login.php', urllib.parse.urlencode(dict(username=user,password=password,csrf='invalid')).encode(), {'Origin':ORIGIN})
    check(status == 403, 'login csrf rejected')
    status, body, _ = request('/lwca/admin_login.php', urllib.parse.urlencode(dict(username=user,password=password,csrf=csrf)).encode(), {'Origin':ORIGIN})
    check(status == 200 and '<h1>Consent evidence</h1>' in body, 'login succeeds with dashboard')
    check(next(c.value for c in jar if c.name == 'cc_admin_session') != cookie_before, 'session regenerated')
    check('accept_all' in body and 'withdraw' in body, 'append-only evidence includes both actions')
    csrf = re.search(r'name="csrf" value="([^"]+)"', body).group(1)
    status, _, _ = request('/lwca/admin_logout.php')
    check(status == 405, 'logout requires POST')
    status, body, _ = request('/lwca/admin_logout.php', urllib.parse.urlencode(dict(csrf=csrf)).encode(), {'Origin':ORIGIN})
    check(status == 200 and '<h1>Consent admin login</h1>' in body, 'logout succeeds')
    csrf = re.search(r'name="csrf" value="([^"]+)"', body).group(1)
    for attempt in range(5):
        status, _, _ = request('/lwca/admin_login.php', urllib.parse.urlencode(dict(username=user,password='deliberately-wrong',csrf=csrf)).encode(), {'Origin':ORIGIN})
        check(status == 401, 'failed login counted')
    status, _, _ = request('/lwca/admin_login.php', urllib.parse.urlencode(dict(username=user,password=password,csrf=csrf)).encode(), {'Origin':ORIGIN})
    check(status == 429, 'global throttle survives correct credentials during lockout')
print(f'Backend HTTP checks: {checks} passed')
