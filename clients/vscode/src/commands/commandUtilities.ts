import { platform } from 'os';
import { spawn } from 'child_process';

type kosPlatforms = 'win32' | 'linux' | 'darwin';

/**
 * the assumed telnet client for each platform
 * @param platform the target platform
 */
export const platformTelnetClient = (): string => {
  const checkPlatform = platform();

  switch (checkPlatform) {
    case 'win32':
      return 'putty';
    case 'darwin':
    case 'linux':
      return 'telnet';
    default:
      throw new Error('Unsupported platform');
  }
};

/**
 * the assumed telnet client for each platform
 * @param platform the target platform
 */
export const platformTelnetArguments = (): string => {
  const checkPlatform = platform();

  switch (checkPlatform) {
    case 'win32':
      return '-telnet jeb@127.0.0.1 5410';
    case 'darwin':
    case 'linux':
      return '127.0.0.1 5410';
    default:
      throw new Error('Unsupported platform');
  }
};

/**
 * Make sure we're on a supported platform, obviously vscode
 * should work on other platforms or kerbal space program either
 * but can't be too sure
 */
export const currentPlatform = (): kosPlatforms => {
  const checkPlatform = platform();
  switch (checkPlatform) {
    case 'win32':
    case 'linux':
    case 'darwin':
      return checkPlatform;
    default:
      throw new Error('Unsupported platform');
  }
};

/**
 * Get the platform specific where clause
 */
export const whereCommand = (): string => {
  const current = currentPlatform();

  switch (current)
  {
    case 'win32':
    case 'darwin':
      return 'where';
    case 'linux':
      return 'whereis';
    default:
      throw new Error('Unexcpected platform');
  }
};

/**
 * Check if a given command is on the path
 * @param command command to check
 */
export const commandOnPath = (command: string): Promise<boolean> => {
  const where = whereCommand();
  const out = spawn(where, [command]);

  // we'll run the where command and if we have status 0
  // then we know the command is on the path
  return new Promise((resolve, reject) => {
    out.on('exit', (code, signal) => {
      console.log(signal);
      resolve(code === 0);
    });

    out.on('error', (error) => {
      reject(error);
    });
  });
};

/**
 * Check if a given command is in a directory
 * @param command command to check
 */
export const commandInDirectory = (command: string, directory: string): Promise<boolean> => {
  const where = whereCommand();
  const out = spawn(where, ['-r', directory, command]);

  // we'll run the where command and if we have status 0
  // then we know the command is on the path
  return new Promise((resolve, reject) => {
    out.on('exit', (code, signal) => {
      console.log(signal);
      resolve(code === 0);
    });

    out.on('error', (error) => {
      reject(error);
    });
  });
};
