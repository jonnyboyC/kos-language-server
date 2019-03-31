
/**
 * Basic interface replicating the vscode command registration
 */
export interface IKosCommand {
  /**
   * Name of the command
   */
  command: string;

  /**
   * Callback to be called when command is invoked
   */
  commandCallback: (...args: any[]) => any;
}
