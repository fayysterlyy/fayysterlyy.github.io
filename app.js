/* ============================================================
   MOL KAMP — app.js
   quiz verisi + state machine · hesaplayıcı · tema · nav
   ============================================================ */
"use strict";

/* ---------- sabitler (site genelinde tutarlı) ---------- */
const NA = 6.02e23;           // Avogadro
const VM = 22.4;              // NK molar hacim (0 °C, 1 atm)

/* ---------- yardımcılar ---------- */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

/* sayı → "3,01×10²³" (HTML sup düzenli) */
function sci(x, forcePlain=false){
  if (!isFinite(x)) return "—";
  const exp = Math.floor(Math.log10(Math.abs(x)));
  if (!forcePlain && (exp >= 6 || exp <= -3)){
    const m = (x / Math.pow(10, exp));
    const mm = Math.round(m * 1000) / 1000;
    const ee = Math.round(exp);
    return `${String(mm).replace(".", ",")}×10<sup>${ee}</sup>`;
  }
  return (Math.round(x * 100) / 100)
    .toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}
const fmt = x => (Math.round(x * 1000) / 1000)
  .toLocaleString("tr-TR", { maximumFractionDigits: 3 });

/* ---------- quiz verisi (14 yazıldı → 13 seçildi; tümü elle hesaplandı) ---------- */
const QUESTIONS = [
  {
    q: `1 mol saf maddede kaç tane tanecik (atom, molekül veya iyon) bulunur?`,
    opts: [`3,01×10<sup>23</sup> tanecik`, `6,02×10<sup>23</sup> tanecik`, `22,4×10<sup>23</sup> tanecik`, `12 tanecik`],
    correct: 1,
    steps: [
      `Mol tanımı: 12 g <b>¹²C</b> içindeki atom sayısı kadar tanecik = <b>6,02×10<sup>23</sup></b>.`,
      `"22,4" sayısı NK hacimle ilgilidir (litre), tanecikle değil.`
    ]
  },
  {
    q: `0,5 mol H<sub>2</sub>O içinde kaç molekül su vardır?`,
    opts: [`9,03×10<sup>23</sup>`, `1,204×10<sup>24</sup>`, `3,01×10<sup>23</sup>`, `6,02×10<sup>23</sup>`],
    correct: 2,
    steps: [
      `N = n × N<sub>A</sub> = 0,5 × 6,02×10<sup>23</sup>`,
      `= <b>3,01×10<sup>23</sup> molekül</b>.`
    ]
  },
  {
    q: `18 gram H<sub>2</sub>O kaç mOldir? (M<sub>A</sub> = 18 g/mol)`,
    opts: [`2 mol`, `0,5 mol`, `18 mol`, `1 mol`],
    correct: 3,
    steps: [
      `n = m / M<sub>A</sub> = 18 / 18`,
      `= <b>1 mol</b>.`
    ]
  },
  {
    q: `44 gram CO<sub>2</sub> gazı içinde kaç molekül bulunur? (M<sub>A</sub> = 44 g/mol)`,
    opts: [`6,02×10<sup>23</sup>`, `1,204×10<sup>24</sup>`, `3,01×10<sup>23</sup>`, `44 molekül`],
    correct: 0,
    steps: [
      `n = 44 / 44 = <b>1 mol</b>`,
      `N = 1 × 6,02×10<sup>23</sup> = <b>6,02×10<sup>23</sup> molekül</b>.`
    ]
  },
  {
    q: `Normal koşullarda (NK) 2 mol O<sub>2</sub> gazı kaç litre yer kaplar?`,
    opts: [`22,4 L`, `11,2 L`, `44,8 L`, `5,6 L`],
    correct: 2,
    steps: [
      `V = n × 22,4 L/mol`,
      `V = 2 × 22,4 = <b>44,8 L</b>.`
    ]
  },
  {
    q: `NK'da ölçülen 11,2 L O<sub>2</sub> gazının molekül sayısı kaçtır?`,
    opts: [`6,02×10<sup>23</sup>`, `3,01×10<sup>23</sup>`, `1,505×10<sup>23</sup>`, `1,204×10<sup>24</sup>`],
    correct: 1,
    steps: [
      `n = V / 22,4 = 11,2 / 22,4 = <b>0,5 mol</b>`,
      `N = 0,5 × 6,02×10<sup>23</sup> = <b>3,01×10<sup>23</sup></b>.`
    ]
  },
  {
    q: `H<sub>2</sub>O'nun molar kütlesi kaç g/mol'dür?`,
    opts: [`20`, `16`, `22`, `18`],
    correct: 3,
    steps: [
      `M<sub>A</sub> = 2×1 (H) + 16 (O)`,
      `= <b>18 g/mol</b>.`
    ]
  },
  {
    q: `0,25 mol CO<sub>2</sub> kaç molekül içerir?`,
    opts: [`6,02×10<sup>23</sup>`, `2,408×10<sup>24</sup>`, `1,505×10<sup>23</sup>`, `3,01×10<sup>23</sup>`],
    correct: 2,
    steps: [
      `N = 0,25 × 6,02×10<sup>23</sup>`,
      `= <b>1,505×10<sup>23</sup> molekül</b>.`
    ]
  },
  {
    q: `18 g H<sub>2</sub>O içindeki toplam hidrojen atomu sayısı kaçtır?`,
    opts: [`1,204×10<sup>24</sup>`, `6,02×10<sup>23</sup>`, `3,01×10<sup>23</sup>`, `9,03×10<sup>23</sup>`],
    correct: 0,
    steps: [
      `18 g su = 1 mol → 6,02×10<sup>23</sup> molekül`,
      `1 molekülde <b>2</b> H atomu var → N<sub>H</sub> = 1 × 2 × 6,02×10<sup>23</sup>`,
      `= <b>1,204×10<sup>24</sup> atom</b>. (Soru H atomu istiyor — molekül sayısı cevap olamaz!)`
    ]
  },
  {
    q: `32 gram CH<sub>4</sub> içindeki toplam hidrojen atomu sayısı kaçtır? (M<sub>A</sub> = 16 g/mol)`,
    opts: [`1,204×10<sup>24</sup>`, `2,408×10<sup>24</sup>`, `6,02×10<sup>23</sup>`, `4,816×10<sup>24</sup>`],
    correct: 3,
    steps: [
      `n = 32 / 16 = <b>2 mol</b> CH<sub>4</sub>`,
      `1 CH<sub>4</sub> molekülü <b>4</b> H atomu içerir → N<sub>H</sub> = 2 × 4 × 6,02×10<sup>23</sup>`,
      `= <b>4,816×10<sup>24</sup> atom</b>.`
    ]
  },
  {
    q: `2H<sub>2</sub> + O<sub>2</sub> → 2H<sub>2</sub>O tepkimesinde 4 mol H<sub>2</sub>'nin tam tepkimeye girmesi için kaç mol O<sub>2</sub> gerekir?`,
    opts: [`4 mol`, `2 mol`, `1 mol`, `8 mol`],
    correct: 1,
    steps: [
      `Katsayı oranı H<sub>2</sub> : O<sub>2</sub> = 2 : 1`,
      `n(O<sub>2</sub>) = 4 × (1/2) = <b>2 mol</b>.`
    ]
  },
  {
    q: `N<sub>2</sub> + 3H<sub>2</sub> → 2NH<sub>3</sub> tepkimesine 6 mol H<sub>2</sub> verilirse kaç mol NH<sub>3</sub> oluşur?`,
    opts: [`6 mol`, `2 mol`, `8 mol`, `4 mol`],
    correct: 3,
    steps: [
      `Oran H<sub>2</sub> : NH<sub>3</sub> = 3 : 2`,
      `n(NH<sub>3</sub>) = 6 × (2/3) = <b>4 mol</b> (= 68 g).`
    ]
  },
  {
    q: `H<sub>2</sub> ve CH<sub>4</sub> gazlarından oluşan 0,5 mollük karışımın kütlesi 2,4 gramdır. Karışımdaki CH<sub>4</sub>'ün mol yüzdesi kaçtır?`,
    opts: [`%80`, `%50`, `%20`, `%40`],
    correct: 2,
    steps: [
      `CH<sub>4</sub> = x mol olsun → H<sub>2</sub> = (0,5 − x) mol`,
      `Kütle: 2(0,5 − x) + 16x = 2,4`,
      `1 − 2x + 16x = 2,4 → 14x = 1,4 → <b>x = 0,1 mol CH<sub>4</sub></b>`,
      `Mol yüzdesi = 0,1 / 0,5 = <b>%20</b>. (Kütle yüzdesine karıştırma: CH<sub>4</sub> kütlece %67!)`
    ]
  }
];

