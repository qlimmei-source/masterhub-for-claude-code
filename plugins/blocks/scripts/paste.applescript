-- "Paste" for an answer in a badge, Mac. What the clipboard holds:
--   a file copied in Finder (Cmd+C): its path goes out, the file itself is not touched;
--   a screenshot (Cmd+Ctrl+Shift+4): saved as PNG to the path given in argument 1, that path goes out;
--   text: goes out as is, the mod keeps it only if it is the path of an existing file.
-- Sends nothing and does not read the files' contents. Nothing found: an empty answer.
-- Argument: 1) the full path for a screenshot (its folder already exists).
on run argv
	set target to item 1 of argv
	try
		set f to the clipboard as «class furl»
		return POSIX path of f
	end try
	try
		set png to the clipboard as «class PNGf»
		set fh to open for access (POSIX file target) with write permission
		set eof of fh to 0
		write png to fh
		close access fh
		return target
	on error
		try
			close access (POSIX file target)
		end try
	end try
	try
		return the clipboard as text
	end try
	return ""
end run
