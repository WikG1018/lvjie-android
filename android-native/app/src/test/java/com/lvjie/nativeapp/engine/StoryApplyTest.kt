package com.lvjie.nativeapp.engine

import com.lvjie.nativeapp.data.Beast
import com.lvjie.nativeapp.data.Friend
import com.lvjie.nativeapp.data.InventoryItem
import com.lvjie.nativeapp.data.Place
import com.lvjie.nativeapp.data.PlayerState
import com.lvjie.nativeapp.data.Spot
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class StoryApplyTest {
    private val town = Place(id = "p1", name = "青云坊市", people = listOf("苏婉儿"))
    private val hill = Place(id = "p2", name = "落霞山")

    @Test
    fun giftAcceptedWhenNarrativeSaysReceived() {
        val applied = StoryApply.apply(
            PlayerState(loc = "p1"),
            listOf(town),
            fence("""{"narrative":"苏婉儿把「聚气丹」塞给你，你收下了。","options":["道谢"],"changes":{}}"""),
            nowMillis = 1L,
        )
        val item = applied.state.inventory.single { it.name == "聚气丹" }
        assertEquals(1, item.count)
        assertEquals("剧情赠与", item.desc)
        assertEquals("你收下了。", applied.display.substringAfter("，"))
        assertFalse(applied.display.contains("```"))
        assertEquals(listOf("道谢"), applied.options)
    }

    @Test
    fun giftRefusedWhenHardRefusal() {
        val applied = StoryApply.apply(
            PlayerState(loc = "p1"),
            listOf(town),
            fence("""{"narrative":"他递给你「聚气丹」，你拒绝了。","options":[],"changes":{}}"""),
            nowMillis = 1L,
        )
        assertTrue(applied.state.inventory.none { it.name == "聚气丹" })
    }

    @Test
    fun giftNotGrantedOnConditionalPromise() {
        val applied = StoryApply.apply(
            PlayerState(loc = "p1"),
            listOf(town),
            fence("""{"narrative":"若你赢了便送你「聚气丹」。","options":[],"changes":{}}"""),
            nowMillis = 1L,
        )
        assertTrue(applied.state.inventory.none { it.name == "聚气丹" })
        val promised = "若你赢了便送你「聚气丹」。"
        assertFalse(StoryApply.giftAcceptedAt(promised, promised.indexOf("聚气丹")))
    }

    @Test
    fun softRefusalStillCountsWhenLaterAccepted() {
        val accepted = "你推辞一番，还是收了。"
        assertTrue(StoryApply.giftAcceptedAt(accepted, accepted.indexOf("推辞")))
        val declined = "你推辞一番，他转身离开。"
        assertFalse(StoryApply.giftAcceptedAt(declined, declined.indexOf("推辞")))

        val applied = StoryApply.apply(
            PlayerState(loc = "p1"),
            listOf(town),
            fence("""{"narrative":"苏婉儿把「回元丹」塞给你。你推辞一番，还是收了。","options":[],"changes":{}}"""),
            nowMillis = 1L,
        )
        assertTrue(applied.state.inventory.any { it.name == "回元丹" && it.desc == "剧情赠与" })
    }

    @Test
    fun jsonItemKeptWhenNarrativeOmitsIt() {
        val applied = StoryApply.apply(
            PlayerState(loc = "p1"),
            listOf(town),
            fence("""{"narrative":"你在坊市闲逛。","options":[],"changes":{"add_items":[{"name":"青锋剑","count":2,"type":"equip","desc":"剑","grade":"极品","tier":3}]}}"""),
            nowMillis = 1L,
        )
        val sword = applied.state.inventory.single { it.name == "青锋剑" }
        assertEquals(2, sword.count)
        assertEquals("equip", sword.type)
        assertEquals("剑", sword.desc)
        assertEquals(0, sword.value)
    }

    @Test
    fun sameNameLocationMergesBeastsPeopleAndSpots() {
        val existing = town.copy(
            beasts = listOf(Beast("赤狼", "筑基", 10, "牙")),
            interactables = listOf(Spot("石碑", "旧字")),
        )
        val applied = StoryApply.apply(
            PlayerState(loc = "p1"),
            listOf(existing, hill),
            fence(
                """{"narrative":"坊市依旧。","options":[],"changes":{"new_locations":[{"name":"青云坊市","people":["青云道人","苏婉儿"],"beasts":[{"name":"黑风狼","realm":"练气","power":8,"drops":"皮"},{"name":"未知生物","power":1},{"name":"","power":9}],"interactables":[{"name":"告示板","intro":"招贤"},{"name":"未知","intro":"空"},{"name":"","intro":"无"}]}]}}""",
            ),
            nowMillis = 1_700_000_000_000L,
        )
        assertEquals(2, applied.state.mapPlaces.size)
        val merged = applied.state.mapPlaces.single { it.name == "青云坊市" }
        assertEquals("p1", merged.id)
        assertEquals(listOf("苏婉儿", "青云道人"), merged.people)
        assertEquals(listOf("赤狼", "黑风狼"), merged.beasts.map { it.name })
        assertEquals(listOf("石碑", "告示板"), merged.interactables.map { it.name })
        assertTrue(applied.state.mapPlaces.none { it.id.startsWith("n") })
    }

    @Test
    fun unknownBeastsAndBlankNamesAreDropped() {
        val dirty = PlayerState(
            loc = "p1",
            mapPlaces = listOf(
                town.copy(
                    beasts = listOf(Beast("未知生物"), Beast("  "), Beast("赤目狼")),
                    interactables = listOf(Spot("未知"), Spot(""), Spot("井")),
                ),
            ),
        )
        val cleaned = MapHygiene.clean(dirty)
        val place = cleaned.mapPlaces.single()
        assertEquals(listOf("赤目狼"), place.beasts.map { it.name })
        assertEquals(listOf("井"), place.interactables.map { it.name })

        val applied = StoryApply.apply(
            PlayerState(loc = "p1"),
            listOf(town),
            fence(
                """{"narrative":"山中有兽。","options":[],"changes":{"new_locations":[{"name":"黑风寨","beasts":[{"name":"未知生物"},{"name":"黑风狼","power":3}]}]}}""",
            ),
            nowMillis = 42L,
        )
        val created = applied.state.mapPlaces.single { it.name == "黑风寨" }
        assertEquals(listOf("黑风狼"), created.beasts.map { it.name })
        assertTrue(created.id.startsWith("n42"))
    }

    @Test
    fun ageDaysCappedAt3650AndAdvancesTravelers() {
        val state = PlayerState(
            loc = "p1",
            age = 12,
            ageDays = 100,
            tierIndex = 2,
            friends = listOf(
                Friend(name = "苏婉儿", traveling = true, ageDays = 20),
                Friend(name = "青云道人", traveling = false, ageDays = 30),
            ),
        )
        val applied = StoryApply.apply(
            state,
            listOf(town),
            fence("""{"narrative":"闭关。","options":[],"changes":{"age_days":99999,"tierIndex":5,"tier":"渡劫"}}"""),
            nowMillis = 1L,
        )
        assertEquals(100 + 3650, applied.state.ageDays)
        assertEquals((100 + 3650) / 360, applied.state.age)
        assertEquals(2, applied.state.tierIndex)
        assertEquals(20 + 3650, applied.state.friends[0].ageDays)
        assertEquals(30, applied.state.friends[1].ageDays)
        assertEquals("12岁0月0天", StoryApply.ageText(0, 12))
        assertEquals("1岁1月5天", StoryApply.ageText(395, 99))
    }

    @Test
    fun endTravelReturnsHomeOrStaysAndDismissAllDoesTheSame() {
        val friends = listOf(
            Friend(name = "苏婉儿", traveling = true, origin = "青云坊市", at = "落霞山"),
            Friend(name = "青云道人", traveling = true, origin = "", at = "落霞山"),
            Friend(name = "路人", traveling = false, origin = "洛阳", at = "洛阳"),
        )
        val home = Party.endTravel(friends, "苏婉儿", "落霞山", returnHome = true)
        assertFalse(home[0].traveling)
        assertEquals("青云坊市", home[0].at)
        assertTrue(home[1].traveling)
        assertFalse(home[2].traveling)

        val stay = Party.endTravel(friends, "苏婉儿", "落霞山", returnHome = false)
        assertFalse(stay[0].traveling)
        assertEquals("落霞山", stay[0].at)

        val noOrigin = Party.endTravel(friends, "青云道人", "剑冢", returnHome = true)
        assertFalse(noOrigin[1].traveling)
        assertEquals("剑冢", noOrigin[1].at)

        val dismissed = Party.dismissAll(friends, "落霞山", returnHome = true)
        assertEquals("青云坊市", dismissed[0].at)
        assertFalse(dismissed[0].traveling)
        assertEquals("落霞山", dismissed[1].at)
        assertFalse(dismissed[1].traveling)
        assertEquals("洛阳", dismissed[2].at)
        assertFalse(dismissed[2].traveling)
    }

    @Test
    fun teamPowerSumsPositiveTravelersOnly() {
        val friends = listOf(
            Friend(name = "甲", traveling = true, power = 20),
            Friend(name = "乙", traveling = true, power = 0),
            Friend(name = "丙", traveling = true, power = -4),
            Friend(name = "丁", traveling = false, power = 50),
        )
        assertEquals(120, Party.teamPower(100, friends))
        assertEquals(20, Party.teamPower(0, friends))
        assertEquals(20, Party.teamPower(-3, friends))
        assertEquals(3L, Party.dayKey(100))
    }

    @Test
    fun moneyCannotGoNegativeAndItemsStackWithinCaps() {
        val state = PlayerState(
            loc = "p1",
            money = 5,
            moneyMid = 1,
            progress = 4,
            inventory = listOf(InventoryItem(name = "聚气丹", count = 2, desc = "旧")),
        )
        val extras = (1..12).joinToString(",") { i ->
            """{"name":"物$i","count":100,"desc":"d","type":"consumable"}"""
        }
        val applied = StoryApply.apply(
            state,
            listOf(town),
            fence(
                """{"narrative":"结账。","options":["1. 离开"],"changes":{"money_main":-100,"money_mid":3,"money_high":1,"money_peak":2,"progress":-9,"add_items":[{"name":"聚气丹","count":5,"desc":"新","type":"consumable"},$extras]}}""",
            ),
            nowMillis = 1L,
        )
        assertEquals(0, applied.state.money)
        assertEquals(4, applied.state.moneyMid)
        assertEquals(1, applied.state.moneyHigh)
        assertEquals(2, applied.state.moneyPeak)
        assertEquals(0, applied.state.progress)
        val pill = applied.state.inventory.first { it.name == "聚气丹" }
        assertEquals(7, pill.count)
        assertEquals("旧", pill.desc)
        assertEquals(99, applied.state.inventory.first { it.name == "物1" }.count)
        assertEquals(10, applied.state.inventory.size)
        assertTrue(applied.state.inventory.none { it.name == "物10" })
        assertEquals("离开", applied.options.single())
    }

    @Test
    fun moveToAndTailArrivalUpdateCompanion() {
        val state = PlayerState(
            loc = "p1",
            friends = listOf(Friend(name = "苏婉儿", traveling = true, at = "青云坊市", power = 8)),
        )
        val moved = StoryApply.apply(
            state,
            listOf(town, hill),
            fence("""{"narrative":"你离开了。","options":[],"changes":{"move_to":"落霞山"}}"""),
            nowMillis = 1L,
        )
        assertEquals("p2", moved.state.loc)
        assertEquals("落霞山", moved.state.friends.single().at)

        val narr = "甲".repeat(20) + "你来到落霞山。"
        val inferred = StoryApply.apply(
            state,
            listOf(town, hill),
            fence("""{"narrative":"$narr","options":[],"changes":{}}"""),
            nowMillis = 1L,
        )
        assertEquals("p2", inferred.state.loc)

        val early = "你来到落霞山。" + "乙".repeat(40)
        val stayed = StoryApply.apply(
            state,
            listOf(town, hill),
            fence("""{"narrative":"$early","options":[],"changes":{}}"""),
            nowMillis = 1L,
        )
        assertEquals("p1", stayed.state.loc)
    }

    @Test
    fun jsonFenceWinsAndTrailingCommaIsTolerated() {
        val text = """
            前言 {"narrative":"错误","changes":{"money_main":1}}
            ```json
            {"narrative":"正确，","options":["走",],"changes":{"money_main":10,}}
            ```
        """.trimIndent()
        val applied = StoryApply.apply(PlayerState(money = 1, loc = "p1"), listOf(town), text, 1L)
        assertEquals("正确，", applied.display)
        assertEquals(11, applied.state.money)
        assertFalse(applied.display.contains("```"))
    }

    private fun fence(json: String) = "```json\n$json\n```"
}
