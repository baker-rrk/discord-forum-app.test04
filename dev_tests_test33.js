// 開発用の自動テスト（本番には不要・配布不要）。使い方: node dev_tests.js [HTMLとJSがあるフォルダ]
const fs = require('fs'), path = require('path'); const DIR = process.argv[2] || '.';
const HTML = path.join(DIR, fs.readdirSync(DIR).filter(f => /^discord_forum_app_test\d+\.html$/.test(f)).sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0])).pop());
const V = HTML.match(/test(\d+)\.html/)[1];
const loadApp = () => fs.readdirSync(DIR).filter(f => new RegExp('^app_test' + V + '_\\d+_.*\\.js$').test(f)).sort().map(f => fs.readFileSync(path.join(DIR, f), 'utf8')).join('');
{
const fs=require('fs'); const src=loadApp();
const a=src.indexOf('  // ===== 取り込みデータ'); const mi=src.indexOf('function migrateScenarioBlocks'); const b=src.indexOf('\n  }\n',mi)+5;
const seg=src.slice(a,b);
const dummy=new Proxy(function(){},{get:()=>dummy,apply:()=>dummy,set:()=>true});
const run=new Function('uid','document','window','Blob', seg+`
 const T={sanitizeBlock,sanitizeBlocks,sanitizeImported,ensureScenarioBlocks,deriveFlat,applyFlatToBlocks,migrateScenarioBlocks,createDefaultBlocks,FLAT_MAP}; return T;`);
let n=0; const uid=()=>'u'+(++n);
const T=run(uid,dummy,{},Blob);
const ok=(c,m)=>console.log((c?'OK  ':'NG  ')+m);
// 1 悪意ある/壊れた取り込み
const bad={channels:[{id:5,name:null,webhookUrl:' x ',tags:'zz'}],scenarios:[{id:1,title:{a:1},tags:'x',fullBlockData:[{type:'"><img src=x onerror=alert(1)>',id:'a b',val:{}},null,{type:'summary_container',items:[null,{keyName:7,val:null}]},{type:'image',file:{},previewUrl:null}]},null,'str'],history:[1,null,{title:'t'}]};
const r=T.sanitizeImported(JSON.parse(JSON.stringify(bad)));
ok(r&&r.scenarios.length===1,'null/文字列のシナリオを除外');
ok(r.scenarios[0].fullBlockData.every(b=>['text','textarea','url','split','image','summary_container'].includes(b.type)),'block.type が許可リスト内');
ok((()=>{const x=r.scenarios[0].fullBlockData.find(b=>b.type==='summary_container');return x.items.length===1&&x.items[0].keyName==='7'})(),'items を正規化');
ok((()=>{const x=r.scenarios[0].fullBlockData.find(b=>b.type==='image');return !x.file})(),'不正な file を除去');
ok(Array.isArray(r.channels[0].tags)&&r.channels[0].name==='','channels を正規化');
ok(T.sanitizeImported({scenarios:1,channels:[]})===null,'形式不正は null');
// 2 フラット項目 ⇄ ブロック
const legacy={id:'s1',title:'T',system:'CoC',playerCount:'2-4',notes:'メモ',imageUrl:'data:image/png;base64,AAAA',reqSkills:'目星',trailer:'https://x'};
T.migrateScenarioBlocks(legacy);
const sum=legacy.fullBlockData.find(b=>b.type==='summary_container');
ok(sum&&sum.items.find(i=>i.field==='system').val==='CoC','旧データ→ブロック(システム)');
ok(legacy.fullBlockData.find(b=>b.id==='notes').val==='メモ','旧データ→ブロック(備考)');
ok(legacy.fullBlockData.some(b=>b.type==='image'&&b.previewUrl.startsWith('data:image')),'旧データ→画像ブロック');
// 項目名を変えても値が追従する
sum.items.find(i=>i.field==='system').keyName='使用システム'; sum.items.find(i=>i.field==='system').val='新クトゥルフ';
T.deriveFlat(legacy); ok(legacy.system==='新クトゥルフ','項目名を変えても system に反映');
// 編集モーダル経路
legacy.playTime='4h'; legacy.system='SW2.5'; T.applyFlatToBlocks(legacy);
ok(legacy.fullBlockData.find(b=>b.type==='summary_container').items.find(i=>i.field==='system').val==='SW2.5'&&legacy.fullBlockData.find(b=>b.type==='summary_container').items.find(i=>i.field==='playTime').val==='4h','編集モーダル→ブロック');
// 画像が全部消えたらサムネも空
legacy.fullBlockData.filter(b=>b.type==='image').forEach(b=>b.previewUrl=''); T.deriveFlat(legacy); ok(legacy.imageUrl==='','画像なし→imageUrl が空');
// 移行は冪等
const before=JSON.stringify(legacy); T.migrateScenarioBlocks(legacy); T.migrateScenarioBlocks(legacy); ok(JSON.stringify(legacy)===before,'移行を2回かけても結果が変わらない');
// 項目が重複名
const dup={id:'d',fullBlockData:[{id:'summary',type:'summary_container',label:'',items:[{keyName:'システム',val:'a'},{keyName:'システム',val:'b'}]}]};
T.migrateScenarioBlocks(dup); ok(dup.fullBlockData[0].items.filter(i=>i.field==='system').length===1,'同名項目でも field は1つだけ');

}
{
const fs=require('fs'); const html=fs.readFileSync(HTML,'utf8');
const mod=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
const a=mod.indexOf('async function mergeRemote'); const b=mod.indexOf('\n  }\n',a)+5;
const fn=mod.slice(a,b);
const mk=(local,remote,cloudDocs)=>{
  let applied=null; const cloudIndex=new Map(cloudDocs.map((c,i)=>['s_'+c.id,{order:i,json:JSON.stringify(c)}]));
  const env={ setSync(){}, loadIndex:async()=>{}, cloudIndex, cloudImages:null,
    window:{getAppStateForSync:()=>local, applyMergedState:async m=>{applied=m;}} };
  const f=new Function(...Object.keys(env),fn+'; return mergeRemote;')(...Object.values(env));
  return f('uid',{data:()=>({images:{},json:JSON.stringify(remote)})}).then(()=>applied);
};
const ok=(c,m)=>console.log((c?'OK  ':'NG  ')+m);
(async()=>{
  const L=(id,u,t='')=>({id,title:t||id,updatedAt:u});
  // 1 新しい方を採用
  let r=await mk({scenarios:[L('a',10,'local-a'),L('b',50,'local-b')],channels:[],history:[]},{channels:[],history:[]},[L('a',20,'cloud-a'),L('b',40,'cloud-b')]);
  ok(r.scenarios.find(s=>s.id==='a').title==='cloud-a'&&r.scenarios.find(s=>s.id==='b').title==='local-b','シナリオごとに新しい方を採用');
  // 2 他端末で追加
  r=await mk({scenarios:[L('a',10)],channels:[],history:[]},{channels:[],history:[]},[L('a',10),L('c',5)]);
  ok(r.scenarios.map(s=>s.id).join()==='a,c','他端末で追加したシナリオを取り込む');
  // 3 この端末で削除 → 復活しない
  r=await mk({scenarios:[L('a',10)],channels:[],history:[],deletedScenarios:{c:Date.now()}},{channels:[],history:[]},[L('a',10),L('c',5)]);
  ok(r.scenarios.map(s=>s.id).join()==='a','この端末で削除したものは復活しない');
  // 4 他端末で削除（クラウド側の墓標）→ ローカルからも消える
  r=await mk({scenarios:[L('a',10),L('x',5)],channels:[],history:[]},{channels:[],history:[],deletedScenarios:{x:Date.now()}},[L('a',10)]);
  ok(r.scenarios.map(s=>s.id).join()==='a','他端末で削除したものは消える');
  // 5 削除後に編集した方が勝つ
  r=await mk({scenarios:[L('x',Date.now()+1000)],channels:[],history:[]},{channels:[],history:[],deletedScenarios:{x:Date.now()}},[]);
  ok(r.scenarios.length===1,'削除より後に編集されたものは残る');
  // 6 履歴の重複除去・チャンネル和集合・古い墓標の掃除
  r=await mk({scenarios:[],channels:[{id:'c1'}],history:[{date:'2026-01-01',title:'T',channels:'A'}]},{channels:[{id:'c1'},{id:'c2'}],history:[{date:'2026-01-01',title:'T',channels:'A'},{date:'2026-01-02',title:'U',channels:'B'}],deletedScenarios:{old:1}},[]);
  ok(r.history.length===2,'履歴は重複を除いて統合'); ok(r.channels.map(c=>c.id).join()==='c1,c2','チャンネルは和集合'); ok(!('old' in r.deletedScenarios),'90日超の削除記録を掃除');
  // 7 壊れたクラウドJSONがあっても落ちない
  const env2=await (async()=>{try{const cloud=[{id:'ok',updatedAt:1}];let applied;const cloudIndex=new Map([['s_ok',{order:0,json:JSON.stringify(cloud[0])}],['s_bad',{order:1,json:'{broken'}]]);
    const f=new Function('setSync','loadIndex','cloudIndex','cloudImages','window',fn+';return mergeRemote;')(()=>{},async()=>{},cloudIndex,null,{getAppStateForSync:()=>({scenarios:[],channels:[],history:[]}),applyMergedState:async m=>{applied=m}});
    await f('u',{data:()=>({images:{},json:'{}'})}); return applied;}catch(e){return e}})();
  ok(!(env2 instanceof Error)&&env2.scenarios.length===1,'壊れたクラウドJSONは無視して統合を続行');
})();
(async()=>{ const f=require('fs').readFileSync(HTML,'utf8').match(/<script type="module">([\s\S]*?)<\/script>/)[1];
  const a=f.indexOf('async function mergeRemote'), b=f.indexOf('\n  }\n',a)+5; const fn=f.slice(a,b); let ap;
  const L={id:'a',updatedAt:10,postedChannels:['c1'],postedInfo:{c1:{n:1}}}, C={id:'a',updatedAt:20,title:'cloud',postedChannels:['c2'],postedInfo:{c2:{n:2}}};
  const g=new Function('setSync','loadIndex','cloudIndex','cloudImages','window',fn+';return mergeRemote;')(()=>{},async()=>{},new Map([['s_a',{order:0,json:JSON.stringify(C)}]]),null,{getAppStateForSync:()=>({scenarios:[L],channels:[],history:[]}),applyMergedState:async m=>{ap=m}});
  await g('u',{data:()=>({images:{},json:'{}'})});
  const s=ap.scenarios[0]; console.log((s.title==='cloud'&&s.postedChannels.sort().join()==='c1,c2'&&s.postedInfo.c1&&s.postedInfo.c2?'OK  ':'NG  ')+'posted-record merge (body from newer side)'); })();

}

