import { IType, IVarType } from '../types';
import { createStructureType, createArgSuffixType, createVarSuffixType } from '../ksType';
import { addPrototype } from '../typeUitlities';

export const functionType: IType = createStructureType('function');

export const createFunctionType = (name: string, returns?: IType, ...params: IType[]): IType => {
  const newType = createArgSuffixType(name, returns, ...params);
  addPrototype(newType, functionType);

  return newType;
};

export const createVarFunctionType = (name: string, returns?: IType, params?: IVarType): IType => {
  const newType = createVarSuffixType(name, returns, params);
  addPrototype(newType, functionType);

  return newType;
};
