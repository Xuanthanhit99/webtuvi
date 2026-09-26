const { chromium } = require('../../apps/web/node_modules/@playwright/test');
const AxeBuilder = require('../../apps/web/node_modules/@axe-core/playwright').default;
const fs = require('node:fs');
(async()=>{
 const browser=await chromium.launch();
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 const page=await context.newPage();
 await page.goto('https://tuvitarot.vn/',{waitUntil:'networkidle'});
 const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 fs.writeFileSync(__dirname+'/production/axe-home.json',JSON.stringify(result.violations,null,2));
 console.log(JSON.stringify(result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),null,2));
 await browser.close();
})();
