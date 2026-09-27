package com.lvjie.nativeapp.data

import com.lvjie.nativeapp.ui.theme.WorldColors
import com.lvjie.nativeapp.ui.theme.WorldPalettes
import kotlinx.serialization.Serializable

@Serializable
data class Place(
    val id: String,
    val name: String,
    val type: String,
    val world: String,
    val desc: String,
    val people: List<String> = emptyList(),
    val shop: Boolean = false,
)

@Serializable
data class ActionDef(
    val id: String,
    val label: String,
    val hint: String,
)

@Serializable
data class InventoryItem(
    val name: String,
    val type: String, // consumable / equip / technique / material / special
    val count: Int = 1,
    val desc: String = "",
    val effect: String? = null,
    val value: Int = 0,
    val equipped: Boolean = false,
)

@Serializable
data class Quest(
    val title: String,
    val status: String, // active / done / failed
    val from: String,
    val desc: String,
    val reward: String,
)

@Serializable
data class Friend(
    val name: String,
    val rel: String,
    val favor: Int,
    val at: String,
    val intro: String,
)

@Serializable
data class BigEvent(
    val age: String,
    val text: String,
)

@Serializable
data class PlayerState(
    val worldId: String = "xiuxian",
    val name: String = "林逸",
    val tierIndex: Int = 1,
    val sub: Int = 1,
    val progress: Int = 310,
    val money: Int = 320,
    val power: Int = 966,
    val age: Int = 12,
    val lifespan: Int = 100,
    val loc: String = "p1",
    val inventory: List<InventoryItem> = emptyList(),
    val quests: List<Quest> = emptyList(),
    val friends: List<Friend> = emptyList(),
    val events: List<BigEvent> = emptyList(),
    val aiStyle: String = "沉浸",
    val lang: String = "简体中文",
    val bgm: Boolean = true,
    val dialogLimit: Boolean = true,
)

data class WorldPack(
    val id: String,
    val name: String,
    val icon: String,
    val tagline: String,
    val level: String,
    val progress: String,
    val money: String,
    val advance: String,
    val tiers: List<String>,
    val places: List<Place>,
    val actions: List<ActionDef>,
    val startText: String,
    val colors: WorldColors,
)

object WorldPacks {
    val tierReq = listOf(0, 120, 320, 700, 1400, 2500)

