/**
 * A class representing a unicode spinner
 */
export class Spinner {
  /**
   * character frames of the spinner
   */
  private readonly frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

  /**
   * Current frame
   */
  private interval = 0;

  /**
   * Return a frame of the spinner and increment the frame
   */
  public spin(): string {
    return this.frames[(this.interval = ++this.interval % this.frames.length)];
  }
}
