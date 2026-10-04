# src/shared

Canonical, pure (no I/O) domain code shared by **admin** (this repo, the owner)
and **web**. Edit it here only, then run `pnpm sync:web`. The web repo checks the
checksum in `SHARED_CHECKSUM` and fails its tests if its copy was edited locally.
