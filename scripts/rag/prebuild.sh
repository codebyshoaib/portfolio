#!/usr/bin/env bash
#
# Rebuilds the retrieval index before every build.
#
# Half the corpus lives in Sanity, which changes without touching the repo, so a
# committed index goes stale silently — the twin keeps answering from whatever
# was true at the last `pnpm rag:index`. Rebuilding here means a deploy always
# ships a twin that knows what the CMS knows.
#
# Deliberately non-fatal: index.json is committed, so a Jina or Sanity outage
# falls back to the last known-good index rather than failing the deploy. That
# is the one case where shipping a stale index is the right call — the
# alternative is a portfolio that will not deploy because someone else's API is
# down. The warning is loud so it does not become the silent default.

set -uo pipefail

if [ -z "${JINA_API_KEY:-}" ]; then
  echo "prebuild: JINA_API_KEY unset — keeping the committed index" >&2
  exit 0
fi

if tsx scripts/rag/build-index.ts; then
  echo "prebuild: index rebuilt"
else
  echo "prebuild: WARNING — index rebuild failed, deploying the committed index" >&2
  echo "prebuild: the twin may not know about recent CMS edits" >&2
fi

exit 0
