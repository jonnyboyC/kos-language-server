import {
  GrammarNode, IGrammarOptional,
  IGrammarUnion, IGrammarRepeat,
  Distribution, INormalDistribution,
  IGammaDistribution, IExponentialDistribution, IConstantDistribution,
} from './types';

/**
 * Create an optional grammar node
 * @param dist a sampling distribution for when the node is included
 * @param nodes optional nodes
 */
export const createGrammarOptional = (dist: Distribution, ...nodes: GrammarNode[])
  : IGrammarOptional => ({ dist, nodes, tag: 'optional' });

/**
 * Create a repeating grammar node
 * @param dist a sampling distribution for how many times a node is included
 * @param nodes repeating nodes
 */
export const createGrammarRepeat = (dist: Distribution, ...nodes: GrammarNode[])
  : IGrammarRepeat => ({ dist, nodes, tag: 'repeat' });

/**
 * Create a union grammar node
 * @param node a set of nodes and distribution for node selection
 */
export const createGrammarUnion = (...node: [GrammarNode, Distribution][])
  : IGrammarUnion => ({ node, tag: 'union' });

/**
 * Create a normal distribution
 * @param mean mean of the normal
 * @param std standard deviation for the normal
 */
export const createNormal = (mean: number, std: number)
  : INormalDistribution => ({ mean, std, tag: 'normal' });

/**
 * Create a gamma distribution
 * @param shape shape factor for the gamma
 * @param scale scale factor for the gamma
 */
export const createGamma = (shape: number, scale: number)
  : IGammaDistribution => ({ shape, scale, tag: 'gamma' });

/**
 * Create a exponential distribution
 * @param rate rate for the exp distribution
 */
export const createExponential = (rate: number)
  : IExponentialDistribution => ({ rate, tag: 'exp' });

/**
 * Create a constant distribution
 * @param value constant value of distribution
 */
export const createConstant = (value: number)
  : IConstantDistribution => ({ value, tag: 'constant' });
