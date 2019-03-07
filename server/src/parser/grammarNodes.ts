import {
  GrammarNode, IGrammarOptional,
  IGrammarUnion, IGrammarRepeat,
  Distribution, INormalDistribution,
  IGammaDistribution, IExponentialDistribution, IConstantDistribution,
} from './types';

export const createGrammarOptional = (dist: Distribution, ...nodes: GrammarNode[])
  : IGrammarOptional => ({ dist, nodes, tag: 'optional' });

export const createGrammarRepeat = (dist: Distribution, ...nodes: GrammarNode[])
  : IGrammarRepeat => ({ dist, nodes, tag: 'repeat' });

export const createGrammarUnion = (...node: [GrammarNode, Distribution][])
  : IGrammarUnion => ({ node, tag: 'union' });

export const createNormal = (mean: number, std: number)
  : INormalDistribution => ({ mean, std, tag: 'normal' });

export const createGamma = (shape: number, scale: number)
  : IGammaDistribution => ({ shape, scale, tag: 'gamma' });

export const createExponential = (rate: number)
  : IExponentialDistribution => ({ rate, tag: 'exp' });

export const createConstant = (value: number)
  : IConstantDistribution => ({ value, tag: 'constant' });
