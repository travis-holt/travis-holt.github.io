# Ad creatives in the grid

Pulled from your Drive folders and re-encoded for the web (H.264, 1080×1920,
`+faststart` for progressive streaming). Your full-quality masters are in Drive;
the untouched downloads are also stashed locally in `_orig/` (git-ignored).

| File | Poster | Grid label (edit in `script.js`) |
|------|--------|----------------------------------|
| `nerve-patch.mp4` | `nerve-patch.jpg` | Problem–agitate hook |
| `ic-1.mp4`        | `ic-1.jpg`        | Founder-style talking head |
| `ic-2.mp4`        | `ic-2.jpg`        | “3 reasons” listicle |
| `knife-1.mp4`     | `knife-1.jpg`     | Hook test · variation 1 |
| `knife-2.mp4`     | `knife-2.jpg`     | Hook test · variation 2 |
| `knife-3.mp4`     | `knife-3.jpg`     | Hook test · variation 3 |

> ⚠️ The labels are my best guess at each hook style — **edit them to match the
> real format** of each ad in the `REELS` array at the top of `../script.js`.
> That array is the single source of truth: change order, labels, posters, or
> add/remove tiles there.

## Re-poster a different frame
```bash
ffmpeg -y -ss 2 -i knife-1.mp4 -frames:v 1 -q:v 3 knife-1.jpg   # grab frame at 2s
```

## Re-encode smaller (if you want lighter files)
The knife clips are the heaviest (~39 MB) because they're high-motion at 1080p.
Bump the CRF for smaller files (higher = smaller/softer):
```bash
ffmpeg -y -i _orig/knife-1.mp4 -c:v libx264 -preset faster -crf 30 \
  -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 96k knife-1.mp4
```