{ // チャンネル削除の反映・時計ずれ対策のテスト
  const fn=(()=>{const f=fs.readFileSync(HTML,'utf8').match(/<script type="module">([\s\S]*?)<\/script>/)[1];const a=f.indexOf('async function mergeRemote');return f.slice(a,f.indexOf('\n  }\n',a)+5);})();
  (async()=>{ let ap; const g=new Function('setSync','loadIndex','cloudIndex','cloudImages','window',fn+';return mergeRemote;')(()=>{},async()=>{},new Map(),null,{getAppStateForSync:()=>({scenarios:[],channels:[{id:'c1'},{id:'c3'}],history:[],deletedChannels:{c3:Date.now()}}),applyMergedState:async m=>{ap=m}});
    await g('u',{data:()=>({images:{},json:JSON.stringify({channels:[{id:'c1'},{id:'c2'}],history:[],deletedChannels:{c2:Date.now()}})})});
    console.log((ap.channels.map(c=>c.id).join()==='c1'?'OK  ':'NG  ')+'削除したチャンネルは両端末から消え、復活しない'); })(); }

{ // 履歴の全消去・添付上限のテスト
  const fn=(()=>{const f=fs.readFileSync(HTML,'utf8').match(/<script type="module">([\s\S]*?)<\/script>/)[1];const a=f.indexOf('async function mergeRemote');return f.slice(a,f.indexOf('\n  }\n',a)+5);})();
  (async()=>{ let ap; const old='2026-01-01T00:00:00.000Z', nw='2026-03-01T00:00:00.000Z';
    const g=new Function('setSync','loadIndex','cloudIndex','cloudImages','window',fn+';return mergeRemote;')(()=>{},async()=>{},new Map(),null,{getAppStateForSync:()=>({scenarios:[],channels:[],history:[{date:old,title:'a',channels:'x'}],historyClearedAt:Date.parse('2026-02-01')}),applyMergedState:async m=>{ap=m}});
    await g('u',{data:()=>({images:{},json:JSON.stringify({channels:[],history:[{date:old,title:'b',channels:'y'},{date:nw,title:'c',channels:'z'}]})})});
    console.log((ap.history.length===1&&ap.history[0].title==='c'?'OK  ':'NG  ')+'履歴を消した後の新しい履歴だけが残る');
    const src=loadApp(); const m=src.match(/const maxAttachBytes = [^\n]*/)[0];
    const f=new Function('appState',m+';return maxAttachBytes;'); console.log((f({})()===9.5*1048576&&f({maxAttachMB:20})()===20*1048576&&f({maxAttachMB:'x'})()===9.5*1048576?'OK  ':'NG  ')+'添付上限: 既定9.5MB・設定値・不正値'); })(); }


