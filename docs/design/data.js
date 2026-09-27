/* 旅界 · 安卓原生版设计规范 · 内容数据 */
var SPEC = window.SPEC = {
  meta: {
    title: "旅界 · 安卓原生版设计规划",
    version: "v2.0 · 2026-09-27",
    source: "Fly143/LvJie-WanJie @ master",
    sourceTip: "原仓库已更新至 v0.0.3（多语言 / Keystore 加密 / 安全加固），Android 仍为 WebView 壳。",
    account: "WikG1018",
  },

  worlds: [
    { id: "xiuxian", name: "修仙", icon: "🏔", accent: "#C9A227", soft: "#FBF3DC", glow: "rgba(201,162,39,.28)", deep: "#8A6B12", level: "境界", progress: "修为", money: "灵石", advance: "突破" },
    { id: "xuanhuan", name: "玄幻", icon: "🌌", accent: "#7C5CFF", soft: "#EEE9FF", glow: "rgba(124,92,255,.28)", deep: "#4B2FCC", level: "实力", progress: "灵力", money: "金币", advance: "破境" },
    { id: "wuxia", name: "武侠", icon: "⚔️", accent: "#C24B2E", soft: "#FBE8E2", glow: "rgba(194,75,46,.26)", deep: "#8E2F1A", level: "修为", progress: "内力", money: "银两", advance: "精进" },
    { id: "urban", name: "职场", icon: "💼", accent: "#2E6BE6", soft: "#E6EEFF", glow: "rgba(46,107,230,.26)", deep: "#1A46A0", level: "职级", progress: "声望", money: "薪资", advance: "晋升" },
    { id: "apocalypse", name: "末世", icon: "🧟", accent: "#3D8B5A", soft: "#E4F3EA", glow: "rgba(61,139,90,.26)", deep: "#256B3F", level: "进化", progress: "进化点", money: "物资", advance: "进化" },
    { id: "western", name: "西幻", icon: "🛡", accent: "#B84A9A", soft: "#F8E6F2", glow: "rgba(184,74,154,.26)", deep: "#7E2E67", level: "位阶", progress: "魔力", money: "金币", advance: "晋阶" },
  ],

  github: {
    updated: "2026-09-27",
    tag: "v0.0.3",
    highlights: [
      { t: "界面多语言", d: "简体 / 繁體 / English / 日本語 四语，欢迎页可切剧情语言。" },
      { t: "Key 真加密", d: "安卓端 Android Keystore AES-256-GCM，堵死明文 localStorage 回退。" },
      { t: "安全加固", d: "HTTP 桥 SSRF 防护、跨 origin 重定向剥离认证头、toast XSS 转义。" },
      { t: "工程配套", d: "双语 README、MIT LICENSE、CHANGELOG；Android versionName 0.0.3。" },
    ],
    android: "仍是 WebView 壳（MainActivity + assets/www），无 Compose 原生 UI。",
  },
};

/* ===== 层级导航 ===== */
SPEC.nav = [
  {
    group: "A · 设计基础",
    items: [
      { id: "sec-overview", n: "A0", label: "总览与版本" },
      { id: "sec-principles", n: "A1", label: "设计原则" },
      { id: "sec-color", n: "A2", label: "色彩系统" },
      { id: "sec-type", n: "A3", label: "字体排印 · MiSans" },
      { id: "sec-shape", n: "A4", label: "形状 · 间距 · 海拔" },
    ],
  },
  {
    group: "B · 信息架构",
    items: [
      { id: "sec-ia", n: "B1", label: "导航层级树" },
      { id: "sec-flow", n: "B2", label: "核心任务流" },
    ],
  },
  {
    group: "C · 组件库",
    items: [
      { id: "comp-nav", n: "C1", label: "导航类组件" },
      { id: "comp-action", n: "C2", label: "动作类组件" },
      { id: "comp-form", n: "C3", label: "表单类组件" },
      { id: "comp-feedback", n: "C4", label: "反馈类组件" },
      { id: "comp-data", n: "C5", label: "数据展示类" },
      { id: "comp-float", n: "C6", label: "浮层类组件" },
    ],
  },
  {
    group: "D · 页面详解",
    items: [
      { id: "pg-01", n: "P01", label: "欢迎 · 世界选择", sub: true },
      { id: "pg-02", n: "P02", label: "世界详情预览", sub: true },
      { id: "pg-03", n: "P03", label: "自定义世界工坊", sub: true },
      { id: "pg-04", n: "P04", label: "API 与模型设置", sub: true },
      { id: "pg-05", n: "P05", label: "帮助", sub: true },
      { id: "pg-06", n: "P06", label: "主场景 · 叙事", sub: true },
      { id: "pg-07", n: "P07", label: "地图探索", sub: true },
      { id: "pg-08", n: "P08", label: "人物信息", sub: true },
      { id: "pg-09", n: "P09", label: "同伴", sub: true },
      { id: "pg-10", n: "P10", label: "任务", sub: true },
      { id: "pg-11", n: "P11", label: "行囊", sub: true },
      { id: "pg-12", n: "P12", label: "设置", sub: true },
      { id: "pg-13", n: "P13", label: "突破 · 全屏反馈", sub: true },
      { id: "pg-14", n: "P14", label: "底部抽屉", sub: true },
    ],
  },
  {
    group: "E · 系统规范",
    items: [
      { id: "sec-states", n: "E1", label: "状态与异常" },
      { id: "sec-motion", n: "E2", label: "动效与触感" },
      { id: "sec-tech", n: "E3", label: "技术架构" },
      { id: "sec-roadmap", n: "E4", label: "路线图" },
      { id: "sec-repo", n: "E5", label: "独立项目与同步" },
    ],
  },
];

