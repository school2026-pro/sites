'use strict';
const D = window.SCHOOL_DATA;
const main = document.querySelector('main');
const dialog = document.querySelector('#detail');
const axes = {kindness:'優しさ',strictness:'厳しさ',humor:'面白さ',clarity:'わかりやすさ',passion:'熱血度'};
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrow = '<span aria-hidden="true">→</span>';
const drawings = {
  book:'<path d="M5 10c8-3 14-1 19 3 5-4 11-6 19-3v27c-8-3-14-1-19 3-5-4-11-6-19-3Z"/><path d="M24 13v27M11 17c3-1 5-1 8 1M11 23c3-1 5-1 8 1M29 18c3-2 5-2 8-1M29 24c3-2 5-2 8-1"/>',
  ball:'<circle cx="24" cy="24" r="19"/><path d="M6 18c14-2 23 5 30 20M13 8c3 18 12 24 29 23M8 35 35 8M6 21c10 7 17 4 20-15M22 43c-2-12 5-20 20-21"/>',
  clipboard:'<path d="M17 9h-6v33h27V9h-7M19 5h10v8H19Z"/><path d="m16 23 3 3 5-6M27 23h6m-17 9 3 3 5-6M27 32h6"/>',
  chat:'<path d="M9 9h30v23H23L12 41v-9H9Z"/><path d="M16 17h16M16 24h11"/>',
  star:'<path d="m24 5 6 12 13 2-10 10 3 14-12-7-12 7 3-14L5 19l13-2Z"/>',
  search:'<circle cx="20" cy="20" r="12"/><path d="m29 29 11 11"/>',
  leaf:'<path d="M39 7C17 3 4 19 13 33c13 13 31 1 26-26Z"/><path d="M8 42 32 18M16 34V23M23 27h12"/>'
};
const icon = (name, cls='') => `<svg class="line-icon ${cls}" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawings[name] || drawings.book}</svg>`;
const heading = (label,title,description) => `<div class="page-heading"><span class="eyebrow">${label}</span><h1>${title}</h1><p>${description}</p></div>`;
const empty = (title,description,kind='book') => `<div class="empty-state">${icon(kind)}<h3>${title}</h3><p>${description}</p></div>`;
const chipLinks = () => Object.entries(axes).map(([key,label],i) => `<a class="axis-chip axis-${i}" href="#teachers/rankings/${key}">${label}${arrow}</a>`).join('');
let focusAfterDialog = null;
let currentQuiz = {type:null,step:0,answers:[],result:false};

function home() {
  main.innerHTML = `
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-colors" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="hero-content"><span class="eyebrow">岡山大学附属中学校 / 生徒による探究企画</span><h1 id="hero-title">知ると、<br>学校はもっと楽しい。</h1><p>先生のこと。部活のこと。<br class="mobile-only">先輩たちの本音から。</p><a class="button" href="#teachers">先生図鑑・ランキングを見る ${arrow}</a><a class="hero-sub-link" href="#home-activities">部活・委員会の診断はこちら ↓</a></div>
      <img class="campus" src="assets/campus.svg" width="1440" height="260" alt="校舎や本、運動場を描いた学校生活のイメージイラスト">
    </section>
    <div class="status-note content-width"><span class="status-dot" aria-hidden="true"></span><p>ただいまアンケート集計準備中。先生の紹介や生徒の声は、確認した内容から順次掲載します。</p></div>
    <section class="teacher-feature content-width" aria-labelledby="teacher-feature-title">
      <div class="section-label"><span>01</span>このサイトの、いちばんの見どころ</div>
      <div class="teacher-feature-body"><div class="teacher-feature-copy"><span class="eyebrow">TEACHERS / 先生を知る</span><h2 id="teacher-feature-title">あの先生の、<br>知らなかった一面。</h2><p>いつもの授業の、ちょっと先へ。<br>先生の個性も、授業を楽しむコツも。<br>図鑑と5つのランキングから見つけよう。</p><div class="feature-actions"><a class="button" href="#teachers">先生図鑑をひらく ${arrow}</a><a class="text-link" href="#teachers/rankings">ランキングから探す ${arrow}</a></div></div>
      <div class="teacher-feature-visual"><div class="feature-book" aria-hidden="true"><div class="book-heading">先生の魅力、<br><strong>5つの見方。</strong></div>${icon('book')}<span class="book-bottom">ひとつの順位では、語れない。</span></div><div class="axis-links" aria-label="ランキングの項目から探す">${chipLinks()}</div></div></div>
    </section>
    <section class="activities-section content-width" id="home-activities" aria-labelledby="activities-title"><div class="section-heading"><span class="eyebrow">FIND YOUR PLACE</span><h2 id="activities-title">あなたに合う活動を、<br class="mobile-only">見つけよう。</h2><p>一覧からじっくり探す？ 診断から出会ってみる？</p></div>
      <div class="activity-pair">${activityEntry('clubs')}${activityEntry('committees')}</div>
    </section>
    <section class="voices-feature content-width"><div class="voice-decoration" aria-hidden="true">${icon('chat')}</div><div><span class="eyebrow">STUDENT VOICES</span><h2>この学校、実際どう？</h2><p>よかったことも、大変だったことも。<br>学校生活の本音と、新入生へのひとこと。</p></div><a class="button button-outline" href="#voices">先輩の声を読む ${arrow}</a></section>
    <div class="about-link content-width"><span>生徒の声を、どう集めて伝えるか。</span><a href="#about">このサイトについて ${arrow}</a></div>`;
}

