const claimInput = document.getElementById('claimInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsSection = document.getElementById('resultsSection');
const meterFill = document.getElementById('meterFill');
const meterLabel = document.getElementById('meterLabel');
const redFlags = document.getElementById('redFlags');
const fallacies = document.getElementById('fallacies');
const context = document.getElementById('context');
const sources = document.getElementById('sources');
const shareBtn = document.getElementById('shareBtn');
const historyList = document.getElementById('historyList');

const HISTORY_KEY = 'bs-detector-history';
let latestResult = null;

const keywordRules = {
  urgency: /shocking|exposed|they don't want you to know|must read|breaking|wake up/i,
  certainty: /always|never|everyone knows|guaranteed|proven once and for all/i,
  conspiracy: /cover-up|deep state|globalist|mainstream media lies/i,
  noSource: /according to experts|people are saying|a friend told me/i,
};

function analyzeClaim(claim) {
  let bsScore = 35;
  const redFlagList = [];
  const fallacyList = [];
  const contextList = [];
  const sourceList = [];

  if (claim.length < 25) {
    bsScore += 15;
    contextList.push('Claim is very short and lacks specifics to verify.');
  }

  if (keywordRules.urgency.test(claim)) {
    bsScore += 18;
    redFlagList.push('Uses hype or urgency language that pushes emotional reaction.');
  }

  if (keywordRules.certainty.test(claim)) {
    bsScore += 15;
    fallacyList.push('Absolute wording suggests overgeneralization.');
  }

  if (keywordRules.conspiracy.test(claim)) {
    bsScore += 20;
    redFlagList.push('Conspiracy framing appears without testable evidence.');
  }

  if (keywordRules.noSource.test(claim) || !/(http|www\.|study|report|data|source)/i.test(claim)) {
    bsScore += 20;
    sourceList.push('No clear citation to high-quality evidence was detected.');
  } else {
    bsScore -= 10;
    sourceList.push('Potential source mention detected; still verify credibility directly.');
  }

  if (/\d/.test(claim) && !/(year|%|percent|study|sample|source)/i.test(claim)) {
    bsScore += 10;
    contextList.push('Numbers are presented without methodological context.');
  }

  if (!/who|what|when|where|how|because|due to/i.test(claim)) {
    contextList.push('Claim does not explain mechanism or causal chain.');
    bsScore += 8;
  }

  if (/(they|them|everyone|nobody)/i.test(claim)) {
    fallacyList.push('Possible vague authority or hasty generalization.');
  }

  if (redFlagList.length === 0) redFlagList.push('No major linguistic red flags detected.');
  if (fallacyList.length === 0) fallacyList.push('No obvious logical fallacy patterns detected.');
  if (contextList.length === 0) contextList.push('Claim includes some context, but external verification is still needed.');

  bsScore = Math.max(0, Math.min(100, bsScore));

  return {
    claim,
    bsScore,
    verdict: verdictFromScore(bsScore),
    redFlagList,
    fallacyList,
    contextList,
    sourceList,
    checkedAt: new Date().toISOString(),
  };
}

function verdictFromScore(score) {
  if (score < 25) return 'Legit-ish ✅';
  if (score < 50) return 'Needs Fact Check 🤔';
  if (score < 75) return 'Suspicious ⚠️';
  return 'Total BS 🚨';
}

function renderList(listEl, items) {
  listEl.innerHTML = '';
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    listEl.appendChild(li);
  });
}

function renderResult(result) {
  resultsSection.classList.remove('hidden');
  meterFill.style.width = `${result.bsScore}%`;
  meterLabel.textContent = `${result.verdict} — BS Score: ${result.bsScore}/100`;

  renderList(redFlags, result.redFlagList);
  renderList(fallacies, result.fallacyList);
  renderList(context, result.contextList);
  renderList(sources, result.sourceList);
}

function saveHistory(result) {
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  history.unshift(result);
  const trimmed = history.slice(0, 30);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  renderHistory(trimmed);
}

function renderHistory(history = null) {
  const checks = history || JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  historyList.innerHTML = '';

  if (checks.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No checks yet. Analyze your first claim above.';
    historyList.appendChild(li);
    return;
  }

  checks.forEach((item) => {
    const li = document.createElement('li');
    const when = new Date(item.checkedAt).toLocaleString();
    li.innerHTML = `<span class="history-score">${item.verdict}</span> (${item.bsScore}/100)<br>${item.claim}<br><small>${when}</small>`;
    historyList.appendChild(li);
  });
}

analyzeBtn.addEventListener('click', () => {
  const claim = claimInput.value.trim();
  if (!claim) {
    alert('Please enter a claim to analyze.');
    return;
  }

  latestResult = analyzeClaim(claim);
  renderResult(latestResult);
  saveHistory(latestResult);
});

shareBtn.addEventListener('click', async () => {
  if (!latestResult) return;

  const text = `BS Detector Verdict: ${latestResult.verdict}\nScore: ${latestResult.bsScore}/100\nClaim: "${latestResult.claim}"`;

  if (navigator.share) {
    await navigator.share({
      title: 'BS Detector Result',
      text,
    });
  } else {
    await navigator.clipboard.writeText(text);
    alert('Result copied to clipboard.');
  }
});

renderHistory();