/* ===== 色彩分类 ===== */
SPEC.colorGroups = [
  {
    title: "中性色 · 系统骨架",
    desc: "画布 / 表面 / 文字三级层次。所有皮肤共享，不随世界观变化。",
    colors: [
      { name: "Canvas", hex: "#EFF0F4", use: "页面画布" },
      { name: "Surface", hex: "#FFFFFF", use: "卡片 / 浮层" },
      { name: "Surface-2", hex: "#F7F8FA", use: "次级块 / 输入槽" },
      { name: "Surface-3", hex: "#EEF0F5", use: "禁用 / 分割" },
      { name: "Line", hex: "#E6E8EE", use: "描边 / 分割线" },
      { name: "Ink", hex: "#17181C", use: "主文字" },
      { name: "Ink-2", hex: "#5B5E68", use: "正文 / 说明" },
      { name: "Ink-3", hex: "#9CA0AB", use: "辅助 / 标签" },
    ],
  },
  {
    title: "品牌强调色",
    desc: "小米橙作为全局品牌点睛；系统蓝作次级交互。世界皮肤只替换「世界强调色」。",
    colors: [
      { name: "Accent", hex: "#FF6A00", use: "品牌 / 主 CTA" },
      { name: "Accent-Soft", hex: "#FFF1E6", use: "强调容器" },
      { name: "Accent-Ink", hex: "#C24E00", use: "强调上的文字" },
      { name: "Blue", hex: "#2E6BE6", use: "链接 / 信息" },
    ],
  },
  {
    title: "功能语义色",
    desc: "状态、任务、危险操作的专用色，禁止挪作装饰。",
    colors: [
      { name: "Success", hex: "#00A870", use: "完成 / 增益" },
      { name: "Warning", hex: "#E6A100", use: "寿限 / 待办" },
      { name: "Error", hex: "#E5484D", use: "失败 / 危险" },
      { name: "Purple", hex: "#7C5CFF", use: "特殊事件 / 稀有" },
    ],
  },
];

/* ===== 字阶 ===== */
SPEC.typeScale = [
  { label: "Display 大标题", size: "28–34", weight: "700", lh: "1.2", sample: "地图上的修仙世界", style: "font-size:28px;font-weight:700;letter-spacing:-.025em" },
  { label: "Headline 章节", size: "22–24", weight: "700", lh: "1.25", sample: "06 — KEY SCREENS", style: "font-size:22px;font-weight:700;letter-spacing:-.02em" },
  { label: "Title 界面标题", size: "18", weight: "700", lh: "1.3", sample: "青云坊市 · 当前场景", style: "font-size:18px;font-weight:700" },
  { label: "TitleM 卡片标题", size: "15–16", weight: "700", lh: "1.35", sample: "游历 · 第 3 轮", style: "font-size:15px;font-weight:700" },
  { label: "Body 正文", size: "13.5–14", weight: "400", lh: "1.65", sample: "灵雾在坊市檐角游走，丹香与人声交织。", style: "font-size:13.5px;color:var(--ink-2)" },
  { label: "BodyM 强调正文", size: "13–13.5", weight: "500", lh: "1.55", sample: "行动按钮 · 选项条 · 列表主行", style: "font-size:13px;font-weight:500" },
  { label: "Label 标签", size: "11", weight: "650", lh: "1.3", sample: "境界 · 货币 · 时间戳", style: "font-size:11px;font-weight:650;letter-spacing:.04em;color:var(--ink-3)" },
  { label: "Caption 脚注", size: "10", weight: "500", lh: "1.35", sample: "剧情由 AI 实时合成，可能存在虚构", style: "font-size:10px;color:var(--ink-3)" },
  { label: "Numeric 数值", size: "12–22", weight: "650", lh: "1.2", sample: "12,480 / 15,000 · 战力 9,266", style: "font-size:14px;font-weight:650;font-variant-numeric:tabular-nums;color:var(--accent)" },
];

/* ===== 形状间距 ===== */
SPEC.shape = [
  { k: "28px", v: "Hero 卡片 / BottomSheet 顶角", n: "主内容容器、手机 mockup 场景卡" },
  { k: "22px", v: "标准卡片", n: "列表卡、面板、浮层内容区" },
  { k: "16px", v: "组件块", n: "列表项、输入槽、工具面板" },
  { k: "12px", v: "小组件", n: "缩略图、图标槽、内嵌块" },
  { k: "999px", v: "胶囊", n: "按钮、Chip、状态徽标、导航选中" },
  { k: "48dp", v: "最小触控", n: "所有可点区域；图标按钮含外扩热区" },
  { k: "4px", v: "基线网格", n: "间距取值 4/8/12/16/20/24/32" },
  { k: "18px", v: "页边距", n: "手机内容左右边距（小屏 16px）" },
];

SPEC.elevation = [
  { k: "E0", v: "无影", n: "页面底色、分割、内嵌槽" },
  { k: "E1", v: "sh-1 柔和弥散", n: "卡片、列表项、Chip 容器" },
  { k: "E2", v: "sh-2 中等", n: "下拉菜单、吸顶栏、导航胶囊" },
  { k: "E3", v: "sh-3 / float", n: "BottomSheet、Dialog、全屏确认、Toast" },
];