/* ---------- tema ---------- */
const themeBtn = $("#themeBtn");
function setTheme(t){
  document.documentElement.dataset.theme = t;
  try{ localStorage.setItem("mk-theme", t); }catch(e){}
}
try{
  const saved = localStorage.getItem("mk-theme");
  if (saved) setTheme(saved);
}catch(e){}
themeBtn.addEventListener("click", () => {
  setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

/* ---------- scroll progress ---------- */
const bar = $("#progressBar");
addEventListener("scroll", () => {
  const h = document.documentElement;
  const max = h.scrollHeight - h.clientHeight;
  bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
}, { passive:true });

/* ---------- aktif nav ---------- */
const navLinks = $$(".topnav a");
const secMap = new Map();
navLinks.forEach(a => {
  const sec = $(a.getAttribute("href"));
  if (sec) secMap.set(sec, a);
});
const navIO = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting){
      const link = secMap.get(en.target);
      if (link){
        navLinks.forEach(l => l.classList.remove("is-active"));
        link.classList.add("is-active");
      }
    }
  });
}, { rootMargin: "-35% 0px -60% 0px" });
secMap.forEach((_, sec) => navIO.observe(sec));

/* ---------- reveal ---------- */
const revealTargets = $$(".def-card, .example, .trap, .fcard, .mist, .tri-node, .eq-col, .stat, .tips, .ma-table, .q-start");
revealTargets.forEach(el => el.classList.add("reveal"));
const revIO = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting){
      en.target.classList.add("in");
      revIO.unobserve(en.target);
    }
  });
}, { rootMargin: "0px 0px -8% 0px" });
revealTargets.forEach(el => revIO.observe(el));

