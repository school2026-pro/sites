'use strict';
/*
 * スクールライフ完全攻略 — 学校案内の画面描画
 *
 * ・データは assets/data.js の window.SCHOOL_DATA だけを使う（架空のデータは入れない）
 * ・名前や感想などデータ由来の文字列は必ず esc() を通して表示する
 * ・画面は URL のハッシュ（#clubs など）で切り替える
 * ・日課表・校内マップは school-day.js、気になるリストは features.js、検索は search.js が担当
 */

const D = window.SCHOOL_DATA;
const main = document.querySelector('main');
const dialog = document.querySelector('#detail');
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const arrow = '<span class="arrow" aria-hidden="true">→</span>';

const AXES = {
  kindness: ['優しさ', '困ったときに、どんなふうに支えてくれる？'],
  strictness: ['厳しさ', '大切にしていることに、先生の個性が出るかも。'],
  humor: ['面白さ', '思わず笑った授業には、どんな工夫がある？'],
  clarity: ['わかりやすさ', '「なるほど！」と思えた説明を見つけよう。'],
  passion: ['熱血度', '授業にかける熱い思いを、のぞいてみよう。']
};
const axisLabel = (k) => AXES[k][0];

/* ---------- 線画アイコン ---------- */
const DRAWINGS = {
  book: '<path d="M5 10c8-3 14-1 19 3 5-4 11-6 19-3v27c-8-3-14-1-19 3-5-4-11-6-19-3Z"/><path d="M24 13v27M11 18c3-1 5-1 8 1M11 24c3-1 5-1 8 1M29 19c3-2 5-2 8-1M29 25c3-2 5-2 8-1"/>',
  ball: '<circle cx="24" cy="24" r="18"/><path d="M7 18c14-2 23 5 29 19M13 9c3 17 12 23 28 22M8.5 34 34 8.5"/>',
  clipboard: '<path d="M17 9h-6v33h27V9h-7M19 5h10v8H19Z"/><path d="m16 23 3 3 5-6M27 23h6m-17 9 3 3 5-6M27 32h6"/>',
  chat: '<path d="M8 9h32v23H23L12 41v-9H8Z"/><path d="M16 18h16M16 25h10"/>',
  star: '<path d="m24 5 6 12 13 2-10 10 3 14-12-7-12 7 3-14L5 19l13-2Z"/>',
  clock: '<circle cx="24" cy="24" r="18"/><path d="M24 14v10l7 5"/>',
  notebook: '<rect x="10" y="5" width="28" height="38" rx="3"/><path d="M17 14h14M17 22h14M17 30h8M6 12h6M6 20h6M6 28h6M6 36h6"/>',
  compass: '<circle cx="24" cy="24" r="18"/><path d="m30 18-4 9-8 3 4-9Z"/>',
  search: '<circle cx="21" cy="21" r="13"/><path d="m31 31 10 10"/>'
};
const icon = (name, cls = '') =>
  `<svg class="line-icon ${cls}" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${DRAWINGS[name] || DRAWINGS.book}</svg>`;

/* ---------- 共通パーツ ---------- */
const pageHeading = (no, label, title, lead) => `
  <header class="page-heading">
    <p class="eyebrow">${no ? `<span class="chapter-no">${no}</span>` : ''}${label}</p>
    <h1>${title}</h1>
    <p>${lead}</p>
  </header>`;

const emptyState = (title, body, kind = 'book') => `
  <div class="empty-state">
    <span class="stamp" aria-hidden="true">準備中</span>
    ${icon(kind, 'empty-icon')}
    <h2>${title}</h2>
    <p>${body}</p>
  </div>`;

const segmented = (label, items, active, attr) => `
  <div class="segmented" role="group" aria-label="${label}">
    ${items
      .map(
        ({ value, text, count }) =>
          `<button type="button" ${attr}="${esc(value)}" aria-pressed="${value === active}">${esc(text)}${count === undefined ? '' : `<span class="seg-count">${count}</span>`}</button>`
      )
      .join('')}
  </div>`;

const statusNote = (text) => `<p class="status-note"><span class="status-dot" aria-hidden="true"></span>${text}</p>`;

/* ---------- 今日の日課（ホーム） ---------- */
const JP_DAYS = ['日', '月', '火', '水', '木', '金', '土'];
const DAY_KEYS = [null, 'mon', 'tue', 'wed', 'thu', 'fri', null];
let todayTimer = null;

function tokyoNow() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value])
  );
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  return { month: +parts.month, day: +parts.day, weekday, minutes: +parts.hour * 60 + +parts.minute };
}
const toMin = (t) => (/^\d{1,2}:\d{2}$/.test(t || '') ? +t.split(':')[0] * 60 + +t.split(':')[1] : null);
const fmtRange = (r) => `${r.start}${r.end && r.end !== r.start ? '〜' + r.end : ''}`;

// 日課の行に開始・終了（分）を付ける。開始が「ER終了後」のような行は直前の終了時刻から始まるとみなす
function timeline(dayKey) {
  let prevEnd = null;
  return window.CAMPUS_GUIDE.schedule(dayKey).map((r) => {
    const s = toMin(r.start) ?? prevEnd;
    const e = toMin(r.end) ?? s;
    prevEnd = e;
    return { ...r, s, e };
  });
}