    val all: List<WorldPack> = listOf(
        WorldPack(
            id = "xiuxian", name = "修仙", icon = "🏔", tagline = "逆天改命，证道长生",
            level = "境界", progress = "修为", money = "灵石", advance = "突破",
            tiers = listOf("练气", "筑基", "金丹", "元婴", "化神", "渡劫"),
            colors = WorldPalettes.Xiuxian,
            places = listOf(
                Place("p1", "青云坊市", "城池", "东洲", "灵雾在坊市檐角游走，丹香与人声交织。万宝阁前人来人往。", listOf("苏婉儿", "青云道人"), true),
                Place("p2", "落霞山", "荒野", "东洲", "晚霞如血，古木参天。山中偶有妖兽出没，亦藏天材地宝。", emptyList(), false),
                Place("p3", "剑冢遗迹", "秘境", "东洲", "万剑插地，剑意纵横。传闻深处留有上古剑仙传承。", listOf("剑灵"), false),
                Place("p4", "沧澜渡", "渡口", "东洲", "大江东去，帆影点点。由此可远航至海外仙山。", listOf("船老黑"), true),
            ),
            actions = listOf(
                ActionDef("travel", "🗺 游历", "四处走走看看"),
                ActionDef("talk", "💬 交谈", "与人攀谈"),
                ActionDef("fight", "⚔ 除妖", "挑战强敌"),
                ActionDef("search", "🔍 搜寻", "寻找机缘"),
                ActionDef("rest", "🧘 打坐", "调息修行"),
            ),
            startText = "你睁开眼，青云坊市的喧闹扑面而来。修仙之路，自此开始。",
        ),
        WorldPack(
            id = "xuanhuan", name = "玄幻", icon = "🌌", tagline = "破境称尊，执掌苍穹",
            level = "实力", progress = "灵力", money = "金币", advance = "破境",
            tiers = listOf("凡境", "灵境", "王境", "皇境", "帝境", "神境"),
            colors = WorldPalettes.Xuanhuan,
            places = listOf(
                Place("p1", "天星城", "主城", "天玄大陆", "星辰投影笼罩城池，各方势力汇聚于此。", listOf("云澈", "洛神"), true),
                Place("p2", "万兽山脉", "险地", "天玄大陆", "灵兽嘶鸣，凶机四伏。深处有远古血脉觉醒。"),
                Place("p3", "虚空裂缝", "秘境", "天玄大陆", "空间扭曲，异界之力渗出。", listOf("虚空行者")),
            ),
            actions = listOf(
                ActionDef("travel", "🗺 闯荡", "四处闯荡"),
                ActionDef("talk", "💬 结交", "结交豪杰"),
                ActionDef("fight", "⚔ 挑战", "挑战强者"),
                ActionDef("search", "🔍 探秘", "探索秘境"),
                ActionDef("rest", "🧘 吐纳", "吸收灵力"),
            ),
            startText = "天星城的晨钟响起。你握紧拳头，灵力在经脉中奔涌。",
        ),
        WorldPack(
            id = "wuxia", name = "武侠", icon = "⚔", tagline = "快意恩仇，仗剑天涯",
            level = "修为", progress = "内力", money = "银两", advance = "精进",
            tiers = listOf("初窥", "小成", "大成", "宗师", "大宗师", "绝顶"),
            colors = WorldPalettes.Wuxia,
            places = listOf(
                Place("p1", "洛阳城", "古城", "中原", "古都繁华，江湖恩怨暗流涌动。", listOf("白玉京", "铁中棠"), true),
                Place("p2", "断魂崖", "险地", "中原", "悬崖千仞，风声如泣。传说崖底有绝世秘籍。"),
                Place("p3", "醉仙楼", "酒楼", "中原", "酒香四溢，江湖消息在此交汇。", listOf("柳三娘"), true),
            ),
            actions = listOf(
                ActionDef("travel", "🗺 闯江湖", "行走江湖"),
                ActionDef("talk", "💬 攀谈", "结交英雄"),
                ActionDef("fight", "⚔ 切磋", "切磋武艺"),
                ActionDef("search", "🔍 寻访", "寻访秘籍"),
                ActionDef("rest", "🧘 运功", "调息运功"),
            ),
            startText = "洛阳城门下，你负手而立。江湖路远，故事才刚开始。",
        ),
        WorldPack(
            id = "urban", name = "职场", icon = "💼", tagline = "步步高升，掌控风云",
            level = "职级", progress = "声望", money = "薪资", advance = "晋升",
            tiers = listOf("实习生", "专员", "经理", "总监", "VP", "合伙人"),
            colors = WorldPalettes.Urban,
            places = listOf(
                Place("p1", "环球金融中心", "写字楼", "上海", "玻璃幕墙反射着城市的野心。你的工位在 28 层。", listOf("王总监", "李秘书"), true),
                Place("p2", "创业咖啡馆", "社交", "上海", "路演、合作、跳槽机会都在这里发生。", listOf("张创业"), true),
                Place("p3", "行业峰会", "活动", "上海", "大佬云集，一次握手可能改变轨迹。", listOf("陈大佬")),
            ),
            actions = listOf(
                ActionDef("travel", "🗺 出差", "外出见世面"),
                ActionDef("talk", "💬 谈判", "商务谈判"),
                ActionDef("fight", "⚔ 竞标", "拿下项目"),
                ActionDef("search", "🔍 找机会", "寻找机会"),
                ActionDef("rest", "🧘 充电", "学习提升"),
            ),
            startText = "周一早高峰，你挤进地铁。新的项目，新的战役。",
        ),
        WorldPack(
            id = "apocalypse", name = "末世", icon = "🧟", tagline = "废土求生，进化称王",
            level = "进化", progress = "进化点", money = "物资", advance = "进化",
            tiers = listOf("幸存者", "觉醒者", "强化者", "超凡者", "领主", "王者"),
            colors = WorldPalettes.Apocalypse,
            places = listOf(
                Place("p1", "安全屋", "据点", "废土", "锈蚀的铁门内，篝火摇曳。这里是暂时的家。", listOf("老赵", "小雨"), true),
                Place("p2", "废弃超市", "资源点", "废土", "货架倾颓，罐头尚存。也可能藏着丧尸。", emptyList(), true),
                Place("p3", "地下实验室", "险地", "废土", "应急灯闪烁，实验记录散落一地。", listOf("神秘科学家")),
            ),
            actions = listOf(
                ActionDef("travel", "🗺 搜刮", "搜刮物资"),
                ActionDef("talk", "💬 结盟", "与幸存者结盟"),
                ActionDef("fight", "⚔ 狩猎", "狩猎丧尸"),
                ActionDef("search", "🔍 探索", "探索废墟"),
                ActionDef("rest", "🧘 守夜", "休整守夜"),
            ),
            startText = "警报声渐远。你握紧钢管，推开安全屋的门。",
        ),
        WorldPack(
            id = "western", name = "西幻", icon = "🛡", tagline = "魔法与剑，荣耀之路",
            level = "位阶", progress = "魔力", money = "金币", advance = "晋阶",
            tiers = listOf("学徒", "骑士", "精英", "大师", "传奇", "神话"),
            colors = WorldPalettes.Western,
            places = listOf(
                Place("p1", "王都银辉城", "王城", "艾泽拉斯", "尖塔林立，魔法灯照亮鹅卵石街道。", listOf("艾琳", "铁壁爵士"), true),
                Place("p2", "幽暗森林", "野外", "艾泽拉斯", "古树遮天，精灵低语。魔兽潜伏其中。"),
                Place("p3", "龙眠山脉", "险地", "艾泽拉斯", "龙吼回荡，宝藏与死亡并存。", listOf("古龙")),
            ),
            actions = listOf(
                ActionDef("travel", "🗺 冒险", "外出冒险"),
                ActionDef("talk", "💬 交流", "与人交流"),
                ActionDef("fight", "⚔ 讨伐", "讨伐魔物"),
                ActionDef("search", "🔍 探宝", "探寻宝藏"),
                ActionDef("rest", "🧘 冥想", "冥想恢复"),
            ),
            startText = "银辉城的钟声敲响。你披上斗篷，踏上冒险之路。",
        ),
    )

