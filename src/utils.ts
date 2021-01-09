import * as vscode from 'vscode'

export async function loadingWrap<T>(fn: Promise<T>, message?: string) {
  const data = await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      cancellable: false,
      title: message ?? '正在加载中...'
  }, async (progress) => {
      progress.report({ increment: 0 })
      const result = await fn
      progress.report({ increment: 100 })
      return result
  })

  return data
}

export function loading(message?: string) {
  let hide!: Function
  const promise = new Promise((resolve) => hide = resolve)
  vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    cancellable: false,
    title: message ?? '正在加载中...'
  }, async (progress) => {
    progress.report({ increment: 0 })
    await promise
    progress.report({ increment: 100 })
  })
  return hide
}

export async function loadingWithProgress<T>(fns: Array<() => Promise<T>>, message = '正在加载中') {
  const data = await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      cancellable: true,
      title: message
  }, async (progress, token) => {
      progress.report({ increment: 0 })
      let i = 0
      const unit = 100 / fns.length
      const results = []
      for (const fn of fns) {
        if (token.isCancellationRequested) {
          await vscode.window.showErrorMessage('已取消')
          throw new Error('已取消')
        }
        progress.report({ message: `${i++} / ${fns.length}`})
        results.push(await fn())
        progress.report({ increment: unit })
      }
      return results
  })

  return data
}

export const predicate = <T>(x: T): x is Exclude<T, null | undefined | void | false | 0 | ''> => Boolean(x)

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function arrayBufferToBuffer(arrayBuffer: ArrayBuffer) {
  var buffer = Buffer.alloc(arrayBuffer.byteLength)
  var view = new Uint8Array(arrayBuffer)
  for (var i = 0; i < buffer.length; ++i) {
    buffer[i] = view[i]
  }
  return buffer
}

export function flatten<T>(arr: Array<T | T[]>): T[] {
  const result: Array<T> = []
  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(...item)
    } else {
      result.push(item)
    }
  }
  return result
}
