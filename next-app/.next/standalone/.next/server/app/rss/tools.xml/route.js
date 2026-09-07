(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[349],{2067:e=>{"use strict";e.exports=require("node:async_hooks")},6195:e=>{"use strict";e.exports=require("node:buffer")},7371:(e,t,r)=>{"use strict";r.r(t),r.d(t,{ComponentMod:()=>b,default:()=>k});var o={};r.r(o),r.d(o,{GET:()=>d,runtime:()=>c});var s={};r.r(s),r.d(s,{originalPathname:()=>f,patchFetch:()=>h,requestAsyncStorage:()=>m,routeModule:()=>w,serverHooks:()=>x,staticGenerationAsyncStorage:()=>g});var n=r(932),a=r(2561),l=r(4828),i=r(6631),p=r(9985),u=r(7102);let c="edge";async function d(){let e=u.Tk.filter(e=>e.indexable),t=new Date().toUTCString(),r=`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>XFree Tools - Free Developer &amp; SEO Tools</title>
    <link>https://www.xfree.in</link>
    <description>Latest free privacy-first developer and SEO tools from XFree</description>
    <language>en-US</language>
    <lastBuildDate>${t}</lastBuildDate>
    <atom:link href="https://www.xfree.in/rss/tools.xml" rel="self" type="application/rss+xml"/>
    <ttl>60</ttl>
    <image>
      <url>https://www.xfree.in/favicon.ico</url>
      <title>XFree Tools</title>
      <link>https://www.xfree.in</link>
    </image>
    ${e.map(e=>`
    <item>
      <title><![CDATA[${e.title}]]></title>
      <link>https://www.xfree.in/tools/${e.slug}</link>
      <guid isPermaLink="true">https://www.xfree.in/tools/${e.slug}</guid>
      <description><![CDATA[${e.shortDescription} - ${e.explanation}]]></description>
      <dc:creator>XFree</dc:creator>
      <category>${e.categoryLabel}</category>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <keywords>${e.tags.join(", ")}</keywords>
    </item>`).join("")}
  </channel>
</rss>`;return new p.xk(r,{headers:{"Content-Type":"application/rss+xml; charset=utf-8","Cache-Control":"public, max-age=3600"}})}let w=new a.AppRouteRouteModule({definition:{kind:l.x.APP_ROUTE,page:"/rss/tools.xml/route",pathname:"/rss/tools.xml",filename:"route",bundlePath:"app/rss/tools.xml/route"},resolvedPagePath:"/workspace/63b72ac8-352e-4e5b-b366-7b9bdabc09e7/sessions/agent_eaa788bc-8e62-43be-b9cc-0b95bb7515e6/next-app/app/rss/tools.xml/route.ts",nextConfigOutput:"standalone",userland:o}),{requestAsyncStorage:m,staticGenerationAsyncStorage:g,serverHooks:x}=w,f="/rss/tools.xml/route";function h(){return(0,i.XH)({serverHooks:x,staticGenerationAsyncStorage:g})}let b=s,k=n.a.wrap(w)}},e=>{var t=t=>e(e.s=t);e.O(0,[546,29],()=>t(7371));var r=e.O();(_ENTRIES="undefined"==typeof _ENTRIES?{}:_ENTRIES)["middleware_app/rss/tools.xml/route"]=r}]);
//# sourceMappingURL=route.js.map