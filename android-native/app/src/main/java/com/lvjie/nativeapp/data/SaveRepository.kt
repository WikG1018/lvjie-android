package com.lvjie.nativeapp.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "lvjie")

/** 存档 / 偏好 / 世界选择 */
class SaveRepository(private val context: Context) {
    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    private object Keys {
        fun save(worldId: String) = stringPreferencesKey("save_$worldId")
        val activeWorld = stringPreferencesKey("active_world")
        val packOrder = stringPreferencesKey("pack_order")
        val customPacks = stringPreferencesKey("custom_packs")
        val aiStyle = stringPreferencesKey("ai_style")
        val lang = stringPreferencesKey("lang")
        val dialogLimit = booleanPreferencesKey("dialog_limit")
        val bgm = booleanPreferencesKey("bgm")
    }

    val activeWorldId: Flow<String> = context.dataStore.data.map { it[Keys.activeWorld] ?: "xiuxian" }

    fun saveFlow(worldId: String): Flow<PlayerState?> =
        context.dataStore.data.map { prefs ->
            prefs[Keys.save(worldId)]?.let {
                runCatching { json.decodeFromString<PlayerState>(it) }.getOrNull()
            }
        }

    suspend fun writeSave(state: PlayerState) {
        context.dataStore.edit { prefs ->
            prefs[Keys.save(state.worldId)] = json.encodeToString(PlayerState.serializer(), state)
            prefs[Keys.activeWorld] = state.worldId
        }
    }

    suspend fun readSave(worldId: String): PlayerState? =
        context.dataStore.data.first()[Keys.save(worldId)]?.let {
            runCatching { json.decodeFromString<PlayerState>(it) }.getOrNull()
        }

    suspend fun deleteSave(worldId: String) {
        context.dataStore.edit { prefs ->
            prefs.remove(Keys.save(worldId))
        }
    }

    suspend fun exportBundle(): String {
        val prefs = context.dataStore.data.first()
        val saves = LinkedHashMap<String, PlayerState>()
        // 遍历所有 save_ 键（含自定义世界），保证导出/导入对称
        prefs.asMap().keys.forEach { key ->
            if (key.name.startsWith("save_")) {
                val worldId = key.name.removePrefix("save_")
                val raw = prefs[Keys.save(worldId)] ?: return@forEach
                val st = runCatching { json.decodeFromString(PlayerState.serializer(), raw) }.getOrNull() ?: return@forEach
                saves[worldId] = st
            }
        }
        return json.encodeToString(ExportMap.serializer(), ExportMap(saves))
    }

    suspend fun importBundle(raw: String): Int {
        val map = runCatching {
            json.decodeFromString(ExportMap.serializer(), raw)
        }.getOrNull()?.saves ?: return 0
        if (map.isEmpty()) return 0
        context.dataStore.edit { prefs ->
            for ((id, st) in map) {
                prefs[Keys.save(id)] = json.encodeToString(PlayerState.serializer(), st)
            }
        }
        return map.size
    }

    // 自定义世界包
    private val _customPacks = kotlinx.coroutines.flow.MutableStateFlow<List<CustomPack>>(emptyList())
    val customPacksFlow: kotlinx.coroutines.flow.StateFlow<List<CustomPack>> = _customPacks

    init {
        // 启动时加载一次自定义包
    }

    suspend fun loadCustomPacksOnce() {
        val raw = context.dataStore.data.first()[Keys.customPacks]
        if (!raw.isNullOrBlank()) {
            val list = runCatching {
                json.decodeFromString(kotlinx.serialization.builtins.ListSerializer(CustomPack.serializer()), raw)
            }.getOrDefault(emptyList())
            _customPacks.value = list
        }
    }

    suspend fun saveCustomPack(id: String, name: String, tagline: String, tiers: List<String>, placeNames: List<String>) {
        val cur = _customPacks.value.filterNot { it.id == id }
        val next = cur + CustomPack(id, name, tagline, tiers, placeNames)
        _customPacks.value = next
        context.dataStore.edit { prefs ->
            prefs[Keys.customPacks] = json.encodeToString(
                kotlinx.serialization.builtins.ListSerializer(CustomPack.serializer()),
                next,
            )
        }
    }

    suspend fun deleteCustomPack(id: String) {
        val next = _customPacks.value.filterNot { it.id == id }
        _customPacks.value = next
        context.dataStore.edit { prefs ->
            prefs[Keys.customPacks] = json.encodeToString(
                kotlinx.serialization.builtins.ListSerializer(CustomPack.serializer()),
                next,
            )
        }
    }

    // 全局偏好
    val prefsFlow: Flow<GlobalPrefs> = context.dataStore.data.map { p ->
        GlobalPrefs(
            aiStyle = p[Keys.aiStyle] ?: "沉浸",
            lang = p[Keys.lang] ?: "简体中文",
            dialogLimit = p[Keys.dialogLimit] ?: true,
            bgm = p[Keys.bgm] ?: true,
        )
    }

    suspend fun setAiStyle(v: String) = context.dataStore.edit { it[Keys.aiStyle] = v }
    suspend fun setLang(v: String) = context.dataStore.edit { it[Keys.lang] = v }
    suspend fun setDialogLimit(v: Boolean) = context.dataStore.edit { it[Keys.dialogLimit] = v }
    suspend fun setBgm(v: Boolean) = context.dataStore.edit { it[Keys.bgm] = v }
}

@kotlinx.serialization.Serializable
data class ExportMap(val saves: Map<String, PlayerState> = emptyMap())

@kotlinx.serialization.Serializable
data class GlobalPrefs(
    val aiStyle: String = "沉浸",
    val lang: String = "简体中文",
    val dialogLimit: Boolean = true,
    val bgm: Boolean = true,
)
