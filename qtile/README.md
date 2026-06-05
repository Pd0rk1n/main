# qtile-kiro

The Kiro qtile configuration. A merge of two upstream configs:

- **Visual design** (DoomOne colour scheme, bar layout, widgets, circle GroupBox)
  comes from the DTOS / CachyOS qtile (`qtile`).
- **Keybindings are authoritative from `qtile-erik`**:
  - Window-management keys are native qtile bindings in [config.py](config.py).
  - Application launchers, multimedia, screenshot and wallpaper keys live in
    [sxhkd/sxhkdrc](sxhkd/sxhkdrc) and are started by
    [scripts/autostart.sh](scripts/autostart.sh) — sxhkd replaces qtile's native
    key handling for those, exactly as in qtile-erik.

## Design principle

> **What** (keys + the apps they launch) = qtile-erik, verbatim.
> **How it looks** (colours, borders, fonts, bar, widgets) = DTOS DoomOne.

## Layout

| Path | Source | Purpose |
|------|--------|---------|
| `config.py` | merged | qtile config: DTOS bar + qtile-erik window keys + sxhkd autostart hook |
| `colors.py` | qtile (DTOS) | colour schemes; `DoomOne` is the active default |
| `sxhkd/sxhkdrc` | qtile-erik | authoritative app / media / screenshot keybindings |
| `scripts/` | qtile-erik | autostart.sh (starts sxhkd), compositor toggles (fastcompmgr/picom), system-overview conky |
| `rofi/` | qtile-erik | rofi launcher themes referenced by sxhkd |
| `icons/` | qtile + qtile-erik | bar icon (`cachyos.svg`) + horizontal battery icons |
| `arcobattery.py` | qtile-erik | battery icon widget (available, not enabled by default) |

## Install

Deploy to `~/.config/qtile/`. On first start the `startup_once` hook runs
`scripts/autostart.sh`, which launches sxhkd against `sxhkd/sxhkdrc`.

## Notes / things to revisit

- App targets are kept **verbatim** from qtile-erik (vivaldi, archlinux-logout,
  variety, conky, xfce4-*). Swap to Kiro equivalents later if needed.
- The DTOS emacs/dmscripts `KeyChord` menus were intentionally dropped (they collided
  with qtile-erik's `Super+e`=code and `Super+p`=wallpaper).
- Bar icon is still the DTOS `cachyos.svg`; replace with a Kiro logo when one exists.
- Validate on the target box with `qtile check` before shipping (qtile CLI was not
  available where this was assembled).
