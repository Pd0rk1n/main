# Copyright (c) 2010 Aldo Cortesi
# Copyright (c) 2010, 2014 dequis
# Copyright (c) 2012 Randall Ma
# Copyright (c) 2012-2014 Tycho Andersen
# Copyright (c) 2012 Craig Barnes
# Copyright (c) 2013 horsik
# Copyright (c) 2013 Tao Sauvage
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

# Kiro qtile config:
#   - Visual design (DoomOne colours, bar, widgets) follows the DTOS/CachyOS qtile.
#   - Keybindings are authoritative from qtile-erik: window management lives here,
#     application/multimedia/screenshot launchers live in sxhkd/sxhkdrc and are
#     started by scripts/autostart.sh ("sxhkd to replace Qtile native key-bindings").

import os
import subprocess

from libqtile import bar, hook, layout, qtile, widget
from libqtile.config import Drag, Group, Key, Match, Screen
from libqtile.lazy import lazy

import colors

IS_WAYLAND = qtile.core.name == "wayland"
IS_X11 = qtile.core.name == "x11"

# mod4 or mod = super key
mod = "mod4"
mod1 = "alt"
mod2 = "control"
home = os.path.expanduser("~")

myTerm = "xfce4-terminal"

# ── Keybindings (authoritative: qtile-erik) ──────────────────────────────
# Application launchers, multimedia and screenshot keys live in sxhkd/sxhkdrc.
# Only window-management bindings are native to qtile, exactly as in qtile-erik.
keys = [

    # Most of our keybindings are in sxhkd file - except these
    # SUPER + FUNCTION KEYS

    Key([mod], "f", lazy.window.toggle_fullscreen()),
    Key([mod], "q", lazy.window.kill()),


    # SUPER + SHIFT KEYS

    Key([mod, "shift"], "q", lazy.window.kill()),
    Key([mod, "shift"], "r", lazy.restart()),
    Key([mod, "shift"], "t", lazy.spawn(home + "/.config/qtile/scripts/theme-switcher.sh"),
        desc="Pick a qtile colour theme (rofi)"),

    # ALT + SHIFT KEYS
    Key(["mod1", "shift"], "r", lazy.reload_config()),


    # QTILE LAYOUT KEYS
    Key([mod], "n", lazy.layout.normalize()),
    Key([mod], "space", lazy.next_layout()),

    # CHANGE FOCUS
    Key([mod], "Up", lazy.layout.up()),
    Key([mod], "Down", lazy.layout.down()),
    Key([mod], "Left", lazy.layout.left()),
    Key([mod], "Right", lazy.layout.right()),
    Key([mod], "k", lazy.layout.up()),
    Key([mod], "j", lazy.layout.down()),
    Key([mod], "h", lazy.layout.left()),
    Key([mod], "l", lazy.layout.right()),


    # RESIZE UP, DOWN, LEFT, RIGHT
    Key([mod, "control"], "l",
        lazy.layout.grow_right(),
        lazy.layout.grow(),
        lazy.layout.increase_ratio(),
        lazy.layout.delete(),
        ),
    Key([mod, "control"], "Right",
        lazy.layout.grow_right(),
        lazy.layout.grow(),
        lazy.layout.increase_ratio(),
        lazy.layout.delete(),
        ),
    Key([mod, "control"], "h",
        lazy.layout.grow_left(),
        lazy.layout.shrink(),
        lazy.layout.decrease_ratio(),
        lazy.layout.add(),
        ),
    Key([mod, "control"], "Left",
        lazy.layout.grow_left(),
        lazy.layout.shrink(),
        lazy.layout.decrease_ratio(),
        lazy.layout.add(),
        ),
    Key([mod, "control"], "k",
        lazy.layout.grow_up(),
        lazy.layout.grow(),
        lazy.layout.decrease_nmaster(),
        ),
    Key([mod, "control"], "Up",
        lazy.layout.grow_up(),
        lazy.layout.grow(),
        lazy.layout.decrease_nmaster(),
        ),
    Key([mod, "control"], "j",
        lazy.layout.grow_down(),
        lazy.layout.shrink(),
        lazy.layout.increase_nmaster(),
        ),
    Key([mod, "control"], "Down",
        lazy.layout.grow_down(),
        lazy.layout.shrink(),
        lazy.layout.increase_nmaster(),
        ),


    # MAXIMIZE (fills screen but keeps the bar; super+f is true fullscreen)
    Key([mod, "shift"], "f", lazy.window.toggle_maximize()),

    # FLIP LAYOUT FOR BSP
    Key([mod, "mod1"], "k", lazy.layout.flip_up()),
    Key([mod, "mod1"], "j", lazy.layout.flip_down()),
    Key([mod, "mod1"], "l", lazy.layout.flip_right()),
    Key([mod, "mod1"], "h", lazy.layout.flip_left()),

    # MOVE WINDOWS UP OR DOWN BSP LAYOUT
    Key([mod, "shift"], "k", lazy.layout.shuffle_up()),
    Key([mod, "shift"], "j", lazy.layout.shuffle_down()),
    Key([mod, "shift"], "h", lazy.layout.shuffle_left()),
    Key([mod, "shift"], "l", lazy.layout.shuffle_right()),

    # MOVE WINDOWS UP OR DOWN MONADTALL/MONADWIDE LAYOUT
    # shift+Left/Right are NOT bound here on purpose: they move a window to the
    # previous/next screen (see keys.extend below). Binding them twice made the
    # swap_left/swap_right dead (qtile kept the later move-to-screen binding).
    Key([mod, "shift"], "Up", lazy.layout.shuffle_up()),
    Key([mod, "shift"], "Down", lazy.layout.shuffle_down()),

    # TOGGLE FLOATING LAYOUT
    Key([mod, "shift"], "space", lazy.window.toggle_floating()),

    ]