/* ============================================================
   HESAPLAYICI
   ============================================================ */
const tabs = $$(".calc-tab");
const panes = $$(".calc-pane");
const outEl = {
  kutle:   $("#cOut_kutle"),
  tanecik: $("#cOut_tanecik"),
  hacim:   $("#cOut_hacim"),
  molarite:$("#cOut_molarite")
};
function sayError(mode, msg){
  const el = outEl[mode];
  el.textContent = msg;
  el.classList.add("err", "has-val");
}
function say(mode, html){
  const el = outEl[mode];
  el.innerHTML = html;
  el.classList.remove("err");
  el.classList.add("has-val");
}
function clearOut(mode){
  const el = outEl[mode];
  el.textContent = "";
  el.classList.remove("err", "has-val");
}

tabs.forEach(t => t.addEventListener("click", () => {
  tabs.forEach(x => x.classList.remove("is-active"));
  panes.forEach(p => p.classList.remove("is-active"));
  t.classList.add("is-active");
  const pane = $(`.calc-pane[data-pane="${t.dataset.mode}"]`);
  if (pane) pane.classList.add("is-active");
}));

/* hızlı molar kütle seçimi */
$("#cIn_maPick").addEventListener("change", e => {
  if (e.target.value){ $("#cIn_ma").value = e.target.value; }
});

