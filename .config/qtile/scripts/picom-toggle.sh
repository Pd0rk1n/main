#!/bin/bash
if pgrep -x "picom" > /dev/null
then
	killall picom
else
	killall fastcompmgr 2>/dev/null
	picom -b --config ~/.config/qtile/scripts/picom.conf
fi