def window_to_previous_screen(qtile, switch_group=False, switch_screen=False):
    i = qtile.screens.index(qtile.current_screen)
    if i != 0:
        group = qtile.screens[i - 1].group.name
        qtile.current_window.togroup(group, switch_group=switch_group)
        if switch_screen:
            qtile.to_screen(i - 1)


def window_to_next_screen(qtile, switch_group=False, switch_screen=False):
    i = qtile.screens.index(qtile.current_screen)
    if i + 1 != len(qtile.screens):
        group = qtile.screens[i + 1].group.name
        qtile.current_window.togroup(group, switch_group=switch_group)
        if switch_screen:
            qtile.to_screen(i + 1)


keys.extend([
    # MOVE WINDOW TO NEXT SCREEN
    Key([mod, "shift"], "Right", lazy.function(window_to_next_screen, switch_screen=True)),
    Key([mod, "shift"], "Left", lazy.function(window_to_previous_screen, switch_screen=True)),
])


def drag_window(qtile, x, y):
    """Super+drag handler. Floating windows are repositioned as before; a tiled
    window dragged onto another screen re-tiles there (joins that screen's group)
    instead of floating."""
    win = qtile.current_window
    if win is None:
        return
    if win.floating:
        win.set_position_floating(x, y)
        return
    px, py = qtile.core.get_mouse_position()
    for idx, screen in enumerate(qtile.screens):
        if (screen.x <= px < screen.x + screen.width
                and screen.y <= py < screen.y + screen.height):
            if screen is not qtile.current_screen:
                win.togroup(screen.group.name)
                qtile.focus_screen(idx, warp=False)
                # qtile suppresses focus/relayout mid-drag (see Group.focus);
                # force it so the window tiles and paints immediately instead
                # of waiting for the next click.
                win.group.focus(win, warp=False, force=True)
            break

# ── Groups (qtile-erik bindings, DoomOne circle labels from DTOS) ─────────
groups = []

