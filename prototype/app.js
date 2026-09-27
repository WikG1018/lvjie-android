/* 旅界 · 安卓原生版 · 应用逻辑 */
(function () {
  "use strict";
  const G = window.GAME;

  const app = {
    view: "welcome", // welcome | detail | author | api | help | game
    tab: "scene", // scene | map | profile | bag | settings
    worldId: "xiuxian",
    selectedWorld: "xiuxian",
    S: null,
    ev: null, // 事件进行中
    overlay: null, // sheet/dialog/fullscreen/toast
    authorStep: 1,
  };

  /* ---------- helpers ---------- */
  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  function applyWorldTheme(id) {
    const w = G.WORLDS[id] || G.WORLDS.xiuxian;
    const r = document.documentElement.style;
    r.setProperty("--w", w.accent);
    r.setProperty("--w-soft", w.soft);
    r.setProperty("--w-glow", w.glow);
    r.setProperty("--w-deep", w.deep);
    app.worldId = w.id;
    if (app.S) app.S.worldId = w.id;
  }

  function toast(msg, ms) {
    const host = $("overlay-root");
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = msg;
    host.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transition = "opacity .25s";
      setTimeout(() => el.remove(), 260);
    }, ms || 2200);
  }

  function closeOverlay() {
    app.overlay = null;
    $("overlay-root").innerHTML = "";
  }

  function showDialog(title, body, confirmText, onConfirm, danger) {
    app.overlay = "dialog";
    $("overlay-root").innerHTML =
      '<div class="dialog-wrap" data-close="1"><div class="dialog" onclick="event.stopPropagation()">' +
      "<h3>" + esc(title) + "</h3><p>" + esc(body) + "</p>" +
      '<div class="btn-row"><button class="btn ghost grow" data-act="close-overlay">取消</button>' +
      '<button class="btn ' + (danger ? "danger" : "primary") + ' grow" id="dlg-ok">' + esc(confirmText) + "</button></div>" +
      "</div></div>";
    $("dlg-ok").onclick = () => {
      closeOverlay();
      if (onConfirm) onConfirm();
    };
  }

  function showSheet(html) {
    app.overlay = "sheet";
    $("overlay-root").innerHTML =
      '<div class="scrim" data-close="1"></div><div class="sheet">' +
      '<div class="handle"></div>' + html + "</div>";
  }

  /* ---------- topbar / navbar ---------- */
  function renderChrome() {
    const top = $("topbar");
    const nav = $("navbar");
    const w = G.WORLDS[app.worldId];

    if (app.view === "welcome") {
      top.className = "topbar";
      top.innerHTML =
        '<div class="brand-mark" style="width:34px;height:34px;border-radius:11px;background:linear-gradient(145deg,#FF8A2B,#FF5A00);color:#fff;font-weight:700;display:grid;place-items:center;font-size:14px">旅</div>' +
        '<div class="title">旅界<small>安卓原生 · ' + esc(w.name) + "世界</small></div>" +
        '<button class="icon-btn" data-nav="api" title="API">🔑</button>' +
        '<button class="icon-btn" data-nav="help" title="帮助">?</button>';
      nav.innerHTML =
        '<div class="navbar-in">' +
        navItem("welcome", "✦", "世界", app.view === "welcome") +
        navItem("author", "🛠", "工坊", app.view === "author") +
        navItem("api", "🔑", "API", app.view === "api") +
        navItem("help", "?", "更多", app.view === "help") +
        "</div>";
    } else if (app.view === "game") {
      const S = app.S;
      top.className = "topbar";
      top.innerHTML =
        '<button class="icon-btn" data-act="back-welcome">←</button>' +
        '<div class="title">' + esc(w.name) + " · 旅界<small>" +
        esc(S.name) + " · " + esc(G.tierLabel(S)) + "</small></div>" +
        '<button class="status-pill" data-act="status-sheet"><b>' + S.money + "</b> " + esc(w.money) + "</button>";
      nav.innerHTML =
        '<div class="navbar-in">' +
        navItem("scene", "📍", "场景", app.tab === "scene") +
        navItem("map", "🗺", "地图", app.tab === "map") +
        navItem("profile", "👤", "人物", app.tab === "profile") +
        navItem("bag", "🎒", "囊务", app.tab === "bag") +
        navItem("settings", "⚙", "我的", app.tab === "settings") +
        "</div>";
    } else {
      const titles = { detail: "世界详情", author: "自定义世界", api: "API 与模型", help: "帮助" };
      top.className = "topbar";
      top.innerHTML =
        '<button class="icon-btn" data-act="back">←</button>' +
        '<div class="title">' + titles[app.view] + "</div>";
      nav.innerHTML =
        '<div class="navbar-in">' +
        navItem("welcome", "✦", "世界", app.view === "welcome") +
        navItem("author", "🛠", "工坊", app.view === "author") +
        navItem("api", "🔑", "API", app.view === "api") +
        navItem("help", "?", "更多", app.view === "help") +
        "</div>";
    }
  }

  function navItem(id, icon, label, on) {
    return (
      '<button class="nav-item' + (on ? " on" : "") + '" data-nav="' + id + '">' +
      '<span class="ni">' + icon + "</span>" + label + "</button>"
    );
  }

  /* ---------- screens ---------- */
  function render() {
    renderChrome();
    const stage = $("stage");
    const views = {
      welcome: viewWelcome,
      detail: viewDetail,
      author: viewAuthor,
      api: viewApi,
      help: viewHelp,
      game: viewGame,
    };
    stage.innerHTML = (views[app.view] || viewWelcome)();
    stage.scrollTop = 0;
    bindStage();
  }

  /* ===== P01 欢迎 ===== */
  function viewWelcome() {
    const w = G.WORLDS[app.worldId];
    const worlds = Object.values(G.WORLDS);
    return (
      '<div class="fade-up">' +
      '<div class="welcome-hero">' +
      '<div class="k">MAP OF WORLDS</div>' +
      "<h1>地图上的" + esc(w.name) + "世界</h1>" +
      "<p>选择你的旅程，AI 即时编织剧情。各世界存档互不影响。</p>" +
      '<div class="btn-row mt12">' +
      '<button class="btn primary" data-act="start">开始旅程</button>' +
      '<button class="btn outline" data-nav="author">🛠 自定义世界</button>' +
      "</div></div>" +

      '<div class="section-label">世界收藏 · 点击切换主题</div>' +
      '<div class="world-grid mb12">' +
      worlds
        .map((x) => {
          const on = x.id === app.worldId;
          return (
            '<div class="world-card' + (on ? " on" : "") + '" data-world="' + x.id + '" style="--wc:' + x.accent + ";--wc-glow:" + x.glow + (on ? ";border-color:" + x.accent + ";background:" + x.soft : "") + '">' +
            '<div class="wicon" style="background:' + x.soft + '">' + x.icon + "</div>" +
            '<div class="wname">' + x.name + "</div>" +
            '<div class="wtag">' + esc(x.tagline) + "</div>" +
            '<div class="wmeta">' + esc(x.level) + " · " + esc(x.progress) + " · 6 阶</div>" +
            "</div>"
          );
        })
        .join("") +
      "</div>" +

      '<div class="card tight row between" data-act="continue">' +
      '<div class="row"><div class="item" style="border:none;box-shadow:none;padding:0;background:transparent">' +
      '<div class="ic" style="width:36px;height:36px;font-size:16px">💾</div>' +
      '<div class="tx"><b>继续上次</b><span>林逸 · ' + esc(G.WORLDS[app.worldId].tiers[1]) + " · " + esc(G.WORLDS[app.worldId].places[0].name) + "</span></div></div></div>" +
      '<span class="chip on">进入</span></div>' +
      "</div>"
    );
  }

  /* ===== P02 世界详情 ===== */
  function viewDetail() {
    const w = G.WORLDS[app.selectedWorld];
    return (
      '<div class="fade-up">' +
      '<div class="welcome-hero" style="background:linear-gradient(155deg,' + w.soft + ',#fff 75%)">' +
      '<div class="center"><div style="font-size:40px">' + w.icon + "</div>" +
      '<h1 style="margin-top:8px">' + esc(w.name) + "世界</h1>" +
      "<p>" + esc(w.tagline) + "</p></div></div>" +
      '<div class="seg mb12"><button class="on">介绍</button><button>等级表</button><button>地图</button></div>' +
      '<div class="card"><h3><span class="dot"></span>这个世界怎么玩</h3><p>行动、对话、自由输入，AI 生成剧情并回写数值。等级名为「' + esc(w.level) + "」，进度为「" + esc(w.progress) + "」。</p></div>" +
      '<div class="card"><h3><span class="dot"></span>等级表</h3><div class="chip-row">' +
      w.tiers.map((t, i) => '<span class="chip' + (i === 1 ? " on" : "") + '">' + t + "</span>").join("") +
      "</div></div>" +
      '<div class="card"><h3><span class="dot"></span>地点预览</h3><div class="list">' +
      w.places.slice(0, 3).map((p) => '<div class="item tight"><div class="ic">📍</div><div class="tx"><b>' + esc(p.name) + "</b><span>" + esc(p.type) + " · " + esc(p.world) + "</span></div></div>").join("") +
      "</div></div>" +
      '<div class="btn-row"><button class="btn primary grow" data-act="start">进入世界</button>' +
      '<button class="btn outline grow" data-act="new-game">新开一局</button></div>' +
      "</div>"
    );
  }

  /* ===== P03 工坊 ===== */
  function viewAuthor() {
    const steps = ["来源", "设定", "生成", "微调"];
    const step = app.authorStep;
    let body = "";
    if (step === 1) {
      body =
        '<div class="list">' +
        ["📚|从作品生成|书名 + 设定摘要", "📄|整本小说|上传 TXT · 抽样考据", "🌐|联网补充设定|百科 / 设定帖", "🧩|粘贴 JSON|高级 · schema 校验"]
          .map((s) => {
            const [ic, t, d] = s.split("|");
            return '<div class="item" data-act="author-next"><div class="ic">' + ic + '</div><div class="tx"><b>' + t + "</b><span>" + d + "</span></div></div>";
          })
          .join("") +
        "</div>";
    } else if (step === 2) {
      body =
        '<div class="card"><div class="field"><label>书名 / 世界名</label><input id="wa-name" placeholder="例如：凡人修仙传" value="凡人修仙传"></div>' +
        '<div class="field"><label>设定摘要</label><textarea placeholder="一句话描述核心设定…">凡人流修仙，资质平平的少年靠机缘与谋略步步登天。</textarea></div>' +
        '<div class="btn-row"><button class="btn ghost" data-act="author-back">上一步</button>' +
        '<button class="btn primary grow" data-act="author-next">下一步 · 生成草稿</button></div></div>';
    } else if (step === 3) {
      body =
        '<div class="card center" style="padding:28px 16px"><div class="dots"><i></i><i></i><i></i></div>' +
        '<p class="mt12">正在考据设定、合并世界观、生成草稿…</p>' +
        '<div class="bar mt12"><i style="width:62%"></i></div>' +
        '<div class="btn-row center mt16"><button class="btn outline" data-act="author-next">跳过（演示）</button></div></div>';
    } else {
      body =
        '<div class="card"><h3><span class="dot"></span>草稿预览</h3><p><b>凡人修仙</b> · 等级 6 阶 · 地点 8 个 · NPC 12 人</p>' +
        '<div class="chip-row mt8"><span class="chip on">练气</span><span class="chip">筑基</span><span class="chip">金丹</span><span class="chip">元婴</span><span class="chip">化神</span><span class="chip">渡劫</span></div>' +
        '<div class="btn-row mt12"><button class="btn ghost" data-act="author-back">返回修改</button>' +
        '<button class="btn primary grow" data-act="author-save">保存世界</button></div></div>' +
        '<div class="note">AI 生成结果为草稿，可随时修改或删除。保存后会出现在世界列表。</div>';
    }
    return (
      '<div class="fade-up">' +
      '<div class="steps">' +
      steps.map((s, i) => '<div class="st' + (i + 1 === step ? " on" : i + 1 < step ? " done" : "") + '"><div class="pt">' + (i + 1 < step ? "✓" : i + 1) + "</div>" + s + "</div>").join("") +
      "</div>" +
      '<div class="section-label">第 ' + step + " 步 / 共 4 步 · " + steps[step - 1] + "</div>" +
      body + "</div>"
    );
  }

  /* ===== P04 API ===== */
  function viewApi() {
    return (
      '<div class="fade-up">' +
      '<div class="card"><h3><span class="dot"></span>协议</h3>' +
      '<div class="seg mb12"><button class="on">chat</button><button>response</button></div>' +
      '<p class="muted" style="font-size:12px">chat → POST {Base URL}/chat/completions<br>response → POST {Base URL}/responses</p></div>' +
      '<div class="card"><h3><span class="dot"></span>连接配置</h3>' +
      '<div class="field"><label>Base URL</label><input value="https://api.example.com/v1"></div>' +
      '<div class="field"><label>模型名</label><input value="gpt-mini"></div>' +
      '<div class="field"><label>API Key</label><input type="password" value="sk-demo-key"><div class="hint">Keystore AES-256-GCM 加密保存；导出存档不含 Key。</div></div>' +
      '<div class="btn-row"><button class="btn outline" data-act="test-api">测试连通</button>' +
      '<button class="btn outline" data-act="refresh-models">刷新模型列表</button></div></div>' +
      '<div class="card"><h3><span class="dot"></span>安全</h3><p>密钥仅存本机 Keystore，不明文落盘。跨请求自动剥离敏感头。</p></div>' +
      "</div>"
    );
  }

  /* ===== P05 帮助 ===== */
  function viewHelp() {
    return (
      '<div class="fade-up">' +
      '<div class="card"><h3><span class="dot"></span>快速开始</h3>' +
      '<div class="stats"><div class="stat"><div class="k">1</div><div class="v" style="font-size:15px">选世界</div></div>' +
      '<div class="stat"><div class="k">2</div><div class="v" style="font-size:15px">点行动</div></div>' +
      '<div class="stat"><div class="k">3</div><div class="v" style="font-size:15px">看剧情</div></div>' +
      '<div class="stat"><div class="k">4</div><div class="v" style="font-size:15px">数值变</div></div></div></div>' +
      '<div class="section-label">常见问题</div>' +
      ["什么是世界包？|世界包定义了等级、货币、地图、行动与 AI 铁律，可导入 JSON 或 AI 生成。",
        "AI 会犯错吗？|剧情由 AI 实时合成，可能存在虚构。数值落库有熔断保护。",
        "存档会丢吗？|按世界分槽本地保存，可导出 JSON 备份。清应用数据会丢失。",
        "Key 安全吗？|安卓端 Keystore AES-256-GCM 加密，不进导出文件。"]
        .map((s) => {
          const [q, a] = s.split("|");
          return '<div class="card tight"><b style="font-size:13px">' + q + '</b><p class="mt8">' + a + "</p></div>";
        })
        .join("") +
      '<div class="note">剧情由 AI 实时合成，可能存在虚构或错误内容。设计规划见 design-spec/ 目录。</div>' +
      "</div>"
    );
  }

  /* ===== 游戏主壳 ===== */
  function viewGame() {
    const tabs = { scene: tabScene, map: tabMap, profile: tabProfile, bag: tabBag, settings: tabSettings };
    return (tabs[app.tab] || tabScene)();
  }

  /* --- P06 场景 --- */
  function tabScene() {
    const S = app.S;
    const w = G.WORLDS[S.worldId];
    const loc = G.locOf(S);
    let evHtml = "";

    if (app.ev) {
      const ev = app.ev;
      if (ev.loading && !ev.text) {
        evHtml =
          '<div class="ev"><div class="hd"><span>AI 叙事中</span><span class="dots"><i></i><i></i><i></i></span></div>' +
          '<div class="body muted">正在生成……</div></div>';
      } else if (ev.text) {
        evHtml =
          '<div class="ev"><div class="hd"><span>' + esc(ev.kind) + " · 第 " + ev.count + ' 轮</span>' +
          '<button class="btn sm ghost" data-act="end-ev">结束事件</button></div>' +
          '<div class="body" id="ev-body">' + ev.text + (ev.streaming ? '<span class="cursor"></span>' : "") + "</div>" +
          (ev.options && !ev.streaming
            ? ev.options.map((o, i) => '<button class="opt' + (i > 0 ? " ghost" : "") + '" data-opt="' + i + '">' + (i + 1) + ". " + esc(o) + "</button>").join("")
            : "") +
          (ev.options && !ev.streaming
            ? ""
            : "") +
          '<div class="free-input"><input id="free-in" placeholder="描述你想做的事…" ' + (ev.streaming ? "disabled" : "") + '><button class="send" data-act="free-send">发送</button></div>' +
          "</div>";
      }
    }

    return (
      '<div class="fade-up">' +
      '<div class="card hero-card">' +
      '<div class="loc-head"><div><div class="name">' + esc(loc.name) + '</div><div class="meta">' + esc(w.name) + "界 · " + esc(loc.world) + " · " + esc(loc.type) + "</div></div>" +
      '<span class="chip on">' + w.icon + " " + esc(G.tierLabel(S)) + "</span></div>" +
      '<div class="loc-desc">' + esc(loc.desc) + "</div>" +
      '<div class="btn-row">' +
      w.actions.map((a) => '<button class="btn tonal sm" data-act="' + a.id + '">' + a.label + "</button>").join("") +
      "</div></div>" +
      evHtml +
      '<div class="card"><h3><span class="dot"></span>场景中的人</h3>' +
      (loc.people.length
        ? '<div class="list">' +
          loc.people.map((n) => '<div class="item"><div class="ic">👤</div><div class="tx"><b>' + esc(n) + "</b><span>点击可交谈</span></div>" +
            '<button class="btn sm tonal" data-talk="' + esc(n) + '">交谈</button></div>').join("") +
          "</div>"
        : '<div class="empty"><div class="ei">🍃</div><div class="et">此处暂无他人</div><div class="ed">换一个行动或移动到别处</div></div>') +
      "</div>" +
      '<div class="card tight"><div class="row between"><div class="muted" style="font-size:11px;font-weight:650">' + esc(w.progress) + '</div>' +
      '<div class="num" style="font-size:11px;font-weight:700;color:var(--w)">' + S.progress + " / " + G.reqFor(S) + "</div></div>" +
      '<div class="bar mt8' + (G.canBreak(S) ? " full" : "") + '"><i style="width:' + Math.min(100, (S.progress / G.reqFor(S)) * 100) + '%"></i></div></div>' +
      "</div>"
    );
  }

  /* --- P07 地图 --- */
  function tabMap() {
    const S = app.S;
    const w = G.WORLDS[S.worldId];
    return (
      '<div class="fade-up">' +
      '<div class="card" style="border-color:var(--w);background:var(--w-soft)">' +
      '<div class="row between"><div><div style="font-size:15px;font-weight:700">当前 · ' + esc(G.locOf(S).name) + "</div>" +
      '<div class="muted" style="font-size:11px">' + esc(w.name) + "界 · " + esc(G.locOf(S).world) + "</div></div>" +
      '<button class="btn primary sm" data-act="move-here">移动</button></div></div>' +
      '<div class="section-label">' + w.icon + " " + esc(w.name) + "界 · " + w.places.length + " 地点</div>" +
      '<div class="list">' +
      w.places
        .map((p) => {
          const cur = p.id === S.loc;
          return (
            '<div class="item" data-move="' + p.id + '"' + (cur ? ' style="border-color:var(--w);border-width:1.5px"' : "") + ">" +
            '<div class="ic">' + (cur ? "📍" : p.type === "秘境" ? "🏯" : p.type === "荒野" ? "⛰" : p.type === "渡口" ? "🌊" : "🏙") + "</div>" +
            '<div class="tx"><b>' + esc(p.name) + (cur ? " · 当前" : "") + "</b><span>" + esc(p.type) + " · " + (p.people.length ? p.people.length + " 人" : "无人") + "</span></div>" +
            (cur ? '<span class="chip on">在此</span>' : '<span class="chip">前往</span>') +
            "</div>"
          );
        })
        .join("") +
      "</div></div>"
    );
  }

  /* --- P08 人物 --- */
  function tabProfile() {
    const S = app.S;
    const w = G.WORLDS[S.worldId];
    const can = G.canBreak(S);
    return (
      '<div class="fade-up">' +
      '<div class="card hero-card center" style="background:linear-gradient(160deg,var(--w-soft),#fff 70%)">' +
      '<div style="font-size:42px">' + w.icon + "</div>" +
      '<div style="font-size:22px;font-weight:700;letter-spacing:-.02em;margin-top:6px">' + esc(S.name) + "</div>" +
      '<div class="muted" style="font-size:12px">' + esc(w.name) + "界旅者</div>" +
      '<div class="mt12"><span class="chip on" style="font-size:13px;padding:8px 16px">' + esc(G.tierLabel(S)) + "</span></div>" +
      '<div class="bar mt12' + (can ? " full" : "") + '"><i style="width:' + Math.min(100, (S.progress / G.reqFor(S)) * 100) + '%"></i></div>' +
      '<div class="muted mt8" style="font-size:11px">' + esc(w.progress) + " " + S.progress + " / " + G.reqFor(S) + "</div>" +
      '<div class="btn-row center mt12"><button class="btn primary" data-act="breakthrough"' + (can ? "" : " disabled") + ">" + esc(w.advance) + "</button></div></div>" +
      '<div class="stats">' +
      '<div class="stat"><div class="k">战力</div><div class="v num">' + S.power + "</div></div>" +
      '<div class="stat"><div class="k">年龄</div><div class="v num">' + S.age + "<small> 岁</small></div></div>" +
      '<div class="stat"><div class="k">' + esc(w.money) + '</div><div class="v num">' + S.money + "</div></div>" +
      '<div class="stat"><div class="k">技艺</div><div class="v num">4<small> 项</small></div></div></div>' +
      '<div class="card mt12"><h3><span class="dot"></span>重大经历</h3><div class="list">' +
      S.events.map((e) => '<div class="item"><div class="ic">✦</div><div class="tx"><b>' + esc(e.age) + "</b><span>" + esc(e.text) + "</span></div></div>").join("") +
      "</div></div></div>"
    );
  }

  /* --- P09/P10/P11 囊务 --- */
  function tabBag() {
    const S = app.S;
    const w = G.WORLDS[S.worldId];
    const mode = app.bagMode || "quests";
    return (
      '<div class="fade-up">' +
      '<div class="seg mb12"><button class="' + (mode === "quests" ? "on" : "") + '" data-bag="quests">任务 ' + S.quests.filter((q) => q.status === "active").length + "</button>" +
      '<button class="' + (mode === "bag" ? "on" : "") + '" data-bag="bag">行囊 ' + S.inventory.length + "</button></div>" +
      (mode === "quests"
        ? '<div class="list">' +
          S.quests
            .map((q) => {
              const st = q.status === "active" ? '<span class="chip amber">进行中</span>' : q.status === "done" ? '<span class="chip green">已完成</span>' : '<span class="chip red">失败</span>';
              return (
                '<div class="item" style="align-items:flex-start"><div class="ic">' + (q.status === "done" ? "✅" : "📜") + "</div>" +
                '<div class="tx"><div class="row between"><b>' + esc(q.title) + "</b>" + st + "</div>" +
                "<span>委托人：" + esc(q.from) + "</span>" +
                '<div class="muted" style="font-size:11px;margin-top:4px;white-space:normal">' + esc(q.desc) + "　奖励：" + esc(q.reward) + "</div></div></div>"
              );
            })
            .join("") +
          "</div>"
        : '<div class="list">' +
          S.inventory
            .map((it, idx) => {
              const icon = it.type === "consumable" ? "🧪" : it.type === "equip" ? "🗡" : it.type === "technique" ? "📜" : "📦";
              return (
                '<div class="item" data-item="' + idx + '"><div class="ic">' + icon + "</div>" +
                '<div class="tx"><b>' + esc(it.name) + ' <span class="muted" style="font-size:11px">×' + it.count + "</span></b><span>" + esc(it.desc) + "</span></div>" +
                (it.type === "consumable" ? '<button class="btn sm tonal" data-use="' + idx + '">使用</button>' : "") +
                "</div>"
              );
            })
            .join("") +
          "</div>") +
      "</div>"
    );
  }

  /* --- P12 设置 --- */
  function tabSettings() {
    const S = app.S;
    return (
      '<div class="fade-up">' +
      '<div class="card"><h3><span class="dot"></span>AI 叙事</h3>' +
      '<div class="seg mb12"><button class="' + (S.aiStyle === "沉浸" ? "on" : "") + '" data-style="沉浸">沉浸</button>' +
      '<button class="' + (S.aiStyle === "简练" ? "on" : "") + '" data-style="简练">简练</button>' +
      '<button class="' + (S.aiStyle === "诙谐" ? "on" : "") + '" data-style="诙谐">诙谐</button></div>' +
      '<div class="row between"><div><b style="font-size:13px">对话轮数限制</b><div class="muted" style="font-size:11px">开启后单次事件约 10 轮收束</div></div>' +
      '<div class="switch' + (S.dialogLimit ? " on" : "") + '" data-act="toggle-limit"></div></div></div>' +

      '<div class="card"><h3><span class="dot"></span>语言</h3>' +
      '<div class="seg"><button class="on">简体中文</button><button>繁體中文</button><button>English</button><button>日本語</button></div></div>' +

      '<div class="card"><h3><span class="dot"></span>音乐</h3>' +
      '<div class="row between"><div><b style="font-size:13px">背景音乐</b><div class="muted" style="font-size:11px">内置曲目 · 自定义 mp3</div></div>' +
      '<div class="switch' + (S.bgm ? " on" : "") + '" data-act="toggle-bgm"></div></div></div>' +

      '<div class="card"><h3><span class="dot"></span>模型与 API</h3>' +
      '<div class="row between"><div><b style="font-size:13px">已配置 1 个密钥</b><div class="muted" style="font-size:11px">chat 协议 · gpt-mini</div></div>' +
      '<button class="btn sm outline" data-nav="api">管理</button></div></div>' +

      '<div class="card"><h3><span class="dot"></span>存档</h3>' +
      '<div class="btn-row"><button class="btn outline" data-act="export">导出 JSON</button>' +
      '<button class="btn outline" data-act="import">导入</button>' +
      '<button class="btn danger" data-act="delete-save">删除本世界</button></div>' +
      '<p class="muted mt8" style="font-size:11px">导出不含 API Key。删除只影响当前世界存档。</p></div>' +

      '<div class="note">旅界 · 安卓原生版原型 · 设计规格见 design-spec/ · 基于 Fly143/LvJie-WanJie</div>' +
      "</div>"
    );
  }

  /* ---------- 事件流模拟 ---------- */
  const STREAM_DELAY = 18;

  function startEvent(actionId, customText) {
    const S = app.S;
    const w = G.WORLDS[S.worldId];
    if (app.ev && app.ev.loading) return;

    const pool = G.EVENTS[actionId] || G.EVENTS.travel;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const rawText = customText
      ? "你决定" + customText + "。<span class='hl'>命运的丝线</span>被轻轻拨动……"
      : pick.text;
    const plain = rawText.replace(/<[^>]+>/g, "");

    app.ev = {
      kind: customText ? "自由行动" : (w.actions.find((a) => a.id === actionId) || { label: "事件" }).label,
      count: (app.ev ? app.ev.count + 1 : 1),
      text: "",
      options: pick.options,
      changes: pick.changes,
      loading: true,
      streaming: true,
      _full: rawText,
    };
    app.tab = "scene";
    render();

    // 逐字流式
    let i = 0;
    const full = rawText;
    function tick() {
      if (!app.ev) return;
      // HTML-safe streaming: append by chunks of visible chars while keeping tags
      if (i >= full.length) {
        app.ev.text = full;
        app.ev.loading = false;
        app.ev.streaming = false;
        render();
        return;
      }
      // advance past tags instantly
      if (full[i] === "<") {
        const close = full.indexOf(">", i);
        i = close >= 0 ? close + 1 : full.length;
      } else {
        i += 1;
      }
      app.ev.text = full.slice(0, i);
      const body = document.getElementById("ev-body");
      if (body) body.innerHTML = app.ev.text + '<span class="cursor"></span>';
      const stage = $("stage");
      if (stage) stage.scrollTop = stage.scrollHeight;
      setTimeout(tick, STREAM_DELAY + (full[i] === "，" || full[i] === "。" ? 40 : 0));
    }
    setTimeout(tick, 280);
  }

  function endEvent() {
    if (!app.ev) return;
    const changes = app.ev.changes || {};
    const notes = G.applyChanges(app.S, changes);
    app.ev = null;
    render();
    if (notes.length) toast(notes.join(" · "));
  }

  function chooseOption(idx) {
    if (!app.ev || app.ev.streaming) return;
    const map = ["果决", "谨慎", "从容"];
    startEvent("travel", "以" + (map[idx] || "自己的") + "的方式回应：" + app.ev.options[idx]);
  }

  function breakthrough() {
    const r = G.doBreak(app.S);
    if (!r.ok) {
      toast(esc(r.msg));
      return;
    }
    // 全屏反馈 + 粒子
    const w = G.WORLDS[app.S.worldId];
    let particles = "";
    for (let i = 0; i < 18; i++) {
      const dx = (Math.random() - 0.5) * 280;
      const dy = (Math.random() - 0.5) * 280;
      particles += '<div class="particle" style="left:' + (40 + Math.random() * 20) + "%;top:" + (35 + Math.random() * 30) + "%;--dx:" + dx + "px;--dy:" + dy + "px;animation-delay:" + Math.random() * 0.35 + 's"></div>';
    }
    $("overlay-root").innerHTML =
      '<div class="fullscreen">' + particles +
      '<div style="font-size:56px">' + w.icon + "</div>" +
      '<div class="big">' + esc(w.advance) + "成功</div>" +
      '<div class="badge">' + esc(w.tiers[app.S.tierIndex]) + "</div>" +
      '<div class="sum">战力 +' + (400 + app.S.tierIndex * 200) + "　寿限 +40 年</div>" +
      '<button class="btn primary" style="min-width:180px" data-act="close-overlay">继续旅程</button></div>';
    app.overlay = "fullscreen";
    if (navigator.vibrate) navigator.vibrate(30);
    render();
  }

  /* ---------- 事件绑定 ---------- */
  function bindStage() {
    // delegated via root clicks in bindRoot
  }

  function bindRoot() {
    document.body.addEventListener("click", function (e) {
      const t = e.target.closest("[data-act],[data-nav],[data-world],[data-opt],[data-move],[data-use],[data-item],[data-bag],[data-style],[data-talk],[data-close]");
      if (!t) return;

      if (t.hasAttribute("data-close") || t.dataset.act === "close-overlay") {
        closeOverlay();
        return;
      }

      const nav = t.dataset.nav;
      if (nav) {
        if (nav === "welcome" || nav === "author" || nav === "api" || nav === "help") {
          if (app.S && app.view === "game") {
            // save implied; go welcome
          }
          app.view = nav;
          if (nav === "author") app.authorStep = 1;
          render();
          return;
        }
      }

      const world = t.dataset.world;
      if (world) {
        applyWorldTheme(world);
        app.selectedWorld = world;
        render();
        return;
      }

      const opt = t.dataset.opt;
      if (opt != null && opt !== "") {
        chooseOption(parseInt(opt, 10));
        return;
      }

      const move = t.dataset.move;
      if (move) {
        app.S.loc = move;
        render();
        toast("已抵达 " + G.locOf(app.S).name);
        return;
      }

      const use = t.dataset.use;
      if (use != null && use !== "") {
        const it = app.S.inventory[parseInt(use, 10)];
        if (it && it.type === "consumable") {
          const w = G.WORLDS[app.S.worldId];
          app.S.progress += it.value || 20;
          it.count -= 1;
          if (it.count <= 0) app.S.inventory.splice(parseInt(use, 10), 1);
          render();
          toast("使用 " + it.name + " · " + w.progress + " +" + (it.value || 20));
        }
        return;
      }

      const bag = t.dataset.bag;
      if (bag) {
        app.bagMode = bag;
        render();
        return;
      }

      const style = t.dataset.style;
      if (style) {
        app.S.aiStyle = style;
        render();
        return;
      }

      const talk = t.dataset.talk;
      if (talk) {
        startEvent("talk", "与" + talk + "交谈");
        return;
      }

      const act = t.dataset.act;
      if (!act) return;

      switch (act) {
        case "start":
          app.S = G.newGame(app.worldId, "林逸");
          applyWorldTheme(app.worldId);
          app.view = "game";
          app.tab = "scene";
          app.ev = null;
          render();
          toast("已进入《" + G.WORLDS[app.worldId].name + "》世界");
          break;
        case "continue":
          if (!app.S) app.S = G.newGame(app.worldId, "林逸");
          applyWorldTheme(app.S.worldId);
          app.view = "game";
          app.tab = "scene";
          render();
          break;
        case "new-game":
          showDialog("新开一局？", "将覆盖现有存档。其它世界存档与 API Key 不受影响。", "覆盖并新开", () => {
            app.S = G.newGame(app.selectedWorld, "林逸");
            applyWorldTheme(app.selectedWorld);
            app.view = "game";
            app.tab = "scene";
            render();
          }, true);
          break;
        case "back":
          app.view = "welcome";
          render();
          break;
        case "back-welcome":
          app.view = "welcome";
          app.ev = null;
          render();
          break;
        case "travel":
        case "talk":
        case "fight":
        case "search":
        case "rest":
          startEvent(act);
          break;
        case "end-ev":
          endEvent();
          break;
        case "free-send": {
          const inp = document.getElementById("free-in");
          const v = inp && inp.value.trim();
          if (!v) {
            toast("先描述你想做的事");
            return;
          }
          startEvent("travel", v);
          break;
        }
        case "breakthrough":
          breakthrough();
          break;
        case "status-sheet": {
          const S = app.S;
          const w = G.WORLDS[S.worldId];
          showSheet(
            "<h3>状态</h3>" +
            '<div class="muted" style="font-size:12px;margin-bottom:12px">' + esc(S.name) + " · " + esc(G.tierLabel(S)) + "</div>" +
            '<div class="stats"><div class="stat"><div class="k">' + esc(w.progress) + '</div><div class="v num">' + S.progress + "</div></div>" +
            '<div class="stat"><div class="k">战力</div><div class="v num">' + S.power + "</div></div>" +
            '<div class="stat"><div class="k">' + esc(w.money) + '</div><div class="v num">' + S.money + "</div></div>" +
            '<div class="stat"><div class="k">年龄</div><div class="v num">' + S.age + "</div></div></div>" +
            '<div class="btn-row mt16"><button class="btn primary grow" data-act="close-overlay">知道了</button></div>'
          );
          break;
        }
        case "toggle-limit":
          app.S.dialogLimit = !app.S.dialogLimit;
          render();
          break;
        case "toggle-bgm":
          app.S.bgm = !app.S.bgm;
          render();
          break;
        case "test-api":
          toast("✓ 连通正常 · 延迟 240ms");
          break;
        case "refresh-models":
          toast("已拉取 3 个模型");
          break;
        case "export":
          toast("已导出存档 JSON（不含 Key）");
          break;
        case "import":
          toast("请选择备份文件…（演示）");
          break;
        case "delete-save":
          showDialog("删除本世界存档？", "此操作不可恢复。其它世界与 API Key 不受影响。", "确认删除", () => {
            app.S = null;
            app.view = "welcome";
            render();
            toast("存档已删除");
          }, true);
          break;
        case "author-next":
          app.authorStep = Math.min(4, app.authorStep + 1);
          if (app.authorStep === 3) {
            render();
            setTimeout(() => {
              if (app.view === "author" && app.authorStep === 3) {
                app.authorStep = 4;
                render();
              }
            }, 1600);
            return;
          }
          render();
          break;
        case "author-back":
          app.authorStep = Math.max(1, app.authorStep - 1);
          render();
          break;
        case "author-save":
          app.authorStep = 1;
          app.view = "welcome";
          render();
          toast("自定义世界已保存（演示）");
          break;
        case "move-here":
          app.tab = "map";
          render();
          break;
      }
    });

    // 底部导航：游戏内 tab
    document.body.addEventListener("click", function (e) {
      const t = e.target.closest("[data-nav]");
      if (!t) return;
      const nav = t.dataset.nav;
      const gameTabs = ["scene", "map", "profile", "bag", "settings"];
      if (gameTabs.includes(nav) && app.view === "game") {
        app.tab = nav;
        render();
      }
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    applyWorldTheme("xiuxian");
    bindRoot();
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
