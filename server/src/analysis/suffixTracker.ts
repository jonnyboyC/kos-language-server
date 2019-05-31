import { SymbolTrackerBase, IKsDeclared, TrackerKind } from './types';
import { KsSuffix } from '../entities/suffix';
import { Location, Range, Position } from 'vscode-languageserver';
import { builtIn } from '../utilities/constants';
import { ISuffixType } from '../typeChecker/types/types';

export class SuffixTracker implements SymbolTrackerBase<KsSuffix> {
  public declared: IKsDeclared<KsSuffix, ISuffixType>;

  constructor(
    symbol: KsSuffix,
    public type: ISuffixType,
  ) {
    this.declared = {
      symbol,
      type,
      uri: builtIn,
      range: Range.create(Position.create(0, 0), Position.create(0, 0)),
    };
  }

  /**
   * Get the the type of the suffix type
   * @param _ location is irrelvant since suffix types cannot be changed
   */
  public getType(_: Location): ISuffixType {
    return this.declared.type;
  }
  /**
   * What kind of tracker is this type
   */
  public get kind(): TrackerKind.suffix {
    return TrackerKind.suffix;
  }
}