/* ===== 组件分类 ===== */
SPEC.components = {
  "comp-nav": {
    title: "导航类组件",
    desc: "负责应用层级切换与返回路径，统一手势与焦点管理。",
    items: [
      { name: "TopAppBar", spec: "高度 52dp，衬线/等宽标题，滚动时可收缩为 44dp 标题条", use: "各页面顶栏" },
      { name: "BottomNavBar", spec: "5 项，图标 24dp + 标签 10sp，选中态世界色胶囊底", use: "游戏主壳" },
      { name: "SegmentedControl", spec: "2–3 段，高度 36dp，圆角 12dp，指示器 220ms 弹性", use: "任务/行囊切换、语言选择" },
      { name: "BreadcrumbWorld", spec: "世界名 · 境界 · 位置 的 StatusPill 横条，可点开状态抽屉", use: "游戏顶栏" },
      { name: "TabRowSecondary", spec: "工坊步骤条 1-2-3-4，当前步高亮 + 已完成打勾", use: "自定义世界工坊" },
    ],
  },
  "comp-action": {
    title: "动作类组件",
    desc: "所有可点行为的按钮族，按优先级分层：主 / 次 / 幽灵 / 危险 / 文字。",
    items: [
      { name: "ButtonPrimary", spec: "高度 44dp，全圆，世界色填充，点击微缩 0.97", use: "进入世界、发送、突破" },
      { name: "ButtonTonal", spec: "高度 40dp，世界色 Soft 容器 + 深色字", use: "继续旅程、次要行动" },
      { name: "ButtonOutline", spec: "1.5dp 描边，透明底", use: "自定义世界、导出" },
      { name: "ActionDock", spec: "场景页底部行动坞：4–5 行动横滑 + 自由输入入口", use: "P06 主场景" },
      { name: "OptionChip", spec: "选项 1/2/3 大号胶囊，全宽堆叠，选中态收缩触发事件", use: "事件回合" },
      { name: "IconButton", spec: "48dp 热区 / 20dp 图标，无底；危险态红字", use: "顶栏、列表操作" },
    ],
  },
  "comp-form": {
    title: "表单类组件",
    desc: "设置页与工坊的输入控件，统一错误态与帮助文案位置。",
    items: [
      { name: "TextField", spec: "高度 48dp，圆角 16dp，Label 浮起；错误红描边 + 下方提示", use: "API Key、角色名、书名" },
      { name: "Switch", spec: "48×28dp，原生轨道 + 拇指；支持「系统默认/开/关」三态时用 Radio", use: "对话轮数限制、深色阅读" },
      { name: "Slider", spec: "轨道 4dp，拇指 22dp；值气泡延迟 200ms", use: "字号、BGM 音量" },
      { name: "RadioGroup", spec: "竖排单选，行高 48dp", use: "AI 风格、协议 chat/response" },
      { name: "DropdownMenu", spec: "锚定弹出，圆角 16dp，项高 44dp", use: "模型列表选择" },
      { name: "FilePickerCard", spec: "虚线大框 + 图标 + 说明；选中后显示文件摘要行", use: "小说 TXT、JSON、BGM" },
    ],
  },
  "comp-feedback": {
    title: "反馈类组件",
    desc: "状态变化必须可见。区分：即时轻反馈 / 过程反馈 / 结果反馈 / 阻断反馈。",
    items: [
      { name: "SnackBar", spec: "底部，圆角 14dp，时长 2.4s，可带动作；错误时红描边", use: "数值变化摘要、保存成功" },
      { name: "CenterToast", spec: "全屏中转场，世界色光晕，1.2s 自动消失", use: "突破成功" },
      { name: "ProgressDots", spec: "三点呼吸，1.1s 循环；替代全屏 Loading", use: "AI 流式生成" },
      { name: "LinearProgress", spec: "轨道 4dp，世界色填充；不确定模式时均匀扫过", use: "工坊生成草稿" },
      { name: "EmptyState", spec: "插图 + 一句话 + 主按钮；禁止空白页", use: "无同伴 / 无任务 / 无物品" },
      { name: "ErrorCard", spec: "错误码 + 人话说明 + 重试/查看细节", use: "LLM 请求失败" },
    ],
  },
  "comp-data": {
    title: "数据展示类组件",
    desc: "游戏数值与世界内容的容器，保证可扫读、可对比。",
    items: [
      { name: "StatChip", spec: "图标 + 标签 + 数值，数值等宽对齐", use: "货币、战力、年龄" },
      { name: "ProgressBar", spec: "高度 6–8dp，圆角全圆；满额时世界色发光边", use: "修为进度、任务进度" },
      { name: "ListCard", spec: "左 32dp 图标槽 + 主标题 + 次行 + 右动作", use: "物品、NPC、地点、任务" },
      { name: "MapSection", spec: "世界→区域→地点三级折叠；当前地点高亮描边", use: "P07 地图" },
      { name: "Timeline", spec: "竖线 + 节点 + 年龄标签 + 事件句", use: "人物重大经历" },
      { name: "Badge", spec: "角标数字 / 语义色点；红点仅表示未读或危险", use: "任务标记、更新提醒" },
    ],
  },
  "comp-float": {
    title: "浮层类组件",
    desc: "抽屉优先于全屏弹窗，危险操作必须二次确认。",
    items: [
      { name: "BottomSheet", spec: "圆角顶 28dp，拖拽把手 36×4dp，最大高度 85%", use: "状态卡、物品详情、移动确认" },
      { name: "Dialog", spec: "宽 280–320dp，圆角 24dp；最多一个主按钮 + 一个文字按钮", use: "覆盖存档、删除世界" },
      { name: "FullScreenConfirm", spec: "世界色渐变底 + 大字结果 + 庆祝微粒子", use: "突破成功 P13" },
      { name: "Tooltip", spec: "长按 400ms 触发，圆角 10dp，时长 1.8s", use: "图标按钮说明" },
      { name: "PopupSort", spec: "卡片长按弹出：上移/下移/删除", use: "欢迎页世界排序" },
    ],
  },
};