def detect_group_names():
    """Return group names matching the active keyboard layout.

    Belgian AZERTY ('be') emits these keysyms on the unshifted number row, so
    Super+<physical 1..0> only reaches the group bindings when the names match
    them. Every other layout (QWERTY) just uses plain digits.
    """
    azerty_be = ["ampersand", "eacute", "quotedbl", "apostrophe", "parenleft",
                 "section", "egrave", "exclam", "ccedilla", "agrave",]
    qwerty = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0",]
    try:
        out = subprocess.check_output(["setxkbmap", "-query"], text=True)
        for line in out.splitlines():
            if line.startswith("layout:") and line.split()[1].split(",")[0] == "be":
                return azerty_be
    except Exception:
        pass
    return qwerty


group_names = detect_group_names()

# Circle labels from the DTOS design.
group_labels = ["⬤", "⬤", "⬤", "⬤", "⬤", "⬤", "⬤", "⬤", "⬤", "⬤",]
# group_labels = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0",]
# group_labels = ["Web", "Edit/chat", "Image", "Gimp", "Meld", "Video", "Vb", "Files", "Mail", "Music",]

group_layouts = ["monadtall", "monadtall", "monadtall", "monadtall",
                 "monadtall", "monadtall", "monadtall", "monadtall",
                 "monadtall", "monadtall",]

for i in range(len(group_names)):
    groups.append(
        Group(
            name=group_names[i],
            layout=group_layouts[i].lower(),
            label=group_labels[i],
        ))

# CYCLE GROUPS (registered once, not per-group)
keys.extend([
    Key([mod], "Tab", lazy.screen.next_group()),
    Key([mod, "shift"], "Tab", lazy.screen.prev_group()),
    Key(["mod1"], "Tab", lazy.screen.next_group()),
    Key(["mod1", "shift"], "Tab", lazy.screen.prev_group()),
])

for i in groups:
    keys.extend([

        # CHANGE WORKSPACES
        Key([mod], i.name, lazy.group[i.name].toscreen()),

        # MOVE WINDOW TO SELECTED WORKSPACE 1-10 AND FOLLOW MOVED WINDOW TO WORKSPACE
        Key([mod, "shift"], i.name, lazy.window.togroup(i.name),
            lazy.group[i.name].toscreen()),
    ])

# ── Theme selection (default DoomOne; honored from the switcher if set) ──────
# scripts/theme-switcher.sh (Super+Shift+T) writes a palette name to
# ~/.config/qtile/active_theme. Missing or invalid → the shipped DoomOne
# default is used untouched.
_active_theme_file = os.path.expanduser("~/.config/qtile/active_theme")
_palette = "DoomOne"
try:
    with open(_active_theme_file) as _fh:
        _pick = _fh.read().strip()
    if _pick and hasattr(colors, _pick):
        _palette = _pick
except OSError:
    pass
colors = getattr(colors, _palette)

layout_theme = {"border_width": 2,
                "margin": 12,
                "border_focus": colors[8],
                "border_normal": colors[0],
                }

layouts = [
    layout.MonadTall(**layout_theme),
    layout.MonadWide(**layout_theme),
    layout.Matrix(**layout_theme),
    layout.Bsp(**layout_theme),
    layout.Floating(**layout_theme),
    layout.RatioTile(**layout_theme),
    layout.Max(**layout_theme),
]

# ── Widgets / bar (DTOS DoomOne design) ──────────────────────────────────
widget_defaults = dict(
    font="Ubuntu Bold",
    fontsize=12,
    padding=0,
    background=colors[0],
)

extension_defaults = widget_defaults.copy()


def tray_widget():
    if IS_WAYLAND:
        return widget.StatusNotifier(padding=6)
    else:
        return widget.Systray(padding=6)


