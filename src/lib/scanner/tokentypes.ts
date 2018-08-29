export enum TokenType {
    WhiteSpace, CommentLine,
    Plus, Minus, Multi, Div, Power, E,
    Not, And, Or, True, False,
    Equal, NotEqual, GreaterEqual, Greater, LessEqual, Less,
    
    Set, Unset, To, Is, Until,
    If, Else, For, When, Then, From, Do,
    At, On, In,
    Lock, Unlock,
    Print, ArrayIndex,
    
    Integer, Double, String,

    Local, Global, Parameter, Function,
    Preserve, Break, Return, Declare,
    Defined, 

    // done
    BracketOpen, BracketClose, CurlyOpen, CurlyClose,
    SquareOpen, SquareClose, Comma, Colon,
    Period, AtSign, Eof,

    Toggle, Wait, Off, List, Clearscreen,
    Stage, Add, Remove, Log, Step, 

    Switch, Copy, Rename, Volume,
    File, Delete, Edit, All,

    Run, RunPath, RunOncePath,
    Once, Compile,

    Reboot, Shutdown,

    Identifier,
    FileIdentifier,
    LazyGlobal,
}