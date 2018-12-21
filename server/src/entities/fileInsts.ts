import { IToken } from './types';
import { IInst } from '../parser/types';

export class FileInsts {
  constructor(
    public readonly start: IToken,
    public readonly insts: IInst[],
    public readonly end: IToken,
  )
  { }
}
