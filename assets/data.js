/* 公開確認済みの集計データだけを追加。生の回答は保存しない。 */
window.SCHOOL_DATA = {
  updatedAt: null,
  teachers: [],
  /* 先生: {id:'teacher-1',name:'先生名',subject:'教科',votes:{kindness:0,strictness:0,humor:0,clarity:0,passion:0},summary:'授業の特徴',tips:'授業を受けるコツ',voices:[]} */
  clubs: ['野球部','サッカー部','陸上競技部','テニス部','バスケットボール部','バドミントン部','バレーボール部','卓球部','剣道部','科学部','家庭部','美術部','吹奏楽部'].map((name,i)=>({id:'club-'+(i+1),name,category:i<9?'運動部':'文化部',frequency:'',atmosphere:[],summary:'',voices:[]})),
  committees: ['生徒会執行部','生徒委員会','生活委員会','保健委員会','体育委員会','環境委員会','図書委員会','レクリエーション委員会','視聴覚委員会','選挙管理委員会'].map((name,i)=>({id:'committee-'+(i+1),name,frequency:'',atmosphere:[],summary:'',voices:[]})),
  voices: [],
  /* 声: {category:'よかったこと'|'大変なこと'|'改善アイデア'|'新入生へ一言',text:'確認済みの掲載文'} */
  satisfaction: null
};
