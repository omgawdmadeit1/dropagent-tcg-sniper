# dropagent.lvlltd.com

## DNS (Cloudflare → lvlltd.com)

Add this record so `https://dropagent.lvlltd.com` resolves:

| Type | Name | Content | Proxy status |
|------|------|---------|--------------|
| CNAME | `dropagent` | `omgawdmadeit1.github.io` | **DNS only** (grey cloud) |

Or for Vercel instead:

| Type | Name | Content | Proxy status |
|------|------|---------|--------------|
| CNAME | `dropagent` | `cname.vercel-dns.com` | **DNS only** |

## After DNS propagates

1. GitHub Pages custom domain is already set to `dropagent.lvlltd.com` on this repo.
2. Wait for DNS (usually 1–5 min on Cloudflare).
3. Open https://dropagent.lvlltd.com

## Works right now (no DNS needed)

- Full app: https://cdn.jsdelivr.net/gh/omgawdmadeit1/dropagent-tcg-sniper@gh-pages/index.html
- Vercel entry: https://dropagent-tcg-sniper.vercel.app
- Source: https://github.com/omgawdmadeit1/dropagent-tcg-sniper
