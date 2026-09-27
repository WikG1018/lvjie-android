export function createWesternMap() {
  return [
    {
      id: 'wv_village', name: '榆树村', world: '王国', continent: '边陲', type: '村庄',
      desc: '王国边缘的安静村庄，最近总有魔物传闻。',
      people: [{ name: '村长·老汤姆', realm: '正式', power: 20, intro: '热心的村长' }],
      shop: [{ name: '黑面包', desc: '管饱', type: 'consumable', realm_index: 0, grade: '凡品', price: 1, usable: 'direct', use_effect: { type: 'progress', value: 0.2 } }],
      beasts: [], interactables: [], notes: []
    },
    {
      id: 'wv_town', name: '灰石镇', world: '王国', continent: '边陲', type: '城镇',
      desc: '有冒险者公会分会的小镇。',
      people: [{ name: '公会接待·米拉', realm: '正式', power: 30, intro: '公会接待员，消息灵通' }],
      shop: [], beasts: [], interactables: [{ name: '冒险者公会', intro: '接委托' }], notes: []
    },
    {
      id: 'wv_castle', name: '白霜城', world: '王国', continent: '王都', type: '王城',
      desc: '王国政治中心，骑士团与法师塔并立。',
      people: [{ name: '宫廷法师·艾琳', realm: '大师', power: 3000, intro: '宫廷顾问法师' }],
      shop: [], beasts: [], interactables: [{ name: '法师塔', intro: '可求学' }], notes: []
    },
    {
      id: 'wv_forest', name: '低语森林', world: '王国', continent: '边陲', type: '森林',
      desc: '树影会低语的古老森林。',
      people: [],
      shop: [],
      beasts: [{ name: '哥布林斥候', realm: '学徒', power: 8, drops: '破匕首x1' }],
      interactables: [], notes: []
    },
    {
      id: 'wv_ruin', name: '龙眠废墟', world: '大陆', continent: '中部', type: '遗迹',
      desc: '巨龙陨落之地，魔力浓郁。',
      people: [{ name: '遗迹看守·不死骑士', realm: '传奇', power: 8e4, intro: '守卫龙眠之地' }],
      shop: [],
      beasts: [{ name: '腐化龙裔', realm: '大师', power: 4000, drops: '龙鳞x1' }],
      interactables: [], notes: []
    },
    {
      id: 'wv_free', name: '自由城邦·银湾', world: '大陆', continent: '海岸', type: '城邦',
      desc: '商人、法师与佣兵共治的港湾城。',
      people: [{ name: '商会会长·卡特', realm: '精英', power: 600, intro: '银湾商会会长' }],
      shop: [], beasts: [], interactables: [], notes: []
    },
    {
      id: 'wv_sky', name: '浮空圣域', world: '神域', continent: '天穹', type: '圣地',
      desc: '半神与从神居所，光辉刺眼。',
      people: [{ name: '神使·拉斐尔', realm: '半神', power: 5e7, intro: '神域使者' }],
      shop: [], beasts: [], interactables: [{ name: '命运织机', intro: '可窥命运丝线' }], notes: []
    },
    {
      id: 'wv_abyss', name: '深渊回廊', world: '神域', continent: '天穹', type: '险地',
      desc: '与神域相对的深渊夹层。',
      people: [],
      shop: [],
      beasts: [{ name: '深渊领主', realm: '史诗', power: 2e7, drops: '深渊核心x1' }],
      interactables: [], notes: []
    }
  ]
}