    fun byId(id: String): WorldPack = all.firstOrNull { it.id == id } ?: all.first()
}

object SampleContent {
    data class EventBeat(val text: String, val options: List<String>, val progress: Int, val money: Int = 0, val item: String? = null)

    fun beatsFor(actionId: String): List<EventBeat> = when (actionId) {
        "talk" -> listOf(
            EventBeat(
                "苏婉儿靠在栏杆上，见你走来微微一笑：「今日风大，倒是适合论道。」她递来一杯灵茶。",
                listOf("接茶论道", "问她近况", "告辞"), 6
            ),
        )
        "fight" -> listOf(
            EventBeat(
                "黑风中传来低吼。一头赤目狼妖挡住去路，獠牙滴落涎水。",
                listOf("拔剑迎战", "寻找破绽", "撤退"), 25, 50
            ),
        )
        "search" -> listOf(
            EventBeat(
                "你在岩缝间摸索，指尖触到一株赤芝草，灵光微闪。远处似有脚步逼近。",
                listOf("迅速采摘", "设下埋伏", "放弃离开"), 15, 0, "赤芝草"
            ),
        )
        "rest" -> listOf(
            EventBeat(
                "你盘膝而坐，灵气如溪流汇入丹田。心境渐明，许久未曾有过的宁静。",
                listOf("继续打坐", "起身走走"), 18
            ),
        )
        else -> listOf(
            EventBeat(
                "你沿着青石长街缓步而行。一缕剑意自阁楼垂落，白袍客抬眼：「道友，可愿切磋？」",
                listOf("立刻应战", "先探虚实", "婉拒离开"), 12
            ),
            EventBeat(
                "转过街角，你听见争执声。几名散修正围住一位受伤的老者，意图抢夺他的药篓。",
                listOf("出手相助", "静观其变", "绕道离开"), 8, 20
            ),
        )
    }

    fun newGame(worldId: String, name: String = "林逸"): PlayerState {
        val pack = WorldPacks.byId(worldId)
        return PlayerState(
            worldId = worldId,
            name = name,
            tierIndex = 1,
            sub = 1,
            progress = 310,
            money = 320,
            power = 966,
            age = 12,
            lifespan = 100,
            loc = pack.places.first().id,
            inventory = listOf(
                InventoryItem("聚气丹", "consumable", 3, "服用后修为 +50", "progress", 50),
                InventoryItem("青锋剑", "equip", 1, "攻击 +12", equipped = true),
                InventoryItem("吐纳诀", "technique", 1, "未参悟的秘籍"),
            ),
            quests = listOf(
                Quest("除妖 · 黑风寨", "active", "悬镜司", "击败黑风三煞", "${pack.money}×200"),
                Quest("寻药 · 赤芝草", "done", "药铺", "已交付", "${pack.money}×50"),
            ),
            friends = listOf(
                Friend("苏婉儿", "道侣", 82, pack.places.first().name, "温柔如水，剑心通明。"),
                Friend("青云道人", "师长", 60, pack.places.getOrElse(1) { pack.places.first() }.name, "引你入门的恩师。"),
            ),
            events = listOf(
                BigEvent("12 岁", "于${pack.places.first().name}${pack.advance}至${pack.tiers[1]}"),
                BigEvent("11 岁", "拜入外门"),
                BigEvent("10 岁", pack.startText),
            ),
        )
    }
}