function todayHTML() {
  const G = window.CAMPUS_GUIDE;
  if (!G) return '';
  const now = tokyoNow();
  const dateLabel = `${now.month}月${now.day}日（${JP_DAYS[now.weekday]}）`;
  const key = DAY_KEYS[now.weekday];
  const foot = `<a class="text-link" href="#day">一週間の日課表へ ${arrow}</a><p class="today-note">通常日課の場合です。行事・テスト期間・休校日は異なります。</p>`;

  if (!key) {
    const first = timeline('mon')[0];
    return `<p class="eyebrow">今日の日課</p><h2 id="today-title">${dateLabel}</h2>
      <div class="today-now is-off"><span class="today-label">今日は</span><strong>お休み</strong></div>
      <p class="today-next">月曜日は <strong>${esc(first.name)}</strong> ${esc(first.start)} から</p>${foot}`;
  }

  const rows = timeline(key);
  const m = now.minutes;
  const current = rows.find((r) => r.s !== null && r.e > r.s && m >= r.s && m < r.e);
  const next = rows.find((r) => r.s !== null && r.s > m);
  const dayInfo = G.days.find((d) => d[0] === key);
  let block;

  if (current) {
    const pct = Math.round(((m - current.s) / (current.e - current.s)) * 100);
    block = `<div class="today-now"><span class="today-label">いま</span><strong>${esc(current.name)}</strong><span class="today-time">${esc(fmtRange(current))}</span></div>
      <div class="today-progress" role="progressbar" aria-label="${esc(current.name)}の経過" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div>
      <p class="today-rest">終わりまで あと${current.e - m}分</p>`;
  } else if (next && m < rows[0].s) {
    block = `<div class="today-now is-off"><span class="today-label">まもなく</span><strong>${esc(next.name)}</strong><span class="today-time">${esc(next.start)}</span></div>`;
  } else if (next) {
    block = `<div class="today-now is-break"><span class="today-label">いま</span><strong>休み時間</strong><span class="today-time">あと${next.s - m}分</span></div>`;
  } else {
    block = `<div class="today-now is-off"><span class="today-label">今日の日課は</span><strong>おしまい</strong></div><p class="today-rest">おつかれさまでした。</p>`;
  }
  const nextLine = next ? `<p class="today-next">つぎ：<strong>${esc(next.name)}</strong> ${esc(fmtRange(next))}</p>` : '';
  return `<p class="eyebrow">今日の日課${dayInfo ? `<span class="today-kind">${esc(dayInfo[2])}</span>` : ''}</p><h2 id="today-title">${dateLabel}</h2>${block}${nextLine}${foot}`;
}

function startToday() {
  clearInterval(todayTimer);
  const card = $('#today-card');
  if (!card) return;
  card.innerHTML = todayHTML();
  todayTimer = setInterval(() => {
    const c = $('#today-card');
    if (c) c.innerHTML = todayHTML();
    else clearInterval(todayTimer);
  }, 30000);
}

