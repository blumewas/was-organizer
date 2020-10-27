// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { TerminalWrapper } from './util/terminalWrapper';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // workbench.extensions.action.enableAllWorkspace
    let disposable = vscode.commands.registerCommand('was-organizer.show-configurationview', async function() {
        const command = `code --list-extensions`;

        const wrapper = new TerminalWrapper();
        wrapper.start('', command);
        console.log('Waiting');
        const result = await wrapper.waitForResult();
        
        for(let ext of result.extensions) {
            console.log(ext);
        }
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
