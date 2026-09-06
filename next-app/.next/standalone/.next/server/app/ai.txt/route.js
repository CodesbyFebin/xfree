"use strict";(()=>{var e={};e.id=314,e.ids=[314],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},9479:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>h,patchFetch:()=>y,requestAsyncStorage:()=>p,routeModule:()=>u,serverHooks:()=>g,staticGenerationAsyncStorage:()=>d});var o={};r.r(o),r.d(o,{GET:()=>c});var i=r(9303),s=r(8716),a=r(670),n=r(7070),l=r(2153);async function c(){let e=(0,l.n6)();return new n.NextResponse(e,{headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"public, max-age=3600"}})}let u=new i.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/ai.txt/route",pathname:"/ai.txt",filename:"route",bundlePath:"app/ai.txt/route"},resolvedPagePath:"/workspace/63b72ac8-352e-4e5b-b366-7b9bdabc09e7/sessions/agent_eaa788bc-8e62-43be-b9cc-0b95bb7515e6/next-app/app/ai.txt/route.ts",nextConfigOutput:"standalone",userland:o}),{requestAsyncStorage:p,staticGenerationAsyncStorage:d,serverHooks:g}=u,h="/ai.txt/route";function y(){return(0,a.patchFetch)({serverHooks:g,staticGenerationAsyncStorage:d})}},2153:(e,t,r)=>{r.d(t,{Ub:()=>s,n6:()=>a});var o=r(9750),i=r(6438);function s(){let e=function(){let e=[{slug:"home",route:"/",lastModified:new Date().toISOString(),changeFrequency:"daily",priority:1},{slug:"pillars",route:"/pillars",lastModified:new Date().toISOString(),changeFrequency:"weekly",priority:.8},{slug:"categories",route:"/categories",lastModified:new Date().toISOString(),changeFrequency:"weekly",priority:.7}];return o.vC.forEach(t=>{e.push({slug:`tool-${t}`,route:`/tools/${t}`,lastModified:new Date().toISOString(),changeFrequency:"monthly",priority:.9})}),i.Lj.forEach(t=>{e.push({slug:`pillar-${t.slug}`,route:`/pillars/${t.slug}`,lastModified:new Date().toISOString(),changeFrequency:"weekly",priority:.8})}),i.UM.forEach(t=>{e.push({slug:`authority-${t.slug}`,route:`/pillars/${t.slug}`,lastModified:new Date().toISOString(),changeFrequency:"weekly",priority:.8})}),e}(),t=e.filter(e=>e.slug.startsWith("tool-")),r=e.filter(e=>e.slug.startsWith("pillar-")||e.slug.startsWith("authority-")),s=["# XFree App - Free Online Developer & SEO Tools","","## Overview","XFree App provides free, privacy-first browser-based tools for developers and SEO professionals.","All tools execute entirely client-side with zero data transmission.","",`## Available Tools (${t.length})`];return t.forEach(e=>{let t=e.slug.replace("tool-","").replace(/-/g," ");s.push(`- [${t}](https://www.xfree.in${e.route})`)}),s.push("",`## Tool Pillars (${r.length})`),r.forEach(e=>{let t=e.slug.replace("pillar-","").replace("authority-","").replace(/-/g," ");s.push(`- [${t}](https://www.xfree.in${e.route})`)}),s.push("","## Privacy","All XFree tools are 100% client-side.","No data is transmitted to any server.","No cookies or tracking.",""),s.join("\n")}function a(){return`# AI Crawler Access Policy

## XFree App AI Access Policy
https://www.xfree.in/

## Access Statement
XFree App welcomes AI crawlers from recognized providers (OpenAI, Anthropic, Google, Perplexity, etc.) to access and index our public content.

## Guidelines
1. Access is granted to all public pages and tool content
2. AI crawlers should respect robots.txt directives
3. Rate limiting: Max 10 requests per second
4. Provide accurate user-agent identification

## Tool Content
- All published tool descriptions and documentation may be used by AI systems for training and inference
- Privacy-first tools: All tool execution happens client-side

## Contact
For API access or bulk data requests: contact@xfree.in
`}}};var t=require("../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[948,59,750,438],()=>r(9479));module.exports=o})();