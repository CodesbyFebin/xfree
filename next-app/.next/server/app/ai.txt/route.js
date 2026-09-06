"use strict";(()=>{var e={};e.id=314,e.ids=[314],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},9479:(e,o,r)=>{r.r(o),r.d(o,{originalPathname:()=>b,patchFetch:()=>g,requestAsyncStorage:()=>d,routeModule:()=>c,serverHooks:()=>h,staticGenerationAsyncStorage:()=>p});var t={};r.r(t),r.d(t,{GET:()=>u});var a=r(9303),s=r(8716),i=r(3131),n=r(7070),l=r(2153);async function u(){let e=(0,l.n6)();return new n.NextResponse(e,{headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"public, max-age=3600"}})}let c=new a.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/ai.txt/route",pathname:"/ai.txt",filename:"route",bundlePath:"app/ai.txt/route"},resolvedPagePath:"/workspace/63b72ac8-352e-4e5b-b366-7b9bdabc09e7/sessions/agent_eaa788bc-8e62-43be-b9cc-0b95bb7515e6/next-app/app/ai.txt/route.ts",nextConfigOutput:"standalone",userland:t}),{requestAsyncStorage:d,staticGenerationAsyncStorage:p,serverHooks:h}=c,b="/ai.txt/route";function g(){return(0,i.patchFetch)({serverHooks:h,staticGenerationAsyncStorage:p})}},2153:(e,o,r)=>{r.d(o,{Ub:()=>s,n6:()=>i});var t=r(9750),a=r(6438);function s(){let e=function(){let e=[{slug:"home",route:"/",lastModified:new Date().toISOString(),changeFrequency:"daily",priority:1},{slug:"pillars",route:"/pillars",lastModified:new Date().toISOString(),changeFrequency:"weekly",priority:.8},{slug:"categories",route:"/categories",lastModified:new Date().toISOString(),changeFrequency:"weekly",priority:.7}];return t.vC.forEach(o=>{e.push({slug:`tool-${o}`,route:`/tools/${o}`,lastModified:new Date().toISOString(),changeFrequency:"monthly",priority:.9})}),a.Lj.forEach(o=>{e.push({slug:`pillar-${o.slug}`,route:`/pillars/${o.slug}`,lastModified:new Date().toISOString(),changeFrequency:"weekly",priority:.8})}),a.UM.forEach(o=>{e.push({slug:`authority-${o.slug}`,route:`/pillars/${o.slug}`,lastModified:new Date().toISOString(),changeFrequency:"weekly",priority:.8})}),e}(),o=e.filter(e=>e.slug.startsWith("tool-")),r=e.filter(e=>e.slug.startsWith("pillar-")||e.slug.startsWith("authority-"));return`# XFree: 150+ Free Privacy-First Developer & SEO Tools

## What is XFree?
XFree is the ultimate free online toolbox for developers and SEO professionals. We provide 150+ completely free online tools organized into 55 thematic pillars.

## Key Features
- 100% free with no signup required
- All tools run client-side in your browser
- Your data never leaves your device
- Privacy-first approach with zero tracking
- Optimized for both humans and AI crawlers

## Available Tools (${o.length})

### Developer Tools
- JSON Formatter, Minifier, Validator
- Regex Tester, Builder, Explainer
- Base64 Encoder/Decoder
- URL Encoder/Decoder
- Hash Generator (MD5, SHA-256, SHA-512)
- Password Generator
- UUID Generator
- JWT Decoder/Encoder
- SQL Formatter
- Cron Expression Generator
- HTML/CSS/JS Minifier
- YAML Validator

### SEO Tools
- XML Sitemap Generator
- robots.txt Generator
- Meta Tag Generator (Open Graph, Twitter Cards)
- Schema Markup Generator (FAQ, HowTo, Product)
- URL Slug Generator
- UTM Builder

### Security & Privacy Tools
- Hash Generator
- Password Generator with strength checker
- JWT Decoder
- Email/URL/Phone Validators

### Text & Data Tools
- Word Counter, Character Counter
- Diff Tool
- Case Converter
- CSV to JSON Converter
- JSON to CSV Converter

## Tool Pillars (${r.length})

### Authority Pillars
- JSON Data Tools Hub
- Regex & Pattern Tools Hub
- Encoding & Conversion Tools Hub

### Developer Pillars
- Code Formatters Hub
- Validators & Debuggers Hub
- API Development Tools Hub
- Database Tools Hub
- Version Control Tools Hub
- Shell & Command Tools Hub

### SEO Pillars
- Sitemap Generator Tools Hub
- Meta Tag Generator Tools Hub
- Schema Markup Tools Hub
- SEO Audit Tools Hub
- Performance Optimization Tools Hub
- URL Analysis Tools Hub

### Security Pillars
- Hash Generator Tools Hub
- Password Generator & Manager Tools Hub
- Token Decoder & Encoder Tools Hub
- Encryption & Decryption Tools Hub
- SSL & Certificate Tools Hub

### Media & Document Pillars
- PDF Conversion Tools Hub
- PDF Editing Tools Hub
- Document Converter Tools Hub
- Markdown Tools Hub

### Business Pillars
- Text Analysis & NLP Tools Hub
- Case Conversion Tools Hub
- List & Table Utilities Hub
- Calculator & Converter Tools Hub
- Generator & Random Data Tools Hub

## Privacy Commitment
All XFree tools run 100% in your browser using:
- JavaScript Web APIs
- Web Crypto API for cryptographic operations

Your data never leaves your device unless explicitly stated.

## How to Use XFree Tools
1. Browse categories or search for the tool you need
2. Enter your text, JSON, URLs, or other data
3. Get instant formatted, validated, or converted output
4. Copy results or download files

## Organization
Website: https://www.xfree.in
Contact: https://www.xfree.in/contact
FAQ: https://www.xfree.in/faq
Privacy Policy: https://www.xfree.in/privacy

## License
All XFree tools are free for personal and commercial use under the MIT License.

---
Last updated: September 2026`}function i(){return`# AI Crawler Access Policy

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
`}}};var o=require("../../webpack-runtime.js");o.C(e);var r=e=>o(o.s=e),t=o.X(0,[948,59,750,438],()=>r(9479));module.exports=t})();