/* ===== 页面详解 ===== */
SPEC.pages = [
  {
    id: "pg-01",
    code: "P01",
    title: "欢迎 · 世界选择",
    goal: "3 秒内让人明白「选一个世界开始旅程」，并一眼看到自己的存档进度。",
    layer: [
      { t: "顶栏：品牌 + 语言 + API", s: "高度 52dp；右侧文字入口，不放主按钮", hl: false },
      { t: "宣言区：游戏名 + 一句话", s: "Display 字阶；随当前选中世界变化", hl: true },
      { t: "世界横滑卡片（精选 3 + 其余）", s: "卡片 160×200dp；选中抬升 2dp + 世界色描边", hl: true },
      { t: "存档摘要条", s: "角色名 · 境界 · 最近地点 · 继续按钮", hl: false },
      { t: "主 CTA + 次级入口", s: "进入世界（Primary）｜自定义世界｜帮助", hl: true },
      { t: "底部导航（世界 / 工坊 / API / 更多）", s: "四段；世界为默认选中", hl: false },
    ],
    specs: [
      ["世界卡片", "160×200dp / r=22dp / E1", "图标 36dp、名称 TitleM、标签 Caption、等级条 4dp"],
      ["选中态", "抬升 2dp + 世界色描边 1.5dp", "宣言区与 CTA 同步换肤"],
      ["存档摘要", "ListCard 变体", "无存档时显示「新开旅程」空态"],
      ["主 CTA", "ButtonPrimary 全宽 48dp", "有档：「继续 · 林逸（筑基）」；无档：世界包 startBtn"],
      ["排序", "长按卡片 → PopupSort", "上移 / 下移 / 删除自定义包"],
    ],
    states: ["无存档空态", "有 1 档", "有档 + 新开一局", "自定义包置顶", "首次无 API Key（CTA 旁提示）"],
    notes: [
      ["层级", "宣言 > 世界选择 > 存档 > CTA；次级入口字号再降一级，不与主 CTA 抢焦点。"],
      ["分类", "内置六世界固定顺序，用户自定义包可排序并默认排在内置之后、收藏可置顶。"],
      ["交互", "点卡片即换肤（主题色在 220ms 内过渡）；双击卡片进详情 P02。"],
    ],
    mock: "welcome",
  },
  {
    id: "pg-02",
    code: "P02",
    title: "世界详情预览",
    goal: "进世界前建立预期：等级表、货币、玩法、存档状态一目了然。",
    layer: [
      { t: "顶栏：返回 + 世界名", s: "返回手势 / 系统返回均可", hl: false },
      { t: "Hero 区：图标 + 世界名 + 标语", s: "世界色渐变底，高度 140dp", hl: true },
      { t: "分段：介绍 / 等级表 / 地图", s: "SegmentedControl 三段", hl: false },
      { t: "内容区", s: "介绍=铁律要点；等级表=阶梯芯片；地图=地点预览", hl: true },
      { t: "底部固定 CTA", s: "进入 / 继续 + 新开一局文字钮", hl: true },
    ],
    specs: [
      ["Hero", "140dp 渐变", "仅用世界色 Soft→透明，不做重插画"],
      ["等级表", "横向阶梯 Chip", "当前档位高亮；末档标注「尽头」"],
      ["货币体系", "三行 StatChip", "主 / 中 / 高货币名称由 lexicon 决定"],
      ["地图预览", "2×2 地点磁贴", "起点标记「从这里开始」"],
    ],
    states: ["无存档", "有存档摘要", "自定义世界（可编辑/导出）"],
    notes: [
      ["层级", "Hero 建立情感 → 分段内容建立认知 → CTA 完成决策。"],
      ["分类", "介绍页写「这个世界怎么玩」；等级表写「目标感」；地图写「空间想象」。"],
      ["约束", "文案直接来自世界包 pack，不在客户端硬编码世界观知识。"],
    ],
    mock: "worldDetail",
  },
  {
    id: "pg-03",
    code: "P03",
    title: "自定义世界工坊",
    goal: "把复杂的「造世界」拆成四步问卷，任何人 5 分钟能产出可玩草稿。",
    layer: [
      { t: "步骤条 1 来源 → 2 设定 → 3 生成 → 4 微调", s: "TabRowSecondary，可返回上一步", hl: true },
      { t: "步骤 1 来源选择卡（4 选 1）", s: "作品生成 / 整本小说 / 联网补充 / JSON", hl: true },
      { t: "步骤 2 表单", s: "书名、摘要、等级表、主角名；FilePickerCard", hl: false },
      { t: "步骤 3 生成中", s: "LinearProgress + 阶段文案（考据/合并/草稿）", hl: true },
      { t: "步骤 4 预览与微调", s: "JSON 树折叠 + 重点字段编辑 + 保存", hl: false },
    ],
    specs: [
      ["步骤指示", "4 点 / 线，当前 24dp 实心", "完成步显示勾选"],
      ["来源卡", "104dp 高，图标 + 标题 + 说明", "选中描边世界色"],
      ["生成过程", "三阶段文案切换", "禁止静默等待；可取消"],
      ["校验错误", "字段级 ErrorCard", "展示 schema 路径，如 map[2].id 重复"],
      ["保存成功", "SnackBar + 跳回 P01 并高亮新包", "可导出 JSON 分享"],
    ],
    states: ["草稿中", "校验失败", "联网补充中", "生成完成待确认", "覆盖同名包确认"],
    notes: [
      ["层级", "步骤条永远置顶；每步只展示当前步字段，避免一屏表单轰炸。"],
      ["分类", "来源四选一决定后续表单形态；JSON 源直接进校验，跳过 AI 生成。"],
      ["安全", "AI 生成结果始终是草稿，玩家可改可删；不自动覆盖已有世界包。"],
    ],
    mock: "author",
  },
  {
    id: "pg-04",
    code: "P04",
    title: "API 与模型设置",
    goal: "配置自定义大模型像连接 Wi-Fi 一样简单可信，Key 永远不明文暴露。",
    layer: [
      { t: "顶栏：API 与模型", s: "返回 + 标题", hl: false },
      { t: "协议选择（chat / response）", s: "RadioGroup 两行 + 说明", hl: true },
      { t: "Base URL / 模型名 / API Key", s: "TextField 三行；Key 默认掩码", hl: true },
      { t: "工具行：测试连通 · 刷新模型列表", s: "ButtonOutline 双按钮", hl: false },
      { t: "密钥管理列表", s: "多 Key 切换、设为默认、删除", hl: true },
      { t: "安全说明块", s: "Keystore AES-256-GCM；不进导出文件", hl: false },
    ],
    specs: [
      ["协议 Radio", "两行，附请求路径提示", "chat → /chat/completions；response → /responses"],
      ["API Key", "掩码 + 显示切换", "显示需二次确认；粘贴自动 trim"],
      ["测试连通", "按钮 → ProgressDots → 成功/失败 SnackBar", "失败给出可行动文案（URL/Key/网络）"],
      ["模型列表", "DropdownMenu 或 BottomSheet", "来自 GET {Base}/models；可手动填"],
      ["多 Key", "ListCard + 默认角标", "游戏存档只引用索引，不存明文"],
    ],
    states: ["未配置（空态引导）", "已配置 1 个", "多 Key", "测试失败", "Key 校验通过但模型不存在"],
    notes: [
      ["层级", "先协议后参数再工具；安全说明置底，建立信任。"],
      ["分类", "Key 属于「凭据」分类，与偏好设置分离；导出存档永不包含。"],
      ["对齐 v0.0.3", "沿用原仓库 Keystore AES-GCM 策略，UI 上明确告知加密方式。"],
    ],
    mock: "api",
  },
  {
    id: "pg-05",
    code: "P05",
    title: "帮助",
    goal: "新玩家 2 分钟学会：什么是世界包、怎么行动、AI 边界在哪里。",
    layer: [
      { t: "顶栏：帮助", s: "返回", hl: false },
      { t: "快速开始 3 步卡片", s: "选世界 → 行动/输入 → 看数值变化", hl: true },
      { t: "FAQ 折叠列表", s: "8–10 条常见问题", hl: true },
      { t: "概念图例", s: "境界/进度/货币/任务 的小图标说明", hl: false },
      { t: "关于与开源", s: "版本、致谢、MIT、原项目链接", hl: false },
    ],
    specs: [
      ["快速开始", "三列编号卡", "每步 1 图标 + 1 标题 + 1 说明"],
      ["FAQ", "Accordion，默认展开第 1 条", "搜索框（可选）"],
      ["AI 免责", "固定 Callout", "剧情可能虚构，与数值规则说明"],
    ],
    states: ["默认展开首条", "全部折叠", "从设置进入（滚动到指定条）"],
    notes: [
      ["层级", "快速开始 > FAQ > 概念 > 关于。"]
    ],
    mock: "help",
  },
  {
    id: "pg-06",
    code: "P06",
    title: "主场景 · 叙事",
    goal: "让故事成为绝对主角；行动永远在拇指区；生成过程有呼吸感。",
    layer: [
      { t: "StatusPill 条：境界 · 货币 · 位置", s: "可点开状态抽屉；滚动后吸顶收窄", hl: true },
      { t: "地点卡：名称 + 简述 + 场景行动", s: "行动 4–5 个，横滑不折行过多", hl: true },
      { t: "事件叙事卡（可多段堆叠）", s: "衬线正文，段落淡入，选项竖排", hl: true },
      { t: "ActionDock 行动坞", s: "固定底部；自由输入常驻", hl: true },
      { t: "底部导航", s: "5 Tab；场景为默认", hl: false },
    ],
    specs: [
      ["地点卡", "E1 卡片", "名称 Title、类型 Chip、简述 Body 最多 3 行"],
      ["场景行动", "ButtonTonal 横滑组", "文案来自 worldpack.sceneActions"],
      ["叙事正文", "衬线 15sp / 行高 1.75", "按段落 120ms 淡入；AI 高亮词用世界色"],
      ["选项", "OptionChip 全宽", "编号 1./2./3.，点选后整组收缩"],
      ["自由输入", "TextField + 发送", "placeholder「描述你想做的事…」"],
      ["结束事件", "文案按钮在叙事头右上", "进行中不可误触，需无加载态时可点"],
    ],
    states: [
      "空闲（无事件）",
      "加载中（ProgressDots）",
      "叙事 + 选项",
      "叙事无选项（可结束）",
      "错误（重试/关闭）",
      "数值变化 SnackBar",
    ],
    notes: [
      ["层级", "叙事 >> 行动 >> 数据。数据只出现在 StatusPill 与进度条。"],
      ["分类", "事件类型（游历/交谈/挑战/搜寻/休息）改变文案与 AI 提示，不改变布局。"],
      ["性能", "长叙事分段虚拟化；输入框键盘顶起时 ActionDock 上移并压缩。"],
    ],
    mock: "scene",
  },
  {
    id: "pg-07",
    code: "P07",
    title: "地图探索",
    goal: "用空间层级表达世界规模，让「去哪里」成为可扫读的决策。",
    layer: [
      { t: "当前所在横幅", s: "世界色 Soft 底 + 移动按钮", hl: true },
      { t: "界层折叠（worlds）", s: "每个界层一个 Section，展开地点列表", hl: true },
      { t: "地点 ListCard", s: "名称、类型、人数、任务角标、门槛锁", hl: true },
      { t: "地图 Sheet（点地点）", s: "描述、人物、商店、移动", hl: false },
    ],
    specs: [
      ["当前横幅", "固定在列表头", "含快速移动入口"],
      ["折叠 Section", "世界名 + 地点数 + 折叠箭头", "动画 220ms 高度过渡"],
      ["地点卡", "ListCard", "当前地点 1.5dp 世界色描边；门槛未达标显示锁"],
      ["任务角标", "右上 Badge", "数量 >0 显示数字"],
    ],
    states: ["仅 1 界层", "多界层", "含未解锁地点", "空世界（自定义包异常）"],
    notes: [
      ["层级", "当前位置 > 界层 > 地点详情。"],
      ["交互", "点卡片弹 BottomSheet 移动；长按设目的地（P2 可选）。"],
    ],
    mock: "map",
  },
  {
    id: "pg-08",
    code: "P08",
    title: "人物信息",
    goal: "角色的「英雄页」：身份、实力、成长、经历四块信息明确分层。",
    layer: [
      { t: "身份区：姓名 + 境界徽章 + 头衔", s: "居中，世界色徽章", hl: true },
      { t: "进度条 + 突破按钮", s: "满进度才可点突破", hl: true },
      { t: "核心数值四宫格", s: "战力 / 年龄 / 主货币 / 技艺", hl: true },
      { t: "技艺列表", s: "名称 + 熟练度条", hl: false },
      { t: "经历 Timeline", s: "年龄标签 + 事件句，最近在上", hl: false },
    ],
    specs: [
      ["境界徽章", "胶囊 Chip 世界色", "显示 tierLabel + subName"],
      ["进度条", "8dp ProgressBar", "满额发光 + 可点"],
      ["突破按钮", "ButtonPrimary", "文案来自 ui.advanceBtn"],
      ["数值宫格", "2×2 StatChip", "等宽数字对齐"],
      ["经历", "Timeline", "bigEvents 逆序；最多显示 20 条 + 展开"],
    ],
    states: ["未满进度（按钮禁用）", "可突破", "满级已至尽头", "寿限将尽警告", "有天赋/无天赋"],
    notes: [
      ["层级", "身份 > 成长（进度/突破）> 数值 > 经历。"],
      ["分类", "技艺归「能力」；经历归「叙事」；寿限归「压力」，用 Warning 色。"],
    ],
    mock: "profile",
  },
  {
    id: "pg-09",
    code: "P09",
    title: "同伴",
    goal: "把 NPC 关系变成可管理的卡片档案，支持点名注入记忆。",
    layer: [
      { t: "顶栏：同伴 + 结识新同伴按钮", s: "主按钮在右上或 FAB", hl: true },
      { t: "同伴 ListCard 列表", s: "头像槽、称呼、关系、所在地", hl: true },
      { t: "详情 Sheet", s: "档案正文、好感、恩怨、对话入口", hl: true },
      { t: "空态", s: "插图 + 「结识新同伴」CTA", hl: false },
    ],
    specs: [
      ["同伴卡", "ListCard", "关系 Chip：友 / 爱 / 仇"],
      ["所在地", "次行文案", "在当前场景显示「同行」徽标"],
      ["好感条", "4dp ProgressBar", "绿/黄/红三段语义"],
      ["点名注入", "详情内「带入下一事件」开关", "说明：会加入 AI 记忆上下文"],
    ],
    states: ["空", "1–2 位", "多位含仇人", "NPC 行踪不明"],
    notes: [
      ["层级", "列表 > 档案详情 > 关系操作。"],
      ["分类", "同伴与场景 NPC 共用档案结构；页面只管理 friends，场景页管理 people。"],
    ],
    mock: "friends",
  },
  {
    id: "pg-10",
    code: "P10",
    title: "任务",
    goal: "委托链路可视化：接取 → 进行 → 完成/失败，奖励清晰。",
    layer: [
      { t: "状态分段：进行中 / 已完成 / 已失败", s: "SegmentedControl 或 Badge 计数", hl: true },
      { t: "任务 ListCard", s: "标题、委托人、地点、目标、奖励", hl: true },
      { t: "空态", s: "「去场景里触发委托」", hl: false },
    ],
    specs: [
      ["任务卡", "ListCard 变体", "状态 Chip 语义色"],
      ["目标", "Checkbox 列表（只读）", "AI 落库后自动打勾"],
      ["奖励", "StatChip 行", "物品 + 货币 + 进度"],
    ],
    states: ["全部空", "仅进行中", "含失败", "完成弹 SnackBar"],
    notes: [
      ["层级", "状态筛选 > 卡片列表 > 详情展开。"],
    ],
    mock: "quests",
  },
  {
    id: "pg-11",
    code: "P11",
    title: "行囊",
    goal: "物品可扫读、可分类、可快速使用/装备。",
    layer: [
      { t: "分类 Chip 横滑：全部/消耗/装备/秘籍/材料/特殊", s: "FilterChip 单选", hl: true },
      { t: "物品 ListCard", s: "图标、名称、类型、数量、简介", hl: true },
      { t: "详情 Sheet", s: "描述、价格、使用效果、使用/装备按钮", hl: true },
      { t: "空态", s: "「场景搜寻中可能获得物品」", hl: false },
    ],
    specs: [
      ["分类 Chip", "横滑 FilterChip", "计数徽标"],
      ["图标槽", "32dp 按类型着色", "consumable 绿 / equip 蓝 / technique 紫 …"],
      ["使用", "ButtonPrimary", "消耗品立即使用并 SnackBar 结果"],
    ],
    states: ["空", "多类混排", "装备中（角标）", "不可用物品置灰"],
    notes: [
      ["层级", "过滤 > 列表 > 详情动作。"],
      ["分类", "五类由 worldpack.typeNames 本地化文案。"],
    ],
    mock: "bag",
  },
  {
    id: "pg-12",
    code: "P12",
    title: "设置",
    goal: "低频项收纳分组；危险操作隔离；隐私与安全说清楚。",
    layer: [
      { t: "分组 1 叙事偏好", s: "AI 风格、语言、性别、对话轮数", hl: true },
      { t: "分组 2 音乐", s: "内置曲目、自定义上传、音量", hl: false },
      { t: "分组 3 模型与 API", s: "入口跳 P04 + 当前摘要", hl: true },
      { t: "分组 4 存档", s: "导出 / 导入 / 覆盖新开 / 删除本世界", hl: true },
      { t: "分组 5 关于", s: "版本、开源许可、反馈", hl: false },
    ],
    specs: [
      ["分组卡", "每组独立 Card", "组标题 Label 置于卡内顶部"],
      ["选择项", "Chip 单选 或 Segmented", "即时保存 + SnackBar"],
      ["危险项", "底部独立卡 + Error 色文案", "必须 Dialog 二次确认"],
      ["导出", "ButtonOutline", "导出 JSON 不含 Key；系统分享表"],
    ],
    states: ["默认", "含自定义 BGM", "无任何存档（导出置灰）", "删除确认中"],
    notes: [
      ["层级", "偏好 > 媒体 > 模型 > 数据 > 关于。"],
      ["分类", "数据类操作（导出/删除）与偏好开关物理分隔。"],
    ],
    mock: "settings",
  },
  {
    id: "pg-13",
    code: "P13",
    title: "突破 · 全屏反馈",
    goal: "把「升级」做成游戏的高光时刻，值得玩家截图。",
    layer: [
      { t: "全屏世界色渐变底", s: "从中心扩散的光晕", hl: true },
      { t: "结果大字：新境界名", s: "Display 字阶，弹性入场", hl: true },
      { t: "副标题：变化摘要（战力+寿限）", s: "StatChip 两行", hl: true },
      { t: "轻量庆祝粒子/光带", s: "300–600ms，不遮挡文字", hl: false },
      { t: "主按钮：继续旅程", s: "Primary，底部安全区", hl: true },
    ],
    specs: [
      ["入场", "500ms 弹性 + 触感重击", "旧境界 → 新境界数字翻动"],
      ["持续", "不自动关闭", "玩家点按钮或点空白返回"],
      ["失败", "不是全屏，改 ErrorCard + 原因（进度不足/寿限）", "保持在 P08"],
    ],
    states: ["普通突破", "满级尽头（文案不同）", "突破失败"],
    notes: [
      ["层级", "结果 > 原因 > 动作。"],
      ["分类", "成功用 FullScreenConfirm；失败用普通反馈，避免情绪双高。"],
    ],
    mock: "breakthrough",
  },
  {
    id: "pg-14",
    code: "P14",
    title: "底部抽屉",
    goal: "不离开当前页，完成状态查看与物品/移动等短决策。",
    layer: [
      { t: "拖拽把手 + 标题", s: "顶角 28dp，最大高度 85%", hl: true },
      { t: "内容区（按类型切换）", s: "状态卡 / 物品详情 / 移动确认 / 排序", hl: true },
      { t: "操作行", s: "最多 1 主 + 1 次按钮", hl: true },
      { t: "遮罩 + 点击关闭", s: "遮罩 32% 黑", hl: false },
    ],
    specs: [
      ["状态卡抽屉", "境界 + 进度 + 三货币 + 战力 + 寿限", "从 StatusPill 下拉触发"],
      ["物品抽屉", "大图标 + 描述 + 效果 + 使用/装备", "从 P11 点条目触发"],
      ["移动抽屉", "目的地摘要 + 距离/门槛 + 确认移动", "从 P07 点地点触发"],
      ["手势", "下拉 80dp 关闭", "与系统返回键同义"],
    ],
    states: ["展开", "半展开（预览）", "拖拽中", "嵌套确认 Dialog"],
    notes: [
      ["层级", "抽屉内最多两层；更深的确认用 Dialog 浮在抽屉之上。"],
    ],
    mock: "sheet",
  },
];

