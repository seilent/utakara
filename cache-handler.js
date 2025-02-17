export default class CacheHandler {
  async get(key: string) {
    return null
  }

  async set(key: string, data: any, ctx: { tags?: string[]; revalidate?: number | false }) {
    return false
  }

  async revalidateTag(tag: string) {
    return
  }
}