function activityEntry(type) {
  const club = type === 'clubs';
  return `<article class="activity-entry ${club?'club-theme':'committee-theme'}"><div class="activity-entry-top">${icon(club?'ball':'clipboard')}<div><h3>${club?'部活動ガイド':'委員会ガイド'}</h3><p>${club?'好きなことから、自分に合う部活を探そう。':'得意なことから、活躍できる場所を探そう。'}</p></div></div><div class="activity-entry-actions"><a class="button button-outline" href="#${type}">${club?'部活':'委員会'}を一覧で見る ${arrow}</a><a class="button" href="#${type}/quiz">${club?'部活':'委員会'}診断をはじめる ${arrow}</a></div></article>`;
}

function teacherHub(mode='directory', selectedAxis='kindness') {
  const rankMode = mode === 'rankings';
  const axis = Object.hasOwn(axes,selectedAxis) ? selectedAxis : 'kindness';
  main.innerHTML = `<div class="content-width inner-page">${heading('TEACHERS / 先生を知る','先生図鑑・ランキング','生徒の声から、先生の個性と授業の楽しみ方を見つけよう。')}<div class="hub-switch" aria-label="先生の探し方"><a href="#teachers" ${!rankMode?'aria-current="page"':''}>${icon('book')}図鑑で探す</a><a href="#teachers/rankings" ${rankMode?'aria-current="page"':''}>${icon('star')}ランキングで探す</a></div><section id="teacher-content"></section><aside class="context-note">${icon('leaf')}<p>優しさも、厳しさも、先生の一面。5項目はそれぞれの魅力を知るためのものです。総合順位にはまとめません。</p></aside></div>`;
  const area = document.querySelector('#teacher-content');
  if (!rankMode) {
    area.innerHTML = `<div class="toolbar"><label class="search-field">${icon('search')}<input type="search" id="teacher-search" aria-label="先生名・教科で検索" placeholder="先生の名前・教科で探す"></label></div><p id="teacher-count" class="result-count" role="status"></p><div id="teacher-items"></div>`;
    const update = () => {
      const query = document.querySelector('#teacher-search').value.trim().toLowerCase();
      const rows = D.teachers.filter(t => `${t.name} ${t.subject || ''}`.toLowerCase().includes(query));
      document.querySelector('#teacher-count').textContent = `${rows.length}人掲載`;
      document.querySelector('#teacher-items').innerHTML = rows.length ? `<div class="directory-grid">${rows.map(t=>`<button class="teacher-card" type="button" data-detail="${esc(t.id)}"><span class="teacher-avatar">${icon('book')}</span><span class="category-label">${esc(t.subject || '先生')}</span><h3>${esc(t.name)}</h3><p>${esc(t.summary || '紹介は準備中です。')}</p><span class="card-link">授業の特徴・先輩の声を見る ${arrow}</span></button>`).join('')}</div>` : empty(query?'先生が見つかりませんでした':'先生図鑑、ただいま準備中。',query?'名前や教科の条件を変えて、もう一度探してみてください。':'アンケートを集計し、先生の紹介や授業を楽しむコツを掲載します。');
      bindDetails(D.teachers);
    };
    document.querySelector('#teacher-search').addEventListener('input',update);
    update();
  } else {
    const rows = D.teachers.filter(t=>Number.isFinite(t.votes?.[axis]) && t.votes[axis]>0).sort((a,b)=>b.votes[axis]-a.votes[axis]);
    let last = null, rank = 0;
    area.innerHTML = `<div class="ranking-intro"><h2>先生の魅力、5つの見方。</h2><p>気になる項目から、先生の新しい一面を。</p></div><div class="axis-tabs" aria-label="ランキングの項目">${Object.entries(axes).map(([key,label],i)=>`<a href="#teachers/rankings/${key}" class="axis-chip axis-${i}" ${key===axis?'aria-current="page"':''}>${label}</a>`).join('')}</div><h3 class="ranking-title">${axes[axis]}ランキング</h3>${rows.length?`<div class="ranking-list">${rows.map((t,i)=>{if(t.votes[axis]!==last)rank=i+1;last=t.votes[axis];return `<button type="button" class="ranking-row" data-detail="${esc(t.id)}"><span class="rank-number">${rank}<small>位</small></span><span class="rank-name"><small>${esc(t.subject || '')}</small><strong>${esc(t.name)}</strong></span><span class="vote-count">${t.votes[axis]}<small>票</small></span>${arrow}</button>`;}).join('')}</div>`:empty('ランキングは集計準備中です。','回答を整理し、確認後に結果と集計条件を掲載します。','star')}<p class="small ranking-note">各項目で授業を受けた先生を最大3人選ぶ方式です。同票は同順位。票数は担当生徒数などにも影響され、選ばれなかったことは評価の低さを意味しません。</p>`;
    bindDetails(D.teachers);
  }
}