function runCalc(mode){
  if (mode === "kutle"){
    const m  = parseFloat($("#cIn_g").value);
    const ma = parseFloat($("#cIn_ma").value);
    if (isNaN(m) || isNaN(ma) || m < 0 || ma <= 0){
      sayError(mode, "Kütle ve molar kütle değerlerini kontrol et — ikisi de sayı, molar kütle sıfırdan büyük olmalı."); return;
    }
    const n = m / ma;
    say(mode, `n = ${fmt(n)} mol &nbsp;·&nbsp; tanecik N = ${sci(n * NA)}`);
  }
  else if (mode === "tanecik"){
    const n = parseFloat($("#cIn_n").value);
    const tur = $("#cIn_tur").value;
    if (isNaN(n) || n < 0){
      sayError(mode, "Mol sayısını gir (0,5 gibi — ondalık virgülle değil nokta ile: 0.5)."); return;
    }
    say(mode, `N = ${fmt(n)} × 6,02×10<sup>23</sup> = <b>${sci(n * NA)} ${tur}</b>`);
  }
  else if (mode === "hacim"){
    const v = rawVal("#cIn_v");
    const n = rawVal("#cIn_n2");
    if ((v !== null && isNaN(v)) || (n !== null && isNaN(n))){
      sayError(mode, "Girilen değer sayı değil — kontrol et (ondalık için nokta kullan: 0.5)."); return;
    }
    if (v !== null && n !== null){
      sayError(mode, "İkisini birden doldurma — bir tanesini boş bırak, diğeri hesaplanır."); return;
    }
    if (v !== null){
      if (v < 0){ sayError(mode, "Hacim negatif olamaz."); return; }
      const mol = v / VM;
      say(mode, `n = ${fmt(v)} / 22,4 = <b>${fmt(mol)} mol</b> &nbsp;·&nbsp; tanecik N = ${sci(mol * NA)}`);
    }
    else if (n !== null){
      if (n < 0){ sayError(mode, "Mol negatif olamaz."); return; }
      say(mode, `V<sub>NK</sub> = ${fmt(n)} × 22,4 = <b>${fmt(n * VM)} L</b>`);
    }
    else{
      sayError(mode, "Hacmi ya da molü gir — diğerinden biri boş kalsın.");
    }
  }
  else { /* molarite */
    const n = parseFloat($("#cIn_n3").value);
    const v = parseFloat($("#cIn_v2").value);
    if (isNaN(n) || isNaN(v) || n < 0 || v <= 0){
      sayError(mode, "Mol sayısını ve hacmi litre cinsinden gir (250 mL → 0.25). Hacim sıfırdan büyük olmalı."); return;
    }
    say(mode, `M = ${fmt(n)} / ${fmt(v)} = <b>${fmt(n / v)} mol/L</b>`);
  }
}
/* "boş mu doldu mu" — NaN yerine null dönen küçük wrap */
function rawVal(sel){
  const raw = $(sel).value.trim();
  if (raw === "") return null;
  const x = parseFloat(raw);
  return isNaN(x) ? NaN : x;
}

$$(".calc-go").forEach(b => b.addEventListener("click", () => runCalc(b.dataset.go)));
$$(".calc-pane input").forEach(i => i.addEventListener("keydown", e => {
  if (e.key === "Enter"){
    const pane = i.closest(".calc-pane");
    const btn = pane && pane.querySelector(".calc-go");
    if (btn) btn.click();
  }
}));

/* ============================================================
   TEST
   ============================================================ */
const quizData = {
  card:   $("#quizCard"),
  top:    $("#quizTop"),
  start:  $("#quizStart"),
  startBtn:$("#quizStartBtn"),
  prog:   $("#quizProgFill"),
  pos:    $("#quizPos"),
  score:  $("#quizScore")
};
let qi = 0, correctCount = 0, answered = false;

