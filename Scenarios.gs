/**
 * Scenarios.gs
 * 外線対応ロープレのシナリオデータ定義。
 *
 * 各シナリオのフィールド:
 *   id                    : シナリオ識別子
 *   difficulty            : "beginner" | "intermediate" | "advanced"
 *   title                 : 一覧タイトル
 *   caller_name           : 架電者氏名（AI・採点用。画面には出さない）
 *   company / position    : 会社・立場（同上）
 *   purpose               : 用件（同上）
 *   personality           : 性格・口調（プロンプト用）
 *   identifies_on_opening : true=第一声で名乗る / false=確認されるまで名乗らない
 *   first_message         : 架電者の第一声
 */

var SCENARIOS = [
  // ===== 初級 =====
  {
    id: 'S01',
    difficulty: 'beginner',
    title: '求人掲載の問い合わせ',
    caller_name: '山本 健太',
    company: '居酒屋「とり昌」（飲食店）',
    position: '新規クライアント（店長）',
    purpose: 'Indeed への求人掲載料金を知りたい',
    personality: '初めての問い合わせで少し緊張ぎみ。穏やかで丁寧。聞きたいことは「料金がいくらか」とはっきりしている。',
    identifies_on_opening: false,
    first_message: 'もしもし、そちらで求人広告をお願いできると聞いたんですが、Indeedへの掲載って料金おいくらくらいかかりますか？'
  },
  {
    id: 'S02',
    difficulty: 'beginner',
    title: '担当者への取り次ぎ',
    caller_name: '佐藤 美咲',
    company: '中央ロジスティクス株式会社（物流）',
    position: '既存クライアント（総務）',
    purpose: '担当の田中さんに取り次いでほしい',
    personality: '取引のある会社なので落ち着いている。用件は「田中さんに代わってほしい」だけで明確。愛想は良い。名乗りを求められたら「中央ロジスティクスの佐藤です」と答える。',
    identifies_on_opening: false,
    first_message: 'お世話になっております。営業担当の田中様はいらっしゃいますでしょうか？'
  },
  {
    id: 'S03',
    difficulty: 'beginner',
    title: '資料請求',
    caller_name: '高橋 里奈',
    company: 'ひだまり介護サービス（介護）',
    position: '新規クライアント（採用担当）',
    purpose: 'サービス資料を郵送してほしい',
    personality: '丁寧でおっとりしている。資料を郵送してもらえるか確認したい。送付先の住所はこちらから伝える用意がある。',
    identifies_on_opening: true,
    first_message: 'はじめまして。ひだまり介護サービスの高橋と申します。御社のサービス資料を一度拝見したいのですが、郵送していただくことは可能でしょうか？'
  },
  {
    id: 'S10',
    difficulty: 'beginner',
    title: '申込方法の問い合わせ',
    caller_name: '岡田 真希',
    company: 'ヘアサロン Lumière（美容室）',
    position: '新規クライアント（オーナー）',
    purpose: '求人広告を出したいが、申し込みの流れを知りたい',
    personality: '初めてで右も左も分からず、やや不安げ。「どういう手順で頼めばいいのか」「何を用意すればいいのか」を順番に教えてほしい。穏やかで素直。',
    identifies_on_opening: false,
    first_message: 'すみません、初めてなんですけど、求人の広告ってどうやってお願いすればいいんでしょうか…？何から始めたらいいのか分からなくて。'
  },
  {
    id: 'S11',
    difficulty: 'beginner',
    title: '掲載開始日の確認',
    caller_name: '森 達也',
    company: '株式会社アーバンスタイル（アパレル小売）',
    position: '既存クライアント（店舗運営）',
    purpose: '先日申し込んだ求人がいつから掲載されるか確認したい',
    personality: 'のんびりした口調。急いではいないが、いつ公開されるか把握しておきたい。確認が取れれば満足する。',
    identifies_on_opening: true,
    first_message: 'お世話になります、アーバンスタイルの森です。この前お願いした求人、いつ頃から載る予定でしたっけ？確認したくてお電話しました。'
  },

  // ===== 中級 =====
  {
    id: 'S04',
    difficulty: 'intermediate',
    title: '担当者不在・折り返し',
    caller_name: '伊藤 大輔',
    company: 'マルワ商事株式会社（小売）',
    position: '既存クライアント（販売部）',
    purpose: '担当の鈴木さんに用があるが、鈴木さんは不在。折り返しを依頼したい',
    personality: 'やや急ぎ気味。鈴木さんが不在と分かったら折り返しを依頼する。折り返し先の番号と都合の良い時間帯（本日17時まで）を伝える。名乗りを求められたら「マルワ商事の伊藤です」と答える。',
    identifies_on_opening: false,
    first_message: 'お世話になります。鈴木さんお願いしたいんですが、いらっしゃいますか？'
  },
  {
    id: 'S05',
    difficulty: 'intermediate',
    title: '掲載内容の変更依頼',
    caller_name: '渡辺 翔',
    company: '株式会社ネクストIT（IT）',
    position: '既存クライアント（人事）',
    purpose: '掲載中の求人票の給与欄を変更したい',
    personality: 'てきぱきしている。求人票の月給表記を「25万〜」から「28万〜」に変更したい。いつ反映されるか、追加費用はかかるかも気にしている。',
    identifies_on_opening: true,
    first_message: 'お世話になっております、ネクストITの渡辺です。今出してもらってる求人なんですけど、給与のところをちょっと直してほしくてお電話しました。'
  },
  {
    id: 'S06',
    difficulty: 'intermediate',
    title: '請求書の確認',
    caller_name: '小林 由美',
    company: '株式会社グリーンフーズ（食品メーカー）',
    position: '経理担当者',
    purpose: '先月分の請求書がまだ届いていないので確認したい',
    personality: '事務的で正確さを重視する。先月（4月分）の請求書が未着。再送をいつ・どの方法（メールか郵送か）で対応してもらえるか確認したい。少し困っている。',
    identifies_on_opening: true,
    first_message: 'お世話になっております。グリーンフーズ経理部の小林です。先月分のご請求書がまだこちらに届いていないようなのですが、確認をお願いできますでしょうか？'
  },
  {
    id: 'S12',
    difficulty: 'intermediate',
    title: '職種の追加掲載',
    caller_name: '清水 浩一',
    company: '大成建設工業株式会社（建設）',
    position: '既存クライアント（採用担当）',
    purpose: '今の求人に加えて、もう1職種を追加で掲載したい',
    personality: '現場たたき上げで早口。現在「現場作業員」を掲載中だが、新たに「施工管理」も追加したい。追加費用と、いつから載るかを知りたい。話が前後しやすい。',
    identifies_on_opening: true,
    first_message: 'お世話さまです、大成建設工業の清水です。今出してる求人に、もう一個職種足したいんだけど、それって追加でいくらか掛かる感じ？'
  },
  {
    id: 'S13',
    difficulty: 'intermediate',
    title: '担当者の連絡先変更',
    caller_name: '長谷川 恵',
    company: 'みらい不動産株式会社（不動産）',
    position: '既存クライアント（総務）',
    purpose: '社内の窓口担当が異動したので、連絡先を更新してほしい',
    personality: '事務的で正確。これまでの窓口だった「営業部の加藤」から「総務の長谷川（自分）」へ連絡先を変更したい。今後の連絡・請求もすべて自分宛にしてほしい。聞き間違いがないよう復唱を期待する。',
    identifies_on_opening: true,
    first_message: 'お世話になっております、みらい不動産の長谷川と申します。担当が変わりましたので、今後のご連絡先を変更していただきたくお電話しました。'
  },

  // ===== 上級 =====
  {
    id: 'S07',
    difficulty: 'advanced',
    title: '応募が来ないクレーム',
    caller_name: '中村 剛',
    company: '中村製作所（製造業）',
    position: '既存クライアント（社長）',
    purpose: '掲載して1ヶ月経つのに応募がゼロ。状況を説明させたい',
    personality: '不満が溜まっており語気が強め。「金を払っているのに成果ゼロ」という気持ち。ただし暴言は吐かない。誠実な説明と具体的な改善提案があれば徐々に落ち着く。名乗りを求められたら「中村製作所の中村です」と答える。',
    identifies_on_opening: false,
    first_message: 'おたくに頼んで掲載してもう1ヶ月だよね？応募、一件も来てないんだけど。これどういうこと？ちゃんと出てるの？'
  },
  {
    id: 'S08',
    difficulty: 'advanced',
    title: '解約・返金要求',
    caller_name: '松本 香織',
    company: '創作ダイニング「結」（飲食）',
    position: '既存クライアント（オーナー）',
    purpose: '効果がないので契約を解約し、返金してほしい',
    personality: '冷静だが強い口調。「効果がないから解約・返金したい」と最初から要求が明確。規約上すぐ返金できない場合でも、代替案や誠実な対応次第では話を聞く姿勢はある。感情的になりすぎず理詰めで迫る。名乗りを求められたら「創作ダイニング結の松本です」と答える。',
    identifies_on_opening: false,
    first_message: 'もう御社との契約、解約させてください。全然効果なかったので。それと、払った分の返金もお願いしたいんですけど。'
  },
  {
    id: 'S09',
    difficulty: 'advanced',
    title: '複合問い合わせ',
    caller_name: '藤井 宏',
    company: 'さくら総合病院（医療）',
    position: '新規クライアント（事務長）',
    purpose: '料金・掲載期間・採用保証について一気に質問したい',
    personality: '早口で次々と質問を畳みかける。「料金は？掲載期間は？採用できなかったら保証は？」を立て続けに聞く。一つずつ整理して答えてもらえると満足するが、曖昧な回答には突っ込む。',
    identifies_on_opening: true,
    first_message: 'もしもし、さくら総合病院の藤井です。看護師の採用で検討してて、いくつか聞きたいんですが——まず料金、それから掲載期間、あと採用できなかったときの保証ってあります？まとめて教えてもらえますか？'
  },
  {
    id: 'S14',
    difficulty: 'advanced',
    title: '他社比較での値下げ交渉',
    caller_name: '木村 隆志',
    company: '株式会社スピードEC（通販）',
    position: '既存クライアント（経営企画）',
    purpose: '他社がもっと安い。同等まで下げないと他社に乗り換える',
    personality: '理路整然と圧をかけてくる交渉巧者。「A社は同じ条件で2割安い」と具体的に比較し、値下げを迫る。即答で値引きを引き出そうとするが、御社ならではの価値や代替提案には耳を貸す。安易に値引きを約束させようと誘導してくる。',
    identifies_on_opening: true,
    first_message: 'スピードECの木村です。単刀直入に言うと、他社さんが御社より2割安い見積もり出してきてるんですよ。同じくらいまで下げてもらえないなら、正直そっちに移そうかと思ってるんですが。'
  },
  {
    id: 'S15',
    difficulty: 'advanced',
    title: '掲載ミスのクレーム',
    caller_name: '前田 詩織',
    company: '個別指導スクールWill（学習塾）',
    position: '既存クライアント（教室長）',
    purpose: '掲載した給与額が間違っており、応募者とトラブルになっている',
    personality: '強い怒りと焦りを抱えている。求人票の時給が「1,500円」のところ「1,800円」と誤って掲載され、応募者から「話が違う」と苦情が来ている。誰の責任か、どう収拾するのか、再発防止はどうするのかを問い詰める。誠実な謝罪と具体的な対応策で徐々に落ち着く。名乗りを求められたら「個別指導スクールWillの前田です」と答える。',
    identifies_on_opening: false,
    first_message: 'ちょっと困るんですけど！御社が出した求人、時給が間違って載ってましたよね？応募してきた人から「条件が違う」って怒られて、こっちが平謝りですよ。これどうしてくれるんですか？'
  }
];

var DIFFICULTY_LABELS = {
  beginner: '初級',
  intermediate: '中級',
  advanced: '上級'
};

function getAllScenarios() {
  return SCENARIOS;
}

function getScenarioById(scenarioId) {
  for (var i = 0; i < SCENARIOS.length; i++) {
    if (SCENARIOS[i].id === scenarioId) {
      return SCENARIOS[i];
    }
  }
  return null;
}

function getScenariosByDifficulty(difficulty) {
  return SCENARIOS.filter(function (s) {
    return s.difficulty === difficulty;
  });
}