function activityList(type) {
  const club = type === 'clubs';
  const items = D[type];
  main.innerHTML = `<div class="content-width inner-page ${club?'club-theme':'committee-theme'}">${heading(club?'CLUBS / 放課後を楽しむ':'COMMITTEES / 学校に関わる',club?'部活動ガイド':'委員会ガイド',club?'活動の様子や先輩の声から、気になる部活を探そう。':'どんな仕事？ やってみてどう？ 経験した生徒の声を集めます。')}<aside class="diagnosis-banner">${icon(club?'ball':'clipboard')}<div><h2>どこから探すか、迷ったら。</h2><p>5つの質問で、興味や好みから候補を探せます。</p></div><a class="button" href="#${type}/quiz">${club?'部活':'委員会'}診断をはじめる ${arrow}</a></aside><div class="toolbar"><label class="search-field">${icon('search')}<input id="activity-search" type="search" aria-label="名前で検索" placeholder="${club?'部活':'委員会'}の名前で探す"></label>${club?'<label class="select-field"><span>部の種類</span><select id="category"><option value="すべて">すべて</option><option value="運動部">運動部</option><option value="文化部">文化部</option></select></label>':''}</div><p id="activity-count" class="result-count" role="status"></p><div id="activity-items"></div></div>`;
  const update = () => {
    const query = document.querySelector('#activity-search').value.trim().toLowerCase();
    const category = document.querySelector('#category')?.value;
    const rows = items.filter(x => x.name.toLowerCase().includes(query) && (!category || category==='すべて' || x.category===category));
    document.querySelector('#activity-count').textContent = `${rows.length}件`;
    document.querySelector('#activity-items').innerHTML = rows.length ? `<div class="directory-grid">${rows.map((x,i)=>`<button type="button" class="activity-card" data-detail="${esc(x.id)}"><span class="activity-card-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><span class="category-label">${esc(x.category || '委員会')}</span><h3>${esc(x.name)}</h3><p>${esc(x.summary || '活動内容・先輩の声は集計準備中です。')}</p><span class="card-link">詳しく見る ${arrow}</span></button>`).join('')}</div>` : empty('該当する活動がありません。','検索条件を変えてお試しください。',club?'ball':'clipboard');
    bindDetails(items);
  };
  document.querySelector('#activity-search').addEventListener('input',update);
  document.querySelector('#category')?.addEventListener('change',update);
  update();
}

function bindDetails(items) {
  document.querySelectorAll('[data-detail]').forEach(button => button.addEventListener('click',()=> {
    const item = items.find(x=>x.id===button.dataset.detail);
    if (item) showDetail(item,D.teachers.includes(item));
  }));
}

