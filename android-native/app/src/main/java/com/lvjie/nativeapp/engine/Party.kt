package com.lvjie.nativeapp.engine

import com.lvjie.nativeapp.data.Friend

/** 上游 v0.3.0 同伴同行。模型不直接改 party，只由界面切换。 */
object Party {
    fun follow(friends: List<Friend>, placeName: String): List<Friend> {
        if (placeName.isBlank()) return friends
        return friends.map { friend ->
            if (friend.traveling) friend.copy(at = placeName) else friend
        }
    }

    fun toggle(friends: List<Friend>, name: String, here: String): Pair<List<Friend>, String> {
        val index = friends.indexOfFirst { it.name == name }
        if (index < 0) return friends to "先结识 $name"
        val friend = friends[index]
        val updated = friends.toMutableList()
        if (friend.traveling) {
            val back = friend.origin.ifBlank { here }
            updated[index] = friend.copy(
                traveling = false,
                at = back,
                history = friend.history + "结束同行，留在$back",
            )
            return updated to "已结束与 $name 同行"
        }
        if (friend.at.isNotBlank() && here.isNotBlank() && friend.at != here) {
            return friends to "$name 在${friend.at}，需同场景才能邀请"
        }
        updated[index] = friend.copy(
            traveling = true,
            origin = friend.at.ifBlank { here },
            at = here,
            history = friend.history + "开始同行",
        )
        return updated to "$name 加入同行"
    }

    fun spar(friends: List<Friend>, name: String, day: Long): Pair<List<Friend>, String> {
        val index = friends.indexOfFirst { it.name == name }
        if (index < 0) return friends to "先结识 $name"
        val friend = friends[index]
        if (!friend.traveling) return friends to "先邀请 $name 同行"
        if (friend.lastSparDay == day) return friends to "今日已互动"
        val updated = friends.toMutableList()
        updated[index] = friend.copy(
            favor = (friend.favor + 2).coerceAtMost(100),
            lastSparDay = day,
            history = (friend.history + "切磋交流").takeLast(50),
        )
        return updated to "与 $name 切磋，好感 +2"
    }
}
