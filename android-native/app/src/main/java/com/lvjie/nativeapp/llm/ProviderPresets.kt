package com.lvjie.nativeapp.llm

/** 上游 v0.4.0 服务商预设。只收录公开文档里的地址，不含任何密钥。 */
data class ProviderPreset(
    val id: String,
    val name: String,
    val baseUrl: String,
    val model: String,
    val tag: String = "",
    val steps: List<String> = emptyList(),
)

object ProviderPresets {
    val all: List<ProviderPreset> = listOf(
        ProviderPreset(
            "intern", "书生（Intern-AI）", "https://chat.intern-ai.org.cn/api/v1", "intern-latest", "免费",
            listOf("登录书生后在 API 控制台生成 token，粘到 API Key。默认 intern-latest。"),
        ),
        ProviderPreset(
            "spark", "讯飞星火（Spark）", "https://spark-api-open.xf-yun.com/v1", "lite", "免费",
            listOf("复制星火的 APIPassword，不是 APPID。免费档模型填 lite。"),
        ),
        ProviderPreset(
            "zhipu", "智谱（GLM）", "https://open.bigmodel.cn/api/paas/v4", "glm-4.7-flash", "免费",
            listOf("免费模型也要求账户有余额。默认 glm-4.7-flash。"),
        ),
        ProviderPreset(
            "mimo", "小米（MiMo）", "https://api.xiaomimimo.com/v1", "mimo-v2.6-flash",
            steps = listOf("在 MiMo 开放平台创建 sk- 密钥。默认 mimo-v2.6-flash。"),
        ),
        ProviderPreset(
            "deepseek", "深度求索（DeepSeek）", "https://api.deepseek.com/v1", "",
            steps = listOf("粘贴 Key 后点刷新模型列表，自己选模型。"),
        ),
        ProviderPreset(
            "qwen", "通义千问（Qwen）", "https://dashscope.aliyuncs.com/compatible-mode/v1", "qwen-plus",
            steps = listOf("阿里云百炼创建 API-KEY。默认 qwen-plus。"),
        ),
        ProviderPreset(
            "kimi", "月之暗面（Kimi）", "https://api.moonshot.cn/v1", "kimi-k2.6",
            steps = listOf("Moonshot 控制台新建密钥。默认 kimi-k2.6。"),
        ),
        ProviderPreset(
            "doubao", "豆包（Doubao）", "https://ark.cn-beijing.volces.com/api/v3", "doubao-2.0-pro",
            steps = listOf("火山方舟开通模型后创建 API Key。若要求接入点，把 ep- 填到模型。"),
        ),
        ProviderPreset(
            "siliconflow", "硅基流动（SiliconFlow）", "https://api.siliconflow.cn/v1", "Qwen/Qwen3-8B",
            steps = listOf("硅基流动创建密钥。也可刷新模型列表再选。"),
        ),
        ProviderPreset(
            "sensenova", "商汤日日新（SenseNova）", "https://api.sensenova.cn/compatible-mode/v2", "SenseChat-5",
            steps = listOf("日日新控制台创建 API Key。默认 SenseChat-5。"),
        ),
        ProviderPreset(
            "hunyuan", "腾讯混元（Hunyuan）", "https://tokenhub.tencentmaas.com/v1", "hy3",
            steps = listOf("腾讯云 TokenHub 创建 API Key。默认 hy3。"),
        ),
    )
}
