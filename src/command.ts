import * as vscode from 'vscode'
import { Store } from './store'
import { loading, loadingWrap } from './utils'
import { Web } from './webs/base'
import { Biquge } from './webs/biquge'

export class Command {
  private store: Store
  private lines: string[] = []
  private currentBook: string | undefined
  private mark: number = 0
  private web: Web

  constructor(
    private globalStorageUri: vscode.Uri, 
    private globalState: vscode.Memento & { setKeysForSync(keys: string[]): void }, 
    private statusBar: vscode.StatusBarItem
  ) {
    this.store = new Store(this.globalStorageUri)
    this.currentBook = this.globalState.get<string>('currentBook')
    this.web = new Biquge()
    if (this.currentBook) {
      this.selectBook(this.currentBook)
    }
  }

  private async selectBook(bookName: string) {
    const sections = await this.store.get(bookName)
    this.mark = this.globalState.get<number>(bookName) ?? 0
    await this.globalState.update('currentBook', bookName)
    this.currentBook = bookName

    this.lines = this.store.getLines(sections)
    
    this.setText()
  }

  private setText() {
    this.statusBar.text = this.lines[this.mark]
  }

  private async search(searchName: string, page = 1): Promise<Selected | undefined> {
    const searchResults = (await loadingWrap(this.web.search(searchName, page)))
    const pickOptions = searchResults.map(({ name, author }) => getPickOption(name, author))
    if (page !== 1) {
      pickOptions.push('上一页')
    }
    pickOptions.push('下一页')
    const selectedOption = await vscode.window.showQuickPick(pickOptions)
    
    if (selectedOption === '下一页') {
      return await this.search(searchName, page + 1)
    } else if (selectedOption === '上一页') {
      return await this.search(searchName, page - 1)
    } else {
      const selected = searchResults.find(v => getPickOption(v.name, v.author) === selectedOption)
      return selected
    }
  }

  async download() {
    const searchName = await vscode.window.showInputBox({ placeHolder: '请输入书名' })
    if (searchName) {
      const selected = await this.search(searchName)

      if (selected?.id) {
        const sections = await this.web.download(selected?.id)
        await loadingWrap(this.store.set(selected.name, sections), '正在保存...')
        this.select()
      }
    }
  }

  async select() {
    const selected = await vscode.window.showQuickPick(await this.store.getList())

    if (selected) {
      await this.selectBook(selected)
			this.statusBar.show()
    }
  }

  async next(line?: number) {
    if (this.currentBook) {
      if (typeof line === 'number') {
        this.mark = line
      } else {
        this.mark += 1
      }
      console.info(this.lines[this.mark])
      await this.globalState.update(this.currentBook, this.mark)
      this.setText()
    }
  }

  async remove() {
    const selected = await vscode.window.showQuickPick(await this.store.getList())

    if (selected) {
      await this.store.remove(selected)
    }
  }

  async skip() {
    if (this.currentBook) {
      const hide = loading()
      const sourceDocument = await vscode.workspace.openTextDocument(this.store.getUri(this.currentBook))
      const bookText = sourceDocument.getText()

      // 复制一份进行操作，防止源文件被破坏
      await this.store.setBookLines(this.currentBook, this.store.getLines(JSON.parse(bookText)))
      const document = await vscode.workspace.openTextDocument(this.store.getLineUri(this.currentBook))
      const docWindow = await vscode.window.showTextDocument(document, vscode.ViewColumn.Two)
      
      // 跳转到目前所看的位置
      const currentLine = this.mark + 1
      const position = new vscode.Position(currentLine, 999)
      const newSelection = new vscode.Selection(new vscode.Position(currentLine, 0), position)

      docWindow.selection = newSelection
      docWindow.revealRange(new vscode.Range(position, position))

      // 更改书签位置
      const { dispose } = vscode.window.onDidChangeTextEditorSelection((event) => {
        if (!this.currentBook) return
        if (event.textEditor.document.uri.path === this.store.getLineUri(this.currentBook).path) {
          const line = event.selections[0]?.start.line
          console.info('line', line)
          if (line) {
            this.next(line - 1)
          }
        }
      })

      // 关闭之后取消监听
      vscode.window.onDidChangeVisibleTextEditors((editors) => {
        if (editors.every((doc) => doc.document.uri !== document.uri)) {
          dispose()
        }
      })

      hide()
    } else {
      vscode.window.showErrorMessage('请先选择一本书')
    }
  }

  async toggle() {
    const visible = this.globalState.get<boolean>('visible')
			if (visible) {
				this.statusBar.hide()
			} else {
				this.statusBar.show()
			}
			await this.globalState.update('visible', !visible)
  }
}

const getPickOption = (name: string, author: string) => `${name} 作者: ${author}`