def init_widgets_list(include_tray=True):
    widgets_list = [
        widget.Spacer(length=8),
        widget.Image(
                 filename="~/.config/qtile/icons/favicon-32.png",
                 scale="False",
                 mouse_callbacks={"Button1": lambda: qtile.spawn(
                     "rofi -no-config -no-lazy-grab -show drun -modi drun "
                     f"-theme {home}/.config/qtile/rofi/launcher2.rasi")},
                 ),
        widget.Prompt(
                 font="Ubuntu Mono",
                 fontsize=14,
                 foreground=colors[1],
        ),
        widget.GroupBox(
                 fontsize=8,
                 margin_y=5,
                 margin_x=10,
                 padding_y=0,
                 padding_x=2,
                 borderwidth=3,
                 active=colors[8],
                 inactive=colors[9],
                 rounded=False,
                 highlight_color=colors[0],
                 highlight_method="line",
                 this_current_screen_border=colors[7],
                 this_screen_border=colors[4],
                 other_current_screen_border=colors[7],
                 other_screen_border=colors[4],
                 ),
        widget.TextBox(
                 text='|',
                 font="Ubuntu Mono",
                 foreground=colors[9],
                 padding=2,
                 fontsize=14,
                 ),
        widget.LaunchBar(
                 progs=[("🦁", "brave", "Brave web browser"),
                        ("🚀", "alacritty", "Alacritty terminal"),
                        ("📁", "thunar", "Thunar file manager"),
                        ("🎸", "vlc", "VLC media player")
                        ],
                 fontsize=12,
                 padding=5,
                 foreground=colors[3],
        ),
        widget.TextBox(
                 text='|',
                 font="Ubuntu Mono",
                 foreground=colors[9],
                 padding=2,
                 fontsize=14,
                 ),
        widget.CurrentLayout(
                 foreground=colors[1],
                 padding=5,
                 ),
        widget.TextBox(
                 text='|',
                 font="Ubuntu Mono",
                 foreground=colors[9],
                 padding=2,
                 fontsize=14,
                 ),
        widget.WindowName(
                 foreground=colors[6],
                 padding=8,
                 max_chars=40,
                 ),
        widget.CPU(
                 foreground=colors[4],
                 padding=8,
                 mouse_callbacks={"Button1": lambda: qtile.spawn(myTerm + " -e btop")},
                 format='Cpu: {load_percent:03.0f}%',
                 ),
        widget.GenPollText(
                 update_interval=300,
                 func=lambda: subprocess.check_output("printf $(uname -r)", shell=True, text=True),
                 foreground=colors[3],
                 padding=8,
                 fmt='{}',
                 ),
        widget.Memory(
                 foreground=colors[8],
                 padding=8,
                 mouse_callbacks={"Button1": lambda: qtile.spawn(myTerm + " -e btop")},
                 format='{MemUsed: .0f}{mm}',
                 fmt='Mem: {}',
                 ),
        widget.DF(
                 update_interval=60,
                 foreground=colors[5],
                 padding=8,
                 mouse_callbacks={"Button1": lambda: qtile.spawn(
                     myTerm + ' -e bash -c "df -hT; read -n1 -s"')},
                 partition='/',
                 format='{uf:.0f}{m} free',
                 fmt='Disk: {}',
                 visible_on_warn=False,
                 ),
        widget.Volume(
                 foreground=colors[7],
                 padding=8,
                 fmt='Vol: {}',
                 ),
        widget.Clock(
                 foreground=colors[8],
                 padding=8,
                 mouse_callbacks={"Button1": lambda: qtile.spawn("yad --calendar --no-buttons --title=Calendar")},
                 format="%I:%M %p  %a %d %b %Y",
                 ),
    ]

    if include_tray:
        widgets_list.extend([
            tray_widget(),
            widget.Spacer(length=8),
        ])

    return widgets_list


def init_widgets_screen1():
    return init_widgets_list()


# All other monitors' bars display everything but the systray and its spacer.
def init_widgets_screen2():
    widgets_screen2 = init_widgets_list()
    del widgets_screen2[16:17]
    return widgets_screen2


