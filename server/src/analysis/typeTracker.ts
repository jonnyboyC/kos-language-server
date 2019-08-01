import { SymbolTrackerBase, IKsDeclared, TrackerKind, KsSymbol } from './types';
import { Location, Range, Position } from 'vscode-languageserver';
import { builtIn } from '../utilities/constants';
import { IType } from '../typeChecker/types';

export class TypeTracker<T extends KsSymbol = KsSymbol>
  implements SymbolTrackerBase<T> {
  public declared: IKsDeclared<T, IType>;

  constructor(symbol: T, public type: IType) {
    this.declared = {
      symbol,
      type,
      uri: builtIn,
      range: Range.create(Position.create(0, 0), Position.create(0, 0)),
    };
  }

  /**
   * Get the the type of the suffix type
   * @param _ location is irrelevant since suffix types cannot be changed
   */
  public getType(_: Location): IType {
    return this.declared.type;
  }
  /**
   * What kind of tracker is this type
   */
  public get kind(): TrackerKind.type {
    return TrackerKind.type;
  }
}
