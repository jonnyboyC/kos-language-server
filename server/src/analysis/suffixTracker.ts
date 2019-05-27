import { SymbolTrackerBase, IKsDeclared, TrackerKind } from './types';
import { KsSuffix } from '../entities/suffix';
import { SuffixType } from '../typeChecker/types/ksType';
import { defaultSuffix } from '../typeChecker/types/typeHelpers';
import { Location } from 'vscode-languageserver';

export class SuffixTracker implements SymbolTrackerBase<KsSuffix> {
  public declared: IKsDeclared<KsSuffix, SuffixType>;

  constructor(
    symbol: KsSuffix,
    public uri: string,
    public type: SuffixType = defaultSuffix(symbol.name.lexeme),
  ) {
    this.declared = {
      symbol,
      type,
      uri: symbol.name.uri,
      range: symbol.name.range,
    };
  }

  /**
   * Get the the type of the suffix type
   * @param _ location is irrelvant since suffix types cannot be changed
   */
  public getType(_: Location): SuffixType {
    return this.declared.type;
  }
  /**
   * What kind of tracker is this type
   */
  public get kind(): TrackerKind.suffix {
    return TrackerKind.suffix;
  }
}
