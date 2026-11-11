/* 診断用の一般的な活動分野。学校の実際の雰囲気・活動量を示すデータではありません。 */
'use strict';
window.GUIDE_QUIZZES = {
  clubs: {
    title: '部活診断', intro: '「好き」「やってみたい」から、気になる部活を見つけよう。',
    caution: '競技・活動の種類をもとにした、部活探しのヒントです。実際の雰囲気や活動日数は、各部の紹介や見学で確かめてみてください。',
    questions: [
      { text: '放課後、どんなことに夢中になりたい？', options: [
        { label: '体を動かすこと', tags: ['sport'] }, { label: '何かをつくること', tags: ['craft', 'art'] },
        { label: '不思議なことを調べること', tags: ['research'] }, { label: '音楽を楽しむこと', tags: ['music'] }, { label: 'まだ決まっていない', tags: [] }
      ] },
      { text: 'やってみたい場面を選ぶなら？', options: [
        { label: '仲間とパスをつないで、得点！', tags: ['team', 'ball'] }, { label: '自分の記録や技に挑戦！', tags: ['individual', 'skill'] },
        { label: 'アイデアを形にして、作品づくり！', tags: ['craft', 'art'] }, { label: '音を重ねて、一つの演奏に！', tags: ['music', 'team'] },
        { label: '観察や実験で、新しい発見！', tags: ['research'] }, { label: 'どれも気になる', tags: [] }
      ] },
      { text: '気になる道具は？', options: [
        { label: 'ボール・バット・グローブ', tags: ['ball'] }, { label: 'ラケット', tags: ['racket'] }, { label: '竹刀・防具', tags: ['martial'] },
        { label: '画材・調理道具・裁縫道具', tags: ['art', 'craft'] }, { label: '楽器・実験器具', tags: ['music', 'research'] }, { label: '道具より、自分の体で挑戦したい', tags: ['track'] }, { label: '道具はまだ決めていない', tags: [] }
      ] },
      { text: '「できた！」と感じたいのは？', options: [
        { label: 'チームで息の合ったプレーができたとき', tags: ['team', 'sport'] }, { label: '前より速く、正確にできたとき', tags: ['individual', 'skill'] },
        { label: '自分らしい表現ができたとき', tags: ['art', 'music'] }, { label: '工夫したものが完成したとき', tags: ['craft', 'research'] }, { label: 'どれも大切', tags: [] }
      ] },
      { text: 'いま、一番やってみたいことは？', options: [
        { label: '走る・跳ぶ・投げる', tags: ['track', 'sport'] }, { label: 'ボールやシャトルを打ち合う', tags: ['racket', 'skill'] },
        { label: 'チームスポーツを楽しむ', tags: ['team', 'ball', 'sport'] }, { label: '武道の技を磨く', tags: ['martial', 'skill'] },
        { label: 'つくる・描く・調べる', tags: ['craft', 'art', 'research'] }, { label: 'みんなで演奏する', tags: ['music', 'team'] }, { label: '見学してから考えたい', tags: [] }
      ] }
    ],
    profiles: {
      '野球部': { tags: ['sport','team','ball','skill'], reason: 'ボールを使い、仲間とプレーをつなぐ競技に興味があるあなたの候補に。' },
      'サッカー部': { tags: ['sport','team','ball'], reason: '体を動かし、仲間と協力するチームスポーツが気になるなら。' },
      '陸上競技部': { tags: ['sport','individual','track'], reason: '走る・跳ぶ・投げることや、自分の記録への挑戦が気になるなら。' },
      'テニス部': { tags: ['sport','racket','individual','skill'], reason: 'ラケットを使った打ち合いや、一つの技を磨くことが気になるなら。' },
      'バスケットボール部': { tags: ['sport','team','ball'], reason: 'パスをつなぎ、仲間と得点を目指す競技を見てみたいあなたに。' },
      'バドミントン部': { tags: ['sport','racket','individual','skill'], reason: 'シャトルの打ち合いや、正確なプレーに興味があるあなたの候補に。' },
      'バレーボール部': { tags: ['sport','team','ball','skill'], reason: '仲間とボールをつなぐことや、息の合ったプレーが気になるなら。' },
      '卓球部': { tags: ['sport','racket','individual','skill'], reason: 'ラケット競技や、コントロールを工夫するプレーが気になるなら。' },
      '剣道部': { tags: ['sport','martial','individual','skill'], reason: '武道や、一つひとつの技を磨くことに興味があるあなたの候補に。' },
      '科学部': { tags: ['research','individual'], reason: '観察や実験、仕組みを調べることが気になるあなたの候補に。' },
      '家庭部': { tags: ['craft','skill'], reason: '道具を使って何かをつくり、工夫を形にすることが気になるなら。' },
      '美術部': { tags: ['art','craft','individual'], reason: '描くことやつくること、自分らしい表現に興味があるあなたに。' },
      '吹奏楽部': { tags: ['music','team','skill'], reason: '楽器や、みんなで一つの演奏をつくることが気になるあなたに。' }
    }
  },
  committees: {
    title: '委員会診断', intro: '自分の「得意かも」を、学校で生かせる場所を探そう。',
    caution: '委員会名と一般的な活動分野をもとにした目安です。この学校での詳しい仕事内容や活動量は、各委員会の紹介で確認してください。',
    questions: [
      { text: '学校で、どんな力を生かしてみたい？', options: [
        { label: 'アイデアを考える', tags: ['plan'] }, { label: '人に伝える・話を聞く', tags: ['communicate'] },
        { label: '細かいところに気づく', tags: ['care','organize'] }, { label: '道具や機器を扱う', tags: ['technical'] }, { label: 'これから見つけたい', tags: [] }
      ] },
      { text: '気になるテーマは？', options: [
        { label: '学校全体のこと', tags: ['lead','community'] }, { label: '健康や毎日の暮らし', tags: ['health','care'] },
        { label: '運動・イベント', tags: ['sport','event'] }, { label: '本・放送・映像', tags: ['book','technical'] }, { label: '環境・身の回りの整頓', tags: ['environment','organize'] }, { label: 'どれも気になる', tags: [] }
      ] },
      { text: 'みんなで何かをするとき、やってみたい役割は？', options: [
        { label: '意見をまとめる', tags: ['lead','communicate'] }, { label: '楽しい企画を考える', tags: ['plan','event'] },
        { label: '準備を整える', tags: ['organize','care'] }, { label: '機器や道具で支える', tags: ['technical'] }, { label: 'まだわからない', tags: [] }
      ] },
      { text: 'どんな場面で役に立てたらうれしい？', options: [
        { label: 'みんなの意見が形になったとき', tags: ['community','lead'] }, { label: '学校が気持ちのよい場所になったとき', tags: ['environment','care'] },
        { label: '誰かが本や情報に出会えたとき', tags: ['book','communicate'] }, { label: '行事を楽しく進められたとき', tags: ['event','sport'] },
        { label: '公平に、正確に進められたとき', tags: ['fair','organize'] }, { label: 'どれもうれしい', tags: [] }
      ] },
      { text: '少し挑戦してみたいのは？', options: [
        { label: '学校のために提案すること', tags: ['lead','plan','community'] }, { label: '健康や生活を支えること', tags: ['health','care'] },
        { label: '行事の裏側を支えること', tags: ['event','technical'] }, { label: '本や環境を整えること', tags: ['book','environment'] },
        { label: 'ルールや手順に沿って進めること', tags: ['fair','organize'] }, { label: '少しずつ試してみたい', tags: [] }
      ] }
    ],
    profiles: {
      '生徒会執行部': { tags: ['lead','plan','community'], reason: '学校全体への提案や、アイデアを形にする役割が気になるなら。' },
      '生徒委員会': { tags: ['community','communicate','lead'], reason: 'みんなの意見を聞いたり、学校全体のことを考えたりしてみたいあなたに。' },
      '生活委員会': { tags: ['care','community','organize'], reason: '毎日の学校生活を、気持ちよく過ごせるように支えることが気になるなら。' },
      '保健委員会': { tags: ['health','care','communicate'], reason: '健康に関することや、人を支える活動に興味があるあなたの候補に。' },
      '体育委員会': { tags: ['sport','event','organize'], reason: '運動や、行事の準備・進行に関わることが気になるあなたに。' },
      '環境委員会': { tags: ['environment','organize','care'], reason: '身の回りの環境を整え、過ごしやすい学校をつくることが気になるなら。' },
      '図書委員会': { tags: ['book','organize','communicate'], reason: '本や情報との出会いを支えることに興味があるあなたの候補に。' },
      'レクリエーション委員会': { tags: ['plan','event','communicate'], reason: '楽しい企画を考えたり、みんなが参加する場をつくったりしてみたいなら。' },
      '視聴覚委員会': { tags: ['technical','event','organize'], reason: '音や映像、機器を扱うことや、裏側から支える役割が気になるなら。' },
      '選挙管理委員会': { tags: ['fair','organize','community'], reason: '公平さや正確さを大切にして、手順に沿って進める役割が気になるなら。' }
    }
  }
};
/* 一致した活動分野の数から候補を返す。適性の断定や確率ではない。 */
window.scoreGuideQuiz = function(type, answers, items) {
  const quiz = window.GUIDE_QUIZZES[type];
  const chosenTags = answers.flatMap((answer, i) => quiz.questions[i]?.options[answer]?.tags || []);
  const primaryInterests = type === 'clubs' ? (quiz.questions[0].options[answers[0]]?.tags || []) : [];
  return items.filter(item => !primaryInterests.length || quiz.profiles[item.name]?.tags.some(tag => primaryInterests.includes(tag))).map(item => {
    const profile = quiz.profiles[item.name];
    return { item, score: profile ? chosenTags.filter(tag => profile.tags.includes(tag)).length : 0, reason: profile?.reason || '' };
  }).filter(row => row.score > 0).sort((a,b) => b.score-a.score);
};