def init_screens():
    return [Screen(top=bar.Bar(widgets=init_widgets_screen1(), margin=[8, 12, 0, 12], size=30)),
            Screen(top=bar.Bar(widgets=init_widgets_screen2(), margin=[8, 12, 0, 12], size=30)),
            Screen(top=bar.Bar(widgets=init_widgets_screen2(), margin=[8, 12, 0, 12], size=30))]


if __name__ in ["config", "__main__"]:
    screens = init_screens()

# ── Mouse ────────────────────────────────────────────────────────────────
mouse = [
    Drag([mod], "Button1", lazy.function(drag_window),
         start=lazy.window.get_position()),
    Drag([mod], "Button3", lazy.window.set_size_floating(),
         start=lazy.window.get_size()),
]

dgroups_key_binder = None
dgroups_app_rules = []

main = None


# ── Hooks (qtile-erik behaviour: archlinux-logout bar, sxhkd autostart) ───
# hides the top bar when the archlinux-logout widget is opened
@hook.subscribe.client_new
def new_client(window):
    if window.name == "ArchLinux Logout":
        qtile.hide_show_bar()


# shows the top bar when the archlinux-logout widget is closed
@hook.subscribe.client_killed
def logout_killed(window):
    if window.name == "ArchLinux Logout":
        qtile.hide_show_bar()


@hook.subscribe.startup_once
def start_once():
    subprocess.call([home + "/.config/qtile/scripts/autostart.sh"])


@hook.subscribe.startup
def start_always():
    # Set the cursor to something sane in X
    subprocess.Popen(["xsetroot", "-cursor_name", "left_ptr"])


@hook.subscribe.client_new
def set_floating(window):
    if (window.window.get_wm_transient_for()
            or window.window.get_wm_type() in floating_types):
        window.floating = True


floating_types = ["notification", "toolbar", "splash", "dialog"]


follow_mouse_focus = True
bring_front_click = False
floats_kept_above = True
cursor_warp = False
floating_layout = layout.Floating(
    border_focus=colors[8],
    border_width=2,
    float_rules=[
        # Run the utility of `xprop` to see the wm class and name of an X client.
        *layout.Floating.default_float_rules,
        Match(wm_class='confirmreset'),  # gitk
        Match(wm_class='makebranch'),  # gitk
        Match(wm_class='maketag'),  # gitk
        Match(wm_class='ssh-askpass'),  # ssh-askpass
        Match(title='branchdialog'),  # gitk
        Match(title='pinentry'),  # GPG key password entry
        Match(wm_class='confirm'),
        Match(wm_class='dialog'),
        Match(wm_class='download'),
        Match(wm_class='error'),
        Match(wm_class='file_progress'),
        Match(wm_class='notification'),
        Match(wm_class='splash'),
        Match(wm_class='toolbar'),
        Match(wm_class='Arandr'),
        Match(wm_class='feh'),
        Match(wm_class='Galculator'),
        Match(wm_class='archlinux-logout'),
        Match(wm_class='xfce4-terminal'),
    ],
)
auto_fullscreen = True

focus_on_window_activation = "focus"  # or smart
reconfigure_screens = True

# If things like steam games want to auto-minimize themselves when losing
# focus, should we respect this or not?
auto_minimize = True

# When using the Wayland backend, this can be used to configure input devices.
wl_input_rules = None

# xcursor theme (string or None) and size (integer) for Wayland backend
wl_xcursor_theme = None
wl_xcursor_size = 24

# XXX: Gasp! We're lying here. In fact, nobody really uses or cares about this
# string besides java UI toolkits; you can see several discussions on the
# mailing lists, GitHub issues, and other WM documentation that suggest setting
# this string if your java app doesn't work correctly. We may as well just lie
# and say that we're a working one by default.
#
# We choose LG3D to maximize irony: it is a 3D non-reparenting WM written in
# java that happens to be on java's whitelist.
wmname = "LG3D"
