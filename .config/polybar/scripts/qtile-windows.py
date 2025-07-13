#!/usr/bin/env python3
from libqtile.command.client import InteractiveCommandClient

client = InteractiveCommandClient()
groups = client.groups()

output = ""
for name, data in groups.items():
    if data["screen"] is not None:
        output += f" %{F#89dceb}[{name}]%{{F-}}"
    else:
        output += f" {name} "
print(output)
