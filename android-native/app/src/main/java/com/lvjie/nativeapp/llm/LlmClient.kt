package com.lvjie.nativeapp.llm

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

data class LlmConfig(
    val baseUrl: String = "https://api.example.com/v1",
    val apiKey: String = "",
    val model: String = "gpt-mini",
    val protocol: String = "chat", // chat | response
)

/** 自定义大模型客户端：chat / response 双协议 */
class LlmClient(
    private val config: LlmConfig,
    private val http: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(120, TimeUnit.SECONDS)
        .build(),
) {
    private val json = Json { ignoreUnknownKeys = true }

    suspend fun testConnection(): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            val req = Request.Builder()
                .url(config.baseUrl.trimEnd('/') + "/models")
                .addHeader("Authorization", "Bearer ${config.apiKey}")
                .get().build()
            http.newCall(req).execute().use { resp ->
                if (!resp.isSuccessful) error("HTTP ${resp.code}")
                "连通正常 · ${resp.code}"
            }
        }
    }

    /** 简单生成（非流式）。返回叙事文本。 */
    suspend fun generate(system: String, user: String): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            val body = buildJsonObject {
                put("model", config.model)
                putJsonArray("messages") {
                    addJsonObject {
                        put("role", "system")
                        put("content", system)
                    }
                    addJsonObject {
                        put("role", "user")
                        put("content", user)
                    }
                }
                put("stream", false)
            }
            val path = if (config.protocol == "response") "/responses" else "/chat/completions"
            val req = Request.Builder()
                .url(config.baseUrl.trimEnd('/') + path)
                .addHeader("Authorization", "Bearer ${config.apiKey}")
                .addHeader("Content-Type", "application/json")
                .post(body.toString().toRequestBody("application/json".toMediaType()))
                .build()
            http.newCall(req).execute().use { resp ->
                if (!resp.isSuccessful) error("HTTP ${resp.code}")
                val text = resp.body?.string() ?: error("空响应")
                extractText(text)
            }
        }
    }

    private fun extractText(raw: String): String {
        val el = json.parseToJsonElement(raw)
        val obj = el as? JsonObject ?: return raw
        // chat.completions: choices[0].message.content
        obj["choices"]?.jsonArray?.firstOrNull()?.jsonObject
            ?.get("message")?.jsonObject?.get("content")?.jsonPrimitive?.contentOrNull
            ?.let { return it }
        // responses: output_text or output[].content[].text
        obj["output_text"]?.jsonPrimitive?.contentOrNull?.let { return it }
        obj["output"]?.jsonArray?.firstOrNull()?.jsonObject
            ?.get("content")?.jsonArray?.firstOrNull()?.jsonObject
            ?.get("text")?.jsonPrimitive?.contentOrNull
            ?.let { return it }
        return raw
    }
}