/* ---------- ホーム ---------- */
function home() {
  const clubs = D.clubs || [];
  const sports = clubs.filter((c) => c.category === '運動部').length;
  const culture = clubs.length - sports;
  main.innerHTML = `
    <section class="hero" aria-labelledby="hero-title">
      <div class="content-width hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">岡山大学附属中学校　生徒の探究企画</p>
          <h1 id="hero-title" class="hero-title"><span>知ると、</span><span>学校はもっと<em class="marker">楽しい。</em></span></h1>
          <p class="hero-lead">先生・部活・委員会・毎日の過ごし方。<br class="pc-only">先輩たちの声から、学校生活の「知りたい」を見つけよう。</p>
          <button type="button" class="hero-search" data-open-search>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>
            <span>部活・委員会・教室・ページを探す</span><kbd aria-hidden="true">/</kbd>
          </button>
          <div class="hero-actions">
            <a class="button" href="#teachers">先生図鑑を見る ${arrow}</a>
            <a class="button button-ghost" href="#clubs/quiz">部活診断をはじめる</a>
          </div>
        </div>
        <figure class="hero-figure">
          <img src="assets/campus-refined.svg" width="640" height="230" alt="校舎と木々を描いたイラスト">
          <figcaption class="hand-note">生徒がつくる、<br>学校の攻略ノート。</figcaption>
        </figure>
      </div>
    </section>

    <section class="content-width home-index" aria-label="今日の日課と目的別の入口">
      <div class="today-card" id="today-card"></div>
      <nav class="index-grid" aria-label="目的から探す">
        <a href="#teachers" class="index-card"><span class="index-no">01</span>${icon('book')}<strong>先生を知る</strong><small>図鑑・5つのランキング</small></a>
        <a href="#clubs" class="index-card"><span class="index-no">02</span>${icon('ball')}<strong>居場所を見つける</strong><small>部活動・委員会・診断</small></a>
        <a href="#day" class="index-card"><span class="index-no">03</span>${icon('clock')}<strong>学校の一日を見る</strong><small>日課表・3D校内マップ</small></a>
        <a href="notebook/" class="index-card"><span class="index-no">04</span>${icon('notebook')}<strong>毎日を整える</strong><small>時間割・持ち物・マイ手帳</small></a>
      </nav>
    </section>

    <section class="content-width feature-teachers" aria-labelledby="teacher-title">
      <div class="feature-copy">
        <p class="eyebrow"><span class="chapter-no">01</span>先生図鑑・ランキング</p>
        <h2 id="teacher-title">あの先生の、<br>知らなかった一面。</h2>
        <p>生徒の声から、先生の個性と授業を楽しむコツを見つけよう。優しさも厳しさも、先生の大切な一面です。</p>
        <a class="text-link" href="#teachers">先生図鑑をひらく ${arrow}</a>
      </div>
      <div class="axis-board">
        <p class="hand-note">5つの見方で、先生を探す</p>
        <ul class="axis-grid">
          ${Object.entries(AXES)
            .map(([k, [label, desc]], i) => `<li><a class="axis-card axis-${i}" href="#teachers/rankings/${k}"><strong>${label}</strong><span>${desc}</span></a></li>`)
            .join('')}
        </ul>
      </div>
      ${statusNote('アンケート集計準備中。先生の紹介や生徒の声は、確認後に順次掲載します。')}
    </section>

    <section class="band" aria-labelledby="activities-title">
      <div class="content-width">
        <div class="section-head">
          <p class="eyebrow"><span class="chapter-no">02</span>部活動・委員会</p>
          <h2 id="activities-title">あなたらしい場所、見つけよう。</h2>
          <p>好きなこと、得意なことから。5つの質問に答える診断もあります。</p>
        </div>
        <div class="activity-pair">
          <article class="activity-entry theme-club">
            <p class="entry-count"><b>${clubs.length}</b>の部活動</p>
            <h3>部活動ガイド</h3>
            <p>運動部${sports}・文化部${culture}。活動の様子と先輩の声から探そう。</p>
            <div class="entry-actions"><a class="button" href="#clubs/quiz">部活診断 ${arrow}</a><a class="text-link" href="#clubs">一覧で見る ${arrow}</a></div>
          </article>
          <article class="activity-entry theme-committee">
            <p class="entry-count"><b>${(D.committees || []).length}</b>の委員会</p>
            <h3>委員会ガイド</h3>
            <p>生徒会執行部から選挙管理委員会まで。得意なことが活きる場所を。</p>
            <div class="entry-actions"><a class="button" href="#committees/quiz">委員会診断 ${arrow}</a><a class="text-link" href="#committees">一覧で見る ${arrow}</a></div>
          </article>
        </div>
      </div>
    </section>

    <section class="content-width home-pair" aria-label="生徒の声とマイ手帳">
      <article class="voices-feature">
        <p class="eyebrow"><span class="chapter-no">03</span>学校生活の本音</p>
        <h2>この学校、実際どう？</h2>
        <p>よかったことも、大変だったことも。先輩たちの本音と、新入生へのひとこと。</p>
        <a class="button button-ghost" href="#voices">先輩の声を読む ${arrow}</a>
        <span class="quote-mark" aria-hidden="true">“</span>
      </article>
      <article class="notebook-feature">
        <p class="eyebrow"><span class="chapter-no">04</span>マイ手帳</p>
        <h2>明日の準備まで、<br>ひとつの手帳に。</h2>
        <p>時間割・持ち物・予定・振り返り。ログインして、自分のペースで。</p>
        <a class="button button-marker" href="notebook/">マイ手帳を開く ${arrow}</a>
      </article>
    </section>

    <div class="content-width about-link">
      <span>生徒の声を、どう集めて伝えるか。</span>
      <a class="text-link" href="#about">このサイトについて ${arrow}</a>
    </div>`;
  startToday();
}

