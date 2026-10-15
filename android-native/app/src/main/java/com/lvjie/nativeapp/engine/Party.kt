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

    /** 游戏天：30 天为一天。调用方传 ageDays/30，不要用壁钟。 */
    fun dayKey(ageDays: Int): Long = ageDays.toLong() / 30L

    fun teamPower(playerPower: Int, friends: List<Friend>): Int {
        var total = 0L
        if (playerPower > 0) total += playerPower
        for (friend in friends) {
            if (friend.traveling && friend.power > 0) total += friend.power
        }
        return total.coerceAtMost(Int.MAX_VALUE.toLong()).toInt()
    }

    /** returnHome 且 origin 非空则送回原处，否则留在当前地点。 */
    fun endTravel(friends: List<Friend>, name: String, here: String, returnHome: Boolean): List<Friend> {
        return friends.map { friend ->
            if (friend.name != name || !friend.traveling) friend else finishTravel(friend, here, returnHome)
        }
    }

    fun dismissAll(friends: List<Friend>, here: String, returnHome: Boolean): List<Friend> {
        return friends.map { friend ->
            if (!friend.traveling) friend else finishTravel(friend, here, returnHome)
        }
    }

    private fun finishTravel(friend: Friend, here: String, returnHome: Boolean): Friend {
        val back = returnHome && friend.origin.isNotBlank()
        val at = if (back) friend.origin else here.ifBlank { friend.at }
        val note = if (back) "结束同行，返回$at" else "结束同行，留在$at"
        return friend.copy(
            traveling = false,
            at = at,
            history = (friend.history + note).takeLast(50),
        )
    }
}
