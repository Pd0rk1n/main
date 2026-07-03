#!/bin/bash
if pgrep -x "fastcompmgr" > /dev/null
then
	killall fastcompmgr
else
	killall picom 2>/dev/null
	fastcompmgr -c &
fi
