# Changelog

## 2026.05.29

### What Changed
- **Keybinding audit + fixes.** Found bindings that pointed at uninstalled programs or
  were dead duplicates, and fixed the ones that had installed equivalents.
  - **config.py:** `super+shift+Left/Right` were bound twice — the `swap_left/swap_right`
    intent was dead (qtile kept the later move-to-screen binding, logging
    "Key spec duplicated"). Removed the dead pair and documented the intent.
    Repointed bar click callbacks off missing binaries: launchbar 📁 `pcmanfm`→`thunar`,
    CPU/Memory `htop`→`btop`, DF `notify-disk`→`alacritty -e "df -hT; read"`, Clock
    `notify-date`→`yad --calendar`, logo `qtilekeys-yad`→`yad --text-info` of the sxhkdrc.
  - **sxhkd/sxhkdrc:** removed the conky bindings whose targets aren't installed —
    `super+c` (conky-toggle), `super+ctrl+c` (killall conky), `ctrl+alt+Next`/`Prior`
    (conky-rotate). Also deleted the remaining bindings whose targets aren't installed:
    `super+F9`/`super+m` (lollypop), `super+t` (urxvt), `ctrl+alt+i` (nitrogen).
  - Still missing but not keybindings: autostart launches `conky` and `dex` (not installed).
- **Fixed deprecated qtile command API (pre-existing breakage).** The config called
  `qtile.cmd_spawn` (5 bar click callbacks) and `qtile.cmd_to_screen` (move-to-screen
  helpers) — the `cmd_` prefix was dropped in current qtile, so every bar click and the
  `super+shift+Left/Right` move-to-screen threw `AttributeError` on use. Renamed to
  `qtile.spawn` / `qtile.to_screen`. Surfaced by clicking the CPU widget after restart.
- **Removed per-group duplicate Tab bindings.** The four group-cycling keys
  (`mod`/`alt` + Tab and their shift variants) were inside the `for i in groups` loop, so
  they were registered 10× and qtile logged "Key spec duplicated" on every startup. Moved
  them to a single `keys.extend` before the loop; only the per-group `mod+N` /
  `mod+shift+N` bindings stay in the loop. Startup log is now warning-free.
- **Python lint pass (ruff, beyond defaults).** Default `ruff check` was already clean;
  ran an extended ruleset (E,W,F,I,B,SIM,UP) at line-length 120 and fixed the findings,
  all in `arcobattery.py` (legacy code from qtile-erik): dropped the unnecessary
  `from __future__ import division`, sorted imports, removed the redundant `'r'` mode on
  `open()`, replaced `IOError` with `OSError`, switched the `log.exception` %-format to a
  lazy logging arg, and rewrote `dict([(x, '{0}.png'.format(x)) for ...])` as a dict
  comprehension with an f-string. Wrapped the over-120 commented AZERTY `group_names`
  line in `config.py`. Left `widget_defaults = dict(...)` as-is (idiomatic qtile style).
- Removed all **ArcoLinux** references from the config. Deleted the `arcolinux-powermenu`
  (`super+shift+x`) and `arcolinux-welcome-app` (`ctrl+alt+w`) sxhkd bindings, the
  `arcolinux-welcome-app.desktop` autostart line, and the two `Arcolinux-*` floating
  `Match` rules in `config.py`. Neutralised the scrot screenshot filename prefix
  (`ArcoLinux-` → none) and rebranded doc/comment mentions (README, TODO,
  `scripts/system-overview` header → Kiro). The 5 `themes/arcolinux-*.theme` files
  (unused by the active config) were already gone from disk at session start — removed
  externally (likely Insync sync), not by this change.
- Changed the bar logo from `icons/archlinux-white.svg` to `icons/favicon-32.png`
  (`widget.Image` in `config.py`).
- **Added a lightweight config-reload binding.** `alt+shift+r` now runs
  `lazy.reload_config()` (re-reads `config.py` in the running process — instant, no
  flicker, windows untouched), alongside the existing `super+shift+r` full
  `lazy.restart()`. Used `"mod1"` literal, not the `mod1 = "alt"` variable, which qtile
  rejects as an "Unknown modifier". Documented in `keybindings.txt` section 8.
- **Repointed `super+shift+f` to maximize.** Originally `lazy.layout.flip()`
  (monadtall/wide master-side flip), briefly remapped to `toggle_fullscreen`, then
  settled on `lazy.window.toggle_maximize()` so it pairs cleanly with `super+f`:
  `super+f` = true fullscreen (1920×1080, bar hidden), `super+shift+f` = maximize
  (1920×1042 @ y=38, bar stays visible). The layout-flip binding is displaced; bsp flip
  remains on `super+alt+h/j/k/l`. Moved in `keybindings.txt` from section 4 to
  section 2.

### What Changed (earlier)
- Created **qtile-kiro**, a new qtile config merging the DTOS/CachyOS visual design
  with qtile-erik's authoritative keybindings. Goal: keep the DoomOne look while the
  keybindings (and the apps they launch) stay exactly as in qtile-erik.

### Technical Details
- **Design / "how it looks" — from DTOS (`qtile`):** DoomOne colour scheme
  (`colors.py` copied verbatim), `widget_defaults` (Ubuntu Bold, `colors[0]` bg),
  full DoomOne bar (Spacer + icon Image + Prompt + circle GroupBox + `|` separators
  + LaunchBar + CurrentLayout + WindowName + kernel GenPollText + CPU/Memory/DF/
  Volume/Clock + tray), bar margins `[8,12,0,12]` size 30, 3-screen setup with the
  systray removed on secondary screens, and `tray_widget()` selecting
  StatusNotifier (Wayland) vs Systray (X11). Group labels use the DTOS circles `⬤`.
- **Keybindings / "what" — from qtile-erik, verbatim:** the entire window-management
  `keys` list (focus/resize/flip/shuffle/swap, `window_to_next/previous_screen`),
  the group bindings (mod+N switch, mod+shift+N move-and-follow, Tab/alt-Tab group
  cycling), the qtile-erik layout set (MonadTall, MonadWide, Matrix, Bsp, Floating,
  RatioTile, Max) styled with DoomOne borders, the archlinux-logout bar hide/show
  hooks, `set_floating`/`start_always` hooks, and the qtile-erik floating
  `float_rules`. App launchers remain in `sxhkd/sxhkdrc` (copied verbatim); the
  `startup_once` hook runs `scripts/autostart.sh`, which starts sxhkd.
- **Dropped:** DTOS emacs/dmscripts `KeyChord` menus (collided with qtile-erik's
  `Super+e` and `Super+p`); the DTOS `autostart-x11/wayland` scripts (replaced by
  qtile-erik's `scripts/autostart.sh` sxhkd model).
- **Lint:** removed unused `Click` import, replaced two `== True` comparisons
  (E712) carried over from qtile-erik. `ruff check` passes.

### Files Modified
- `config.py` (new, merged)
- `colors.py` (copied from DTOS qtile)
- `sxhkd/sxhkdrc`, `scripts/`, `rofi/`, `themes/`, `arcobattery.py` (copied from qtile-erik)
- `icons/` (DTOS bar icons + qtile-erik horizontal battery icons)
- `README.md`, `TODO.md`, `IDEAS.md` (new)
- `keybindings.txt` (added `alt+shift+r` reload entry)
