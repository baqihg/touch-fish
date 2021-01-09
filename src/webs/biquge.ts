import * as vscode from 'vscode'
import fetch, { Response } from "node-fetch"
import htmlParser from 'node-html-parser'
import { delay, loadingWrap, loadingWithProgress, predicate } from "../utils"
import { Web } from './base'

export class Biquge extends Web {
  private host = 'https://www.biquge.com.cn'
  
  async search(name: string, page = 1) {
    const htmlString = await fetch(`${this.host}/search.php?q=${encodeURIComponent(name)}&p=${page}`).then(res => res.text())

    const document = htmlParser(htmlString)
    const results = document.querySelector('.result-list')

    return results.querySelectorAll('.result-item').map((result) => ({
      id: result.querySelector('.result-game-item-title-link').getAttribute('href'),
      name: result.querySelector('.result-game-item-title-link').querySelector('span').firstChild.innerText,
      author: result.querySelector('.result-game-item-info-tag').querySelectorAll('span')[1]?.innerText,
    }))
  }

  // 下载全本
  async download(id: string) {
    const sectionUrls = await loadingWrap(this.getSectionUrls(id))

    const sections = await loadingWithProgress(
      this.getSections(sectionUrls),
      '正在下载中...'
    )
    return sections
  }

  private async getSectionUrls(id: string) {
    const htmlString = await fetch(`${this.host}${id}`).then(res => res.text())
    const document = htmlParser(htmlString)
    return document.querySelector('#list').querySelectorAll('a').map(v => v.getAttribute('href')).filter(predicate)
  }

  private getSections(sectionUrls: string[]) {
    return sectionUrls
      .map((url) => 
        () => this.getSection(`${this.host}${url}`)
      )
  }

  private getSection(url: string): Promise<Section> {
    return fetch(url)
      .then(res => res.text())
      .then((htmlString) => {
        console.info(url)
        const document = htmlParser(htmlString)
        return {
          name: document.querySelector('.bookname').querySelector('h1').innerText,
          content: document.querySelector('#content').childNodes.map((v) => v.rawText?.replace(/^&nbsp;&nbsp;&nbsp;&nbsp;/, '')).filter(predicate)
        }
      })
      .catch(async (e) => {
        vscode.window.showErrorMessage(`${e.message}, 正在重试...`)
        console.info('正在重试...')
        delay(5000)
        return this.getSection(url)
      })
  }
}
