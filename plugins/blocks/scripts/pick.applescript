-- The Mac "Choose files" window for an answer in a badge: the user picks the files, the mod gets only their paths.
-- Copies nothing, reads nothing, sends nothing. Paths go out one per line. Cancel: exit code 1.
-- Arguments: 1) the window title, 2) the folder to start from (may be empty).
on run argv
	set theTitle to item 1 of argv
	set startDir to ""
	if (count of argv) > 1 then set startDir to item 2 of argv
	activate
	if startDir is not "" then
		set picked to choose file with prompt theTitle default location (POSIX file startDir) with multiple selections allowed
	else
		set picked to choose file with prompt theTitle with multiple selections allowed
	end if
	set out to ""
	repeat with f in picked
		set out to out & POSIX path of f & linefeed
	end repeat
	return out
end run
