import { IKosCommand } from './types';
import { commands, Uri, window, Range } from 'vscode';

export const searchDocumentationProvider: IKosCommand = {
  command: 'kos.searchDocs',
  commandCallback: async (...args: any[]) => {
    let search: string | undefined = undefined;

    // if args is zero we initiated from the command palette
    if (args.length === 0) {
      // prompt user with search box
      search = await window.showInputBox({
        prompt: 'Search Documentation',
        placeHolder: 'print',
      });
    } else {
      const editor = window.activeTextEditor;
      if (editor !== undefined) {
        const { selection, document } = editor;

        // check if text is highlighted otherwise let user know
        if (!selection.isEmpty) {
          search = document.getText(new Range(selection.start, selection.end));
        } else {
          window.showInformationMessage('Highlight a range to search.');
        }
      }
    }

    // open kos docs with the search query
    if (search) {
      commands.executeCommand(
        'vscode.open',
        Uri.parse(
          `https://ksp-kos.github.io/KOS/search.html?q=${search}&check_keywords=yes&area=default`,
        ),
      );
    }
  },
};
