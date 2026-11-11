/* 探す楽しさを加える、小さな機能。アンケートの原票や診断回答は保存しません。 */
'use strict';
window.GuidePlay = (() => {
  const data = window.SCHOOL_DATA;
  const all = [...data.clubs, ...data.committees];
  const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const key = 'school-guide-interests-v1';
  const group = id => data.clubs.some(x=>x.id===id) ? 'clubs' : 'committees';
  let ids = [];
  let persistent = true;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    if(Array.isArray(saved)) {
      for(const id of saved) {
        if(typeof id==='string' && all.some(x=>x.id===id) && !ids.includes(id) && ids.filter(x=>group(x)===group(id)).length<3) ids.push(id);
      }
    }
  } catch { persistent=false; }
  let toastTimer;
  let lastPick = null;
  let axisOrder = [];
  const viewpoints = {
    kindness:['優しさ','困ったときに、どんなふうに支えてくれる？'],
    strictness:['厳しさ','大切にしていることに、先生の個性が出るかも。'],
    humor:['面白さ','思わず笑った授業には、どんな工夫がある？'],
    clarity:['わかりやすさ','「なるほど！」と思えた説明を見つけよう。'],
    passion:['熱血度','授業にかける熱い思いを、のぞいてみよう。']
  };
  function notice(text) {
    let box=document.querySelector('#guide-toast');
    if(!box){box=document.createElement('div');box.id='guide-toast';box.className='guide-toast';box.setAttribute('role','status');document.body.append(box);}
    clearTimeout(toastTimer);box.textContent=text;box.classList.add('visible');
    toastTimer=setTimeout(()=>box.classList.remove('visible'),4000);
  }
  function saveButton(id) {
    const item=all.find(x=>x.id===id);
    if(!item)return '';
    const active=ids.includes(id);
    return `<button type="button" class="save-toggle" data-save="${escape(id)}" aria-pressed="${active}" aria-label="${escape(item.name)}を${active?'気になるリストから外す':'気になるリストに追加'}"><span aria-hidden="true">${active?'✓':'＋'}</span>${active?'メモ済み':'気になる'}</button>`;
  }
  function updateControls() {
    document.querySelectorAll('[data-save]').forEach(button=>{
      const id=button.dataset.save,item=all.find(x=>x.id===id);if(!item)return;
      const active=ids.includes(id);button.setAttribute('aria-pressed',String(active));
      button.setAttribute('aria-label',`${item.name}を${active?'気になるリストから外す':'気になるリストに追加'}`);
      button.innerHTML=`<span aria-hidden="true">${active?'✓':'＋'}</span>${active?'メモ済み':'気になる'}`;
    });
    document.querySelectorAll('[data-saved-count]').forEach(el=>el.textContent=String(ids.length));
    let dock=document.querySelector('#saved-dock');
    if(!dock){dock=document.createElement('a');dock.id='saved-dock';dock.className='saved-dock';dock.href='#saved';document.body.append(dock);}
    dock.hidden=ids.length===0 || document.body.dataset.page==='saved';
    dock.innerHTML=`気になるリスト <span>${ids.length}</span> <span aria-hidden="true">→</span>`;
    if(!persistent)document.querySelectorAll('[data-save-note]').forEach(el=>el.textContent='この画面を開いている間だけメモします。');
  }
  function toggle(id) {
    const item=all.find(x=>x.id===id);if(!item)return;
    const type=group(id),active=ids.includes(id);
    if(!active&&ids.filter(x=>group(x)===type).length>=3){notice(`${type==='clubs'?'部活':'委員会'}のメモは3件まで。リストから外すと入れ替えられます。`);return;}
    ids=active?ids.filter(x=>x!==id):[...ids,id];
    try{localStorage.setItem(key,JSON.stringify(ids));}catch{persistent=false;}
    updateControls();notice(`${item.name}を${active?'リストから外しました':'メモしました'}`);
    if(document.body.dataset.page==='saved') {
      document.querySelector('main').innerHTML=savedPage();
      enhance();
      const same=document.querySelector(`[data-save="${CSS.escape(id)}"]`);
      if(same)same.focus();else document.querySelector('#saved-title')?.focus();
    }
  }
  function table(type) {
    const items=data[type].filter(x=>ids.includes(x.id));
    const label=type==='clubs'?'部活':'委員会';
    if(!items.length)return `<div class="saved-empty"><p>まだ${label}のメモはありません。</p><a class="text-link" href="#${type}">${label}を探す →</a></div>`;
    const fields=[['種類',x=>x.category || '委員会'],['活動内容',x=>x.summary || '集計準備中'],['活動頻度',x=>x.frequency || '集計準備中'],['雰囲気',x=>x.atmosphere?.join(' / ') || '集計準備中']];
    return `<div class="compare-scroll" role="region" tabindex="0" aria-label="${label}の比較表。横にスクロールできます"><table class="compare-table"><caption>${label}を見比べる${items.length===1?'（もう1件メモすると並べて見られます）':''}</caption><thead><tr><th scope="col">見比べる項目</th>${items.map(x=>`<th scope="col"><button type="button" class="compare-name" data-detail="${escape(x.id)}">${escape(x.name)} <span aria-hidden="true">↗</span></button></th>`).join('')}</tr></thead><tbody>${fields.map(([title,get])=>`<tr><th scope="row">${title}</th>${items.map(x=>`<td>${escape(get(x))}</td>`).join('')}</tr>`).join('')}<tr><th scope="row">気になるメモ</th>${items.map(x=>`<td>${saveButton(x.id)}</td>`).join('')}</tr></tbody></table></div>`;
  }
  function savedPage() {
    return `<div class="content-width inner-page saved-page"><div class="page-heading"><span class="eyebrow">MY LITTLE LIST</span><h1 id="saved-title" tabindex="-1">気になる活動を、見比べよう。</h1><p>部活も委員会も、それぞれ3件まで。<br>気になった理由を思い出しながら、じっくり選ぼう。</p></div><p class="small" data-save-note>メモはこのブラウザだけに保存します。名前や診断回答は保存しません。</p><section><h2>部活のメモ</h2>${table('clubs')}</section><section><h2>委員会のメモ</h2>${table('committees')}</section><p class="small">活動内容・頻度・雰囲気は、アンケート集計後に順次掲載します。「集計準備中」は活動がないという意味ではありません。</p><div class="saved-return"><a class="button button-outline" href="#clubs">部活をもっと探す →</a><a class="button button-outline" href="#committees">委員会をもっと探す →</a></div></div>`;
  }
  function enhance() {
    updateControls();
    const flip=document.querySelector('#discover-teacher');
    if(flip&&!flip.dataset.bound){flip.dataset.bound='true';flip.onclick=()=>{
      if(!axisOrder.length){axisOrder=Object.keys(viewpoints);for(let i=axisOrder.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[axisOrder[i],axisOrder[j]]=[axisOrder[j],axisOrder[i]];}}
      const axis=axisOrder.shift(),[title,description]=viewpoints[axis];
      const panel=document.querySelector('#teacher-discovery');
      panel.hidden=false;panel.innerHTML=`<span class="eyebrow">こんな見方も、あるかも。</span><h3>${title}</h3><p>${description}</p><a class="text-link" href="#teachers/rankings/${axis}">${title}から先生を探す →</a>`;
      flip.setAttribute('aria-expanded','true');flip.classList.remove('page-turn');void flip.offsetWidth;flip.classList.add('page-turn');
      flip.querySelector('.book-bottom').textContent='もう一度、めくってみる ↻';
    };}
    const toolbar=document.querySelector('#activity-items')?.previousElementSibling;
    if(toolbar&&!document.querySelector('#activity-discovery')) {
      const bar=document.createElement('div');bar.id='activity-discovery';bar.className='activity-discovery';
      bar.innerHTML=`<button class="surprise-button" id="surprise-activity" type="button"><span aria-hidden="true">↝</span>ひとつ、おまかせで見る</button><a class="text-link" href="#saved">気になるリスト <span data-saved-count>${ids.length}</span> →</a>`;
      toolbar.insertAdjacentElement('afterend',bar);
      bar.querySelector('button').onclick=()=>{
        const options=[...document.querySelectorAll('#activity-items [data-detail]')];
        if(!options.length){notice('検索条件を変えると、新しい活動に出会えるかもしれません。');return;}
        const pool=options.length>1?options.filter(x=>x.dataset.detail!==lastPick):options;
        const pick=pool[Math.floor(Math.random()*pool.length)];lastPick=pick.dataset.detail;pick.click();
      };
    }
  }
  document.addEventListener('click',event=>{const button=event.target.closest('[data-save]');if(button)toggle(button.dataset.save);});
  return {enhance,saveButton,savedPage};
})();
