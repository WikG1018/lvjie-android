package com.lvjie.nativeapp.llm

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.channels.trySendBlocking
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.*
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import java.io.BufferedReader
import java.io.IOException
import java.util.concurrent.TimeUnit

/** 自定义大模型客户端：chat / response 双协议，SSE 流式 */
class LlmService(
    private val http: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(300, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build(),
) {
    private val json = Json { ignoreUnknownKeys = true }

    suspend fun test(cfg: LlmConfig): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            val req = Request.Builder()
                .url(cfg.baseUrl.trimEnd('/') + "/models")
                .addHeader("Authorization", "Bearer ${cfg.apiKey}")
                .get().build()
            http.newCall(req).execute().use { r ->
                if (r.isSuccessful) {
                    return@runCatching "连通正常 · GET /models ${r.code}"
                }
                // /models 不可用时用最短 completion 探测
                val path = if (cfg.protocol == "response") "/responses" else "/chat/completions"
                val payload = buildJsonObject {
                    put("model", cfg.model)
                    put("stream", false)
                    put("max_tokens", 1)
                    if (cfg.protocol == "response") put("input", "ping")
                    else {
                        putJsonArray("messages") {
                            addJsonObject { put("role", "user"); put("content", "ping") }
                        }
                    }
                }
                val req2 = Request.Builder()
                    .url(cfg.baseUrl.trimEnd('/') + path)
                    .addHeader("Authorization", "Bearer ${cfg.apiKey}")
                    .post(payload.toString().toRequestBody("application/json".toMediaType()))
                    .build()
                http.newCall(req2).execute().use { r2 ->
                    if (!r2.isSuccessful) error("HTTP ${r.code}/${r2.code}")
                    "连通正常 · POST $path ${r2.code}"
                }
            }
        }
    }

    suspend fun listModels(cfg: LlmConfig): Result<List<String>> = withContext(Dispatchers.IO) {
        runCatching {
            val req = Request.Builder()
                .url(cfg.baseUrl.trimEnd('/') + "/models")
                .addHeader("Authorization", "Bearer ${cfg.apiKey}")
                .get().build()
            http.newCall(req).execute().use { r ->
                if (!r.isSuccessful) error("HTTP ${r.code}")
                val body = r.body?.string() ?: "[]"
                val el = json.parseToJsonElement(body)
                val arr = when {
                    el is JsonArray -> el
                    el is JsonObject && el["data"] is JsonArray -> el["data"]!!.jsonArray
                    else -> JsonArray(emptyList())
                }
                arr.mapNotNull { it.jsonObject["id"]?.jsonPrimitive?.contentOrNull }
            }
        }
    }

    /** 流式增量文本 */
    fun stream(cfg: LlmConfig, system: String, user: String): Flow<String> = callbackFlow {
        val channel = this
        val isResponse = cfg.protocol == "response"
        val path = if (isResponse) "/responses" else "/chat/completions"
        val payload = buildJsonObject {
            put("model", cfg.model)
            put("stream", true)
            if (isResponse) {
                put("input", "$system\n\n$user")
            } else {
                putJsonArray("messages") {
                    addJsonObject { put("role", "system"); put("content", system) }
                    addJsonObject { put("role", "user"); put("content", user) }
                }
            }
        }
        val request = Request.Builder()
            .url(cfg.baseUrl.trimEnd('/') + path)
            .addHeader("Authorization", "Bearer ${cfg.apiKey}")
            .addHeader("Accept", "text/event-stream")
            .post(payload.toString().toRequestBody("application/json".toMediaType()))
            .build()

        val call = http.newCall(request)
        call.enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                close(e)
            }

            override fun onResponse(call: Call, response: Response) {
                response.use { resp ->
                    if (!resp.isSuccessful) {
                        close(IOException("HTTP ${resp.code}"))
                        return
                    }
                    val reader: BufferedReader = resp.body?.source()?.inputStream()?.bufferedReader()
                        ?: run { close(IOException("空响应")); return }
                    try {
                        reader.forEachLine { line ->
                            val data = line.removePrefix("data:").trim()
                            if (data.isEmpty() || data.startsWith(":")) return@forEachLine
                            if (data == "[DONE]") {
                                close()
                                return@forEachLine
                            }
                            val piece = parseDelta(data, isResponse)
                            if (piece.isNotEmpty()) {
                                // 阻塞发送，避免慢消费者丢字
                                channel.trySendBlocking(piece)
                            }
                        }
                        close()
                    } catch (e: Exception) {
                        close(e)
                    }
                }
            }
        })
        awaitClose { call.cancel() }
    }.flowOn(Dispatchers.IO)

    suspend fun complete(cfg: LlmConfig, system: String, user: String): Result<String> =
        withContext(Dispatchers.IO) {
            runCatching {
                val isResponse = cfg.protocol == "response"
                val path = if (isResponse) "/responses" else "/chat/completions"
                val payload = buildJsonObject {
                    put("model", cfg.model)
                    put("stream", false)
                    if (isResponse) put("input", "$system\n\n$user")
                    else {
                        putJsonArray("messages") {
                            addJsonObject { put("role", "system"); put("content", system) }
                            addJsonObject { put("role", "user"); put("content", user) }
                        }
                    }
                }
                val req = Request.Builder()
                    .url(cfg.baseUrl.trimEnd('/') + path)
                    .addHeader("Authorization", "Bearer ${cfg.apiKey}")
                    .post(payload.toString().toRequestBody("application/json".toMediaType()))
                    .build()
                http.newCall(req).execute().use { r ->
                    if (!r.isSuccessful) error("HTTP ${r.code}")
                    val body = r.body?.string() ?: error("空响应")
                    extractFullText(body)
                }
            }
        }

    private fun parseDelta(data: String, isResponse: Boolean): String {
        return runCatching {
            val el = json.parseToJsonElement(data) as? JsonObject ?: return ""
            if (isResponse) {
                el["delta"]?.jsonPrimitive?.contentOrNull
                    ?: el["text"]?.jsonPrimitive?.contentOrNull
                    ?: ""
            } else {
                el["choices"]?.jsonArray?.firstOrNull()?.jsonObject
                    ?.get("delta")?.jsonObject?.get("content")?.jsonPrimitive?.contentOrNull
                    ?: ""
            }
        }.getOrDefault("")
    }

    private fun extractFullText(raw: String): String {
        val el = json.parseToJsonElement(raw) as? JsonObject ?: return raw
        el["choices"]?.jsonArray?.firstOrNull()?.jsonObject
            ?.get("message")?.jsonObject?.get("content")?.jsonPrimitive?.contentOrNull
            ?.let { return it }
        el["output_text"]?.jsonPrimitive?.contentOrNull?.let { return it }
        el["output"]?.jsonArray?.firstOrNull()?.jsonObject
            ?.get("content")?.jsonArray?.firstOrNull()?.jsonObject
            ?.get("text")?.jsonPrimitive?.contentOrNull
            ?.let { return it }
        return raw
    }
}
