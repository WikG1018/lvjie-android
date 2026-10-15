package com.lvjie.nativeapp.engine

import com.lvjie.nativeapp.data.Place
import com.lvjie.nativeapp.data.PlayerState
import com.lvjie.nativeapp.data.WorldPack

/** 加载与落库时丢掉占位生物 / 未知物件。gender 只保留 男 / 女 / 空。 */
object MapHygiene {
    fun normGender(gender: String): String = when (gender) {
        "男", "女" -> gender
        else -> ""
    }

    fun cleanPlace(place: Place): Place {
        val beasts = place.beasts.filter { beast ->
            val name = beast.name.trim()
            name.isNotEmpty() && name != "未知生物"
        }
        val spots = place.interactables.filter { spot ->
            val name = spot.name.trim()
            name.isNotEmpty() && name != "未知"
        }
        return if (beasts == place.beasts && spots == place.interactables) place
        else place.copy(beasts = beasts, interactables = spots)
    }

    fun cleanPlaces(places: List<Place>): List<Place> = places.map { cleanPlace(it) }

    fun clean(state: PlayerState): PlayerState {
        val places = cleanPlaces(state.mapPlaces)
        val gender = normGender(state.gender)
        return if (places == state.mapPlaces && gender == state.gender) state
        else state.copy(mapPlaces = places, gender = gender)
    }

    /** 运行时地图：存档里的 mapPlaces 非空则盖过静态模板。 */
    fun overlay(pack: WorldPack, state: PlayerState): WorldPack =
        if (state.mapPlaces.isNotEmpty()) pack.copy(places = state.mapPlaces) else pack
}
