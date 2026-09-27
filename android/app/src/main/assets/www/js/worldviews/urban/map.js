export function createUrbanMap() {
  return [
    {
      id: 'u_apartment', name: '城中村出租屋', world: '本地', continent: '南城', type: '住所',
      desc: '月租八百的单间， wifi 时好时坏。',
      people: [{ name: '房东·张阿姨', realm: '月薪过万', power: 10, intro: '精打细算的房东' }],
      shop: [{ name: '泡面箱', desc: '应急口粮', type: 'consumable', realm_index: 0, grade: '普通', price: 30, usable: 'direct', use_effect: { type: 'progress', value: 0.5 } }],
      beasts: [], interactables: [{ name: '共享工位', intro: '可远程接单' }], notes: []
    },
    {
      id: 'u_office', name: '星火科技园', world: '本地', continent: '南城', type: '公司',
      desc: '中小互联网公司扎堆的园区。',
      people: [{ name: '主管·琳姐', realm: '部门经理', power: 200, intro: '你的直属主管，刀子嘴豆腐心' }],
      shop: [], beasts: [], interactables: [{ name: '茶水间', intro: '八卦与情报中心' }], notes: []
    },
    {
      id: 'u_cbd', name: '中央商务区', world: '本地', continent: '南城', type: '商圈',
      desc: '写字楼与奢侈品店交界，寸土寸金。',
      people: [{ name: '投资人·周衡', realm: '创业新贵', power: 800, intro: '早期投资人' }],
      shop: [], beasts: [], interactables: [{ name: '路演厅', intro: '可展示项目' }], notes: []
    },
    {
      id: 'u_market', name: '夜市与小店街', world: '本地', continent: '南城', type: '街区',
      desc: '烟火气最重的地方，信息灵通。',
      people: [], shop: [{ name: '盒饭', desc: '吃饱再说', type: 'consumable', realm_index: 0, grade: '普通', price: 15, usable: 'direct', use_effect: { type: 'progress', value: 0.3 } }],
      beasts: [], interactables: [], notes: []
    },
    {
      id: 'u_shanghai', name: '上海陆家嘴', world: '国内', continent: '华东', type: '金融中心',
      desc: '资本与人才密度最高的地方之一。',
      people: [{ name: '基金经理·韩雪', realm: '高管', power: 1200, intro: '私募基金经理' }],
      shop: [], beasts: [], interactables: [], notes: []
    },
    {
      id: 'u_shenzhen', name: '深圳南山', world: '国内', continent: '华南', type: '科技城',
      desc: '硬件与互联网创业热土。',
      people: [{ name: '连续创业者·阿凯', realm: '创业新贵', power: 900, intro: '失败过三次的创业者' }],
      shop: [], beasts: [], interactables: [], notes: []
    },
    {
      id: 'u_sg', name: '新加坡金融区', world: '国际', continent: '东南亚', type: '国际都市',
      desc: '家族办公室与跨境资本枢纽。',
      people: [{ name: '家族办公室顾问·林菲', realm: '资本巨鳄', power: 5000, intro: '跨境资产顾问' }],
      shop: [], beasts: [], interactables: [], notes: []
    },
    {
      id: 'u_ny', name: '纽约华尔街', world: '国际', continent: '北美', type: '金融中心',
      desc: '全球资本的心脏之一。',
      people: [{ name: '投行董事·Mark', realm: '行业大佬', power: 8000, intro: '投行董事总经理' }],
      shop: [], beasts: [], interactables: [], notes: []
    }
  ]
}