/* ===== 状态与异常 ===== */
SPEC.states = [
  { t: "空状态", d: "插图 + 一句话 + 一个主按钮。禁止纯文字「暂无数据」。", ex: "无同伴 / 无任务 / 无存档 / 无物品" },
  { t: "加载状态", d: "内容骨架或 ProgressDots；叙事场景用呼吸点而非全屏 Loading。", ex: "AI 生成中 / 模型列表拉取 / 存档读取" },
  { t: "部分失败", d: "保留已加载内容，失败块内嵌 ErrorCard + 重试。", ex: "地图加载失败但当前地点可用" },
  { t: "网络错误", d: "人话文案 + 重试 + 可展开技术细节（码/耗时）。", ex: "LLM 超时 / Base URL 不可达" },
  { t: "校验错误", d: "字段级红字 + 修复建议；不整页报错。", ex: "世界包 JSON schema / API Key 格式" },
  { t: "危险确认", d: "Dialog 说明后果；主按钮实心红或高强调，取消为文字钮。", ex: "覆盖存档 / 删除世界 / 删除密钥" },
  { t: "成功反馈", d: "轻则 SnackBar，重则 CenterToast / FullScreenConfirm。", ex: "保存 / 使用物品 / 突破 / 导出" },
  { t: "离线可用", d: "存档、世界包、本地资源可读；仅 AI 功能提示需联网。", ex: "飞行模式下仍可读档与浏览地图" },
];

