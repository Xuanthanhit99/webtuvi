const { chromium } = require('../../apps/web/node_modules/@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.AUDIT_BASE_URL || 'https://tuvitarot.vn';
const label = base.includes('localhost') ? 'local' : 'production';
const dir = path.join(__dirname, label);
fs.mkdirSync(dir, { recursive: true });
(async () => {
 const browser = await chromium.launch({headless:true});
 const results = [];
 const widths = label === 'production' ? [390,1440] : [375,390,430,768,1024,1280,1366,1440,1536,1920,2560];
 for (const width of widths) {
  const context = await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  for (const route of ['/','/discover','/discover/tu-vi','/discover/tarot','/discover/natal-chart','/discover/numerology','/discover/eastern-horoscope']) {
   const page = await context.newPage();
   const errors=[], failed=[], responses=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText}));
   page.on('response',r=>{if(r.status()>=400)responses.push({url:r.url(),status:r.status()})});
   await page.addInitScript(() => {
    window.__auditVitals={lcp:0,cls:0};
    new PerformanceObserver(l=>{for(const e of l.getEntries())window.__auditVitals.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});
    new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__auditVitals.cls+=e.value}).observe({type:'layout-shift',buffered:true});
   });
   try {
    const response = await page.goto(base+route,{waitUntil:'networkidle',timeout:60000});
    await page.evaluate(()=>document.fonts.ready);
    const data = await page.evaluate(()=>({
     title:document.title,url:location.href,h1:[...document.querySelectorAll('h1')].map(x=>x.textContent),
     description:document.querySelector('meta[name="description"]')?.content,
     canonical:document.querySelector('link[rel="canonical"]')?.href,
     robots:document.querySelector('meta[name="robots"]')?.content,
     og:[...document.querySelectorAll('meta[property^="og:"]')].map(x=>({name:x.getAttribute('property'),content:x.content})),
     jsonld:[...document.querySelectorAll('script[type="application/ld+json"]')].map(x=>JSON.parse(x.textContent)),
     overflow:document.documentElement.scrollWidth-innerWidth,
     mainCount:document.querySelectorAll('main').length,
     text:document.querySelector('main')?.innerText.slice(0,1800),
     images:[...document.images].map(i=>({src:i.currentSrc,width:i.clientWidth,naturalWidth:i.naturalWidth,loaded:i.complete&&i.naturalWidth>0})),
     vitals:window.__auditVitals,
     navigation:performance.getEntriesByType('navigation').map(n=>({ttfb:n.responseStart,domContentLoaded:n.domContentLoadedEventEnd})),
     scriptBytes:performance.getEntriesByType('resource').filter(r=>r.initiatorType==='script').reduce((sum,r)=>sum+r.encodedBodySize,0)
    }));
    if([390,1440].includes(width))await page.screenshot({path:path.join(dir,`${route.replace(/\W/g,'_')}-${width}.png`),fullPage:true});
    results.push({route,width,status:response.status(),...data,errors,failed,responses});
    console.log(JSON.stringify({route,width,status:response.status(),url:data.url,h1:data.h1,overflow:data.overflow,errors:errors.length}));
   } catch(e) {results.push({route,width,error:e.message,errors,failed,responses}); console.log(route,width,e.message);}
   await page.close();
  }
  await context.close();
 }
 fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(results,null,2));
 await browser.close();
})();
