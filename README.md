# kos-language-server

A language server for the [KOS](https://github.com/KSP-KOS/KOS) mod for Kerbal Space Program. A language server can provide an IDE language support services for a target language, in this case KOS. The main idea here being that adding language support to new IDES is easier as more of the code can be reused between implmentions. For more infromation read this article about the language server protocol [here](https://langserver.org/). As of now the project has only one client of the server an extension for [Visual Studio Code](https://code.visualstudio.com/). The [vscode-extension can be found here](https://marketplace.visualstudio.com/items?itemName=JohnChabot.kos-vscode)

This project is heavily inspired by the [crafting interpreters](http://craftinginterpreters.com/) series. Definitely check it out if your interested in creating your own language.

(temp)[https://blog.mgechev.com/2017/08/05/typed-lambda-calculus-create-type-checker-transpiler-compiler-javascript/]

![Alt Text](https://i.imgur.com/Xh5yXJi.gif)

For additional client support such as sublime text, vim, atom, notepad++ or others please post an issue with the requested IDE. 

Currently the vscode client 0.1.3 implements the follow features
- synatx highlighting
- brace detection
- diagnostics on parsing errors

In development I'm looking at the follow features
- go to definition
- identify unused variables
- identify variables that don't exist
- suffix suggestions
- function signiture help
- basic type inference 
