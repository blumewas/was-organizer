// taken from https://github.com/Domiii/dbux/blob/dev/dbux-code/src/terminal/TerminalWrapper.js
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { window } from 'vscode';

// ###########################################################################
// execInTerminal w/ process wrapper
// ###########################################################################

export class TerminalWrapper {
    _disposable: any;
    _terminal: any;
    _promise: any;

    start(cwd: string, command: string) {
        this._disposable = window.onDidCloseTerminal(terminal => {
            if (terminal === this._terminal) {
                this.dispose();
            }
        });
        this._promise = this._run(cwd, command);
    }

    async waitForResult() {
        return this._promise;
    }

    async _run(cwd: string, command: string) {
        let tmpFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'wasorganizer-')).replace(/\\/g, '/');
        const outputfile = path.join(tmpFolder, 'list.txt');
        
        fs.writeFileSync(outputfile, '');

        this._terminal = 'Was-Organizer Terminal #1';
        const terminal = window.createTerminal(this._terminal);
        terminal.sendText(`${command} > ${outputfile}`);

        try {
            const result = await new Promise((resolve, reject) => {
                const watcher = fs.watch(tmpFolder);
                watcher.on('change', (eventType, filename) => {
                    let result;
                    if (filename === 'error') {
                        result = { error: fs.readFileSync(path.join(tmpFolder, filename), { encoding: 'utf8' }) };
                    } else {
                        if (filename instanceof Buffer) {
                            result = { extensions: fs.readFileSync(path.join(tmpFolder, filename.toString()), { encoding: 'utf8' }).split("\n") };
                        } else {
                            const text = fs.readFileSync(path.join(tmpFolder, filename.toString()), { encoding: 'utf8' });
                            result = { extensions: text.split("\n") };
                        }
                    }

                    if(result) {
                        if(result.extensions && result.extensions[0] === '') {
                            return;
                        }
                    }

                    if (filename instanceof Buffer) {
                        resolve(result);
                        fs.unlinkSync(path.join(tmpFolder, filename.toString()));
                    } else {
                        resolve(result);
                        fs.unlinkSync(path.join(tmpFolder, filename));
                    }

                    watcher.close();
                    
                });

                watcher.on('error', (err) => {
                    reject(new Error(`FSWatcher error: ${err.message}`));
                });

                window.onDidCloseTerminal((terminal) => {
                    if (terminal === this._terminal) {
                        watcher.close();
                        reject(new Error('User closed the terminal'));
                    }
                });
            });

            return result;
        } finally {
            this.dispose();
            fs.rmdirSync(tmpFolder);
        }
    }

    dispose() {
        const {
            _disposable
        } = this;

        this._disposable = null;
        this._promise = null;
        this._terminal = null;

        _disposable?.dispose();
    }

    cancel() {
        this.dispose();
    }


    // ###########################################################################
    // static functions
    // ###########################################################################

    /**
     * Execute `command` in `cwd` in terminal.
     * @param {string} cwd Set working directory to run `command`.
     * @param {string} command The command will be executed.
     * @param {object} args 
     */
    static execInTerminal(cwd: string, command: string) {
        // TODO: register wrapper with context

        const wrapper = new TerminalWrapper();
        wrapper.start(cwd, command);
        return wrapper;
    }
}