/* ===== 动效 ===== */
SPEC.motion = [
  { m: "320ms", t: "页面转场", d: "容器变换 + 共享元素（世界卡 → 游戏壳），ContentFade + 12dp 上移" },
  { m: "220ms", t: "卡片选中 / 换肤", d: "主题色过渡 220ms ease，卡片抬升 2dp" },
  { m: "180ms", t: "选项选中", d: "胶囊 1.02→1.0 收缩，触发事件流" },
  { m: "流式", t: "叙事文本", d: "按段落 120ms 淡入；光标呼吸点；禁止逐字弹跳" },
  { m: "500ms", t: "突破成功", d: "弹性入场 + 重触感；微粒子 300–600ms" },
  { m: "220ms", t: "BottomSheet", d: "与遮罩同步；拖拽跟手 1:1" },
  { m: "触感·轻", t: "Haptic Light", d: "Tab 切换、选项点按、开关" },
  { m: "触感·中", t: "Haptic Medium", d: "发送、使用物品、移动确认" },
  { m: "触感·重", t: "Haptic Heavy", d: "突破成功、覆盖存档（危险确认）" },
];

/* ===== 技术架构 ===== */
SPEC.arch = [
  {
    name: "应用层 · UI",
    tag: "COMPOSE",
    items: ["Jetpack Compose", "Material 3 Expressive", "Navigation Compose", "LvJieTheme / 动态取色", "Adaptive（平板两栏）", "MiSans 字体资源"],
  },
  {
    name: "领域层 · 玩法",
    tag: "DOMAIN",
    items: ["WorldPack 解析/校验", "EventEngine", "ChangesParser", "Progression / Quests", "NPC Memory", "Prompt Builder", "i18n 文案键"],
  },
  {
    name: "数据层",
    tag: "DATA",
    items: ["Room（存档/世界包）", "DataStore（偏好）", "Keystore AES-GCM（API Key）", "存档 JSON 导出/导入", "旧 localStorage 迁移工具"],
  },
  {
    name: "网络与媒体",
    tag: "INFRA",
    items: ["OkHttp / Ktor", "SSE 流式 chat", "responses 协议适配", "Media3 / ExoPlayer", "MIDI 合成可选", "SSRF/重定向安全策略"],
  },
];

