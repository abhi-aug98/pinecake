# Pinewake Exchange – Tracking Lab (fictional test site)

Static mock marketplace for practising GTM + dataLayer + Fullstory implementation.
GTM container: **GTM-M5HQ3Z9K** (loaded on every page; the harness panel can load another for testing).
Hosted on GitHub Pages, no build step.

## Page object `window.trk`
`pagename, channel, statename, statecode, city, zipcode, dma, canary, sitetype`
(pagenames: home, search, vdp, sell, login, about, help)

## Fullstory simulator
`window.FS` records calls to the on-page log (Copy log / Clear / Hide / Close). Supports
`FS('trackEvent', {name, properties})`, `FS('setIdentity', …)`, `FS.event`, `FS.identify`, `FS.setUserVars`.
The site itself never calls FS; tags built in GTM do.

## No dataLayer events
The site never pushes events: `dataLayer` is a static array (only GTM's own `gtm.js` entry appears).
All data lives on `window.trk`, set before GTM loads. Build triggers from the DOM (clicks, form submit, element visibility).

### Extra `trk` fields
| Page | Fields |
|---|---|
| vdp | listing_id, make, model, year, price (numeric, **omitted when "Call for price"**), condition, listing_type; `lead_ref` is added after a successful lead |
| search | search_term, result_count, filter_type, filter_make, filter_max_price, sort, page_number |
| sell | `ad_ref` after submit |
| login | `user_id` after successful login / account creation |
| vdp calculator | `monthly_payment` after Calculate |

### DOM hooks for triggers
- `[data-track="..."]` ids on nav, footer, cards (`listing-card-title`, `listing-card-image`, `save-listing`), gallery (`gallery-prev/next`), `share-listing`, `lead-submit`.
- Phone buttons: `data-track="phone-reveal"` with `data-placement="main"` (listing page) or `"similar"` / `"search"` / `"featured"` (cards), plus `data-listing-id`.
- Cards carry `data-listing-id`, `data-make`, `data-price` (absent if none), `data-placement`, `data-position`.
- Lead success: `#lead-ok` becomes visible (not hidden) with `data-lead-ref` and `data-listing-id`. A click on `#lead-btn` is not a success.
- Lead failure: `#lead-msg` shows an error. An email ending in `@fail.test` simulates a server error.
- Sell success: `#sell-ok` visible with `data-ad-ref`. Login: password `test1234`.
