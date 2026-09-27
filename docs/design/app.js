/* 旅界 · 设计规范 · 渲染 */
(function () {
  "use strict";
  var S = window.SPEC;
  var curWorld = S.worlds[0];
  var curScreen = "welcome";

  function $(id) {
    return document.getElementById(id);
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function applyWorldTheme(w) {
    curWorld = w;
    var r = document.documentElement;
    r.style.setProperty("--w-accent", w.accent);
    r.style.setProperty("--w-soft", w.soft);
    r.style.setProperty("--w-glow", w.glow);
    r.style.setProperty("--w-deep", w.deep);
    var el = $("theme-name");
    if (el) el.textContent = w.name + " · " + w.accent;
    var btns = document.querySelectorAll(".world-btn");
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute("data-id") === w.id;
      btns[i].classList.toggle("on", on);
      if (on) {
        btns[i].style.borderColor = w.accent;
        btns[i].style.background = w.soft;
      } else {
        btns[i].style.borderColor = "";
        btns[i].style.background = "";
      }
    }
    renderMock();
  }

  function buildThemeBar() {
    var row = $("theme-row");
    if (!row) return;
    row.innerHTML = S.worlds
      .map(function (w) {
        return (
          '<button type="button" class="world-btn" data-id="' +
          w.id +
          '"><span class="ic" style="background:' +
          w.soft +
          ";color:" +
          w.accent +
          '">' +
          w.icon +
          '</span><span class="nm">' +
          w.name +
          "</span></button>"
        );
      })
      .join("");
    row.querySelectorAll(".world-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-id");
        for (var i = 0; i < S.worlds.length; i++)
          if (S.worlds[i].id === id) applyWorldTheme(S.worlds[i]);
      });
    });
    var sw = $("world-swatches");
    if (sw) {
      sw.innerHTML = S.worlds
        .map(function (w) {
          return (
            '<div class="sw"><div class="c" style="background:' +
            w.accent +
            '"></div><div class="m"><b>' +
            w.icon +
            " " +
            w.name +
            "</b><span>" +
            w.accent +
            "</span></div></div>"
          );
        })
        .join("");
    }
    var lex = $("world-lexicon");
    if (lex) {
      lex.innerHTML = S.worlds
        .map(function (w) {
          return (
            '<div class="fitem"><div class="fi">' +
            w.icon +
            '</div><div><div class="ft">' +
            w.name +
            '</div><div class="fd">' +
            esc(w.level) +
            " · " +
            esc(w.progress) +
            " · " +
            esc(w.money) +
            " · " +
            esc(w.advance) +
            "</div></div></div>"
          );
        })
        .join("");
    }
  }

  function buildNav() {
    var side = $("side-nav");
    if (side) {
      side.innerHTML = S.nav
        .map(function (g) {
          return (
            '<div class="side-group"><div class="side-label">' +
            esc(g.group) +
            "</div>" +
            g.items
              .map(function (it) {
                return (
                  '<a href="#' +
                  it.id +
                  '" data-id="' +
                  it.id +
                  '" class="' +
                  (it.sub ? "sub" : "") +
                  '"><span class="n">' +
                  it.n +
                  "</span>" +
                  esc(it.label) +
                  "</a>"
                );
              })
              .join("") +
            "</div>"
          );
        })
        .join("");
    }
    var m = $("mnav-in");
    if (m) {
      var tops = [
        { id: "sec-overview", bi: "✦", label: "总览" },
        { id: "sec-color", bi: "🎨", label: "令牌" },
        { id: "pg-06", bi: "📱", label: "页面" },
        { id: "comp-nav", bi: "🧩", label: "组件" },
        { id: "sec-roadmap", bi: "🚀", label: "路线" },
      ];
      m.innerHTML = tops
        .map(function (t, i) {
          return (
            '<a href="#' +
            t.id +
            '" data-id="' +
            t.id +
            '"' +
            (i === 0 ? ' class="on"' : "") +
            '><span class="bi">' +
            t.bi +
            "</span>" +
            t.label +
            "</a>"
          );
        })
        .join("");
    }
    // scroll spy
    var links = document.querySelectorAll("[data-id]");
    var map = {};
    links.forEach(function (a) {
      map[a.getAttribute("data-id")] = map[a.getAttribute("data-id")] || [];
      map[a.getAttribute("data-id")].push(a);
    });
    var ids = [];
    S.nav.forEach(function (g) {
      g.items.forEach(function (it) {
        ids.push(it.id);
      });
    });
    function spy() {
      var y = window.scrollY + 100;
      var cur = ids[0];
      for (var i = 0; i < ids.length; i++) {
        var el = $(ids[i]);
        if (el && el.offsetTop <= y) cur = ids[i];
      }
      document.querySelectorAll(".side a").forEach(function (a) {
        a.classList.toggle("on", a.getAttribute("data-id") === cur);
      });
      document.querySelectorAll(".mnav a").forEach(function (a) {
        var id = a.getAttribute("data-id");
        // match group tops
        var on =
          id === cur ||
          (id === "pg-06" && cur && cur.indexOf("pg-") === 0) ||
          (id === "comp-nav" && cur && cur.indexOf("comp-") === 0) ||
          (id === "sec-color" && (cur === "sec-type" || cur === "sec-shape" || cur === "sec-principles")) ||
          (id === "sec-roadmap" && cur && (cur.indexOf("sec-") === 0 && cur !== "sec-overview" && cur !== "sec-color"));
        if (id === "sec-overview") on = cur === "sec-overview";
        a.classList.toggle("on", !!on);
      });
    }
    window.addEventListener("scroll", spy, { passive: true });
    spy();
  }

  function renderGithub() {
    var el = $("github-box");
    if (!el) return;
    var g = S.github;
    el.innerHTML =
      '<div class="card"><h3><span class="dot"></span>上游最新动态 · ' +
      esc(g.tag) +
      "（" +
      esc(g.updated) +
      '）</h3><p>' +
      esc(g.android) +
      '</p><div class="flist" style="margin-top:12px">' +
      g.highlights
        .map(function (h) {
          return (
            '<div class="fitem"><div class="fi">◆</div><div><div class="ft">' +
            esc(h.t) +
            '</div><div class="fd">' +
            esc(h.d) +
            "</div></div></div>"
          );
        })
        .join("") +
      "</div></div>";
  }

  function renderColors() {
    var el = $("color-groups");
    if (!el) return;
    el.innerHTML = S.colorGroups
      .map(function (g) {
        return (
          '<div class="card"><h3><span class="dot"></span>' +
          esc(g.title) +
          "</h3><p>" +
          esc(g.desc) +
          '</p><div class="swatches" style="margin-top:12px">' +
          g.colors
            .map(function (c) {
              return (
                '<div class="sw"><div class="c" style="background:' +
                c.hex +
                '"></div><div class="m"><b>' +
                esc(c.name) +
                "</b><span>" +
                esc(c.hex) +
                "<br>" +
                esc(c.use) +
                "</span></div></div>"
              );
            })
            .join("") +
          "</div></div>"
        );
      })
      .join("");
  }

  function renderType() {
    var el = $("type-rows");
    if (!el) return;
    el.innerHTML = S.typeScale
      .map(function (t) {
        return (
          '<div class="trow"><div class="sample" style="' +
          t.style +
          '">' +
          esc(t.sample) +
          '</div><div class="spec">' +
          esc(t.label) +
          "<br>" +
          esc(t.size) +
          "sp / " +
          esc(t.weight) +
          " / lh " +
          esc(t.lh) +
          "</div></div>"
        );
      })
      .join("");
  }

  function renderShape() {
    var a = $("shape-rows"),
      b = $("elev-rows");
    if (a) {
      a.innerHTML = S.shape
        .map(function (s) {
          return (
            '<div class="trow"><div class="sample" style="font-family:var(--font-num);font-size:13px;font-weight:650">' +
            esc(s.k) +
            '</div><div class="spec" style="text-align:left;flex:1"><b style="color:var(--ink);font-family:var(--font)">' +
            esc(s.v) +
            "</b><br>" +
            esc(s.n) +
            "</div></div>"
          );
        })
        .join("");
    }
    if (b) {
      b.innerHTML = S.elevation
        .map(function (s) {
          return (
            '<div class="trow"><div class="sample" style="font-family:var(--font-num);font-size:13px;font-weight:650">' +
            esc(s.k) +
            '</div><div class="spec" style="text-align:left;flex:1"><b style="color:var(--ink);font-family:var(--font)">' +
            esc(s.v) +
            "</b><br>" +
            esc(s.n) +
            "</div></div>"
          );
        })
        .join("");
    }
  }

  function renderComponents() {
    var keys = ["comp-nav", "comp-action", "comp-form", "comp-feedback", "comp-data", "comp-float"];
    keys.forEach(function (id) {
      var el = $(id);
      if (!el) return;
      var c = S.components[id];
      if (!c) return;
      el.innerHTML =
        '<div class="sec-head"><div class="sec-num">' +
        id.replace("comp-", "C · ").toUpperCase() +
        "</div><h2>" +
        esc(c.title) +
        '</h2><p class="desc">' +
        esc(c.desc) +
        '</p></div><div class="card"><table class="stable"><thead><tr><th>组件</th><th>规格</th><th>使用位置</th></tr></thead><tbody>' +
        c.items
          .map(function (it) {
            return (
              "<tr><td>" +
              esc(it.name) +
              "</td><td>" +
              esc(it.spec) +
              '</td><td class="mono">' +
              esc(it.use) +
              "</td></tr>"
            );
          })
          .join("") +
        "</tbody></table></div>";
    });
  }

  function wireframe(layers) {
    return (
      '<div class="wf">' +
      layers
        .map(function (l, i) {
          if (l.t.indexOf("底部") === 0 || l.s.indexOf("底部导航") >= 0) {
            return (
              '<div class="wf-block' +
              (l.hl ? " hl" : "") +
              '"><div class="lbl">' +
              (i + 1) +
              " · " +
              esc(l.t) +
              "</div>" +
              esc(l.s) +
              "</div>" +
              '<div class="wf-nav"><i class="on">场景</i><i>地图</i><i>人物</i><i>囊务</i><i>我的</i></div>'
            );
          }
          return (
            '<div class="wf-block' +
            (l.hl ? " hl" : "") +
            '"><div class="lbl">' +
            (i + 1) +
            " · " +
            esc(l.t) +
            "</div>" +
            esc(l.s) +
            "</div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function renderPages() {
    var el = $("page-list");
    if (!el) return;
    el.innerHTML = S.pages
      .map(function (p) {
        return (
          '<article class="page-block" id="' +
          p.id +
          '"><div class="page-block-h"><div class="page-id">' +
          p.code +
          '</div><div><h3>' +
          esc(p.title) +
          '</h3><div class="goal">' +
          esc(p.goal) +
          '</div></div></div><div class="page-body"><div class="page-grid">' +
          wireframe(p.layer) +
          '<div><h4 style="margin:0 0 8px;font-size:12px;letter-spacing:.08em;color:var(--ink-3);font-weight:700">元素规格</h4><table class="stable"><tbody>' +
          p.specs
            .map(function (s) {
              return (
                "<tr><td>" +
                esc(s[0]) +
                "</td><td>" +
                esc(s[1]) +
                "</td><td>" +
                esc(s[2]) +
                "</td></tr>"
              );
            })
            .join("") +
          '</tbody></table><h4 style="margin:14px 0 8px;font-size:12px;letter-spacing:.08em;color:var(--ink-3);font-weight:700">状态变体</h4><div class="states">' +
          p.states
            .map(function (s, i) {
              return '<span class="state-chip' + (i === 0 ? " on" : "") + '">' + esc(s) + "</span>";
            })
            .join("") +
          '</div></div></div><div class="notes" style="margin-top:14px">' +
          p.notes
            .map(function (n, i) {
              return (
                '<div class="note"><div class="nb">' +
                (i + 1) +
                "</div><div><b>" +
                esc(n[0]) +
                "：</b>" +
                esc(n[1]) +
                "</div></div>"
              );
            })
            .join("") +
          '</div><div class="phone-stage" style="margin-top:14px"><div class="phone"><div class="phone-screen"><div class="st-bar"><span>09:41</span><span>●●● 5G ▮</span></div><div class="p-body" id="mock-body-' +
          p.id +
          '"></div><div class="p-foot" id="mock-foot-' +
          p.id +
          '"></div></div></div><div class="screen-caption"><b>' +
          esc(p.title) +
          ' · 效果示意</b><span>当前主题：' +
          esc(curWorld.name) +
          " · 可点击顶部世界观切换配色</span></div></div></div></article>"
        );
      })
      .join("");
  }

  function renderStates() {
    var el = $("state-list");
    if (!el) return;
    el.innerHTML = '<div class="flist">' +
      S.states
        .map(function (s) {
          return (
            '<div class="fitem"><div class="fi">◉</div><div><div class="ft">' +
            esc(s.t) +
            '</div><div class="fd">' +
            esc(s.d) +
            "　<br><span style=\"color:var(--ink-3)\">例：" +
            esc(s.ex) +
            "</span></div></div></div>"
          );
        })
        .join("") +
      "</div>";
  }

  function renderMotion() {
    var el = $("motion-list");
    if (!el) return;
    el.innerHTML = S.motion
      .map(function (m) {
        return (
          '<div class="motion-item"><div class="mv">' +
          esc(m.m) +
          '</div><div class="mc"><b>' +
          esc(m.t) +
          "</b><span>" +
          esc(m.d) +
          "</span></div></div>"
        );
      })
      .join("");
  }

  function renderTech() {
    var el = $("arch-layers");
    if (el) {
      el.innerHTML = S.arch
        .map(function (a) {
          return (
            '<div class="arch-layer"><div class="al-h"><b>' +
            esc(a.name) +
            "</b><span>" +
            esc(a.tag) +
            '</span></div><div class="arch-tags">' +
            a.items.map(function (i) {
              return "<i>" + esc(i) + "</i>";
            }).join("") +
            "</div></div>"
          );
        })
        .join("");
    }
    var p = $("platform-list");
    if (p) {
      p.innerHTML = S.platform
        .map(function (row) {
          return (
            '<div class="fitem"><div class="fi">1</div><div><div class="ft">' +
            esc(row[0]) +
            '</div><div class="fd">' +
            esc(row[1]) +
            "</div></div></div>"
          );
        })
        .join("");
    }
  }

  function renderRoadmap() {
    var el = $("road-list");
    if (!el) return;
    el.innerHTML = S.roadmap
      .map(function (r) {
        return (
          '<div class="road-item"><div class="rail"><div class="pt"></div><div class="ln"></div></div><div class="rc"><div class="ph">' +
          esc(r.ph) +
          "</div><h3>" +
          esc(r.t) +
          "</h3><p>" +
          esc(r.d) +
          "</p><ul>" +
          r.ul.map(function (u) {
            return "<li>" + esc(u) + "</li>";
          }).join("") +
          "</ul></div></div>"
        );
      })
      .join("");
  }

  function renderRepo() {
    var el = $("repo-list");
    if (!el) return;
    var r = S.repo;
    el.innerHTML =
      '<div class="card"><h3><span class="dot"></span>独立项目落地步骤</h3><div class="notes" style="margin-top:10px">' +
      r.steps
        .map(function (s, i) {
          return (
            '<div class="note"><div class="nb">' +
            (i + 1) +
            "</div><div><b>" +
            esc(s.t) +
            "：</b>" +
            esc(s.d) +
            "</div></div>"
          );
        })
        .join("") +
      "</div><p style=\"margin-top:12px\">" +
      esc(r.note) +
      "</p></div>";
  }

  /* ===== phone mockups ===== */
  function mockWelcome(w) {
    return (
      '<div class="m-card" style="background:linear-gradient(150deg,' +
      w.soft +
      ',#fff 70%)"><div class="m-title" style="font-size:15px">地图上的' +
      w.name +
      '世界</div><div class="m-sub">选择你的旅程，AI 即时编织剧情</div><div class="m-btn"><span class="solid">开始旅程</span><span class="ghost">自定义世界</span></div></div>' +
      '<div class="m-sub" style="margin:2px 2px 6px;font-weight:700;color:#5b5e68">世界收藏</div><div class="m-grid">' +
      '<div class="m-tile" style="border:1.5px solid ' +
      w.accent +
      ";background:" +
      w.soft +
      '"><div class="tt">' +
      w.icon +
      " " +
      w.name +
      '</div><div class="ts">' +
      esc(w.level) +
      " · " +
      esc(w.progress) +
      ' · 3 阶</div><div style="margin-top:6px"><span class="m-chip">存档 · 林逸</span></div></div>' +
      '<div class="m-tile"><div class="tt">🌍 其他世界</div><div class="ts">5 个待探索</div></div></div>' +
      '<div class="m-card" style="margin-top:8px"><div class="m-row"><div><div class="m-title" style="font-size:11px">继续上次</div><div class="m-sub">林逸 · ' +
      esc(w.advance) +
      '中期 · 青云坊市</div></div><span class="m-chip">进入</span></div></div>'
    );
  }

  function mockScene(w) {
    return (
      '<div class="m-card" style="padding:10px 12px"><div class="m-row"><div><div class="m-title" style="font-size:12px">青云坊市</div><div class="m-sub">' +
      w.name +
      '界 · 东洲 · 城池</div></div><span class="m-chip">' +
      w.icon +
      " " +
      esc(w.level) +
      '</span></div><div class="m-desc">灵雾在坊市檐角游走，丹香与人声交织。</div><div class="m-btn"><span>🗺 游历</span><span class="ghost">💬 交谈</span><span class="ghost">⚔ 除妖</span><span class="ghost">🔍 搜寻</span></div></div>' +
      '<div class="m-ev"><div class="hd"><span>游历 · 第 3 轮</span><span>●●●</span></div><div class="tx">你踏入青石长街，<span class="hl">一缕剑意</span>自阁楼垂落。白袍客抬眼：「道友，可愿切磋？」</div><div class="m-btn"><span>1. 立刻应战</span><span class="ghost">2. 先探虚实</span><span class="ghost">3. 婉拒离开</span></div><div class="m-input"><div class="box">描述你想做的事…</div><div class="send">发送</div></div></div>' +
      '<div class="m-card" style="padding:10px 12px"><div class="m-row"><div class="m-sub">' +
      esc(w.progress) +
      '</div><div class="m-sub" style="color:' +
      w.accent +
      ';font-weight:700">12,480 / 15,000</div></div><div class="m-bar"><i style="width:83%"></i></div></div>'
    );
  }

  function mockMap(w) {
    return (
      '<div class="m-card" style="padding:10px 12px;border:1.5px solid ' +
      w.accent +
      ";background:" +
      w.soft +
      '"><div class="m-row"><div class="m-title" style="font-size:12px">当前 · 青云坊市</div><span class="m-chip">移动</span></div><div class="m-sub">' +
      w.name +
      '界 · 东洲</div></div><div class="m-card"><div class="m-row"><div class="m-title" style="font-size:12px">' +
      w.icon +
      " " +
      w.name +
      '界</div><span class="m-sub">4 地点</span></div></div><div class="m-list">' +
      '<div class="m-item" style="border:1.5px solid ' +
      w.accent +
      '"><div class="ic">📍</div><div class="tx"><b>青云坊市</b><span>城池 · 当前 · 3 人</span></div></div>' +
      '<div class="m-item"><div class="ic">⛰</div><div class="tx"><b>落霞山</b><span>荒野 · 任务 2</span></div></div>' +
      '<div class="m-item"><div class="ic">🏯</div><div class="tx"><b>剑冢遗迹</b><span>秘境 · 门槛 ' +
      esc(w.level) +
      "</span></div></div>" +
      '<div class="m-item"><div class="ic">🌊</div><div class="tx"><b>沧澜渡</b><span>渡口 · 可远航</span></div></div></div>'
    );
  }

  function mockProfile(w) {
    return (
      '<div class="m-card" style="text-align:center;padding:16px 12px"><div class="m-title" style="font-size:16px">林逸</div><div class="m-sub">' +
      w.name +
      '界旅者</div><div style="margin:8px 0"><span class="m-chip" style="font-size:11px;padding:5px 12px">' +
      w.icon +
      " " +
      esc(w.level) +
      " · 中期</span></div><div class=\"m-bar\"><i style=\"width:83%\"></i></div><div class=\"m-sub\" style=\"margin-top:5px\">" +
      esc(w.progress) +
      ' 12,480 / 15,000</div><div class="m-btn" style="justify-content:center"><span class="solid">' +
      esc(w.advance) +
      '</span></div></div><div class="m-grid">' +
      '<div class="m-tile"><div class="ts">战力</div><div class="tt" style="font-size:16px">9,266</div></div>' +
      '<div class="m-tile"><div class="ts">年龄</div><div class="tt" style="font-size:16px">12 岁</div></div>' +
      '<div class="m-tile"><div class="ts">' +
      esc(w.money) +
      '</div><div class="tt" style="font-size:16px">1,024</div></div>' +
      '<div class="m-tile"><div class="ts">技艺</div><div class="tt" style="font-size:16px">4 项</div></div></div>' +
      '<div class="m-card" style="margin-top:8px"><div class="m-title" style="font-size:11px">重大经历</div><div class="m-desc" style="margin-top:4px">· 12 岁 于青云坊市筑基<br>· 11 岁 拜入外门<br>· 10 岁 故事开始</div></div>'
    );
  }

  function mockGeneric(w, kind) {
    var map = {
      worldDetail:
        '<div class="m-card" style="background:linear-gradient(150deg,' +
        w.soft +
        ',#fff 70%);text-align:center"><div class="m-title" style="font-size:15px">' +
        w.icon +
        " " +
        w.name +
        '世界</div><div class="m-sub">' +
        esc(w.level) +
        " · " +
        esc(w.progress) +
        ' · 6 阶</div></div><div class="m-seg"><div class="on">介绍</div><div>等级表</div><div>地图</div></div><div class="m-card"><div class="m-title" style="font-size:11px">这个世界怎么玩</div><div class="m-desc">行动、对话、自由输入，AI 生成剧情并回写数值。</div></div><div class="m-btn"><span class="solid">进入世界</span><span class="ghost">新开一局</span></div>',
      author:
        '<div class="m-card"><div class="m-title" style="font-size:12px">🛠 自定义世界</div><div class="m-sub">第 2 步 / 共 4 步 · 填写设定</div><div class="m-bar"><i style="width:50%"></i></div></div><div class="m-list"><div class="m-item"><div class="ic">📚</div><div class="tx"><b>从作品生成</b><span>书名 + 设定摘要</span></div></div><div class="m-item"><div class="ic">📄</div><div class="tx"><b>整本小说</b><span>上传 TXT · 抽样考据</span></div></div><div class="m-item"><div class="ic">🌐</div><div class="tx"><b>联网补充设定</b><span>百科 / 设定帖</span></div></div></div><div class="m-card"><div class="m-sub">书名</div><div class="m-input" style="margin-top:4px"><div class="box">凡人修仙传</div></div><div class="m-btn"><span class="solid">下一步 · 生成草稿</span></div></div>',
      api:
        '<div class="m-card"><div class="m-title" style="font-size:12px">协议</div><div class="m-btn"><span class="solid">chat</span><span class="ghost">response</span></div></div><div class="m-card"><div class="m-sub">Base URL</div><div class="m-input"><div class="box">https://api.example.com/v1</div></div><div class="m-sub" style="margin-top:6px">API Key</div><div class="m-input"><div class="box">sk-••••••••••</div><div class="send">显示</div></div><div class="m-btn"><span class="ghost">测试连通</span><span class="ghost">刷新模型列表</span></div></div><div class="m-card"><div class="m-title" style="font-size:11px">安全</div><div class="m-desc">Keystore AES-256-GCM 加密保存；导出存档不含 Key。</div></div>',
      help:
        '<div class="m-card"><div class="m-title" style="font-size:12px">快速开始</div><div class="m-desc">1 选世界 · 2 点行动或自由输入 · 3 观察数值变化</div></div><div class="m-list"><div class="m-item"><div class="ic">❓</div><div class="tx"><b>什么是世界包？</b><span>点开查看</span></div></div><div class="m-item"><div class="ic">❓</div><div class="tx"><b>AI 会犯错吗？</b><span>点开查看</span></div></div><div class="m-item"><div class="ic">❓</div><div class="tx"><b>存档会丢吗？</b><span>点开查看</span></div></div></div>',
      settings:
        '<div class="m-card"><div class="m-title" style="font-size:11px">AI 叙事</div><div class="m-btn"><span class="solid">沉浸</span><span class="ghost">简练</span><span class="ghost">诙谐</span></div></div><div class="m-card"><div class="m-title" style="font-size:11px">模型与 API</div><div class="m-item" style="border:none;padding:8px 0"><div class="ic">🔑</div><div class="tx"><b>已配置 1 个密钥</b><span>chat · gpt-mini</span></div><span class="m-chip">管理</span></div></div><div class="m-card"><div class="m-title" style="font-size:11px">存档</div><div class="m-btn"><span class="ghost">导出 JSON</span><span class="ghost">导入</span><span class="danger">删除本世界</span></div></div>',
      friends:
        '<div class="m-btn" style="margin:0 0 8px"><span class="solid">✨ 结识新同伴</span></div><div class="m-list"><div class="m-item"><div class="ic">👩</div><div class="tx"><b>苏婉儿</b><span>道侣 · 同行 · 好感 82</span></div></div><div class="m-item"><div class="ic">🧔</div><div class="tx"><b>黑风老祖</b><span>仇敌 · 行踪不明 · 好感 -40</span></div></div><div class="m-item"><div class="ic">👴</div><div class="tx"><b>青云道人</b><span>师长 · 落霞山 · 好感 60</span></div></div></div>',
      quests:
        '<div class="m-seg"><div class="on">进行中 3</div><div>已完成</div><div>已失败</div></div><div class="m-item" style="align-items:flex-start;margin-top:8px"><div class="ic">📜</div><div class="tx"><b>除妖 · 黑风寨</b><span>委托人：悬镜司 · 进行中</span><div class="m-desc" style="margin-top:2px">目标：击败黑风三煞<br>奖励：' +
        esc(w.money) +
        '×200</div></div></div><div class="m-item" style="align-items:flex-start"><div class="ic">✅</div><div class="tx"><b>寻药 · 赤芝草</b><span style="color:#00a870">已完成</span></div></div>',
      bag:
        '<div class="m-card" style="padding:8px"><div class="m-btn" style="margin:0"><span class="solid">全部 12</span><span class="ghost">消耗</span><span class="ghost">装备</span><span class="ghost">秘籍</span></div></div><div class="m-list"><div class="m-item"><div class="ic">🧪</div><div class="tx"><b>聚气丹 ×3</b><span>消耗品 · 使用 +' +
        esc(w.progress) +
        ' 50</span></div></div><div class="m-item"><div class="ic">🗡</div><div class="tx"><b>青锋剑</b><span>装备 · 攻击 +12</span></div></div><div class="m-item"><div class="ic">📜</div><div class="tx"><b>吐纳诀</b><span>秘籍 · 未参悟</span></div></div></div>',
      breakthrough:
        '<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px 10px;background:linear-gradient(160deg,' +
        w.soft +
        ',#fff)"><div style="font-size:28px">' +
        w.icon +
        '</div><div class="m-title" style="font-size:18px;margin-top:8px">' +
        esc(w.advance) +
        '成功</div><div style="margin:10px 0"><span class="m-chip" style="font-size:13px;padding:8px 16px">' +
        esc(w.level) +
        ' · 金丹</span></div><div class="m-desc">战力 +2,400　寿限 +80 年</div><div class="m-btn" style="justify-content:center;margin-top:16px"><span class="solid">继续旅程</span></div></div>',
      sheet:
        '<div class="m-card" style="margin-top:120px;border-radius:20px 20px 16px 16px"><div style="width:36px;height:4px;border-radius:4px;background:#ddd;margin:0 auto 10px"></div><div class="m-title" style="font-size:13px">状态</div><div class="m-desc">' +
        esc(w.level) +
        " · 中期　" +
        esc(w.progress) +
        ' 12,480/15,000<br>战力 9,266　' +
        esc(w.money) +
        ' 1,024</div><div class="m-bar"><i style="width:83%"></i></div><div class="m-btn"><span class="solid">查看详情</span><span class="ghost">关闭</span></div></div>',
    };
    return map[kind] || mockWelcome(w);
  }

  function navBar(w, active) {
    var items = [
      ["📍", "场景", "scene"],
      ["🗺", "地图", "map"],
      ["👤", "人物", "profile"],
      ["🎒", "囊务", "bag"],
      ["⚙", "我的", "settings"],
    ];
    return (
      '<div class="nav-bar">' +
      items
        .map(function (it) {
          return (
            '<div class="nav-item' +
            (it[2] === active ? " on" : "") +
            '"><span class="ni">' +
            it[0] +
            "</span>" +
            it[1] +
            "</div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function renderMock() {
    // inline mocks in page blocks
    S.pages.forEach(function (p) {
      var body = $("mock-body-" + p.id);
      var foot = $("mock-foot-" + p.id);
      if (!body) return;
      var kind = p.mock;
      if (kind === "welcome") body.innerHTML = mockWelcome(curWorld);
      else if (kind === "scene") body.innerHTML = mockScene(curWorld);
      else if (kind === "map") body.innerHTML = mockMap(curWorld);
      else if (kind === "profile") body.innerHTML = mockProfile(curWorld);
      else body.innerHTML = mockGeneric(curWorld, kind);

      if (foot) {
        var active = kind === "map" ? "map" : kind === "profile" ? "profile" : kind === "bag" ? "bag" : kind === "settings" ? "settings" : "scene";
        if (kind === "welcome" || kind === "author" || kind === "api" || kind === "help" || kind === "breakthrough" || kind === "sheet") {
          foot.innerHTML =
            '<div class="m-btn" style="justify-content:center;margin:0"><span class="solid">主操作</span><span class="ghost">次操作</span></div>';
        } else if (kind === "worldDetail" || kind === "quests" || kind === "friends") {
          foot.innerHTML = navBar(curWorld, kind === "quests" ? "bag" : "profile");
        } else {
          foot.innerHTML = navBar(curWorld, active);
        }
      }
    });
  }

  function boot() {
    buildThemeBar();
    buildNav();
    renderGithub();
    renderColors();
    renderType();
    renderShape();
    renderComponents();
    renderPages();
    renderStates();
    renderMotion();
    renderTech();
    renderRoadmap();
    renderRepo();
    applyWorldTheme(S.worlds[0]);
    renderMock();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
