// 渲染进程桥：仅暴露 HTTP 代理与密钥存取，不暴露 Node
const { contextBridge, ipcRenderer } = require('electron')

const chunkHandlers = new Set()
const endHandlers = new Set()
const headHandlers = new Set()

ipcRenderer.on('aw:http:chunk', (_e, data) => {
  for (const h of chunkHandlers) {
    try { h(data) } catch (err) { /* ignore */ }
  }
})
ipcRenderer.on('aw:http:end', (_e, data) => {
  for (const h of endHandlers) {
    try { h(data) } catch (err) { /* ignore */ }
  }
})
ipcRenderer.on('aw:http:head', (_e, data) => {
  for (const h of headHandlers) {
    try { h(data) } catch (err) { /* ignore */ }
  }
})

contextBridge.exposeInMainWorld('awHost', {
  asset: {
    read: (rel) => ipcRenderer.invoke('aw:asset:read', rel)
  },
  http: {
    request: (req) => ipcRenderer.invoke('aw:http', req),
    stream: (req) => ipcRenderer.invoke('aw:http:stream', req),
    abort: (id) => ipcRenderer.invoke('aw:http:abort', id),
    onChunk: (fn) => {
      chunkHandlers.add(fn)
      return () => chunkHandlers.delete(fn)
    },
    onEnd: (fn) => {
      endHandlers.add(fn)
      return () => endHandlers.delete(fn)
    },
    onHead: (fn) => {
      headHandlers.add(fn)
      return () => headHandlers.delete(fn)
    }
  },
  secrets: {
    load: () => ipcRenderer.invoke('aw:secrets:load'),
    save: (payload) => ipcRenderer.invoke('aw:secrets:save', payload),
    clear: () => ipcRenderer.invoke('aw:secrets:clear')
  }
})