/* ---------- 先生図鑑・ランキング ---------- */
function teacherHub(mode = 'directory', selectedAxis = 'kindness') {
  const rankMode = mode === 'rankings';
  const axis = Object.hasOwn(AXES, selectedAxis) ? selectedAxis : 'kindness';
  main.innerHTML = `<div class="content-width inner-page">
    ${pageHeading('01', '先生を知る', '先生図鑑・ランキング', '生徒の声から、先生の個性と授業の楽しみ方を見つけよう。')}
    <nav class="hub-switch" aria-label="先生の探し方">
      <a href="#teachers" ${!rankMode ? 'aria-current="page"' : ''}>${icon('book')}図鑑で探す</a>
      <a href="#teachers/rankings" ${rankMode ? 'aria-current="page"' : ''}>${icon('star')}ランキングで探す</a>
    </nav>
    <section id="teacher-content"></section>
    <aside class="context-note">${icon('compass')}<p>優しさも、厳しさも、先生の一面。5項目はそれぞれの魅力を知るためのもので、総合順位にはまとめません。</p></aside>
  </div>`;
  const area = $('#teacher-content');
  const teachers = D.teachers || [];

  if (!rankMode) {
    area.innerHTML = `<div class="toolbar"><label class="search-field">${icon('search')}<span class="visually-hidden">先生名・教科で検索</span><input type="search" id="teacher-search" placeholder="先生の名前・教科で探す" autocomplete="off"></label></div>
      <p id="teacher-count" class="result-count" role="status"></p><div id="teacher-items"></div>`;
    const update = () => {
      const q = $('#teacher-search').value.trim().toLowerCase();
      const rows = teachers.filter((t) => `${t.name} ${t.subject || ''}`.toLowerCase().includes(q));
      $('#teacher-count').textContent = `${rows.length}人掲載`;
      $('#teacher-items').innerHTML = rows.length
        ? `<div class="card-grid">${rows
            .map(
              (t) => `<article class="activity-card theme-teacher"><button type="button" class="card-main" data-detail="${esc(t.id)}">
                <span class="card-cat">${esc(t.subject || '先生')}</span><h3>${esc(t.name)}</h3>
                ${t.summary ? `<p>${esc(t.summary)}</p>` : ''}<span class="card-more">授業の特徴・先輩の声 ${arrow}</span></button></article>`
            )
            .join('')}</div>`
        : emptyState(q ? '先生が見つかりませんでした' : '先生図鑑、ただいま準備中。', q ? '名前や教科の条件を変えて、もう一度探してみてください。' : 'アンケートを集計し、先生の紹介や授業を楽しむコツを掲載します。');
      bindDetails(rows, 'teacher');
    };
    $('#teacher-search').addEventListener('input', update);
    update();
    return;
  }

  const rows = teachers.filter((t) => Number.isFinite(t.votes?.[axis]) && t.votes[axis] > 0).sort((a, b) => b.votes[axis] - a.votes[axis]);
  const top = rows[0]?.votes[axis] || 1;
  let last = null;
  let rank = 0;
  area.innerHTML = `
    <div class="ranking-intro"><h2>先生の魅力、5つの見方。</h2><p>${esc(AXES[axis][1])}</p></div>
    <nav class="axis-tabs" aria-label="ランキングの項目">${Object.keys(AXES)
      .map((k, i) => `<a href="#teachers/rankings/${k}" class="axis-chip axis-${i}" ${k === axis ? 'aria-current="page"' : ''}>${axisLabel(k)}</a>`)
      .join('')}</nav>
    <h2 class="ranking-title">${axisLabel(axis)}ランキング</h2>
    ${
      rows.length
        ? `<ol class="ranking-list">${rows
            .map((t, i) => {
              if (t.votes[axis] !== last) rank = i + 1;
              last = t.votes[axis];
              return `<li><button type="button" class="ranking-row${rank === 1 ? ' is-top' : ''}" data-detail="${esc(t.id)}">
                <span class="rank-number">${rank}<small>位</small></span>
                <span class="rank-name"><small>${esc(t.subject || '')}</small><strong>${esc(t.name)}</strong></span>
                <span class="rank-bar" aria-hidden="true"><i style="width:${Math.round((t.votes[axis] / top) * 100)}%"></i></span>
                <span class="vote-count">${t.votes[axis]}<small>票</small></span></button></li>`;
            })
            .join('')}</ol>`
        : emptyState('ランキングは集計準備中です。', '回答を整理し、確認後に結果と集計条件を掲載します。', 'star')
    }
    <p class="small ranking-note">各項目で、授業を受けた先生を最大3人選ぶ方式です。同票は同順位。票数は担当生徒数などにも影響され、選ばれなかったことは評価の低さを意味しません。</p>`;
  bindDetails(rows, 'teacher');
}

/* ---------- 部活動・委員会 ---------- */
const activityState = { clubs: { q: '', cat: 'すべて' }, committees: { q: '', cat: 'すべて' } };

function activityCard(x, type) {
  const club = type === 'clubs';
  const theme = club ? (x.category === '文化部' ? 'theme-culture' : 'theme-club') : 'theme-committee';
  return `<article class="activity-card ${theme}">
    <button type="button" class="card-main" data-detail="${esc(x.id)}" aria-label="${esc(x.name)}の紹介を見る">
      ${club ? `<span class="card-cat">${esc(x.category)}</span>` : ''}
      <h3>${esc(x.name)}</h3>
      ${x.summary ? `<p>${esc(x.summary)}</p>` : ''}
      <span class="card-more">詳しく見る ${arrow}</span>
    </button>
    ${window.GuidePlay.saveButton(x.id)}
  </article>`;
}

