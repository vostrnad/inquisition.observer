class Unique {
  private readonly map = new Map<string, number>()

  integer(id?: string, start?: number): number {
    return this.get('integer', id, start)
  }

  hash(id?: string): string {
    return this.get('hash', id).toString(16).padStart(64, '0')
  }

  reset(): void {
    this.map.clear()
  }

  private get(type: string, id?: string, start?: number): number {
    const key = id ? `${type}.${id}` : type
    const res = this.map.get(key) ?? start ?? 0
    this.map.set(key, res + 1)
    return res
  }
}

export const unique = new Unique()
