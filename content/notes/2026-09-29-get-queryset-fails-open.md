---
title: "get_queryset fails open. Postgres RLS fails closed."
slug: "get-queryset-fails-open"
date: "2026-09-29"
summary: "I'm picking up Supabase and compared its Row Level Security to how I scope tenants in DRF. The useful difference is what happens when someone forgets. Plus three Postgres behaviours I checked in a throwaway container that will bite a Django app adopting RLS."
tags: ["postgres", "django", "supabase", "multi-tenancy", "security"]
---

In DRF I scope tenants the way most people do. Override `get_queryset`, filter by `request.user.org_id`, move on.

Supabase doesn't give you that layer. The browser talks to Postgres through PostgREST with a public key, so the only thing between a user and every row in the table is a Row Level Security policy. Learning it as a Django dev, I kept trying to map it onto `get_queryset`. The mapping mostly holds. The part that doesn't is the part worth writing down.

## What happens when someone forgets

Forget `get_queryset` on one viewset and that endpoint returns every tenant's data. No error, no warning, a green test suite if nobody wrote the cross-tenant test.

Enable RLS on a table and forget to write a policy, and a normal role gets zero rows. The mistake shows up as an empty list on your own screen instead of someone else's data on a customer's.

One fails open. The other fails closed. That is most of the argument for RLS in one line.

## Where get_queryset quietly isn't called

The viewset is only one road to the table. These are the ones I'd audit first in any DRF codebase:

- `PrimaryKeyRelatedField(queryset=Classroom.objects.all())`. DRF validates the incoming ID against that queryset, not against `get_queryset`, so tenant A can attach tenant B's classroom by sending its ID.
- Celery tasks and signals calling `Model.objects` directly.
- Custom `@action` methods that query without going through `self.get_queryset()`.
- Sync or bulk endpoints doing `bulk_create` or `update_or_create` straight from a client payload.
- `raw()`, and the admin.

All of them end up as SQL against the same table, which is exactly where RLS sits.

## Three things I checked before believing them

I ran these on `postgres:16-alpine` in a throwaway container rather than trusting my reading of the docs.

### The table owner skips your policies

Django's DB user usually owns the tables because it ran the migrations. With RLS enabled and a policy in place, the owner still counted 2 of 2 rows. Nothing was filtered.

```sql
alter table todos force row level security;
```

After that, the owner got 0 rows with no tenant set and 1 row with one. A superuser still saw both rows even with `force`, so the app can't connect as one.

### Postgres has no request.user, so you pass the tenant in

Middleware sets it inside the request's transaction (`ATOMIC_REQUESTS = True`):

```python
cursor.execute("select set_config('app.org_id', %s, true)", [str(request.user.org_id)])
```

The `true` makes it transaction-local. With a pooler like pgbouncer in transaction mode, a session-level setting would still be there for whichever request picks up that connection next.

### The empty string on a reused connection

This one surprised me. After the transaction that set `app.org_id` commits, the same connection reports the setting as `''`, not NULL. So the obvious policy:

```sql
using (org_id = current_setting('app.org_id', true)::uuid)
```

works on a fresh connection and raises `invalid input syntax for type uuid: ""` on a reused one that didn't set a tenant. It still fails closed, but as a 500 that only shows up once connections are being reused, so you're unlikely to see it on your laptop. Wrap it:

```sql
using (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
```

## What RLS costs

RLS is invisible. A query returns 100 rows and nothing in the response says a policy filtered the other 900. The Supabase SQL editor runs as `postgres` and skips RLS, so the dashboard and the app disagree and people blame the frontend. The fastest way I found to see the effective rule is `EXPLAIN` after `set local role`, which shows every policy for the table merged into one filter.

You also lose pdb. Complex rules written as SQL expressions get hard to reason about quickly.

## How I'd split it in a Django app

RLS gets one boring rule per tenant table, `org_id` matches the request's org, `force`d, with a CI query that fails if any tenant table has `rowsecurity = false`. Its only job is making sure a request can never see another tenant's row.

Roles, ownership inside a tenant and soft deletes stay in `get_queryset` and permission classes, where I can debug them. A missed `get_queryset` then turns into a bug inside one tenant, not a leak across tenants.
