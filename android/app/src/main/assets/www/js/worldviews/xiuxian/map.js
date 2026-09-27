// 修仙初始地图
export function createXiuxianMap() {
  return [
    {
      id: 'l_qy', name: '青云宗', world: '人界', continent: '天南大陆', type: '门派',
      desc: '天南大陆正道大宗，灵气充沛，外门弟子数千，内门以筑基为门槛。',
      people: [
        { name: '掌门·清虚真人', realm: '元婴后期', power: 10000, intro: '青云宗掌门，处事方正' },
        { name: '执事·李长老', realm: '结丹中期', power: 1600, intro: '分管外门事务' }
      ],
      shop: [
        { name: '养气丹', desc: '炼气下品丹药，服用可增加少量修为', type: 'consumable', realm_index: 1, grade: '下品', price: 20, usable: 'direct', use_effect: { type: 'progress', value: 1 } },
        { name: '青锋剑', desc: '炼气下品法宝', type: 'equip', realm_index: 1, grade: '下品', price: 100 }
      ],
      beasts: [],
      interactables: [{ name: '传功殿', intro: '可听长老讲道' }],
      notes: []
    },
    {
      id: 'l_ts', name: '天南坊市', world: '人界', continent: '天南大陆', type: '坊市',
      desc: '人界天南最大的交易集市，丹药法宝功法应有尽有。',
      people: [{ name: '赵执事', realm: '结丹后期', power: 2000, intro: '坊市执事，圆滑精明' }],
      shop: [
        { name: '培元丹', desc: '炼气下品丹药', type: 'consumable', realm_index: 1, grade: '下品', price: 20 },
        { name: '灵剑', desc: '炼气下品法宝', type: 'equip', realm_index: 1, grade: '下品', price: 100 }
      ],
      beasts: [],
      interactables: [{ name: '拍卖行', intro: '偶有稀罕物' }],
      notes: []
    },
    {
      id: 'l_hf', name: '黑风森林', world: '人界', continent: '天南大陆', type: '森林',
      desc: '妖兽出没的外围林地，适合炼气期历练。',
      people: [],
      shop: [],
      beasts: [{ name: '黑风狼', realm: '炼气中期', power: 13, drops: '狼牙x1' }],
      interactables: [],
      notes: []
    },
    {
      id: 'l_ly', name: '灵雾山谷', world: '人界', continent: '天南大陆', type: '山谷',
      desc: '灵气氤氲的静修之地。',
      people: [],
      shop: [],
      beasts: [{ name: '灵狐', realm: '炼气后期', power: 16, drops: '狐裘x1' }],
      interactables: [{ name: '灵泉', intro: '可加快修炼' }],
      notes: []
    },
    {
      id: 'l_lx', name: '落霞秘境', world: '人界', continent: '天南大陆', type: '秘境',
      desc: '定期开启的秘境，机缘与凶险并存。',
      people: [],
      shop: [],
      beasts: [{ name: '秘境守卫', realm: '筑基初期', power: 100, drops: '霞光石x1' }],
      interactables: [{ name: '古传送阵', intro: '通往深处' }],
      notes: []
    },
    {
      id: 'l_bh', name: '北寒城', world: '人界', continent: '北寒大陆', type: '城镇',
      desc: '北寒大陆唯一大城，城墙以万载寒冰砌成。',
      people: [{ name: '城主·寒渊', realm: '元婴初期', power: 8000, intro: '北寒城主' }],
      shop: [],
      beasts: [],
      interactables: [],
      notes: []
    },
    {
      id: 'l_by', name: '北冥冰原', world: '人界', continent: '北寒大陆', type: '冰原',
      desc: '极寒荒原，冰系灵兽盘踞。',
      people: [],
      shop: [],
      beasts: [{ name: '冰原熊', realm: '结丹初期', power: 2000, drops: '熊胆x1' }],
      interactables: [],
      notes: []
    },
    {
      id: 'x_xc', name: '玄天城', world: '灵界', continent: '玄天大陆', type: '城镇',
      desc: '灵界第一大城，往来尽是化神炼虚的大修士。',
      people: [{ name: '城主·玄天子', realm: '合体初期', power: 1e7, intro: '玄天城主' }],
      shop: [],
      beasts: [],
      interactables: [{ name: '升仙台', intro: '通往仙界的古传送台之一' }],
      notes: []
    },
    {
      id: 'x_wy', name: '万妖山脉', world: '灵界', continent: '玄天大陆', type: '山脉',
      desc: '灵界妖族圣地，九阶大妖坐镇。',
      people: [],
      shop: [],
      beasts: [{ name: '九阶大妖', realm: '大乘初期', power: 5e7, drops: '妖丹x1' }],
      interactables: [],
      notes: []
    },
    {
      id: 'x_tj', name: '天剑阁', world: '灵界', continent: '玄天大陆', type: '门派',
      desc: '灵界剑修圣地。',
      people: [{ name: '阁主·剑无尘', realm: '大乘初期', power: 1e8, intro: '剑道通神' }],
      shop: [],
      beasts: [],
      interactables: [],
      notes: []
    },
    {
      id: 's_lx', name: '凌霄仙城', world: '仙界', continent: '中央仙域', type: '城镇',
      desc: '仙界第一城，仙宫林立。',
      people: [{ name: '仙官·凌虚', realm: '金仙中期', power: 5e12, intro: '仙界仙官' }],
      shop: [],
      beasts: [],
      interactables: [{ name: '仙榜', intro: '记录仙君名次' }],
      notes: []
    },
    {
      id: 's_yc', name: '瑶池', world: '仙界', continent: '中央仙域', type: '圣地',
      desc: '传说中的仙家圣地。',
      people: [],
      shop: [],
      beasts: [],
      interactables: [{ name: '瑶池仙莲', intro: '可遇不可求' }],
      notes: []
    },
    {
      id: 's_xz', name: '仙魔战场', world: '仙界', continent: '中央仙域', type: '战场',
      desc: '仙魔交锋的古老战场。',
      people: [],
      shop: [],
      beasts: [{ name: '远古魔将残魂', realm: '金仙中期', power: 1.25e10, drops: '魔核x1' }],
      interactables: [{ name: '仙人遗府', intro: '陨落仙人的遗府' }],
      notes: []
    }
  ]
}
