
local emptyString is "                                                                                                    ".

function horizontalLine {
	parameter line,char.
	local s is emptyString:substring(0,terminal:width - 1).
	set s to s:replace(" ",char).
	print s at (0,line).
}

function horizontalLineTo {
	parameter line,colStart,colEnd,char.
	local s is emptyString:substring(0,colEnd - colStart).
	set s to s:replace(" ",char).
	print s at (colStart,line).
}
function verticalLineTo {
	parameter column,lineStart,lineEnd,char.
	local line is lineStart.
	until line > lineEnd {
		print char at (column,line).
		set line to line + 1.
	}
}

// clears an entire line of the terminal
function clearLine {
	parameter line.
	print emptyString:substring(0,terminal:width - 1) at (0,line).
}

// clears a line from columnStart to columnEnd
function clearLineTo {
	parameter line,columnStart,columnEnd.
	local s is emptyString:substring(0,columnEnd-columnStart).
	print s at (columnStart,line).
}

function clearBox {
	parameter line,lineEnd,colStart,colEnd.

	until line > lineEnd {
		clearLineTo(line,colStart,colEnd).
		set line to line + 1.
	}
}