function activityList(type) {
  const club = type === 'clubs';
  const items = D[type] || [];
  const state = activityState[type];
  main.innerHTML = `<div class="content-width inner-page ${club ? 'theme-club' : 'theme-committee'}">
    ${pageHeading('02', club ? '放課後を楽しむ' : '学校に関わる', club ? '部活動ガイド' : '委員会ガイド', club ? '活動の様子や先輩の声から、気になる部活を探そう。' : 'どんな仕事？ やってみてどう？ 経験した生徒の声を集めます。')}
    <aside class="diagnosis-banner">
      ${icon(club ? 'ball' : 'clipboard')}
      <div><h2>どこから探すか、迷ったら。</h2><p>5つの質問で、興味や好みから候補を探せます。</p></div>
      <a class="button" href="#${type}/quiz">${club ? '部活' : '委員会'}診断をはじめる ${arrow}</a>
    </aside>
    <div class="toolbar">
      <label class="search-field">${icon('search')}<span class="visually-hidden">名前で検索</span><input id="activity-search" type="search" placeholder="${club ? '部活' : '委員会'}の名前で探す" autocomplete="off" value="${esc(state.q)}"></label>
      ${
        club
          ? segmented(
              '部の種類',
              ['すべて', '運動部', '文化部'].map((c) => ({ value: c, text: c, count: c === 'すべて' ? items.length : items.filter((x) => x.category === c).length })),
              state.cat,
              'data-cat'
            )
          : ''
      }
    </div>
    <p id="activity-count" class="result-count" role="status"></p>
    <div id="activity-items"></div>
  </div>`;

  const update = () => {
    const q = state.q.toLowerCase();
    const rows = items.filter((x) => x.name.toLowerCase().includes(q) && (!club || state.cat === 'すべて' || x.category === state.cat));
    const allPending = items.every((x) => !x.summary);
    $('#activity-count').textContent = `${rows.length}件` + (rows.length && allPending ? '　活動内容と先輩の声は、アンケート集計後に掲載します。' : '');
    let html;
    if (!rows.length) {
      html = emptyState('該当する活動がありません。', '検索する言葉や、部の種類を変えてお試しください。', club ? 'ball' : 'clipboard');
    } else if (club && state.cat === 'すべて') {
      html = ['運動部', '文化部']
        .map((cat) => {
          const g = rows.filter((x) => x.category === cat);
          return g.length ? `<section class="card-group"><h2 class="group-title">${cat}<span>${g.length}</span></h2><div class="card-grid">${g.map((x) => activityCard(x, type)).join('')}</div></section>` : '';
        })
        .join('');
    } else {
      html = `<div class="card-grid">${rows.map((x) => activityCard(x, type)).join('')}</div>`;
    }
    $('#activity-items').innerHTML = html;
    bindDetails(rows, type);
    window.GuidePlay.enhance();
  };

  $('#activity-search').addEventListener('input', (e) => {
    state.q = e.target.value.trim();
    update();
  });
  $$('[data-cat]').forEach((b) =>
    b.addEventListener('click', () => {
      state.cat = b.dataset.cat;
      $$('[data-cat]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      update();
    })
  );
  update();
}

/* ---------- 詳細（前後の移動つき） ---------- */
let focusAfterDialog = null;
let detailContext = { list: [], kind: 'clubs', index: 0 };

function bindDetails(list, kind) {
  $$('[data-detail]', main).forEach((button) =>
    button.addEventListener('click', () => {
      const i = list.findIndex((x) => x.id === button.dataset.detail);
      if (i >= 0) showDetail(list, i, kind);
    })
  );
}

function kindOf(item) {
  if ((D.teachers || []).includes(item)) return 'teacher';
  if ((D.clubs || []).includes(item)) return 'clubs';
  return 'committees';
}

function showDetail(list, index, kind) {
  const item = list[index];
  if (!item) return;
  if (!dialog.open) focusAfterDialog = document.activeElement;
  detailContext = { list, kind, index };
  const teacher = kind === 'teacher';
  const label = teacher ? '先生図鑑' : kind === 'clubs' ? '部活動' : '委員会';
  const unit = teacher ? '先生' : kind === 'clubs' ? '部活' : '委員会';
  const section = (title, body) => `<section class="detail-section"><h3>${title}</h3>${body}</section>`;
  const text = (v, fallback) => `<p>${v ? esc(v) : `<span class="muted">${fallback}</span>`}</p>`;

  const votes = teacher
    ? section(
        '5つの項目で見る',
        `<div class="detail-votes">${Object.keys(AXES)
          .map((k) => `<div><span>${axisLabel(k)}</span><strong>${Number.isFinite(item.votes?.[k]) ? `${item.votes[k]}票` : '集計準備中'}</strong></div>`)
          .join('')}</div><p class="small">アンケートで選ばれた票数です。能力の点数ではありません。</p>`
      )
    : '';

  $('#detail-body').innerHTML = `
    <p class="eyebrow">${label}</p>
    <h2 id="detail-title" tabindex="-1">${esc(item.name)}</h2>
    <p class="detail-category">${esc(item.subject || item.category || '委員会')}</p>
    ${section(teacher ? '授業の特徴' : '活動内容', text(item.summary, 'アンケート集計後に掲載します。'))}
    ${
      teacher
        ? section('授業を楽しむコツ', text(item.tips, '先輩の声を集めています。'))
        : section(
            '活動頻度・雰囲気',
            text(item.frequency, '集計準備中です。') + (item.atmosphere?.length ? `<div class="tag-list">${item.atmosphere.map((a) => `<span>${esc(a)}</span>`).join('')}</div>` : '')
          )
    }
    ${votes}
    ${section('先輩の声', item.voices?.length ? item.voices.map((v) => `<blockquote>${esc(v)}</blockquote>`).join('') : '<p class="muted">確認した内容から、順次紹介します。</p>')}
    ${teacher ? '' : `<div class="detail-save">${window.GuidePlay.saveButton(item.id)}<a class="text-link" href="#saved">気になるリストで見比べる ${arrow}</a></div>`}
    ${
      list.length > 1
        ? `<nav class="detail-nav" aria-label="前後の${unit}">
            <button type="button" data-step="-1" ${index === 0 ? 'disabled' : ''}>← 前の${unit}</button>
            <span>${index + 1} / ${list.length}</span>
            <button type="button" data-step="1" ${index === list.length - 1 ? 'disabled' : ''}>次の${unit} →</button>
          </nav>`
        : ''
    }`;
  $$('[data-step]', dialog).forEach((b) =>
    b.addEventListener('click', () => {
      showDetail(detailContext.list, detailContext.index + Number(b.dataset.step), detailContext.kind);
      $('#detail-title').focus({ preventScroll: true });
    })
  );
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  window.GuidePlay.enhance();
}

/* ---------- 診断 ---------- */
let currentQuiz = { type: null, step: 0, answers: [], result: false };

function quizPage(type) {
  const quiz = window.GUIDE_QUIZZES[type];
  if (currentQuiz.type !== type) currentQuiz = { type, step: 0, answers: [], result: false };
  const club = type === 'clubs';
  main.innerHTML = `<div class="content-width inner-page quiz-page ${club ? 'theme-club' : 'theme-committee'}">
    <a class="back-link" href="#${type}">← ${club ? '部活動' : '委員会'}ガイドへ</a>
    ${pageHeading('', '5つの質問で探す', quiz.title, quiz.intro)}
    <section id="quiz-stage" class="quiz-stage" aria-labelledby="quiz-question"></section>
    <p class="quiz-disclaimer">${esc(quiz.caution)}</p>
  </div>`;
  drawQuiz();
}

function drawQuiz(focus = false) {
  const { type, step, answers, result } = currentQuiz;
  const quiz = window.GUIDE_QUIZZES[type];
  const stage = $('#quiz-stage');
  const unit = type === 'clubs' ? '部活' : '委員会';

  if (result) {
    const all = window.scoreGuideQuiz(type, answers, D[type]);
    const cutoff = all.length ? all[Math.min(2, all.length - 1)].score : 0;
    const candidates = all.filter((x) => x.score >= cutoff); // 同点の候補も省略しない
    stage.innerHTML = `
      <div class="quiz-result-heading">${icon('star')}<p class="eyebrow">診断の結果</p>
        <h2 id="quiz-question" tabindex="-1">${candidates.length ? 'こんな活動も、気になるかも。' : 'まずは、一覧からのぞいてみよう。'}</h2>
        <p>${candidates.length ? 'あなたが選んだ興味に重なる活動分野から、候補を紹介します。' : '興味がまだ決まっていなくても大丈夫。いろいろな活動を見比べてみよう。'}</p></div>
      ${
        candidates.length
          ? `<div class="quiz-result-list">${candidates
              .map(
                ({ item, reason }, i) => `<article><span class="result-no">${i + 1}</span><div><span class="card-cat">${esc(item.category || (type === 'committees' ? '委員会' : '部活動'))}</span>
                  <h3>${esc(item.name)}</h3><p>${esc(reason)}</p>
                  <div class="result-save-row"><button class="text-link" type="button" data-detail="${esc(item.id)}">活動の紹介を見る ${arrow}</button>${window.GuidePlay.saveButton(item.id)}</div></div></article>`
              )
              .join('')}</div><p class="small">興味の重なりが多い候補を紹介しています。同じ重なり方の候補は一緒に表示します。</p>`
          : ''
      }
      <div class="quiz-result-actions">
        <a class="button" href="#${type}">すべての${unit}を見る ${arrow}</a>
        <button class="button button-ghost" id="quiz-restart" type="button">もう一度診断する ↻</button>
        <button class="text-link" id="quiz-review" type="button">回答を見直す</button>
      </div>`;
    bindDetails(candidates.map((c) => c.item), type);
    $('#quiz-restart').onclick = () => {
      currentQuiz = { type, step: 0, answers: [], result: false };
      drawQuiz(true);
    };
    $('#quiz-review').onclick = () => {
      currentQuiz.result = false;
      currentQuiz.step = 0;
      drawQuiz(true);
    };
  } else {
    const question = quiz.questions[step];
    const selected = answers[step];
    const total = quiz.questions.length;
    stage.innerHTML = `
      <div class="quiz-progress-label"><span>質問 <strong>${String(step + 1).padStart(2, '0')}</strong></span><span>${step + 1} / ${total}</span></div>
      <div class="quiz-trail" aria-hidden="true">${quiz.questions.map((_, i) => `<span class="${i < step ? 'done' : i === step ? 'current' : ''}">${i < step ? '✓' : i + 1}</span>`).join('')}</div>
      <progress max="${total}" value="${step + 1}" aria-label="診断の進み具合"></progress>
      <h2 id="quiz-question" tabindex="-1">${esc(question.text)}</h2>
      <p class="quiz-hint">いちばん近いものを、ひとつ選んでね。</p>
      <div class="quiz-options" role="group" aria-labelledby="quiz-question">${question.options
        .map((o, i) => `<button type="button" class="quiz-option" data-answer="${i}" aria-pressed="${selected === i}"><span class="option-dot" aria-hidden="true">${selected === i ? '✓' : ''}</span>${esc(o.label)}</button>`)
        .join('')}</div>
      <div class="quiz-controls">
        <button class="text-link" id="quiz-prev" type="button" ${step === 0 ? 'disabled' : ''}>← ひとつ戻る</button>
        <button class="button" id="quiz-next" type="button" ${selected === undefined ? 'disabled' : ''}>${step === total - 1 ? '結果を見る' : '次の質問へ'} ${arrow}</button>
      </div>`;
    $$('[data-answer]').forEach(
      (b) =>
        (b.onclick = () => {
          currentQuiz.answers[step] = Number(b.dataset.answer);
          $$('[data-answer]').forEach((x) => {
            const on = x === b;
            x.setAttribute('aria-pressed', String(on));
            x.querySelector('.option-dot').textContent = on ? '✓' : '';
          });
          $('#quiz-next').disabled = false;
        })
    );
    $('#quiz-next').onclick = () => {
      if (currentQuiz.answers[step] === undefined) return;
      if (step === total - 1) currentQuiz.result = true;
      else currentQuiz.step++;
      drawQuiz(true);
    };
    $('#quiz-prev').onclick = () => {
      if (currentQuiz.step > 0) {
        currentQuiz.step--;
        drawQuiz(true);
      }
    };
  }
  window.GuidePlay.enhance();
  if (focus) {
    $('#quiz-question').focus({ preventScroll: true });
    stage.scrollIntoView({ block: 'start', behavior: 'auto' });
  }
}

/* ---------- 学校生活の本音 ---------- */
function voices() {
  const cats = ['すべて', 'よかったこと', '大変なこと', '改善アイデア', '新入生へ一言'];
  const all = D.voices || [];
  main.innerHTML = `<div class="content-width inner-page">
    ${pageHeading('03', '先輩たちの声', 'この学校、実際どう？', '楽しいことも、大変なことも。学校生活の本音と、新入生へのアドバイス。')}
    ${segmented('声の種類', cats.map((c) => ({ value: c, text: c, count: c === 'すべて' ? all.length : all.filter((v) => v.category === c).length })), 'すべて', 'data-voice')}
    <div id="voice-items"></div>
    <p class="small">個人の感想であり、感じ方は人によって異なります。回答者が特定されないよう、内容を整理して掲載します。</p>
  </div>`;
  const update = (cat) => {
    const rows = all.filter((v) => cat === 'すべて' || v.category === cat);
    $('#voice-items').innerHTML = rows.length
      ? `<div class="voice-grid">${rows.map((v) => `<figure class="voice-card"><figcaption class="card-cat">${esc(v.category)}</figcaption><blockquote><p>${esc(v.text)}</p></blockquote></figure>`).join('')}</div>`
      : emptyState('先輩の声を、集めています。', 'よい意見も、改善してほしいことも。確認した内容から順次紹介します。', 'chat');
    $$('[data-voice]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.voice === cat)));
  };
  $$('[data-voice]').forEach((b) => (b.onclick = () => update(b.dataset.voice)));
  update('すべて');
}

/* ---------- このサイトについて ---------- */
function about() {
  const sections = [
    ['project', '生徒による探究企画です。', '<p>スクールライフ完全攻略は、岡山大学附属中学校の生徒による企画です。学校公式サイトではありません。入学前の不安を減らし、在校生がいつもの学校をもっと楽しめるよう、生徒アンケートから情報をまとめます。</p>'],
    ['status', 'いまは、集計準備中。', '<p>先生の紹介・ランキング・学校生活の本音は、アンケート集計後に掲載します。架空の先生や票数、口コミは載せていません。部活・委員会は名称のみ掲載しており、活動内容や雰囲気を順次追加します。</p>'],
    ['ranking', '先生ランキングの考え方', '<p>項目は「優しさ・厳しさ・面白さ・わかりやすさ・熱血度」の5つ。各項目につき授業を受けた先生を最大3人、順不同で挙げる方式を想定しています。表記ゆれを整理し、同じ回答内で同じ先生を複数回書いても1票として集計します。無回答や「なし」は含めず、同票は同順位です。</p><p>票数は担当する生徒数などにも影響されます。先生の能力そのものを示す点数ではなく、総合順位や5段階評価には換算しません。結果の掲載時には、回答数・集計期間・集計条件も併記します。</p>'],
    ['quiz', '診断と検索について', '<p>5つの質問から、興味のある活動分野と重なる候補を紹介します。部活は競技・活動の種類、委員会は名称と一般的な活動分野をもとにした仕組みです。学校での実際の雰囲気・活動量を判定するものではありません。詳しい活動内容や条件は、紹介や見学を通して確かめてください。</p><p>診断の回答とサイト内検索の言葉は画面内でのみ使用し、サーバーに送信・保存しません。適性を断定したり、一致率を表示したりする仕組みではありません。</p>'],
    ['voices', '本音を、大切に扱います。', '<p>名前・クラスを聞かず、学年のみを尋ねるアンケートを想定しています。掲載する自由記述は、掲載意向を確認したうえで個人が特定されないよう整理します。批判的な意見も、具体的な課題や改善案が伝わる形で扱います。</p><p>先生や学校と掲載内容・公開範囲を確認してから、実際の結果を掲載する方針です。回答が少ない項目は掲載を見合わせる場合があります。</p>'],
    ['access', '公開範囲について', '<p>ログインなしで閲覧できます。リンクは他の人にも転送できます。検索エンジンへの掲載を控える設定は入れていますが、第三者の閲覧や転載を防ぐ機能ではありません。</p>']
  ];
  main.innerHTML = `<div class="content-width inner-page about-page">
    ${pageHeading('05', '企画と掲載の方針', '生徒の声で、学校を知る。', '新入生にも、在校生にも。学校生活の新しい一面が見つかるガイドを目指しています。')}
    <div class="about-layout">
      <nav class="about-toc" aria-label="このページの目次"><p>目次</p>${sections.map(([id, t]) => `<a href="#about" data-jump="${id}">${t}</a>`).join('')}</nav>
      <div class="about-body">${sections.map(([id, t, body]) => `<section id="about-${id}"><h2>${t}</h2>${body}</section>`).join('')}
        <p class="small">最終データ更新：${esc(D.updatedAt || '集計準備中')}</p></div>
    </div>
  </div>`;
  $$('[data-jump]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      $(`#about-${a.dataset.jump}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
    })
  );
}

