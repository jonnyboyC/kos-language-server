export enum TokenType {
    WhiteSpace, CommentLine,
    Plus, Minus, Multi, Div, Power,
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

export const isValidIdentifier = (type: TokenType): boolean => {
  switch (type) {
    case TokenType.Not:
    case TokenType.And:
    case TokenType.Or:
    case TokenType.Set:
    case TokenType.Unset:
    case TokenType.To:
    case TokenType.Is:
    case TokenType.Until:
    case TokenType.If:
    case TokenType.Else:
    case TokenType.For:
    case TokenType.When:
    case TokenType.Then:
    case TokenType.From:
    case TokenType.Do:
    case TokenType.At:
    case TokenType.On:
    case TokenType.In:
    case TokenType.Lock:
    case TokenType.Unlock:
    case TokenType.Print:
    case TokenType.Local:
    case TokenType.Global:
    case TokenType.Parameter:
    case TokenType.Function:
    case TokenType.Preserve:
    case TokenType.Break:
    case TokenType.Return:
    case TokenType.Declare:
    case TokenType.Defined:
    case TokenType.Toggle:
    case TokenType.Wait:
    case TokenType.Off:
    case TokenType.List:
    case TokenType.Clearscreen:
    case TokenType.Stage:
    case TokenType.Add:
    case TokenType.Remove:
    case TokenType.Log:
    case TokenType.Step:
    case TokenType.Switch:
    case TokenType.Copy:
    case TokenType.Rename:
    case TokenType.Volume:
    case TokenType.File:
    case TokenType.Delete:
    case TokenType.Edit:
    case TokenType.All:
    case TokenType.Run:
    case TokenType.RunPath:
    case TokenType.RunOncePath:
    case TokenType.Once:
    case TokenType.Compile:
    case TokenType.Reboot:
    case TokenType.Shutdown:
    case TokenType.Identifier:
    // case TokenType.FileIdentifier:
    case TokenType.LazyGlobal:
      return true;
    default:
      return false;
  }
};