function renderQuestion(){
  answered = false;
  const q = QUESTIONS[qi];
  quizData.card.innerHTML = `
    <p class="q-head">Soru ${qi + 1} / ${QUESTIONS.length}</p>
    <p class="q-text">${q.q}</p>
    <div class="q-opts">
      ${q.opts.map((o, ix) => `
        <button type="button" class="q-opt" data-ix="${ix}"><span class="q-key">${"ABCD"[ix]}</span><span>${o}</span></button>
      `).join("")}
    </div>
  `;
  quizData.prog.style.width = `${(qi / QUESTIONS.length) * 100}%`;
  quizData.pos.textContent = qi + 1;
  quizData.card.classList.remove("is-entering");
  void quizData.card.offsetWidth;   /* reflow → animasyonu yeniden tetikle */
  quizData.card.classList.add("is-entering");
  $$(".q-opt", quizData.card).forEach(btn => {
    btn.addEventListener("click", () => onAnswer(parseInt(btn.dataset.ix, 10), btn));
  });
}

function onAnswer(ix, btn){
  if (answered) return;
  answered = true;
  const q = QUESTIONS[qi];
  const opts = $$(".q-opt", quizData.card);
  opts.forEach(o => (o.disabled = true));
  const ok = ix === q.correct;
  if (ok) correctCount++;
  opts[q.correct].classList.add("is-right");
  if (!ok) btn.classList.add("is-wrong");
  quizData.score.textContent = correctCount;

  const stepsHtml = q.steps.map(s => `<li>${s}</li>`).join("");
  const verdict = ok
    ? `<p class="q-verdict ok">Doğru!</p>`
    : `<p class="q-verdict no">Yanlış — doğru cevap ${"ABCD"[q.correct]} seçeneği.</p>`;
  const isLast = qi === QUESTIONS.length - 1;
  const nextLabel = isLast ? "Sonuçları gör" : "Sonraki soru →";

  const soln = document.createElement("div");
  soln.className = "q-soln";
  soln.innerHTML = `${verdict}<ul class="steps">${stepsHtml}</ul>
    <button type="button" class="btn btn-solid q-next">${nextLabel}</button>`;
  quizData.card.appendChild(soln);
  soln.querySelector(".q-next").addEventListener("click", () => {
    if (isLast) renderDone();
    else { qi++; renderQuestion(); }
  });
  quizData.prog.style.width = `${((qi + 1) / QUESTIONS.length) * 100}%`;
}

function renderDone(){
  const pct = Math.round((correctCount / QUESTIONS.length) * 100);
  let note;
  if (pct >= 85) note = "Bu tempoyla sınavın mol bölümü tam para. Sık yapılan hatalar bölümünü göz gezdirip geç.";
  else if (pct >= 60) note = "Temel sağlam; tuzaklar (tanecik türü, kütle/mol yüzde ayrımı) üzerinden tekrar yap.";
  else note = "Panik yok — 03 · 04 · 05 bölümlerinden başlayarak üçgeni pekiştir, sonra tur tekrar.";
  quizData.top.hidden = true;
  quizData.card.innerHTML = `
    <div class="q-done-panel">
      <span class="q-score-big">${correctCount} / ${QUESTIONS.length}</span>
      <p class="q-note">${note} (${pct}%)</p>
      <button type="button" class="btn btn-solid" id="quizRestart">Tekrar başlat</button>
      <p class="q-note" style="margin-top:14px"><a href="#hatalar">Sık yapılan hatalara dön →</a></p>
    </div>
  `;
  $("#quizRestart").addEventListener("click", startQuiz);
}

function startQuiz(){
  qi = 0; correctCount = 0;
  quizData.score.textContent = "0";
  quizData.top.hidden = false;
  quizData.start.hidden = true;
  renderQuestion();
}
quizData.startBtn.addEventListener("click", startQuiz);
