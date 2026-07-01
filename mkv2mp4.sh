#!/usr/bin/env fish

for file in *.mkv
    if test -f $file
        echo "Converting $file..."
        ffmpeg -i $file -c copy (string replace -r '\.mkv$' '.mp4' $file)
    end
end