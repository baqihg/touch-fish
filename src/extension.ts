import * as vscode from 'vscode'
import { Command } from './command'

export function activate({ subscriptions, globalState, globalStorageUri }: vscode.ExtensionContext) {

	const nextCommand = 'touch-fish.next'

	const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99999)
	statusBar.command = nextCommand

	const command = new Command(globalStorageUri, globalState, statusBar)
	// subscribe
	{
		subscriptions.push(statusBar)

		subscriptions.push(vscode.commands.registerCommand(nextCommand, async () => {
			command.next()
		}))

		subscriptions.push(vscode.commands.registerCommand('touch-fish.toggle', async () => {
			command.toggle()
		}))

		subscriptions.push(vscode.commands.registerCommand('touch-fish.download', async () => {
			command.download()
		}))

		subscriptions.push(vscode.commands.registerCommand('touch-fish.select', async () => {
			command.select()
		}))

		subscriptions.push(vscode.commands.registerCommand('touch-fish.remove', async () => {
			command.remove()
		}))

		subscriptions.push(vscode.commands.registerCommand('touch-fish.skip', async () => {
			command.skip()
		}))
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
