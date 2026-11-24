'use strict';
/*
 * サイト内検索
 * ページ・部活・委員会・先生・日課・教室を、入力に合わせてその場で絞り込む。
 * 検索した言葉はどこにも送信・保存しない。
 * 「/」キー、ヘッダーの「探す」ボタン、ホームの検索欄から開く。
 */
window.SiteSearch = (() => {
  const D = window.SCHOOL_DATA;
  const G = window.CAMPUS_GUIDE;
  const dialog = document.querySelector('#search');
  const input = document.querySelector('#search-input');
  const results = document.querySelector('#search-results');

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  // 全角半角・大文字小文字・カタカナひらがなの違いを無視して比べる
  const norm = (s) =>
    String(s || '')
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
      .replace(/[\s・、。]/g, '');

  // スマホで変換前のひらがなでも見つかるように、漢字の読みを用意する
  const READINGS = {
    野球: 'やきゅう', 陸上競技: 'りくじょうきょうぎ', 陸上: 'りくじょう', 卓球: 'たっきゅう', 剣道: 'けんどう', 科学: 'かがく', 家庭: 'かてい',
    美術: 'びじゅつ', 吹奏楽: 'すいそうがく', 部: 'ぶ', 生徒会執行部: 'せいとかいしっこうぶ', 生徒会: 'せいとかい', 生徒: 'せいと', 委員会: 'いいんかい',
    生活: 'せいかつ', 保健: 'ほけん', 体育: 'たいいく', 環境: 'かんきょう', 図書: 'としょ', 視聴覚: 'しちょうかく', 選挙管理: 'せんきょかんり',
    先生: 'せんせい', 図鑑: 'ずかん', 診断: 'しんだん', 日課表: 'にっかひょう', 日課: 'にっか', 校内: 'こうない', 学校: 'がっこう', 一日: 'いちにち',
    本音: 'ほんね', 手帳: 'てちょう', 時間割: 'じかんわり', 持ち物: 'もちもの', 予鈴: 'よれい', 朝の会: 'あさのかい', 校時: 'こうじ', 昼の時間: 'ひるのじかん',
    清掃: 'せいそう', 帰りの会: 'かえりのかい', 放課後: 'ほうかご', 完全下校: 'かんぜんげこう', 図書室: 'としょしつ', 保健室: 'ほけんしつ', 音楽: 'おんがく',
    理科: 'りか', 技術: 'ぎじゅつ', 購買: 'こうばい', 校長室: 'こうちょうしつ', 教員室: 'きょういんしつ', 職員室: 'しょくいんしつ', 事務室: 'じむしつ',
    体育館: 'たいいくかん', 武道: 'ぶどう', 更衣室: 'こういしつ', 放送室: 'ほうそうしつ', 会議室: 'かいぎしつ', 調理: 'ちょうり', 被服: 'ひふく',
    昇降口: 'しょうこうぐち', 玄関: 'げんかん', 研究室: 'けんきゅうしつ', 国語: 'こくご', 数学: 'すうがく', 英語: 'えいご', 社会: 'しゃかい',
    印刷室: 'いんさつしつ', 多目的: 'たもくてき', 西門: 'にしもん', 南門: 'みなみもん', 教室: 'きょうしつ', 優しさ: 'やさしさ', 厳しさ: 'きびしさ',
    面白さ: 'おもしろさ', 熱血度: 'ねっけつど', 気になる: 'きになる', 部活: 'ぶかつ', 年: 'ねん', 組: 'くみ'
  };
  const READING_KEYS = Object.keys(READINGS).sort((a, b) => b.length - a.length);
  const reading = (s) => {
    let out = String(s || '');
    for (const k of READING_KEYS) out = out.split(k).join(READINGS[k]);
    return norm(out);
  };

  const AXES = { kindness: '優しさ', strictness: '厳しさ', humor: '面白さ', clarity: 'わかりやすさ', passion: '熱血度' };

  function buildIndex() {
    const rows = [];
    const add = (kind, title, href, sub = '', keywords = '', openId = '') =>
      rows.push({ kind, title, href, sub, openId, key: norm(title), yomi: reading(title), extra: norm(`${sub} ${keywords}`) + reading(`${sub} ${keywords}`) });

    [
      ['ホーム', '#home', 'トップページ', 'はじめに'],
      ['先生図鑑', '#teachers', '先生の個性と授業のコツ', '先生 教科 授業'],
      ['先生ランキング', '#teachers/rankings', '5つの見方で先生を知る', 'ランキング 順位'],
      ['部活動ガイド', '#clubs', '運動部9・文化部4', '部活 クラブ'],
      ['部活診断', '#clubs/quiz', '5つの質問で部活を探す', '診断 おすすめ 質問'],
      ['委員会ガイド', '#committees', '10の委員会', '委員会 生徒会'],
      ['委員会診断', '#committees/quiz', '5つの質問で委員会を探す', '診断 おすすめ 質問'],
      ['学校の一日（日課表）', '#day', '月〜金の日課を見比べる', '日課 時間割 時間 チャイム 下校 何時'],
      ['3D校内マップ', '#day/map', '校舎・教室の場所', '地図 マップ 場所 校舎 何階'],
      ['学校生活の本音', '#voices', '先輩たちの声', '声 感想 口コミ 新入生'],
      ['気になるリスト', '#saved', 'メモした部活・委員会を見比べる', 'メモ 比較 保存'],
      ['このサイトについて', '#about', '企画と集計の方針', 'アンケート 集計 方針'],
      ['マイ手帳', 'notebook/', '予定・振り返り・時間割・持ち物（ログイン）', '手帳 予定 カレンダー 持ち物 ログイン'],
    ].forEach(([t, h, s, k]) => add('ページ', t, h, s, k));

    Object.entries(AXES).forEach(([key, label]) => add('ランキング', `${label}ランキング`, `#teachers/rankings/${key}`, '先生ランキング'));
    (D.clubs || []).forEach((c) => add('部活動', c.name, '#clubs', c.category, c.summary, c.id));
    (D.committees || []).forEach((c) => add('委員会', c.name, '#committees', '委員会', c.summary, c.id));
    (D.teachers || []).forEach((t) => add('先生', t.name, '#teachers', t.subject, t.summary, t.id));

    if (G) {
      const seen = new Set();
      G.days.forEach(([day, label]) =>
        G.schedule(day).forEach((r) => {
          if (seen.has(r.name)) return;
          seen.add(r.name);
          add('日課', r.name, '#day', `${label}など ${r.start}${r.end && r.end !== r.start ? '〜' + r.end : ''}`);
        })
      );
      const rooms = new Set();
      G.rooms
        .filter((r) => !['wc', 'stairs', 'elevator'].includes(r.type))
        .forEach((r) => {
          const k = r.name + r.building;
          if (rooms.has(k)) return;
          rooms.add(k);
          add('教室・場所', r.name, `#day/map/${encodeURIComponent(r.id)}`, `${r.building} ${r.floor}階`);
        });
    }
    return rows;
  }

  let index = null;
  const KIND_ORDER = ['ページ', '部活動', '委員会', '先生', 'ランキング', '日課', '教室・場所'];

  function find(q) {
    const n = norm(q);
    if (!n) return [];
    index ||= buildIndex();
    return index
      .map((r) => ({ r, s: r.key.startsWith(n) || r.yomi.startsWith(n) ? 3 : r.key.includes(n) || r.yomi.includes(n) ? 2 : r.extra.includes(n) ? 1 : 0 }))
      .filter((x) => x.s)
      .sort((a, b) => b.s - a.s || KIND_ORDER.indexOf(a.r.kind) - KIND_ORDER.indexOf(b.r.kind))
      .slice(0, 40)
      .map((x) => x.r);
  }

  function highlight(text, q) {
    const n = norm(q);
    const t = String(text);
    // 表示用の文字と比較用の文字を1文字ずつ対応させて、一致部分にマーカーを引く
    const chars = [...t];
    const normed = chars.map((c) => norm(c));
    const joined = normed.join('');
    const at = joined.indexOf(n);
    if (!n || at < 0) return esc(t);
    let pos = 0, start = -1, end = -1;
    chars.forEach((c, i) => {
      if (start < 0 && pos >= at) start = i;
      pos += normed[i].length;
      if (end < 0 && pos >= at + n.length) end = i + 1;
    });
    if (start < 0 || end < 0) return esc(t);
    return esc(chars.slice(0, start).join('')) + '<mark>' + esc(chars.slice(start, end).join('')) + '</mark>' + esc(chars.slice(end).join(''));
  }

  const SUGGEST = ['部活診断', '昼の時間', '図書', '生徒会', '3D校内マップ'];

  function draw() {
    const q = input.value.trim();
    if (!q) {
      results.innerHTML = `<p class="search-hint">たとえば：${SUGGEST.map((s) => `<button type="button" class="search-chip" data-suggest="${esc(s)}">${esc(s)}</button>`).join('')}</p>`;
      return;
    }
    const rows = find(q);
    if (!rows.length) {
      results.innerHTML = `<p class="search-empty">「${esc(q)}」に一致するものが見つかりませんでした。<br>短い言葉や、別の言い方でも探してみてください。</p>`;
      return;
    }
    const groups = KIND_ORDER.map((k) => [k, rows.filter((r) => r.kind === k)]).filter(([, g]) => g.length);
    results.innerHTML =
      `<p class="search-count">${rows.length}件</p>` +
      groups
        .map(
          ([kind, g]) =>
            `<section><h2>${kind}</h2><ul>${g
              .map(
                (r) =>
                  `<li><a href="${esc(r.href)}" data-open-id="${esc(r.openId)}"><span class="search-title">${highlight(r.title, q)}</span>${
                    r.sub ? `<span class="search-sub">${esc(r.sub)}</span>` : ''
                  }</a></li>`
              )
              .join('')}</ul></section>`
        )
        .join('');
  }

  function open(initial = '') {
    if (dialog.open) return;
    input.value = initial;
    draw();
    dialog.showModal();
    input.focus();
    if (initial) input.setSelectionRange(initial.length, initial.length);
  }

  input.addEventListener('input', draw);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      results.querySelector('a')?.click();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      results.querySelector('a')?.focus();
    }
  });
  results.addEventListener('keydown', (e) => {
    if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;
    const links = [...results.querySelectorAll('a')];
    const i = links.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    if (e.key === 'ArrowUp' && i === 0) input.focus();
    else links[Math.max(0, Math.min(links.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))].focus();
  });
  results.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-suggest]');
    if (chip) {
      input.value = chip.dataset.suggest;
      draw();
      input.focus();
      return;
    }
    const link = e.target.closest('a');
    if (!link) return;
    const id = link.dataset.openId;
    dialog.close();
    if (id) {
      e.preventDefault();
      const target = link.getAttribute('href');
      if (location.hash !== target) location.hash = target;
      // 一覧の描画を待ってから詳細を開く
      requestAnimationFrame(() => setTimeout(() => window.GuideApp?.openById(id), 30));
    }
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  document.querySelector('[data-close-search]').addEventListener('click', () => dialog.close());
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-open-search]');
    if (!trigger) return;
    e.preventDefault();
    open(trigger.dataset.query || '');
  });
  document.addEventListener('keydown', (e) => {
    const typing = e.target.closest?.('input, textarea, select, [contenteditable="true"]');
    if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !document.querySelector('dialog[open]')) {
      e.preventDefault();
      open();
    }
  });

  return { open, find };
})();
