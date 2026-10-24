# Pinewake Exchange – Tracking Lab (fictional test site)

Static mock marketplace for practising GTM + dataLayer + Fullstory implementation.
GTM container: **GTM-P52KNDDB** (loaded on every page; the harness panel can load another for testing).
Hosted on GitHub Pages, no build step.

## Page object `window.trk`
`pagename, channel, statename, statecode, city, zipcode, dma, canary, sitetype`
(pagenames: home, search, vdp, sell, login, about, help)

## Fullstory simulator
`window.FS` records calls to the on-page log (Copy log / Clear / Hide / Close). Supports
`FS('trackEvent', {name, properties})`, `FS('setIdentity', …)`, `FS.event`, `FS.identify`, `FS.setUserVars`.
The site itself never calls FS; tags built in GTM do.

## dataLayer events (props omitted when empty, e.g. `price` when "Call for price")
| Event | Fires | Key props |
|---|---|---|
| page_view | every page load | trk fields, page_url/path/title |
| search_submitted | home or results keyword submit | search_term, search_location |
| search_results_viewed | search page load | search_term, result_count, filters, sort, page_number |
| search_no_results | zero results | search_term, filters |
| filter_applied / sort_changed / pagination_clicked | results interactions | filter_*, sort, page_number |
| listing_impression | card 50% visible (once) | listing_id, make, price, placement (featured/search/similar), position |
| listing_clicked | card link click | same + placement, position |
| listing_viewed | VDP load | listing_id, make, price (numeric, omitted if none), condition, year, listing_type |
| gallery_interaction | VDP next/prev | listing_id, action, image_index |
| phone_revealed | phone button | listing_id, placement (`main` vs `similar`) |
| listing_saved / listing_unsaved | save toggle | listing_id, make, price, placement |
| share_clicked | VDP share | listing_id, method |
| payment_calculated | calculator (priced listings) | listing_id, price, down_payment, term_months, apr, monthly_payment |
| lead_form_started | first field focus | listing_id |
| lead_submit_clicked | submit click (NOT a lead) | listing_id |
| lead_submitted | send succeeded only | listing_id, lead_ref, make, price |
| lead_failed | validation or server error | listing_id, error_type, error_field |
| sell_started / sell_step_completed / sell_step_failed / ad_submitted | sell flow | step, step_name, ad_ref, price |
| login_succeeded / login_failed / account_created / account_failed / auth_mode_toggled | login page (password `test1234`) | user_id, method, error_type |
| faq_expanded | help accordion | faq_id, faq_question |
| newsletter_submitted / newsletter_failed | footer form | location, error_type |
| element_click | any `[data-track]` element | click_id, click_text, click_url, click_outbound |

Tip: an email ending in `@fail.test` simulates a lead server error.