/* ---------- マイ手帳の案内（旧リンク #planner 用） ---------- */
function plannerPage() {
  main.innerHTML = `<div class="content-width inner-page planner-intro">
    <a class="back-link" href="#home">← ホームへ</a>
    ${pageHeading('04', 'ログインして使う', '今日を整える。<br>明日につなげる。', '時間割も持ち物も、予定も振り返りも、自分だけの手帳に。')}
    <section class="planner-login-card">
      <div>
        <h2>学校生活を、自分のペースで。</h2>
        <p>メールアドレスとパスワードで登録すると、予定と振り返りをアカウントごとに保存できます。スマホでもパソコンでも、同じ記録を続けられます。</p>
        <a class="button button-marker" href="notebook/">マイ手帳を開く・ログイン ${arrow}</a>
        <p class="small">ログイン前に、保存せず操作を試すこともできます。</p>
      </div>
      <ol>
        <li><span>01</span><div><h3>予定を、見渡す。</h3><p>月・週カレンダー、予定とタスクの管理、完了チェック、時刻の重複確認。</p></div></li>
        <li><span>02</span><div><h3>一日を、振り返る。</h3><p>できたこと・つまずき・気づき・次の一歩。登録したタスクの実績も見比べられます。</p></div></li>
        <li><span>03</span><div><h3>明日の行動へ、つなげる。</h3><p>時間割と持ち物を確認し、振り返りから翌日のタスクを作成できます。</p></div></li>
      </ol>
    </section>
    <p class="planner-privacy">学校案内はこれまでどおりログイン不要です。マイ手帳は認証と個人別保存に対応した専用ページで開きます。</p>
  </div>`;
}

