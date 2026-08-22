# XFree.in AdSense readiness runbook

Last reviewed: 2026-08-23

This is the production monetization runbook for XFree. It distinguishes **Google-published requirements** from **XFree's stricter internal publishing guardrails**. Passing these checks improves policy readiness; it does not guarantee AdSense approval, which remains Google's decision.

## Current publisher identity

- AdSense client: `ca-pub-3573741815038097`
- ads.txt seller ID: `pub-3573741815038097`
- canonical ads.txt row: `google.com, pub-3573741815038097, DIRECT, f08c47fec0942fa0`
- canonical site: `https://www.xfree.in`

## Google policy requirements XFree enforces

### Valuable publisher content

Google Publisher Policies do not publish a universal minimum word count. They do prohibit Google-served ads on screens without publisher content or with low-value content, and warn against automatically generated content without manual review.

XFree therefore uses a deliberately stricter internal publication floor for every **indexable tool page**:

- at least 350 visible words in the prerendered document;
- at least 3 FAQ questions represented in the page's FAQ JSON-LD;
- a self-canonical URL;
- `index,follow` only after the tool is actually implemented and reviewed;
- substantive overview, usage instructions, worked examples, limitations/troubleshooting, and processing disclosure;
- no planned/roadmap stub enters the tool sitemap.

The 350-word and 3-FAQ values are **XFree rules, not Google numeric requirements**.

Reference: https://support.google.com/publisherpolicies/answer/11112688

### Ads must not interfere with actions or content

Google prohibits ads that overlay or are immediately adjacent to navigation/action items when that positioning may cause unintended interactions. Google does not publish a universal 150-pixel separation requirement.

XFree applies a project-specific 160-pixel top separation guardrail for manual `AdSenseUnit` placements and only renders them after substantive educational/tool guidance. Ad units are:

- explicitly labelled `Advertisement`;
- rendered only when a real approved slot ID is configured;
- not hidden with `display:none` or deceptive CSS;
- not used as overlays, sticky click targets, or replacements for navigation;
- not rendered on `/privacy`, `/terms`, or `/contact` by the current page templates.

References:
- https://support.google.com/publisherpolicies/answer/11035030
- https://support.google.com/publisherpolicies/answer/11127388

### Privacy disclosures

Google requires publisher privacy policies to disclose data collection/sharing/use resulting from Google products, including cookies, web beacons, IP addresses, or other identifiers. AdSense's required-content guidance also states that third-party vendors including Google use cookies for ad serving and that users must be told how to opt out of personalized ads.

XFree's `/privacy` page explicitly discloses:

- Local Mode processing versus site/network requests;
- Google AdSense and third-party advertising cookies/identifiers;
- prior-visit based ad personalization;
- Google Ads Settings opt-out;
- Google's partner-sites data-use page;
- Cloud AI data flows separately from advertising;
- consent/CMP treatment where legally required.

References:
- https://support.google.com/publisherpolicies/answer/10437794
- https://support.google.com/adsense/answer/1348695
- https://support.google.com/adsense/answer/7549925

### Consent management in the EEA, UK, and Switzerland

When serving personalized ads to users in the EEA, UK, or Switzerland, Google requires publishers using AdSense to use a Google-certified CMP integrated with the IAB Transparency and Consent Framework. Non-personalized ads can still require consent for cookies/local storage where applicable.

A certified CMP and the desired AdSense privacy-message configuration are account/dashboard concerns as well as site concerns; they cannot be proven solely by a source-code build.

Reference: https://support.google.com/adsense/answer/13554116

### ads.txt

Google recommends placing the AdSense seller declaration at the site root. XFree ships exactly:

```text
google.com, pub-3573741815038097, DIRECT, f08c47fec0942fa0
```

The production gate fails if this row changes unexpectedly.

References:
- https://support.google.com/adsense/answer/7584263
- https://support.google.com/adsense/answer/9785052

## Implementation architecture

### Site connection

`index.html` contains the AdSense account meta tag:

```html
<meta name="google-adsense-account" content="ca-pub-3573741815038097" />
```

Google documents the meta tag as a supported site-connection method.

### Manual ad units

`src/components/AdSenseUnit.tsx` is the single manual ad-unit component. It does not load the Google ad script until a real slot is passed. When an approved `VITE_ADSENSE_TOOL_SLOT` exists, the component lazily loads:

```text
https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3573741815038097
```

This keeps pages from firing manual ad code merely because the application shell loaded.

### CSP

XFree's production CSP explicitly permits the Google endpoints currently used for AdSense/consent integrations while retaining:

- `default-src 'self'`;
- `base-uri 'self'`;
- `object-src 'none'`;
- `frame-ancestors 'none'`;
- HTTPS upgrading;
- controlled script/connect/frame allowlists.

The site intentionally does **not** send a blanket `Cross-Origin-Embedder-Policy` header because that can break third-party advertising/consent resources. COOP remains enabled.

The current CSP still uses `'unsafe-inline'` for compatibility. A future nonce/hash migration should be tested with Google's current AdSense CSP guidance before enforcement.

## Automated release gate

Run:

```bash
npm run validate:adsense
```

The command runs after prerender in both `npm run build` and `npm run build:vercel` and verifies:

1. `/privacy`, `/terms`, and `/contact` are prerendered/indexable trust pages.
2. Those trust pages are linked from the global footer.
3. Privacy contains the required Google advertising disclosures and opt-out links.
4. Contact exposes both direct email and public issue-tracker fallbacks.
5. `public/ads.txt` matches the assigned publisher ID exactly.
6. The AdSense account meta tag exists.
7. CSP contains the required Google ad/consent origins and no blanket COEP header.
8. Every URL in `sitemap-tools.xml` has at least 350 visible prerendered words and at least 3 FAQ schema questions.
9. Tool canonicals self-match and the pages are `index,follow`.
10. The manual ad component is labelled, visible, lazy-loaded, and carries XFree's safe-zone guardrail.

## Before requesting AdSense review

- Confirm `https://www.xfree.in/ads.txt` returns HTTP 200 and the exact publisher row.
- Confirm `/privacy`, `/terms`, `/contact`, `/about`, `/security`, and representative tool pages return HTTP 200.
- Confirm the footer links are visible without authentication.
- Confirm the production build has passed `validate:seo`, `validate:adsense`, and `lint:noindex`.
- Confirm no manual ad slot is configured with a placeholder/test ID.
- In AdSense, verify the site is connected with publisher ID `ca-pub-3573741815038097`.
- If serving personalized ads in the EEA/UK/Switzerland, configure and test a Google-certified TCF CMP before enabling that traffic treatment.
- Review mobile layouts for accidental-click risk, content obstruction, and excessive ad density.

## After approval

- Add the approved manual tool-slot ID as `VITE_ADSENSE_TOOL_SLOT` in the production environment if manual units are desired.
- Deploy through normal CI; never hardcode a guessed slot ID.
- Check AdSense Policy Center and ads.txt status after deployment.
- Re-run mobile interaction checks whenever tool controls or ad placements move.
- Keep roadmap/unbuilt pages out of manual ad inventory until they become substantive publisher-content surfaces.
