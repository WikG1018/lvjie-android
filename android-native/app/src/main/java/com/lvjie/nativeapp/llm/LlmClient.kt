package com.lvjie.nativeapp.llm

/** 模型连接配置（明文仅存内存；落盘前经 KeyVault 加密） */
data class LlmConfig(
    val baseUrl: String = "https://api.example.com/v1",
    val apiKey: String = "",
    val model: String = "gpt-mini",
    val protocol: String = "chat", // chat | response
)
