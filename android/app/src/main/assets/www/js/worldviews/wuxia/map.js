export function createWuxiaMap() {
  return [
    {
      id: 'w_luoyang', name: '洛阳城', world: '中原', continent: '河南', type: '城镇',
      desc: '中原第一大城，镖局、茶楼、暗桩遍地。',
      people: [{ name: '总镖头·王振', realm: '一流后期', power: 400, intro: '龙门镖局总镖头' }],
      shop: [{ name: '金创药', desc: '下品伤药', type: 'consumable', realm_index: 0, grade: '下品', price: 5 }],
      beasts: [], interactables: [{ name: '醉仙楼', intro: '消息汇聚之地' }], notes: []
    },
    {
      id: 'w_shaolin', name: '少林寺', world: '中原', continent: '河南', type: '门派',
      desc: '武林泰山北斗，七十二绝技名动天下。',
      people: [{ name: '方丈·空闻', realm: '宗师中期', power: 5000, intro: '少林方丈' }],
      shop: [], beasts: [], interactables: [{ name: '藏经阁', intro: '可遇机缘' }], notes: []
    },
    {
      id: 'w_emei', name: '峨眉金顶', world: '中原', continent: '蜀中', type: '门派',
      desc: '蜀中名门，剑法与医术并重。',
      people: [{ name: '掌门·灭尘师太', realm: '超一流巅峰', power: 1200, intro: '峨眉掌门' }],
      shop: [], beasts: [], interactables: [], notes: []
    },
    {
      id: 'w_jiang', name: '扬子江畔', world: '中原', continent: '江南', type: '水路',
      desc: '漕帮与盐枭角力的水路要冲。',
      people: [{ name: '漕帮帮主·史刀', realm: '二流巅峰', power: 280, intro: '漕帮帮主' }],
      shop: [], beasts: [], interactables: [{ name: '渡口', intro: '可乘船' }], notes: []
    },
    {
      id: 'w_xj', name: '西域魔城', world: '西域', continent: '荒漠', type: '城镇',
      desc: '三教九流汇聚的边荒魔城。',
      people: [{ name: '城主·血手书生', realm: '宗师初期', power: 4500, intro: '魔城之主' }],
      shop: [], beasts: [], interactables: [], notes: []
    },
    {
      id: 'w_bs', name: '塞外草原', world: '塞外', continent: '北原', type: '荒原',
      desc: '铁骑如龙的塞外草原。',
      people: [{ name: '部落可汗', realm: '一流中期', power: 500, intro: '草原可汗' }],
      shop: [],
      beasts: [{ name: '草原狼王', realm: '二流后期', power: 220, drops: '狼王牙x1' }],
      interactables: [], notes: []
    },
    {
      id: 'w_hs', name: '华山之巅', world: '中原', continent: '关中', type: '险地',
      desc: '论剑圣地，剑意凛然。',
      people: [],
      shop: [],
      beasts: [],
      interactables: [{ name: '思过崖', intro: '可悟剑' }], notes: []
    }
  ]
}
