package com.lvjie.nativeapp.llm

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.keyStore: DataStore<Preferences> by preferencesDataStore(name = "lvjie_keys")

/** API Key / 模型配置：密文进 DataStore，明文只在内存 */
class CredentialsRepository(private val context: Context) {
    private object K {
        val sealedKey = stringPreferencesKey("sealed_api_key")
        val baseUrl = stringPreferencesKey("base_url")
        val model = stringPreferencesKey("model_name")
        val protocol = stringPreferencesKey("protocol")
    }

    val configFlow: Flow<LlmConfig> = context.keyStore.data.map { p ->
        LlmConfig(
            baseUrl = p[K.baseUrl] ?: "https://api.example.com/v1",
            apiKey = p[K.sealedKey]?.let { KeyVault.open(it) } ?: "",
            model = p[K.model] ?: "gpt-mini",
            protocol = p[K.protocol] ?: "chat",
        )
    }

    suspend fun current(): LlmConfig = configFlow.first()

    suspend fun save(cfg: LlmConfig) {
        context.keyStore.edit { p ->
            p[K.baseUrl] = cfg.baseUrl
            p[K.model] = cfg.model
            p[K.protocol] = cfg.protocol
            p[K.sealedKey] = if (cfg.apiKey.isNotEmpty()) KeyVault.seal(cfg.apiKey) else ""
        }
    }

    suspend fun clearKey() {
        context.keyStore.edit { p -> p[K.sealedKey] = "" }
    }
}
