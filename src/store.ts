import * as vscode from 'vscode'
import { arrayBufferToBuffer, flatten } from './utils'

export class Store {
  private splitLength = 40
  private lineSuffix = '-lines'
  constructor(private globalUri: vscode.Uri) {}

  getUri(name: string) {
    return vscode.Uri.joinPath(this.globalUri, name)
  }

  getLineUri(name: string) {
    return vscode.Uri.joinPath(this.globalUri, `${name}${this.lineSuffix}`)
  }

  async set(bookName: string, sections: Section[]) {
    const uri = this.getUri(bookName)
    await vscode.workspace.fs.writeFile(uri, Buffer.from(JSON.stringify(sections, null, 2)))
  }

  async setBookLines(bookName: string, lines: string[]) {
    const uri = this.getUri(`${bookName}${this.lineSuffix}`)
    await vscode.workspace.fs.writeFile(uri, Buffer.from(JSON.stringify(lines, null, 2)))
  }

  async get(bookName: string): Promise<Section[]> {
    const uri = this.getUri(bookName)
    const data = await vscode.workspace.fs.readFile(uri)
    return JSON.parse(arrayBufferToBuffer(data).toString())
  }

  async getBookLines(bookName: string): Promise<string[]> {
    const uri = this.getUri(`${bookName}${this.lineSuffix}`)
    const data = await vscode.workspace.fs.readFile(uri)
    return JSON.parse(arrayBufferToBuffer(data).toString())
  }

  async remove(bookName: string) {
    await vscode.workspace.fs.delete(this.getUri(bookName))
    await vscode.workspace.fs.delete(this.getLineUri(bookName))
    vscode.window.showInformationMessage('删除成功')
  }

  async getList() {
    const list = await vscode.workspace.fs.readDirectory(this.globalUri)
    return list.filter(([name]) => !name.includes(this.lineSuffix)).map(([name]) => name)
  }

  getLines(sections: Section[]) {
    // 行列表
    let lines = flatten(sections.map(({ name, content }) => [name, ...content]))

    // 超过20个字符的行，进行换行
    lines = flatten(lines.map((v) => {
      const count = Math.ceil(v.length / this.splitLength)
      if (count > 1) {
        const list = []
        for (let i = 0; i <count; i++) {
          const start = i * this.splitLength
          list.push(v.slice(start, start + this.splitLength))
        }
        return list
      }
      return v
    }))

    return lines
  }
}