/* 旅界 · 游戏数据与状态 */
(function (global) {
  "use strict";

  const WORLDS = {
    xiuxian: {
      id: "xiuxian", name: "修仙", icon: "🏔", tagline: "逆天改命，证道长生",
      accent: "#C9A227", soft: "#FBF3DC", glow: "rgba(201,162,39,.28)", deep: "#8A6B12",
      level: "境界", progress: "修为", money: "灵石", advance: "突破",
      tiers: ["练气", "筑基", "金丹", "元婴", "化神", "渡劫"],
      places: [
        { id: "p1", name: "青云坊市", type: "城池", world: "东洲", desc: "灵雾在坊市檐角游走，丹香与人声交织。万宝阁前人来人往。", people: ["苏婉儿", "青云道人"], shop: true },
        { id: "p2", name: "落霞山", type: "荒野", world: "东洲", desc: "晚霞如血，古木参天。山中偶有妖兽出没，亦藏天材地宝。", people: [], shop: false },
        { id: "p3", name: "剑冢遗迹", type: "秘境", world: "东洲", desc: "万剑插地，剑意纵横。传闻深处留有上古剑仙传承。", people: ["剑灵"], shop: false },
        { id: "p4", name: "沧澜渡", type: "渡口", world: "东洲", desc: "大江东去，帆影点点。由此可远航至海外仙山。", people: ["船老黑"], shop: true },
      ],
      actions: [
        { id: "travel", label: "🗺 游历", hint: "四处走走看看" },
        { id: "talk", label: "💬 交谈", hint: "与人攀谈" },
        { id: "fight", label: "⚔ 除妖", hint: "挑战强敌" },
        { id: "search", label: "🔍 搜寻", hint: "寻找机缘" },
        { id: "rest", label: "🧘 打坐", hint: "调息修行" },
      ],
      startText: "你睁开眼，青云坊市的喧闹扑面而来。修仙之路，自此开始。",
    },
    xuanhuan: {
      id: "xuanhuan", name: "玄幻", icon: "🌌", tagline: "破境称尊，执掌苍穹",
      accent: "#7C5CFF", soft: "#EEE9FF", glow: "rgba(124,92,255,.28)", deep: "#4B2FCC",
      level: "实力", progress: "灵力", money: "金币", advance: "破境",
      tiers: ["凡境", "灵境", "王境", "皇境", "帝境", "神境"],
      places: [
        { id: "p1", name: "天星城", type: "主城", world: "天玄大陆", desc: "星辰投影笼罩城池，各方势力汇聚于此。", people: ["云澈", "洛神"], shop: true },
        { id: "p2", name: "万兽山脉", type: "险地", world: "天玄大陆", desc: "灵兽嘶鸣，凶机四伏。深处有远古血脉觉醒。", people: [], shop: false },
        { id: "p3", name: "虚空裂缝", type: "秘境", world: "天玄大陆", desc: "空间扭曲，异界之力渗出。", people: ["虚空行者"], shop: false },
      ],
      actions: [
        { id: "travel", label: "🗺 闯荡", hint: "四处闯荡" },
        { id: "talk", label: "💬 结交", hint: "结交豪杰" },
        { id: "fight", label: "⚔ 挑战", hint: "挑战强者" },
        { id: "search", label: "🔍 探秘", hint: "探索秘境" },
        { id: "rest", label: "🧘 吐纳", hint: "吸收灵力" },
      ],
      startText: "天星城的晨钟响起。你握紧拳头，灵力在经脉中奔涌。",
    },
    wuxia: {
      id: "wuxia", name: "武侠", icon: "⚔️", tagline: "快意恩仇，仗剑天涯",
      accent: "#C24B2E", soft: "#FBE8E2", glow: "rgba(194,75,46,.26)", deep: "#8E2F1A",
      level: "修为", progress: "内力", money: "银两", advance: "精进",
      tiers: ["初窥", "小成", "大成", "宗师", "大宗师", "绝顶"],
      places: [
        { id: "p1", name: "洛阳城", type: "古城", world: "中原", desc: "古都繁华，江湖恩怨暗流涌动。", people: ["白玉京", "铁中棠"], shop: true },
        { id: "p2", name: "断魂崖", type: "险地", world: "中原", desc: "悬崖千仞，风声如泣。传说崖底有绝世秘籍。", people: [], shop: false },
        { id: "p3", name: "醉仙楼", type: "酒楼", world: "中原", desc: "酒香四溢，江湖消息在此交汇。", people: ["柳三娘"], shop: true },
      ],
      actions: [
        { id: "travel", label: "🗺 闯江湖", hint: "行走江湖" },
        { id: "talk", label: "💬 攀谈", hint: "结交英雄" },
        { id: "fight", label: "⚔ 切磋", hint: "切磋武艺" },
        { id: "search", label: "🔍 寻访", hint: "寻访秘籍" },
        { id: "rest", label: "🧘 运功", hint: "调息运功" },
      ],
      startText: "洛阳城门下，你负手而立。江湖路远，故事才刚开始。",
    },
    urban: {
      id: "urban", name: "职场", icon: "💼", tagline: "步步高升，掌控风云",
      accent: "#2E6BE6", soft: "#E6EEFF", glow: "rgba(46,107,230,.26)", deep: "#1A46A0",
      level: "职级", progress: "声望", money: "薪资", advance: "晋升",
      tiers: ["实习生", "专员", "经理", "总监", "VP", "合伙人"],
      places: [
        { id: "p1", name: "环球金融中心", type: "写字楼", world: "上海", desc: "玻璃幕墙反射着城市的野心。你的工位在 28 层。", people: ["王总监", "李秘书"], shop: true },
        { id: "p2", name: "创业咖啡馆", type: "社交", world: "上海", desc: "路演、合作、跳槽机会都在这里发生。", people: ["张创业"], shop: true },
        { id: "p3", name: "行业峰会", type: "活动", world: "上海", desc: "大佬云集，一次握手可能改变轨迹。", people: ["陈大佬"], shop: false },
      ],
      actions: [
        { id: "travel", label: "🗺 出差", hint: "外出见世面" },
        { id: "talk", label: "💬 谈判", hint: "商务谈判" },
        { id: "fight", label: "⚔ 竞标", hint: "拿下项目" },
        { id: "search", label: "🔍 找机会", hint: "寻找机会" },
        { id: "rest", label: "🧘 充电", hint: "学习提升" },
      ],
      startText: "周一早高峰，你挤进地铁。新的项目，新的战役。",
    },
    apocalypse: {
      id: "apocalypse", name: "末世", icon: "🧟", tagline: "废土求生，进化称王",
      accent: "#3D8B5A", soft: "#E4F3EA", glow: "rgba(61,139,90,.26)", deep: "#256B3F",
      level: "进化", progress: "进化点", money: "物资", advance: "进化",
      tiers: ["幸存者", "觉醒者", "强化者", "超凡者", "领主", "王者"],
      places: [
        { id: "p1", name: "安全屋", type: "据点", world: "废土", desc: "锈蚀的铁门内，篝火摇曳。这里是暂时的家。", people: ["老赵", "小雨"], shop: true },
        { id: "p2", name: "废弃超市", type: "资源点", world: "废土", desc: "货架倾颓，罐头尚存。也可能藏着丧尸。", people: [], shop: true },
        { id: "p3", name: "地下实验室", type: "险地", world: "废土", desc: "应急灯闪烁，实验记录散落一地。", people: ["神秘科学家"], shop: false },
      ],
      actions: [
        { id: "travel", label: "🗺 搜刮", hint: "搜刮物资" },
        { id: "talk", label: "💬 结盟", hint: "与幸存者结盟" },
        { id: "fight", label: "⚔ 狩猎", hint: "狩猎丧尸" },
        { id: "search", label: "🔍 探索", hint: "探索废墟" },
        { id: "rest", label: "🧘 守夜", hint: "休整守夜" },
      ],
      startText: "警报声渐远。你握紧钢管，推开安全屋的门。",
    },
    western: {
      id: "western", name: "西幻", icon: "🛡", tagline: "魔法与剑，荣耀之路",
      accent: "#B84A9A", soft: "#F8E6F2", glow: "rgba(184,74,154,.26)", deep: "#7E2E67",
      level: "位阶", progress: "魔力", money: "金币", advance: "晋阶",
      tiers: ["学徒", "骑士", "精英", "大师", "传奇", "神话"],
      places: [
        { id: "p1", name: "王都银辉城", type: "王城", world: "艾泽拉斯", desc: "尖塔林立，魔法灯照亮鹅卵石街道。", people: ["艾琳", "铁壁爵士"], shop: true },
        { id: "p2", name: "幽暗森林", type: "野外", world: "艾泽拉斯", desc: "古树遮天，精灵低语。魔兽潜伏其中。", people: [], shop: false },
        { id: "p3", name: "龙眠山脉", type: "险地", world: "艾泽拉斯", desc: "龙吼回荡，宝藏与死亡并存。", people: ["古龙"], shop: false },
      ],
      actions: [
        { id: "travel", label: "🗺 冒险", hint: "外出冒险" },
        { id: "talk", label: "💬 交流", hint: "与人交流" },
        { id: "fight", label: "⚔ 讨伐", hint: "讨伐魔物" },
        { id: "search", label: "🔍 探宝", hint: "探寻宝藏" },
        { id: "rest", label: "🧘 冥想", hint: "冥想恢复" },
      ],
      startText: "银辉城的钟声敲响。你披上斗篷，踏上冒险之路。",
    },
  };

  const EVENTS = {
    travel: [
      {
        text: "你沿着青石长街缓步而行。<span class='hl'>一缕剑意</span>自阁楼垂落，白袍客抬眼：「道友，可愿切磋？」",
        options: ["立刻应战", "先探虚实", "婉拒离开"],
        changes: { progress: 12 },
      },
      {
        text: "转过街角，你听见争执声。几名散修正围住一位<span class='hl'>受伤的老者</span>，意图抢夺他的药篓。",
        options: ["出手相助", "静观其变", "绕道离开"],
        changes: { progress: 8, money: 20 },
      },
    ],
    talk: [
      {
        text: "苏婉儿靠在栏杆上，见你走来微微一笑：「今日风大，倒是适合<span class='hl'>论道</span>。」她递来一杯灵茶。",
        options: ["接茶论道", "问她近况", "告辞"],
        changes: { progress: 6, friend: "苏婉儿" },
      },
    ],
    fight: [
      {
        text: "黑风中传来低吼。一头<span class='hl'>赤目狼妖</span>挡住去路，獠牙滴落涎水。",
        options: ["拔剑迎战", "寻找破绽", "撤退"],
        changes: { progress: 25, money: 50 },
      },
    ],
    search: [
      {
        text: "你在岩缝间摸索，指尖触到一株<span class='hl'>赤芝草</span>，灵光微闪。远处似有脚步逼近。",
        options: ["迅速采摘", "设下埋伏", "放弃离开"],
        changes: { progress: 15, item: "赤芝草" },
      },
    ],
    rest: [
      {
        text: "你盘膝而坐，灵气如溪流汇入丹田。<span class='hl'>心境渐明</span>，许久未曾有过的宁静。",
        options: ["继续打坐", "起身走走"],
        changes: { progress: 18 },
      },
    ],
  };

  const TIER_REQ = [0, 120, 320, 700, 1400, 2500];

  function newGame(worldId, name) {
    const w = WORLDS[worldId] || WORLDS.xiuxian;
    return {
      worldId: w.id,
      name: name || "林逸",
      tierIndex: 1,
      sub: 1,
      progress: 310,
      money: 320,
      power: 966,
      age: 12,
      lifespan: 100,
      loc: w.places[0].id,
      inventory: [
        { name: "聚气丹", type: "consumable", count: 3, desc: "服用后修为 +50", effect: "progress", value: 50 },
        { name: "青锋剑", type: "equip", count: 1, desc: "攻击 +12", equipped: true },
        { name: "吐纳诀", type: "technique", count: 1, desc: "未参悟的秘籍" },
      ],
      quests: [
        { title: "除妖 · 黑风寨", status: "active", from: "悬镜司", desc: "击败黑风三煞", reward: "灵石×200" },
        { title: "寻药 · 赤芝草", status: "done", from: "药铺", desc: "已交付", reward: "灵石×50" },
      ],
      friends: [
        { name: "苏婉儿", rel: "道侣", favor: 82, at: "青云坊市", intro: "温柔如水，剑心通明。" },
        { name: "青云道人", rel: "师长", favor: 60, at: "落霞山", intro: "引你入门的恩师。" },
      ],
      events: [
        { age: "12 岁", text: "于青云坊市" + w.advance + "至" + w.tiers[1] },
        { age: "11 岁", text: "拜入外门" },
        { age: "10 岁", text: w.startText },
      ],
      aiStyle: "沉浸",
      lang: "简体中文",
      bgm: true,
      dialogLimit: true,
    };
  }

  function locOf(state) {
    const w = WORLDS[state.worldId];
    return w.places.find((p) => p.id === state.loc) || w.places[0];
  }

  function tierLabel(state) {
    const w = WORLDS[state.worldId];
    return w.tiers[Math.min(state.tierIndex, w.tiers.length - 1)] + " · " + ["初期", "中期", "后期"][state.sub] ;
  }

  function canBreak(state) {
    return state.progress >= TIER_REQ[Math.min(state.tierIndex + 1, TIER_REQ.length - 1)] && state.tierIndex < 5;
  }

  function reqFor(state) {
    return TIER_REQ[Math.min(state.tierIndex + 1, TIER_REQ.length - 1)];
  }

  function doBreak(state) {
    if (!canBreak(state)) return { ok: false, msg: "修为不足，继续积累" };
    if (state.tierIndex >= 5) return { ok: false, msg: "已至尽头" };
    state.tierIndex += 1;
    state.sub = 0;
    state.progress = 0;
    state.power += 400 + state.tierIndex * 200;
    state.lifespan += 40;
    const w = WORLDS[state.worldId];
    const msg = w.advance + "成功 · " + w.tiers[state.tierIndex];
    state.events.unshift({ age: state.age + " 岁", text: msg });
    return { ok: true, msg };
  }

  function applyChanges(state, changes) {
    const w = WORLDS[state.worldId];
    const notes = [];
    if (changes.progress) {
      state.progress += changes.progress;
      notes.push(w.progress + " +" + changes.progress);
    }
    if (changes.money) {
      state.money += changes.money;
      notes.push(w.money + " +" + changes.money);
    }
    if (changes.item) {
      const exist = state.inventory.find((i) => i.name === changes.item);
      if (exist) exist.count += 1;
      else state.inventory.push({ name: changes.item, type: "consumable", count: 1, desc: "野外所得" });
      notes.push("获得 " + changes.item);
    }
    if (changes.friend) notes.push("与 " + changes.friend + " 关系增进");
    return notes;
  }

  global.GAME = {
    WORLDS, EVENTS, newGame, locOf, tierLabel, canBreak, reqFor, doBreak, applyChanges,
  };
})(window);
