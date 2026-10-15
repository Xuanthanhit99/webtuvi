/**
 * Read/write integration smoke against an isolated QA backend only.
 * Usage (PowerShell):
 *   $env:MENHVI_QA_API_URL='http://localhost:4000'
 *   $env:MENHVI_QA_ACCESS_TOKEN='<token for a disposable QA account>'
 *   node apps/mobile/scripts/integration-qa.mjs
 * Optional natal test: MENHVI_QA_LOCATION_QUERY='Hanoi'
 * Never run against production. Never print credentials or response PII.
 */
import assert from 'node:assert/strict';

const base = (process.env.MENHVI_QA_API_URL || '').replace(/\/$/, '');
const token = process.env.MENHVI_QA_ACCESS_TOKEN;
const safe = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base)
  || /^https:\/\/[^/]*(qa|staging|test)[^/]*$/i.test(base);
if (!safe || !token) {
  console.error('BLOCKED: set MENHVI_QA_API_URL to localhost or a QA/staging/test host, and MENHVI_QA_ACCESS_TOKEN.');
  process.exit(2);
}
const results = [];
async function request(method, path, body, authToken=token) {
  const res = await fetch(base + path, {
    method,
    headers: { ...(authToken ? { Authorization: 'Bearer ' + authToken } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(20000),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, data: json?.data, error: json?.error };
}
function check(ok, name) {
  results.push({ name, ok: Boolean(ok) });
  console.log((ok ? 'PASS ' : 'FAIL ') + name);
  assert.ok(ok, name);
}
async function lifecycle(name, root, create, verify) {
  let id;
  try {
    const made = await create();
    check(made.status === 200 || made.status === 201, name + ': create HTTP success');
    id = made.data?.id;
    check(typeof id === 'string' && id.length > 0, name + ': backend-generated id');
    verify(made.data);
    const url = root + '/' + encodeURIComponent(id);
    const fetched = await request('GET', url);
    check(fetched.status === 200 && fetched.data?.id === id, name + ': reopen');
    verify(fetched.data);
    const history = await request('GET', url + '/history');
    check(history.status === 200 && Array.isArray(history.data), name + ': history');
    const archived = await request('POST', url + '/archive');
    check(archived.status === 200 && archived.data?.status === 'ARCHIVED', name + ': archive');
    const listed = await request('GET', root + '?status=ARCHIVED&page=1&pageSize=100');
    check(listed.status === 200 && listed.data?.items?.some(x => x.id === id), name + ': archived list');
    const restored = await request('POST', url + '/restore');
    check(restored.status === 200 && restored.data?.status === 'ACTIVE', name + ': restore');
    const removed = await request('DELETE', url);
    check(removed.status === 200 && removed.data?.status === 'DELETED', name + ': soft delete');
    const deleted = await request('GET', root + '?status=DELETED&page=1&pageSize=100');
    check(deleted.status === 200 && deleted.data?.items?.some(x => x.id === id), name + ': deleted list');
    const restoredAgain = await request('POST', url + '/restore');
    check(restoredAgain.status === 200 && restoredAgain.data?.status === 'ACTIVE', name + ': cleanup restore');
  } catch (e) {
    console.error('BLOCKED/FAIL ' + name + ': ' + e.message);
    results.push({name: name + ': lifecycle',ok:false});
    // Never attempt an unverified destructive cleanup on error.
  }
}
try {
  const unauthorized = await request('GET','/tu-vi/charts?page=1',undefined,'invalid-qa-token');
  check(unauthorized.status === 401, 'invalid bearer token rejected (401)');
} catch(e) { console.error('Unauthorized check failed: ' + e.message); }
await lifecycle('Tu Vi','/tu-vi/charts',
  () => request('POST','/tu-vi/calculate',{birthDate:'1995-08-21',birthTime:'08:30',sex:'Nam'}),
  c => {
    check(c?.palaces?.layout && Object.keys(c.palaces.layout).length === 12,'Tu Vi: 12 server palaces');
    check(Array.isArray(c?.mainStars) && Array.isArray(c?.auxiliaryStars),'Tu Vi: server stars');
    check(Array.isArray(c?.daiVan) && c.daiVan.length > 0,'Tu Vi: Dai Van');
    check(Array.isArray(c?.nearbyTieuHan),'Tu Vi: Tieu Han');
  });
await lifecycle('Numerology','/numerology/readings',
  () => request('POST','/numerology/calculate',{fullBirthName:'Nguyen Van QA',birthDate:'1995-08-21'}),
  c => check(Array.isArray(c?.values) && c.values.length > 0 &&
    c.values.every(x => Number.isFinite(x.value)),'Numerology: server numeric values'));
const placeQuery = process.env.MENHVI_QA_LOCATION_QUERY || 'Hanoi';
try {
  const geo = await request('GET','/geocoding/search?q=' + encodeURIComponent(placeQuery));
  const candidate = geo.data?.find(x => x.token && x.label);
  if (geo.status === 200 && candidate) {
    await lifecycle('Natal','/natal-charts',
      () => request('POST','/natal-charts',{birthDate:'1995-08-21',birthTime:'08:30',locationToken:candidate.token}),
      c => {
        check(Array.isArray(c?.placements) && c.placements.length > 0,'Natal: server placements');
        check(Array.isArray(c?.houses) && Array.isArray(c?.aspects),'Natal: houses/aspects arrays');
        if (c?.housesAvailable) check(c.houses.length === 12,'Natal: 12 houses when available');
      });
  } else {
    console.error('BLOCKED Natal: geocoding returned no candidate; do not invent locationToken.');
    results.push({name:'Natal geocoding',ok:false});
  }
} catch(e) { console.error('BLOCKED Natal: '+e.message); results.push({name:'Natal geocoding',ok:false}); }
try {
  const invalid = await request('POST','/numerology/calculate',{fullBirthName:'',birthDate:'not-a-date'});
  check(invalid.status >= 400 && invalid.status < 500,'invalid input rejected');
  const expired = await request('POST','/natal-charts',{birthDate:'1995-08-21',locationToken:'expired-invalid-qa-token'});
  check(expired.status >= 400 && expired.status < 500,'invalid/expired location token rejected');
} catch(e) { console.error('Negative tests failed: '+e.message); }
const failed = results.filter(x => !x.ok);
console.log('QA SUMMARY ' + (results.length-failed.length) + '/' + results.length + ' assertions PASS');
if (failed.length) process.exitCode = 1;
