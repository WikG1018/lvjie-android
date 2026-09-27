import { endpointOf, normalizeApiKey, extractGameJSON } from '../app/js/engine/llm.js'

const a = normalizeApiKey({ baseUrl: 'https://api.openai.com/v1', key: 'sk-abc', model: 'gpt-4.1-mini', apiStyle: 'chat' })
const b = normalizeApiKey({ baseUrl: 'https://api.openai.com/v1', key: 'sk-abc', model: 'gpt-4.1-mini', apiStyle: 'response' })
console.log('chat', endpointOf(a))
console.log('response', endpointOf(b))
console.log('fullpath', endpointOf(normalizeApiKey({ baseUrl: 'https://x/v1/chat/completions', key: 'k', model: 'm', apiStyle: 'chat' })))
console.log('json', extractGameJSON('hi\n```json\n{"end":true}\n```'))
if (endpointOf(a) !== 'https://api.openai.com/v1/chat/completions') throw new Error('chat endpoint wrong')
if (endpointOf(b) !== 'https://api.openai.com/v1/responses') throw new Error('response endpoint wrong')
console.log('LLM_ENDPOINT_OK')
