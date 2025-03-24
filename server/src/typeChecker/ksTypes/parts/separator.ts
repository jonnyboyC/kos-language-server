import { createSuffixType, createType, noMap } from '../../utilities/typeCreators';
import { booleanType } from '../primitives/boolean';
import { scalarType } from '../primitives/scalar';
import { decouplerType } from './decoupler';

export const separatorType = createType('separator');
separatorType.addSuper(noMap(decouplerType));

separatorType.addSuffixes(
  noMap(createSuffixType('ejectionForce', scalarType)),
  noMap(createSuffixType('isDecoupled', booleanType)),
  noMap(createSuffixType('staged', booleanType)),
);
