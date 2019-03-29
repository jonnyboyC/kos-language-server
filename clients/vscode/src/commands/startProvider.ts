import { IKosCommand } from './types';

export const startProvider: IKosCommand = {
  command: 'kos.startksp',
  commandCallback: () => {
    console.log('sup');
  },
};