function showDetail(item,teacher=false) {
  focusAfterDialog = document.activeElement;
  const votes = teacher ? `<section class="detail-section"><h3>5つの項目で見る</h3><div class="detail-votes">${Object.entries(axes).map(([key,label])=>`<div><span>${label}</span><strong>${Number.isFinite(item.votes?.[key])?`${item.votes[key]}票`:'集計準備中'}</strong></div>`).join('')}</div><p class="small">アンケートで選ばれた票数です。能力の点数ではありません。</p></section>` : '';
  document.querySelector('#detail-body').innerHTML = `<span class="eyebrow">${teacher?'TEACHERS':item.category?'CLUBS':'COMMITTEES'}</span><h2 id="detail-title">${esc(item.name)}</h2><p class="detail-category">${esc(item.subject || item.category || '委員会')}</p><section class="detail-section"><h3>${teacher?'授業の特徴':'活動内容'}</h3><p>${esc(item.summary || 'アンケート集計後に掲載します。')}</p></section>${teacher?`<section class="detail-section"><h3>授業を楽しむコツ</h3><p>${esc(item.tips || '先輩の声を集めています。')}</p></section>`:`<section class="detail-section"><h3>活動頻度・雰囲気</h3><p>${esc(item.frequency || '集計準備中です。')}</p>${item.atmosphere?.length?`<div class="tag-list">${item.atmosphere.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:''}</section>`}${votes}<section class="detail-section"><h3>先輩の声</h3>${item.voices?.length?item.voices.map(text=>`<blockquote>${esc(text)}</blockquote>`).join(''):'<p>確認した内容から、順次紹介します。</p>'}</section>`;
  dialog.showModal();
}

function quizPage(type) {
  const quiz = window.GUIDE_QUIZZES[type];
  if (currentQuiz.type !== type) currentQuiz = {type,step:0,answers:[],result:false};
  const club = type === 'clubs';
  main.innerHTML = `<div class="content-width inner-page quiz-page ${club?'club-theme':'committee-theme'}"><a class="back-link" href="#${type}">← ${club?'部活動':'委員会'}ガイドへ</a>${heading(club?'CLUB FINDER':'COMMITTEE FINDER',quiz.title,quiz.intro)}<section id="quiz-stage" class="quiz-stage" aria-labelledby="quiz-question"></section><p class="quiz-disclaimer">${esc(quiz.caution)}</p></div>`;
  drawQuiz();
}

function drawQuiz(focus=false) {
  const {type,step,answers,result} = currentQuiz;
  const quiz = window.GUIDE_QUIZZES[type];
  const stage = document.querySelector('#quiz-stage');
  if (result) {
    const all = window.scoreGuideQuiz(type,answers,D[type]);
    const cutoff = all.length ? all[Math.min(2,all.length-1)].score : 0;
    const candidates = all.filter(x=>x.score>=cutoff); // 同点の候補も省略しない
    stage.innerHTML = `<div class="quiz-result-heading">${icon('leaf')}<span class="eyebrow">YOUR NEXT DISCOVERY</span><h2 id="quiz-question" tabindex="-1">${candidates.length?'こんな活動も、気になるかも。':'まずは、一覧からのぞいてみよう。'}</h2><p>${candidates.length?'あなたが選んだ興味に重なる活動分野から、候補を紹介します。':'興味がまだ決まっていなくても大丈夫。いろいろな活動を見比べてみよう。'}</p></div>${candidates.length?`<div class="quiz-result-list">${candidates.map(({item,reason})=>`<article><span class="category-label">${esc(item.category || (type==='committees'?'委員会':'部活動'))}</span><h3>${esc(item.name)}</h3><p>${esc(reason)}</p><button class="text-link" type="button" data-detail="${esc(item.id)}">活動の紹介を見る ${arrow}</button></article>`).join('')}</div><p class="small">興味の重なりが多い候補を紹介しています。同じ重なり方の候補は一緒に表示します。</p>`:''}<div class="quiz-result-actions"><a class="button" href="#${type}">すべての${type==='clubs'?'部活':'委員会'}を見る ${arrow}</a><button class="button button-outline" id="quiz-restart" type="button">もう一度診断する ↻</button><button class="text-link" id="quiz-review" type="button">回答を見直す</button></div>`;
    bindDetails(D[type]);
    document.querySelector('#quiz-restart').onclick = () => { currentQuiz={type,step:0,answers:[],result:false};drawQuiz(true); };
    document.querySelector('#quiz-review').onclick = () => {currentQuiz.result=false;currentQuiz.step=0;drawQuiz(true);};
  } else {
    const question = quiz.questions[step];
    const selected = answers[step];
    stage.innerHTML = `<div class="quiz-progress-label"><span>QUESTION <strong>${String(step+1).padStart(2,'0')}</strong></span><span>${step+1} / ${quiz.questions.length}</span></div><progress max="${quiz.questions.length}" value="${step+1}" aria-label="診断の進み具合"></progress><h2 id="quiz-question" tabindex="-1">${esc(question.text)}</h2><p class="quiz-hint">いちばん近いものを、ひとつ選んでね。</p><div class="quiz-options" role="group" aria-labelledby="quiz-question">${question.options.map((option,index)=>`<button type="button" class="quiz-option" data-answer="${index}" aria-pressed="${selected===index}"><span class="option-dot" aria-hidden="true">${selected===index?'✓':''}</span>${esc(option.label)}</button>`).join('')}</div><div class="quiz-controls"><button class="text-link" id="quiz-prev" type="button" ${step===0?'disabled':''}>← ひとつ戻る</button><button class="button" id="quiz-next" type="button" ${selected===undefined?'disabled':''}>${step===quiz.questions.length-1?'結果を見る':'次の質問へ'} ${arrow}</button></div>`;
    document.querySelectorAll('[data-answer]').forEach(button=>button.onclick=()=> {
      currentQuiz.answers[step]=Number(button.dataset.answer);
      document.querySelectorAll('[data-answer]').forEach(b=>{const active=b===button;b.setAttribute('aria-pressed',String(active));b.querySelector('.option-dot').textContent=active?'✓':'';});
      document.querySelector('#quiz-next').disabled=false;
    });
    document.querySelector('#quiz-next').onclick=()=>{if(currentQuiz.answers[step]===undefined)return;if(step===quiz.questions.length-1)currentQuiz.result=true;else currentQuiz.step++;drawQuiz(true);};
    document.querySelector('#quiz-prev').onclick=()=>{if(currentQuiz.step>0){currentQuiz.step--;drawQuiz(true);}};
  }
  if(focus){document.querySelector('#quiz-question').focus({preventScroll:true});stage.scrollIntoView({block:'start',behavior:'auto'});}
}

function voices() {
  const categories = ['すべて','よかったこと','大変なこと','改善アイデア','新入生へ一言'];
  main.innerHTML = `<div class="content-width inner-page">${heading('STUDENT VOICES / 先輩たちの声','この学校、実際どう？','楽しいことも、大変なことも。学校生活の本音と、新入生へのアドバイス。')}<div class="voice-tabs" role="group" aria-label="声のカテゴリー">${categories.map((label,i)=>`<button type="button" data-voice="${esc(label)}" aria-pressed="${i===0}">${label}</button>`).join('')}</div><div id="voice-items"></div><p class="small">個人の感想であり、感じ方は人によって異なります。回答者が特定されないよう、内容を整理して掲載します。</p></div>`;
  const update = category => {
    const rows = D.voices.filter(x=>category==='すべて'||x.category===category);
    document.querySelector('#voice-items').innerHTML = rows.length ? `<div class="voice-grid">${rows.map(x=>`<article class="voice-card"><span class="category-label">${esc(x.category)}</span>${icon('chat')}<p>${esc(x.text)}</p></article>`).join('')}</div>` : empty('先輩の声を、集めています。','よい意見も、改善してほしいことも。確認した内容から順次紹介します。','chat');
    document.querySelectorAll('[data-voice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.voice===category)));
  };
  document.querySelectorAll('[data-voice]').forEach(button=>button.onclick=()=>update(button.dataset.voice));
  update('すべて');
}

function about() {
  main.innerHTML = `<div class="content-width inner-page about-page">${heading('ABOUT / このサイトについて','生徒の声で、学校を知る。','新入生にも、在校生にも。学校生活の新しい一面が見つかるガイドを目指しています。')}<section><h2>生徒による探究企画です。</h2><p>スクールライフ完全攻略は、岡山大学附属中学校の生徒による企画です。学校公式サイトではありません。入学前の不安を減らし、在校生がいつもの学校をもっと楽しめるよう、生徒アンケートから情報をまとめます。</p></section><section><h2>いまは、集計準備中。</h2><p>先生の紹介・ランキング・学校生活の本音は、アンケート集計後に掲載します。架空の先生や票数、口コミは載せていません。部活・委員会は名称のみ掲載しており、活動内容や雰囲気を順次追加します。</p></section><section><h2>先生ランキングの考え方</h2><p>項目は「優しさ・厳しさ・面白さ・わかりやすさ・熱血度」の5つ。各項目につき授業を受けた先生を最大3人、順不同で挙げる方式を想定しています。表記ゆれを整理し、同じ回答内で同じ先生を複数回書いても1票として集計します。無回答や「なし」は含めず、同票は同順位です。</p><p>票数は担当する生徒数などにも影響されます。先生の能力そのものを示す点数ではなく、総合順位や5段階評価には換算しません。結果の掲載時には、回答数・集計期間・集計条件も併記します。</p></section><section><h2>部活・委員会の診断について</h2><p>5つの質問から、興味のある活動分野と重なる候補を紹介します。部活は競技・活動の種類、委員会は名称と一般的な活動分野をもとにした仕組みです。学校での実際の雰囲気・活動量を判定するものではありません。詳しい活動内容や条件は、紹介や見学を通して確かめてください。</p><p>診断の回答は画面内でのみ使用し、サーバーに送信・保存しません。適性を断定したり、一致率を表示したりする仕組みではありません。</p></section><section><h2>本音を、大切に扱います。</h2><p>名前・クラスを聞かず、学年のみを尋ねるアンケートを想定しています。掲載する自由記述は、掲載意向を確認したうえで個人が特定されないよう整理します。批判的な意見も、具体的な課題や改善案が伝わる形で扱います。</p><p>先生や学校と掲載内容・公開範囲を確認してから、実際の結果を掲載する方針です。回答が少ない項目は掲載を見合わせる場合があります。</p></section><section><h2>公開範囲について</h2><p>ログインなしで閲覧できます。リンクは他の人にも転送できます。検索エンジンへの掲載を控える設定は入れていますが、第三者の閲覧や転載を防ぐ機能ではありません。</p></section><p class="small">最終データ更新：${esc(D.updatedAt || '集計準備中')}</p></div>`;
}

function closeMenu(returnFocus=false) {
  document.querySelector('#mobile-menu').hidden=true;
  const toggle=document.querySelector('#menu-toggle');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','メニューを開く');
  if(returnFocus)toggle.focus();
}

function render() {
  let route = location.hash.slice(1) || 'home';
  if(route==='main'){main.focus();return;}
  if(route==='home-activities'){if(document.body.dataset.page!=='home')home();document.body.dataset.page='home';closeMenu();document.querySelectorAll('[data-nav]').forEach(a=>a.removeAttribute('aria-current'));document.title='ホーム | スクールライフ完全攻略';if(dialog.open)dialog.close();document.querySelector('#home-activities')?.scrollIntoView();return;}
  if(route==='rankings')route='teachers/rankings';
  const [page,mode,axis]=route.split('/');
  closeMenu();if(dialog.open)dialog.close();
  const oldPage = document.body.dataset.page;
  document.body.dataset.page=page;
  document.querySelectorAll('[data-nav]').forEach(a=>{if(a.dataset.nav===page)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  if(page==='teachers')teacherHub(mode,axis);
  else if(page==='clubs'||page==='committees'){if(mode==='quiz')quizPage(page);else activityList(page);}
  else if(page==='voices')voices();
  else if(page==='about')about();
  else home();
  const titles={teachers:'先生図鑑・ランキング',clubs:mode==='quiz'?'部活診断':'部活動ガイド',committees:mode==='quiz'?'委員会診断':'委員会ガイド',voices:'学校生活の本音',about:'このサイトについて'};
  document.title=`${titles[page]||'ホーム'} | スクールライフ完全攻略`;
  if(oldPage)main.focus({preventScroll:true});
  window.scrollTo({top:0,behavior:'auto'});
}

document.querySelector('#menu-toggle').onclick=()=>{const open=document.querySelector('#mobile-menu').hidden;document.querySelector('#mobile-menu').hidden=!open;document.querySelector('#menu-toggle').setAttribute('aria-expanded',String(open));document.querySelector('#menu-toggle').setAttribute('aria-label',open?'メニューを閉じる':'メニューを開く');};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('#mobile-menu').hidden)closeMenu(true);});
document.querySelector('#mobile-menu').addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.querySelector('#close').onclick=()=>dialog.close();
dialog.addEventListener('close',()=>{if(focusAfterDialog?.isConnected)focusAfterDialog.focus();focusAfterDialog=null;});
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
window.addEventListener('hashchange',render);
render();