SPEC.platform = [
  ["目标 SDK 35 · minSdk 26", "Material You 动态取色（Android 12+），低版本回落世界主题色。"],
  ["Edge-to-edge 沉浸", "状态栏/手势条透明，内容 inset 正确；键盘避让 ActionDock。"],
  ["权限最小化", "默认零危险权限；通知按需；媒体用 SAF 选取本地 BGM。"],
  ["无障碍", "触控 ≥48dp、对比度 AA、TalkBack 覆盖叙事与数值、支持系统大字体。"],
  ["深浅双模式", "浅色默认；深色阅读模式显式切换，与世界皮肤联动。"],
  ["多语言", "对齐原仓库四语（简/繁/英/日），UI 键与剧情语言分离。"],
];

/* ===== 路线图 ===== */
SPEC.roadmap = [
  {
    ph: "PHASE 0 · 1 周",
    t: "设计定稿",
    d: "评审本规范；补齐高保真 Figma；六皮肤走查；14 页交互标注。",
    ul: ["设计评审通过", "Token 落表（colors/type/shape）", "动效参考原型"],
  },
  {
    ph: "PHASE 1 · 2–3 周",
    t: "骨架与主循环",
    d: "Compose 工程、导航壳、P01/P04/P06、API 接入与 Key 加密、存档读写。",
    ul: ["最小可玩闭环：进世界 → 行动 → 剧情 → 数值变", "Keystore 集成"],
  },
  {
    ph: "PHASE 2 · 2–3 周",
    t: "全景功能",
    d: "P02/P03/P07–P12/P13/P14、BGM、导出导入、自定义世界工坊、四语。",
    ul: ["功能对齐 v0.0.3 Web 版", "六皮肤完成", "无障碍基线"],
  },
  {
    ph: "PHASE 3 · 1–2 周",
    t: "磨砺与上架",
    d: "动效/触感打磨、深色阅读、性能、崩溃统计、商店物料、Internal Testing。",
    ul: ["发布 Internal Testing", "设计走查报告", "迁移工具验证"],
  },
];

/* ===== 独立项目 ===== */
SPEC.repo = {
  steps: [
    { t: "1. 查询上游", d: "以 Fly143/LvJie-WanJie master 为源，记录 commit 415e379（v0.0.3）。" },
    { t: "2. 复制到个人账号", d: "在 WikG1018 下新建独立仓库（非 PR、非 fork 关联），拷贝源码基线。" },
    { t: "3. 本设计规范入库", d: "index.html / styles.css / data.js / app.js 进 docs/design/。" },
    { t: "4. 后续安卓原生开发", d: "在独立仓库的 android-native/ 分支或目录推进 Compose 工程。" },
    { t: "5. 不直接向原仓库推 PR", d: "如需回馈上游，另开讨论；默认保持独立演进。" },
  ],
  note: "独立仓库保留原项目 MIT 许可与出处说明；发版与命名空间完全自主。",
};