/* ---------- メニュー・画面切り替え ---------- */
function closeMenu(returnFocus = false) {
  $('#mobile-menu').hidden = true;
  const toggle = $('#menu-toggle');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'メニューを開く');
  document.body.classList.remove('menu-open');
  if (returnFocus) toggle.focus();
}

const TITLES = {
  planner: 'マイ手帳',
  day: '学校の一日・校内マップ',
  teachers: '先生図鑑・ランキング',
  voices: '学校生活の本音',
  saved: '気になるリスト',
  about: 'このサイトについて'
};

function render() {
  let route = location.hash.slice(1) || 'home';
  if (route === 'main') {
    main.focus();
    return;
  }
  if (route === 'home-activities') route = 'home';
  if (route === 'rankings') route = 'teachers/rankings';
  const [page, mode, axis] = route.split('/');
  const oldPage = document.body.dataset.page;
  closeMenu();
  if (dialog.open) dialog.close();
  clearInterval(todayTimer);
  const known = ['teachers', 'clubs', 'committees', 'voices', 'about', 'day', 'planner', 'saved'];
  const current = known.includes(page) ? page : 'home';
  document.body.dataset.page = current;

  $$('[data-nav]').forEach((a) => (a.dataset.nav === current ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  $$('[data-tab-nav]').forEach((a) => (a.dataset.tabNav.split(' ').includes(current) ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));

  if (current === 'teachers') teacherHub(mode, axis);
  else if (current === 'clubs' || current === 'committees') mode === 'quiz' ? quizPage(current) : activityList(current);
  else if (current === 'voices') voices();
  else if (current === 'about') about();
  else if (current === 'day') window.SchoolDay.render(mode);
  else if (current === 'planner') plannerPage();
  else if (current === 'saved') main.innerHTML = window.GuidePlay.savedPage();
  else home();

  const title =
    current === 'clubs' ? (mode === 'quiz' ? '部活診断' : '部活動ガイド') : current === 'committees' ? (mode === 'quiz' ? '委員会診断' : '委員会ガイド') : TITLES[current];
  document.title = title ? `${title} | スクールライフ完全攻略` : 'スクールライフ完全攻略';
  window.GuidePlay.enhance();
  window.scrollTo({ top: 0, behavior: 'auto' });
  if (oldPage) main.focus({ preventScroll: true });
}

/* ---------- イベント ---------- */
$('#menu-toggle').addEventListener('click', () => {
  const opening = $('#mobile-menu').hidden;
  $('#mobile-menu').hidden = !opening;
  document.body.classList.toggle('menu-open', opening);
  $('#menu-toggle').setAttribute('aria-expanded', String(opening));
  $('#menu-toggle').setAttribute('aria-label', opening ? 'メニューを閉じる' : 'メニューを開く');
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('#mobile-menu').hidden) closeMenu(true);
});
$('#mobile-menu').addEventListener('click', (e) => {
  if (e.target.closest('a')) closeMenu();
});
$('#close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  if (focusAfterDialog?.isConnected) focusAfterDialog.focus();
  focusAfterDialog = null;
});
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) dialog.close();
  if (e.target.closest('.detail-save a')) dialog.close();
});
// 気になるリストの比較表から詳細を開く
document.addEventListener('click', (e) => {
  const button = e.target.closest('.saved-page [data-detail]');
  if (!button) return;
  const item = [...D.clubs, ...D.committees].find((x) => x.id === button.dataset.detail);
  if (item) showDetail([item], 0, kindOf(item));
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('[data-scroll-top]')) return;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  $('.brand').focus({ preventScroll: true });
});
// スクロールしたらヘッダーに影をつける
const header = $('.site-header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

window.GuideApp = {
  // 検索結果から、部活・委員会・先生の詳細を直接開く
  openById(id) {
    for (const kind of ['clubs', 'committees', 'teachers']) {
      const list = D[kind] || [];
      const i = list.findIndex((x) => x.id === id);
      if (i >= 0) return showDetail(list, i, kind === 'teachers' ? 'teacher' : kind);
    }
  }
};

window.addEventListener('hashchange', render);
render();
