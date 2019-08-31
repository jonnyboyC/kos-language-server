import { ISuffixTermVisitor } from '../parser/types';
import { BasicBlock } from './basicBlock';
import * as SuffixTerm from '../parser/suffixTerm';

export class ControlFlow
  implements ISuffixTermVisitor<(basicBlock: BasicBlock) => BasicBlock> {
  visitSuffixTermInvalid(
    suffixTerm: SuffixTerm.Invalid,
    parameters: [BasicBlock],
  ): BasicBlock {
    console.log(suffixTerm, parameters);
    return new BasicBlock();
  }
  visitSuffixTrailer(
    suffixTerm: SuffixTerm.SuffixTrailer,
    parameters: [BasicBlock],
  ): BasicBlock {
    console.log(suffixTerm, parameters);
    return new BasicBlock();
  }
  visitSuffixTerm(
    suffixTerm: SuffixTerm.SuffixTerm,
    parameters: [BasicBlock],
  ): BasicBlock {
    console.log(suffixTerm, parameters);
    return new BasicBlock();
  }
  visitCall(suffixTerm: SuffixTerm.Call, parameters: [BasicBlock]): BasicBlock {
    console.log(suffixTerm, parameters);
    return new BasicBlock();
  }
  visitArrayIndex(
    suffixTerm: SuffixTerm.ArrayIndex,
    parameters: [BasicBlock],
  ): BasicBlock {
    console.log(suffixTerm, parameters);
    return new BasicBlock();
  }
  visitArrayBracket(
    suffixTerm: SuffixTerm.ArrayBracket,
    parameters: [BasicBlock],
  ): BasicBlock {
    console.log(suffixTerm, parameters);
    return new BasicBlock();
  }
  visitDelegate(
    suffixTerm: SuffixTerm.Delegate,
    parameters: [BasicBlock],
  ): BasicBlock {
    console.log(suffixTerm, parameters);
    return new BasicBlock();
  }
  visitLiteral(
    suffixTerm: SuffixTerm.Literal,
    parameters: [BasicBlock],
  ): BasicBlock {
    console.log(suffixTerm, parameters);
    return new BasicBlock();
  }
  visitIdentifier(
    suffixTerm: SuffixTerm.Identifier,
    parameters: [BasicBlock],
  ): BasicBlock {
    console.log(suffixTerm, parameters);
    return new BasicBlock();
  }
  visitGrouping(
    suffixTerm: SuffixTerm.Grouping,
    parameters: [BasicBlock],
  ): BasicBlock {
    console.log(suffixTerm, parameters);
    return new BasicBlock();
  }
}
