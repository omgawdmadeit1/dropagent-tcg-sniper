# Custom domain: dropagent.lvlltd.com

## Cloudflare DNS (lvlltd.com)

Add this record:

| Type  | Name       | Target                         | Proxy |
|-------|------------|--------------------------------|-------|
| CNAME | dropagent  | omgawdmadeit1.github.io        | DNS only (grey cloud) |

Then re-add a `CNAME` file containing `dropagent.lvlltd.com` on the `gh-pages` branch
and enable HTTPS in GitHub Pages settings.

Alternate (Vercel):
| Type  | Name       | Target                    | Proxy |
|-------|------------|---------------------------|-------|
| CNAME | dropagent  | cname.vercel-dns.com      | DNS only |
