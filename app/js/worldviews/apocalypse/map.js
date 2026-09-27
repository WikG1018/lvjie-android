export function createApocalypseMap() {
  return [
    {
      id: 'a_shelter', name: '地下避难所·B12', world: '安全区', continent: '东区', type: '据点',
      desc: '由旧地铁站改造的避难所，人口约三百。',
      people: [{ name: '所长·老赵', realm: '三阶觉醒', power: 400, intro: '避难所负责人，务实' }],
      shop: [{ name: '标准口粮', desc: '一日口粮', type: 'consumable', realm_index: 0, grade: '标准', price: 3, usable: 'direct', use_effect: { type: 'progress', value: 0.5 } }],
      beasts: [], interactables: [{ name: '配给处', intro: '每日物资' }], notes: []
    },
    {
      id: 'a_market', name: '黑市交易所', world: '安全区', continent: '东区', type: '市场',
      desc: '刀口舔血的交易地，什么都敢卖。',
      people: [{ name: '掮客·蛇眼', realm: '二阶觉醒', power: 180, intro: '消息贩子' }],
      shop: [], beasts: [], interactables: [], notes: []
    },
    {
      id: 'a_city', name: '废墟都市·原中心', world: '荒野', continent: '旧城', type: '废墟',
      desc: '高楼残骸间游荡着异化体。',
      people: [],
      shop: [],
      beasts: [{ name: '爬行异化体', realm: '二阶觉醒', power: 150, drops: '变异腺体x1' }],
      interactables: [{ name: '军方残骸', intro: '可能有武器' }], notes: []
    },
    {
      id: 'a_high', name: '高速公路营地', world: '荒野', continent: '旧城', type: '营地',
      desc: '流浪者与佣兵歇脚点。',
      people: [{ name: '佣兵队长·刀疤', realm: '四阶觉醒', power: 800, intro: '接护卫与清剿委托' }],
      shop: [], beasts: [], interactables: [], notes: []
    },
    {
      id: 'a_hosp', name: '旧市立医院', world: '荒野', continent: '北区', type: '危险区',
      desc: '药品与感染体并存。',
      people: [],
      shop: [],
      beasts: [{ name: '医生异化体', realm: '三阶觉醒', power: 320, drops: '未污染药剂x1' }],
      interactables: [], notes: []
    },
    {
      id: 'a_z1', name: '红雾核心区', world: '禁区', continent: '雾心', type: '禁区',
      desc: '灾变源头附近，规则扭曲。',
      people: [],
      shop: [],
      beasts: [{ name: '雾中巨影', realm: '七阶觉醒', power: 5e4, drops: '核心碎片x1' }],
      interactables: [{ name: '异常立方', intro: '来源不明的几何体' }], notes: []
    },
    {
      id: 'a_tower', name: '灯塔遗迹', world: '禁区', continent: '雾心', type: '遗迹',
      desc: '传说中旧文明最后的广播塔。',
      people: [{ name: '守塔人·残响', realm: '八阶觉醒', power: 1e5, intro: '自称守塔的神秘存在' }],
      shop: [], beasts: [], interactables: [], notes: []
    }
  ]
}