{ // ブロック編集の委譲: テンプレートが出す操作名と、イベント側の処理が一致しているか
  const app=loadApp(), tpl=app.slice(app.indexOf('function getDecorSelectHtml'), app.indexOf('function addSummaryItem'));
  const ev=fs.readFileSync(path.join(DIR, fs.readdirSync(DIR).filter(f=>new RegExp('^app_test'+V+'_\\d+_events\\.js$').test(f))[0]),'utf8');
  for(const [attr,label] of [['data-ba','クリック'],['data-bi','入力'],['data-bc','変更']]){
    const used=new Set([...tpl.matchAll(new RegExp(attr+'="([^"$]+)"','g'))].map(m=>m[1]));
    const handled=[...used].filter(v=>ev.includes("'"+v+"'"));
    console.log((handled.length===used.size?'OK  ':'NG  ')+'ブロック編集の'+label+'操作 '+used.size+'種が全て処理される'+(handled.length===used.size?'':' 未処理: '+[...used].filter(v=>!handled.includes(v))));
  }
  console.log((!/\bon(click|input|change|dragover|dragleave|drop)="[^"]*blockIdx/.test(tpl)?'OK  ':'NG  ')+'ブロック編集のインラインイベントが残っていない');
}

{ // 画像の2重追加防止・入力内容のみクリア
  const app=loadApp(), ev=app.slice(app.indexOf('document.addEventListener(\'click\''));
  const caps=['dragover','dragleave','drop'].every(t=>new RegExp("addEventListener\\('"+t+"'[^\\n]*\\}, true\\);").test(ev));
  console.log((caps?'OK  ':'NG  ')+'ドラッグ系の委譲はキャプチャ段階（親コンテナへ伝播しない）');
  console.log((/function handleContainerDrop\(e\) \{[^\n]*data-ba="pick"/.test(app)?'OK  ':'NG  ')+'画像ブロック上のドロップはコンテナ側で無視');
  const a=app.indexOf('async function resetInputs'), fn=app.slice(a,app.indexOf('\n  }\n',a)+5);
  const els={title:{value:'t'},autoReplyText:{value:'a'},topShopUrl:{value:'s'},topTrailer:{value:'r'},dbScenarioSelect:{value:'x'}};
  const env={ appConfirm:async()=>true, currentScenarioId:'id1', document:{getElementById:i=>els[i]}, activeTagNames:new Set(['a']), updateTagCheckboxes(){}, renderBlockUI(){}, checkDuplicateStatus(){}, renderPreview(){},
    blockOrder:[{id:'s',type:'summary_container',items:[{keyName:'システム',val:'CoC'}],freeText:'f'},{id:'n',type:'textarea',val:'memo',label:'備考'},{id:'sp',type:'split'},{id:'i',type:'image',previewUrl:'u',file:{}}] };
  const bo=env.blockOrder, order=bo.map(b=>b.id).join();
  new Function(...Object.keys(env),fn+';return resetInputs;')(...Object.values(env))().then(()=>{});
  setTimeout(()=>{ const ok=Object.values(els).every(e=>e.value==='')&&bo[0].items[0].val===''&&bo[0].items[0].keyName==='システム'&&bo[0].freeText===''&&bo[1].val===''&&bo[1].label==='備考'&&bo[3].previewUrl===''&&bo[3].file===null&&env.activeTagNames.size===0&&bo.map(b=>b.id).join()===order;
    console.log((ok?'OK  ':'NG  ')+'入力内容のみクリア: 本文・画像・タグ・シナリオ選択は消え、項目名・ブロックの並びは残る'); },50);
}

{ // 固定ヘッダー
  const css=fs.readFileSync(path.join(DIR,'discord_forum_app_test'+V+'.css'),'utf8'), app=loadApp();
  console.log((/\.app-header \{\s*position: sticky; top: 0;[^}]*background:/.test(css)?'OK  ':'NG  ')+'ヘッダーは上部に固定され、背景で内容が透けない');
  console.log((/\.discord-preview-box[^}]*top: calc\(var\(--app-header-h/.test(css)?'OK  ':'NG  ')+'プレビュー枠は固定ヘッダーの下に置かれる');
  console.log((/--app-header-h/.test(app)?'OK  ':'NG  ')+'ヘッダー高さをCSS変数へ反映');
}

{ // インラインイベントの廃止と登録表の整合
  const html=fs.readFileSync(HTML,'utf8').replace(/<script[\s\S]*?<\/script>/g,''), app=loadApp();
  const left=[...(html+app).matchAll(/\son(?:click|input|change|submit|dragover|dragleave|drop|keydown|keyup|paste|focus|blur)=\\?"/g)].length;
  console.log((left===0?'OK  ':'NG  ')+'インラインの on◯◯= 属性が残っていない ('+left+')');
  const act=app.slice(app.indexOf('const HANDLERS = {')); const code=act.slice(0,act.indexOf('\n})();')+6);
  const keys=new Set(); for(const m of (html+app).matchAll(/data-on-(?:click|input|change|submit|dragover|dragleave|drop)="([^"]*)"/g)) keys.add(m[1].replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'"));
  const listeners={}, calls=[]; const env={document:{addEventListener:(t,f)=>{listeners[t]=f;}},console:{warn(){}},appState:{channels:[{tags:[{}]}]},renderPreview(){calls.push('renderPreview')},resetForm(){calls.push('resetForm')},saveState(){},switchTab(a,e){calls.push('switchTab:'+a+':'+(e.currentTarget===btn))},deleteChannelConfig(i){calls.push('del'+i)}};
  const HAN=new Function(...Object.keys(env),code+';return HANDLERS;')(...Object.values(env));
  keys.delete('...');   // actions.js の説明コメント内の例示は数えない
  const miss=[...keys].filter(k=>!(k in HAN)); console.log((miss.length===0?'OK  ':'NG  ')+'画面が使う操作 '+keys.size+' 種が、すべて登録表にある'+(miss.length?' 未登録: '+miss.join(' / '):''));
  // ディスパッチ: 子→親、this/currentTarget、stopPropagation
  const mkEl=(attrs,parent)=>({attrs,parentElement:parent||null,dataset:{},getAttribute(a){return this.attrs[a];},closest(s){const a=s.slice(1,-1);for(let e=this;e;e=e.parentElement)if(a in e.attrs)return e;return null;}});
  const par=mkEl({'data-on-click':'resetForm()'}), btn=mkEl({'data-on-click':"switchTab('postTab', event)"},par), ch=mkEl({'data-on-click':'ch-del'},null); ch.dataset.ci='2';
  const ev={target:btn,cancelBubble:false,stopPropagation(){this.cancelBubble=true;}};
  listeners.click(ev); listeners.click({target:ch,cancelBubble:false});
  console.log((calls.join()==='switchTab:postTab:true,resetForm,del2'?'OK  ':'NG  ')+'委譲の動作: 子→親の順に呼ぶ／currentTarget／data属性の引数 ('+calls.join()+')');
}

{ // プルダウンのお気に入り優先表示
  const app=loadApp(), a=app.indexOf('function populateScenarioDBSelect'), fn=app.slice(a,app.indexOf('\n  }\n',a)+5);
  class Opt{constructor(t,v){this.text=t;this.value=v;}}
  const mkSel=()=>{const s={value:'',children:[],get options(){return this.children.flatMap(c=>c.children?c.children:[c]);},appendChild(c){this.children.push(c);},set innerHTML(h){this.children=[new Opt('',''),];},get innerHTML(){return '';}};return s;};
  const run=(scs,cur)=>{const sel=mkSel(); sel.value=cur||''; const env={document:{getElementById:()=>sel,createElement:()=>({label:'',children:[],appendChild(c){this.children.push(c);}})},appState:{scenarios:scs},Option:Opt};
    new Function(...Object.keys(env),fn+';populateScenarioDBSelect();')(...Object.values(env)); return sel;};
  const S=[{id:'a',title:'A'},{id:'b',title:'B',favorite:true},{id:'c',title:'C'},{id:'d',title:'D',favorite:true}];
  let s=run(S,'c'); const order=s.options.map(o=>o.value).join('');
  console.log((order==='bdac'.replace(/^/,'')||order==='bdac'?'OK  ':'NG  ')+'お気に入りが先頭にまとまり、残りは元の順（'+order+'）');
  console.log((s.value==='c'?'OK  ':'NG  ')+'並べ直しても選択中のシナリオが保たれる');
  s=run([{id:'a',title:'A'},{id:'c',title:'C'}],''); console.log((s.children.length===3&&!s.children[1].children?'OK  ':'NG  ')+'お気に入りが無いときは、これまでどおりの一覧');
  console.log((s.options.every(o=>!/^★/.test(o.text))?'OK  ':'NG  ')+'お気に入りでないものに★が付かない');
}

{ // タイトルが部分的にも一致しなければ別DB扱い
  const app=loadApp(), g=(re)=>app.match(re)[0];
  const head=g(/const _normTitle = [^\n]*\n\s*const titlesRelated = [^\n]*/), fs_=g(/const findScenario = [^\n]*/);
  const mk=(cur,list)=>new Function('currentScenarioId','appState',head+'\n'+fs_+';return {titlesRelated,findScenario};')(cur,{scenarios:list});
  const S=[{id:'a',title:'クトゥルフの呼び声'}], T=mk('a',S).titlesRelated;
  console.log((T('クトゥルフの呼び声','【再募集】クトゥルフの呼び声 前編')&&T(' ＣＯＣ 7版 ','coc7版シナリオ')&&!T('クトゥルフの呼び声','ソード・ワールド2.5')&&!T('','abc')&&!T('abc','')?'OK  ':'NG  ')+'タイトルの部分一致（含む・全角半角/大小/空白を無視・空は不一致）');
  const f=mk('a',S).findScenario;
  console.log((f('クトゥルフの呼び声 後編')===S[0]?'OK  ':'NG  ')+'タイトルが部分一致する間は、直前のシナリオと同じ扱い');
  console.log((f('全く別のシナリオ')===undefined?'OK  ':'NG  ')+'タイトルが一致しなければ、直前のシナリオとは別扱い（重複警告の対象にならない）');
  console.log((mk('a',[...S,{id:'b',title:'全く別のシナリオ'}]).findScenario('全く別のシナリオ').id==='b'?'OK  ':'NG  ')+'同名の別シナリオがあれば、そちらを見つける');
  console.log((/findIndex\(s => s\.id === currentScenarioId && titlesRelated\(s\.title, title\)\)/.test(app)?'OK  ':'NG  ')+'自動保存は、タイトルが一致しない直前のシナリオを上書きしない');
  const a=app.indexOf('async function resolveSaveOpts'), fn=app.slice(a,app.indexOf('\n  }\n',a)+5); let asked=0;
  const run=(cur,list,title)=>{asked=0;return new Function('currentScenarioId','appState','appConfirm',head+'\n'+fn+';return resolveSaveOpts;')(cur,{scenarios:list},async()=>{asked++;return true;})(title);};
  (async()=>{ await run('a',S,'全く別のシナリオ'); const q1=asked; await run('a',S,'クトゥルフの呼び声 後編'); const q2=asked;
    await run(null,[{id:'b',title:'同名'}],'同名'); const q3=asked;
    console.log((q1===0&&q2===1&&q3===1?'OK  ':'NG  ')+'上書き確認は、直前と無関係な新規タイトルでは出ず、同名の既存があるときだけ出る ('+[q1,q2,q3]+')'); })();
}

{ // 部分一致のときの選択／投稿結果ポップアップ
  const app=loadApp(), head=app.match(/const _normTitle = [^\n]*\n\s*const titlesRelated = [^\n]*/)[0];
  const a=app.indexOf('async function resolveSaveOpts'), fn=app.slice(a,app.indexOf('\n  }\n',a)+5);
  const run=(cur,list,title,answers)=>{ const q=[...answers]; let n=0; const f=new Function('currentScenarioId','appState','appConfirm',head+'\n'+fn+';return resolveSaveOpts;')(cur,{scenarios:list},async()=>{n++;return q.shift();}); return f(title).then(r=>({r,n})); };
  const S=[{id:'a',title:'クトゥルフの呼び声'}];
  (async()=>{ const c1=await run('a',S,' クトゥルフの呼び声 ',[]), c2=await run('a',S,'クトゥルフの呼び声 後編',[true]), c3=await run('a',S,'クトゥルフの呼び声 後編',[false]);
    const L=[{id:'a',title:'X'},{id:'b',title:'X 後編'}], c4=await run('a',L,'X 後編',[false,true]), c5=await run('a',L,'X 後編',[false,false]);
    console.log((c1.n===0&&!c1.r.ignoreCurrent?'OK  ':'NG  ')+'完全一致（空白・全角半角の差だけ）なら確認なしで同じシナリオ');
    console.log((c2.n===1&&!c2.r.ignoreCurrent&&!c2.r.forceNew?'OK  ':'NG  ')+'部分一致で「同じシナリオとして上書き」を選ぶと、直前のシナリオを更新');
    console.log((c3.n===1&&c3.r.ignoreCurrent===true?'OK  ':'NG  ')+'部分一致で「別シナリオとして追加」を選ぶと、直前のシナリオは更新しない');
    console.log((c4.n===2&&c4.r.ignoreCurrent===true&&!c4.r.forceNew?'OK  ':'NG  ')+'別シナリオ扱いにしても、同名の既存があればそちらの上書き可否を確認');
    console.log((c5.n===2&&c5.r.forceNew===true?'OK  ':'NG  ')+'同名の既存も別扱いにすると、必ず新規で追加'); })();
  console.log(((app.match(/appAlert\(/g)||[]).length>=3&&/opts\.alert/.test(app)&&/opts\.ignoreCurrent/.test(app)?'OK  ':'NG  ')+'投稿の成功・失敗でポップアップ（appAlert）を表示し、自動保存は ignoreCurrent を尊重');
}
