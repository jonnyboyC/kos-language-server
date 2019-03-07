export enum TokenType {
    whiteSpace, commentLine,
    plus, minus, multi, div, power,
    not, and, or, true, false,
    equal, notEqual, greaterEqual, greater, lessEqual, less,

    set, unset, to, is, until,
    if, else, for, when, then, from, do,
    at, on, in,
    lock, unlock,
    print, arrayIndex,

    integer, double, string,

    local, global, parameter, function,
    preserve, break, return, declare,
    defined,

    // done
    bracketOpen, bracketClose, curlyOpen, curlyClose,
    squareOpen, squareClose, comma, colon,
    period, atSign, eof,

    toggle, wait, off, list, clearscreen,
    stage, add, remove, log, step,

    switch, copy, rename, volume,
    file, delete, edit, all,

    run, runPath, runOncePath,
    once, compile,

    reboot, shutdown,

    identifier,
    fileIdentifier,
    lazyGlobal,
}

export const isValidIdentifier = (type: TokenType): boolean => {
  switch (type) {
    case TokenType.not:
    case TokenType.and:
    case TokenType.or:
    case TokenType.set:
    case TokenType.unset:
    case TokenType.to:
    case TokenType.is:
    case TokenType.until:
    case TokenType.if:
    case TokenType.else:
    case TokenType.for:
    case TokenType.when:
    case TokenType.then:
    case TokenType.from:
    case TokenType.do:
    case TokenType.at:
    case TokenType.on:
    case TokenType.in:
    case TokenType.lock:
    case TokenType.unlock:
    case TokenType.print:
    case TokenType.local:
    case TokenType.global:
    case TokenType.parameter:
    case TokenType.function:
    case TokenType.preserve:
    case TokenType.break:
    case TokenType.return:
    case TokenType.declare:
    case TokenType.defined:
    case TokenType.toggle:
    case TokenType.wait:
    case TokenType.off:
    case TokenType.list:
    case TokenType.clearscreen:
    case TokenType.stage:
    case TokenType.add:
    case TokenType.remove:
    case TokenType.log:
    case TokenType.step:
    case TokenType.switch:
    case TokenType.copy:
    case TokenType.rename:
    case TokenType.volume:
    case TokenType.file:
    case TokenType.delete:
    case TokenType.edit:
    case TokenType.all:
    case TokenType.run:
    case TokenType.runPath:
    case TokenType.runOncePath:
    case TokenType.once:
    case TokenType.compile:
    case TokenType.reboot:
    case TokenType.shutdown:
    case TokenType.identifier:
    // case TokenType.FileIdentifier:
    case TokenType.lazyGlobal:
      return true;
    default:
      return false;
  }
};
