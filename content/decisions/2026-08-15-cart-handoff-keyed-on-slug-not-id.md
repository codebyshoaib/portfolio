---
title: "Key the cross-domain cart handoff on slugs, not on product IDs that match only by accident"
slug: "cart-handoff-keyed-on-slug-not-id"
date: "2026-08-15"
status: "accepted"
impact: "M"
domain: "commerce"
summary: "A client runs two WooCommerce stores, one a clone of the other, with working payment gateways on only one of them. Checkout on the first store now hands its cart to the second. Both installs share identical post IDs (54 products, 17800 to 17893, variation IDs matching too), which made an ID-keyed transfer an eight-line job. I keyed on product slug plus variation attributes instead, roughly triple the code, because nothing enforces that ID alignment and the failure mode when it drifts is a customer silently receiving the wrong item."
context: |
  Two WooCommerce stores for one client. The second was cloned from the first in August, so the catalogs are byte-identical: same 54 products, same post IDs 17800 to 17893, same variation IDs.
  Only the clone has working payment. PayPal and Google Pay are live there; on the original, PayPal was never onboarded and the only enabled gateway was Cash on Delivery renamed to look like an order form.
  So the cart gets built on one domain and paid for on the other. WooCommerce has no mechanism for this: the cart is a server-side session keyed to a domain-scoped cookie, so the receiving store has to re-identify every line item from scratch.
  The obvious stable key was unavailable. All 54 products have no SKU set. Every product is variable, with Size and Colour as local attributes rather than global taxonomies.
decision: |
  The transfer carries product slug plus the variation attribute map, url-safe base64 over JSON in the query string. No IDs cross the boundary.
  The receiving store resolves the slug with get_posts() on post_name, then turns the attributes back into a variation via find_matching_product_variation().
  Anything that fails to resolve increments a counter and surfaces a customer-visible notice, rather than falling back to a substitute product.
tradeoffs: |
  Roughly triple the code of an ID-keyed transfer, plus one extra query per line item on the receiving end, plus a not-found branch that an ID transfer would not need. I also moved the fragility rather than removing it: slugs are editable in WordPress, so renaming a product's permalink now breaks the transfer for that item. I accepted that because a slug edit is a deliberate act by someone who is looking at the product, while ID drift is a side effect of adding an unrelated product to one store.
revisitTrigger: |
  If SKUs get populated across both catalogs, switch the key to SKU: it is a cheaper lookup, it is immune to permalink edits, and it is the field that actually exists for this purpose. If the two stores ever collapse into one install with two domains, delete the whole mechanism instead of maintaining it.
options:
  - label: "Pass product and variation IDs"
    summary: "Eight lines, no lookup, works perfectly today because the clone made the IDs identical. Rejected: nothing enforces the alignment and nothing watches it. Add one product to either store and the sequences drift, after which the same ID means a different garment on each side."
  - label: "Pass SKUs"
    summary: "The field that exists for exactly this. Rejected on inspection: 54 of 54 products have no SKU set, and backfilling them across two live catalogs was a bigger change than the transfer itself."
  - label: "Share the cart session across both domains"
    summary: "Rejected as impossible rather than expensive. The session cookie is domain-scoped, so there is no supported way to make one store read the other's cart."
  - label: "Pass slug plus variation attributes"
    summary: "Chosen. Slug is content that was copied on purpose; the ID is a database counter that was copied incidentally. WooCommerce also hands you the attribute map already shaped the way add_to_cart() wants it."
takeaways:
  - "Separate what is true today from what is true by construction. If two systems line up and you cannot name the thing enforcing it, you are coupling to a coincidence."
  - "Silent-wrong beats loud-wrong at surviving your tests, so it deserves the extra code. I will write three times the lines to convert an invisible failure into a visible one, even when the failure may never arrive."
  - "wc_get_products() has no 'slug' query var. It does not error, it drops the argument and returns an arbitrary product, so the call looks like it worked."
  - "Assert on which object came back, not on how many. A result count of 1 was the thing that hid the bug."
  - "When an integration has two sides, deploy the passive one first. A receiver that does nothing without its trigger parameter can be activated on a live store at no risk, and then tested for real before anything customer-facing changes."
  - "Reasoning from a model of how a system works is how you form a hypothesis, not how you confirm one. Read the schema before you run DDL against it."
