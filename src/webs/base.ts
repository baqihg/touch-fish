export abstract class Web {
  download(id: string): Promise<Section[]> {
    throw new Error('You need override download function')
  }

  search(name: string, page?: number): Promise<Selected[]> {
    throw new Error('You need override search function')
  }
}