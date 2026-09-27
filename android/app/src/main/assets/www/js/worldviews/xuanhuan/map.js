export function createXuanhuanMap() {
  return [
    {
      id: 'x_town', name: '青石镇', world: '青石镇', continent: '南荒', type: '小镇',
      desc: '灵脉稀薄的边陲小镇，宗门招收弟子常经此地。',
      people: [{ name: '镇长·周衡', realm: '凝元境', power: 40, intro: '处事公道的老镇长' }],
      shop: [{ name: '纳气丹', desc: '凡品丹药，可增少许灵力', type: 'consumable', realm_index: 0, grade: '凡品', price: 15, usable: 'direct', use_effect: { type: 'progress', value: 1 } }],
      beasts: [], interactables: [{ name: '灵根石碑', intro: '测试灵根资质' }], notes: []
    },
    {
      id: 'x_market', name: '百草巷', world: '青石镇', continent: '南荒', type: '集市',
      desc: '灵草与凡兵交易的小巷。',
      people: [{ name: '药商·阿宁', realm: '聚气境', power: 12, intro: '眼尖的年轻药商' }],
      shop: [
        { name: '凝灵丹', desc: '灵品丹药', type: 'consumable', realm_index: 1, grade: '灵品', price: 40 },
        { name: '铁脊刀', desc: '灵品神兵', type: 'equip', realm_index: 1, grade: '灵品', price: 120 }
      ],
      beasts: [], interactables: [], notes: []
    },
    {
      id: 'x_fort', name: '苍澜城', world: '苍澜域', continent: '中州', type: '城池',
      desc: '苍澜域枢纽，法相境大能常驻。',
      people: [{ name: '城主府管事·沈兰', realm: '天元境', power: 800, intro: '干练的城主府管事' }],
      shop: [], beasts: [], interactables: [{ name: '城主府告示', intro: '常年悬赏任务' }], notes: []
    },
    {
      id: 'x_ruin', name: '古祭坛', world: '苍澜域', continent: '中州', type: '遗迹',
      desc: '残缺祭坛，灵力潮汐紊乱。',
      people: [], shop: [], beasts: [{ name: '石甲兽', realm: '地元境', power: 200, drops: '兽核与石甲' }],
      interactables: [{ name: '残碑', intro: '记载上古修行之法' }], notes: []
    },
    {
      id: 'x_rift', name: '天外裂隙', world: '天外神墟', continent: '域外', type: '裂隙',
      desc: '空间裂隙边缘，高阶强者出没。',
      people: [{ name: '独行客·凌尘', realm: '界主境', power: 4000, intro: '来历成谜的强者' }],
      shop: [], beasts: [], interactables: [], notes: []
    }
  ]
}