tags:
  - "woocommerce"
  - "wordpress"
  - "php"
  - "integration"
  - "ecommerce"
published: true
---

## Why the obvious key was not available

Cross-store transfers normally key on SKU. That is what the field is for, it is stable across installs, and WooCommerce gives you `wc_get_product_id_by_sku()` to resolve it.

I checked before designing anything. All 54 products had an empty SKU. Not most of them. All of them.

That left the two identifiers WooCommerce hands you for free: the post ID and the slug.

## The IDs matched, which was the trap

The second store was cloned from the first, so the post IDs were identical on both sides. Product 17849 was the same t-shirt on each. Variation IDs matched too, 17854 and 17855 resolving to the same White and Black rows.

An ID-keyed transfer would have been about eight lines. Put the IDs in the URL, read them on the other side, call `add_to_cart()`. Done before lunch, and it would have passed every test I could write that day.

The alignment is real. It is just not guaranteed by anything. Both installs allocate post IDs from their own `wp_posts` sequence, and the sequences agree only because someone copied a database in August. Add one product to either store, or one page, or one Elementor template, and they separate. From that point 17849 is a t-shirt on one side and something else on the other.

That drift does not throw. The cart fills, the total is correct, the customer checks out happy and receives the wrong garment. You find out weeks later from a shape in the refunds, and by then you cannot tell which orders were affected.

So the transfer carries slugs. The slug is content that was copied deliberately. The ID is a counter that was copied as a side effect.

## The lookup that lies

The first version of the receiver used what reads like the idiomatic call:

```php
$found = wc_get_products( array( 'slug' => $slug, 'limit' => 1 ) );
```

`WC_Product_Query` has no `slug` query var. It does not throw, it does not warn, and it does not come back empty. It drops the argument and returns whatever the unfiltered query hands it.

I asked for a tee and got a hoodie. One result. Purchasable, in stock, real.

Nothing about that fails a smoke test. The page renders, the cart populates, the total looks plausible. Had I checked whether a product came back instead of which product came back, this would have shipped and quietly mis-sold items until the refunds formed a pattern.

The debug line that caught it printed the resolved product ID. The count was 1 the whole time, and the count was the thing hiding it.

```php
$ids = get_posts( array(
    'name'        => $slug,
    'post_type'   => 'product',
    'post_status' => 'publish',
    'numberposts' => 1,
    'fields'      => 'ids',
) );

$product = $ids ? wc_get_product( $ids[0] ) : null;
```

Variations then resolve through `find_matching_product_variation()`, which takes the attribute map WooCommerce already stores on the cart item as `attribute_size` and `attribute_colour`. It also handles the "any size" case correctly, where the variation stores an empty string for the attribute.

## The other assumption I got wrong

Both stores run HPOS with sync off. I told the client their order numbers were going to collide, and wrote out an `ALTER TABLE` to bump the sequence past the other store's highest order.

I was reasoning from a model: HPOS stores orders in `wc_orders`, therefore `wc_orders` owns an `AUTO_INCREMENT`, therefore two clones drift into collision. Plausible. Wrong.

`wc_orders.id` is a plain `bigint NOT NULL` with no auto-increment. HPOS still allocates order IDs out of `wp_posts` by reserving a placeholder row. The receiving store's `wp_posts` was already past the other store's highest order number, so there was never a collision to fix.

I caught it because my verification query kept returning zero and I would not run the DDL without a number I could read back. That refusal was worth more than the diagnosis.

## What the extra code actually buys

Not correctness. An ID transfer is correct today and would stay correct for as long as nobody edits either catalog.

What the slug key buys is a failure that announces itself. When a product cannot be resolved the item is dropped, the counter increments, and the customer sees a notice saying so. That is a support ticket on the day it happens instead of a refund pattern six weeks later.

Plenty of engineers will call that over-engineering for a case that may never arrive. It is a fair reading. I would rather argue about eighty lines than read that refund thread.
