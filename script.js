// --- Globals ---
let progress = 0;
let syllabusFile = null;
let syllabusBase64 = null;
let syllabusMime = null;
let paperFile = null;
let paperBase64 = null;
let paperMime = null;
let currentView = 'home';
let currentQuestion = '';

// Quiz Globals
let quizData = [];
let currentQuizIndex = 0;
let quizScore = 0;
let quizUserAnswers = [];
// --- Utility: Clean Markdown Formatting ---
function cleanMarkdown(text) {
    if (!text) return '';
    return text
    
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/####\s(.+)/g, '<h4 class="font-bold text-lg mt-4 mb-2">$1</h4>')
        .replace(/###\s(.+)/g, '<h3 class="font-bold text-xl mt-4 mb-2">$1</h3>')
        .replace(/##\s(.+)/g, '<h2 class="font-bold text-2xl mt-4 mb-2">$1</h2>')
        .replace(/\n/g, '<br>');                                         // Line breaks
}

function saveProgress(newVal) {
    localStorage.setItem('study_progress', newVal);
}

window.updateProgress = (val) => { 
    progress = val; 
    updateProgressUI(); 
    saveProgress(val); 
};

window.updateProgress = (val) => { 
    progress = val; 
    updateProgressUI(); 
    saveProgress(val); 
};

window.onload = () => {
    // RESET PROGRESS ON REFRESH
    progress = 0;
    localStorage.removeItem('om_study_progress'); 
    updateProgressUI();

    lucide.createIcons();
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
    }
};



function updateProgressUI() { document.getElementById('progress-text').innerText = Math.round(progress) + '%'; document.getElementById('circle-progress').setAttribute('stroke-dasharray', `${progress}, 100`); }

// File Handling
function handleFileSelect(input, type) { if(input.files[0]) processFile(input.files[0], type); }
function handleDrop(e, type) { e.preventDefault(); document.getElementById(`drop-${type}`).classList.remove('drop-active'); if(e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0], type); }
function processFile(file, type) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const base64 = e.target.result.split(',')[1];
        if (type === 'syllabus') {
            syllabusFile = file; syllabusBase64 = base64; syllabusMime = file.type;
            document.getElementById('syllabus-status').innerHTML = `<span class="text-green-500 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full flex items-center gap-2 text-sm"><i data-lucide="check-circle" class="w-4 h-4"></i> Uploaded</span>`;
            document.getElementById('ai-msg').classList.remove('hidden');
            document.getElementById('drop-syllabus').classList.add('border-green-500', 'bg-green-50', 'dark:bg-green-900/10');
        } else {
            paperFile = file; paperBase64 = base64; paperMime = file.type;
            document.getElementById('paper-status').innerHTML = `<span class="text-green-500 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full flex items-center gap-2 text-sm"><i data-lucide="check-circle" class="w-4 h-4"></i> Uploaded</span>`;
            document.getElementById('drop-paper').classList.add('border-green-500', 'bg-green-50', 'dark:bg-green-900/10');
        }
        checkWarning(); lucide.createIcons();
    };
    reader.readAsDataURL(file);
}
function resetUpload(type) {
    if (type === 'syllabus') {
        syllabusFile = null; syllabusBase64 = null; syllabusMime = null;
        document.getElementById('syllabus-status').innerHTML = `<span class="text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full flex items-center gap-2 text-sm"><i data-lucide="x-circle" class="w-4 h-4"></i> Not Uploaded</span>`;
        document.getElementById('ai-msg').classList.add('hidden');
        document.getElementById('drop-syllabus').classList.remove('border-green-500', 'bg-green-50', 'dark:bg-green-900/10');
    } else {
        paperFile = null; paperBase64 = null; paperMime = null;
        document.getElementById('paper-status').innerHTML = `<span class="text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full flex items-center gap-2 text-sm"><i data-lucide="minus-circle" class="w-4 h-4"></i> None</span>`;
        document.getElementById('drop-paper').classList.remove('border-green-500', 'bg-green-50', 'dark:bg-green-900/10');
    }
    checkWarning(); lucide.createIcons();
}
function checkWarning() { const warning = document.getElementById('syllabus-warning'); (paperFile && !syllabusFile) ? warning.classList.remove('hidden') : warning.classList.add('hidden'); }

function switchTab(tab) {
    const feedbackTab = document.getElementById('tab-feedback');
    const formulaTab = document.getElementById('tab-formula');
    const feedbackView = document.getElementById('view-feedback');
    const formulaView = document.getElementById('view-formula');

    // Reset all tabs to default dark theme style
    [feedbackTab, formulaTab].forEach(t => {
        t.classList.remove('bg-blue-600', 'text-white', 'shadow-sm', 'bg-orange-600'); 
        t.classList.add('text-gray-400', 'hover:text-gray-200'); 
    });

    // Hide all views
    feedbackView.classList.add('hidden');
    formulaView.classList.add('hidden');

    // Show selected tab and apply active styling
    if (tab === 'feedback') {
        feedbackTab.classList.add('bg-blue-600', 'text-white', 'shadow-sm');
        feedbackTab.classList.remove('text-gray-400', 'hover:text-gray-200');
        feedbackView.classList.remove('hidden');
    } else if (tab === 'formula') {
        formulaTab.classList.add('bg-orange-600', 'text-white', 'shadow-sm');
        formulaTab.classList.remove('text-gray-400', 'hover:text-gray-200');
        formulaView.classList.remove('hidden');
        detectFormulas(); 
    }
    
    lucide.createIcons();
}
// --- Navigation ---
function startStudySession() {
    if (!syllabusFile && !paperFile) return alert("⚠️ Please upload Syllabus first!");
    document.getElementById('view-home').classList.add('hidden'); 
    document.getElementById('view-study').classList.remove('hidden'); 
    document.getElementById('view-study').classList.add('flex'); 
    getNewQuestion();
    detectFormulas();
}
function startQuizSetup() {
    if (!syllabusFile && !paperFile) return alert("⚠️ Please upload Syllabus first!");
    document.getElementById('view-home').classList.add('hidden'); document.getElementById('view-quiz').classList.remove('hidden'); document.getElementById('view-quiz').classList.add('flex'); 
    // Reset Quiz Views
    document.getElementById('quiz-setup').classList.remove('hidden');
    document.getElementById('quiz-active').classList.add('hidden');
    document.getElementById('quiz-results').classList.add('hidden');
}
function goHome() {
    document.getElementById('view-home').classList.remove('hidden');
    document.getElementById('view-study').classList.add('hidden'); document.getElementById('view-study').classList.remove('flex');
    document.getElementById('view-quiz').classList.add('hidden'); document.getElementById('view-quiz').classList.remove('flex');
}

// --- API ---
const API_KEY = "sigma"; 
const API_URL = "https://parthsadaria-lokiai.hf.space/chat/completions";

async function fetchFromAI(messages, retryTextOnly = false) {
    const payload = { model: "gemini-2.5-flash", messages: messages };
    if (retryTextOnly) { payload.messages = payload.messages.map(m => ({ role: m.role, content: Array.isArray(m.content) ? m.content.filter(c => c.type === 'text')[0].text : m.content })); }
    const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': API_KEY }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return await response.json();
}

// --- Study Logic ---
async function getNewQuestion() {
    const qBox = document.getElementById('q-text'); const spinner = document.getElementById('loading-spinner');
    qBox.innerText = "Generating conceptual question..."; spinner.classList.remove('hidden'); document.getElementById('feedback-area').classList.add('hidden'); document.getElementById('feedback-placeholder').classList.remove('hidden'); document.getElementById('user-answer').value = '';
    let promptText = "bro you have to Ask only 1 Qestion Related to sylabus or Exam topic Should be Radom . , you only have to write Qestion not Answer only Qestion no other text";
    let content = [{ type: "text", text: promptText }];
    if (syllabusBase64) content.push({ type: "image_url", image_url: { url: `data:${syllabusMime};base64,${syllabusBase64}` } });
    try { 
        const data = await fetchFromAI([{ role: "user", content: content }]); 
        currentQuestion = data.choices[0].message.content; 
        qBox.innerHTML = cleanMarkdown(currentQuestion);
        if (window.renderMathInElement) renderMathInElement(qBox);
    } 
    catch (e) { 
        if (syllabusBase64) { try { const fb = await fetchFromAI([{ role: "user", content: content }], true); currentQuestion = fb.choices[0].message.content; qBox.innerText = currentQuestion; } catch(ex){ qBox.innerText = "Error: API/Network"; } } else { qBox.innerText = "Error: " + e.message; }
    } finally { spinner.classList.add('hidden'); }
}
async function submitAnswer() {
    const ans = document.getElementById('user-answer').value; if (!ans) return alert("Write an answer!");
    const btn = document.getElementById('btn-submit'); const oldTxt = btn.innerHTML; btn.innerHTML = `Checking... <i data-lucide="loader" class="w-4 h-4 animate-spin"></i>`; btn.disabled = true;
    try {
        const data = await fetchFromAI([{ role: "user", content: `Q: ${currentQuestion}\nAns: ${ans}\nEvaluate strictly. Format: Score: X/10 \n Feedback: ...` }]);
        const text = data.choices[0].message.content; let score = "5"; const m = text.match(/(\d+)\/10/); if (m) score = m[1];
document.getElementById('fb-score').innerText = score; 
document.getElementById('fb-text').innerHTML = cleanMarkdown(text);
        document.getElementById('feedback-placeholder').classList.add('hidden'); document.getElementById('feedback-area').classList.remove('hidden');
        window.updateProgress(Math.min(100, progress + (parseInt(score)/10)*2));
    } catch (e) { alert("Error: " + e.message); } finally { btn.innerHTML = oldTxt; btn.disabled = false; }
}

// --- QUIZ LOGIC ---
async function generateQuiz() {
    const count = document.getElementById('quiz-count').value;
    const diff = document.getElementById('quiz-diff').value;
    const btn = document.getElementById('btn-gen-quiz');
    
    btn.innerHTML = `Generating... <i data-lucide="loader" class="w-5 h-5 animate-spin"></i>`;
    btn.disabled = true;

    // Prompt Engineering
    let promptText = `Generate ${count} Multiple Choice Questions on the attached content. Difficulty: ${diff}. 
    Strictly output a valid JSON Array. Format: [{"q": "Question Text", "options": ["A", "B", "C", "D"], "correct": 0}] (0-3 index).
    Ensure all 4 options have similar text length to make it tricky. No markdown, just JSON.umm ask question related to syllabus only , question will help in Improving general knowledge`;

    let content = [{ type: "text", text: promptText }];
    if (syllabusBase64) content.push({ type: "image_url", image_url: { url: `data:${syllabusMime};base64,${syllabusBase64}` } });
    if (paperBase64) content.push({ type: "image_url", image_url: { url: `data:${paperMime};base64,${paperBase64}` } });

    try {
        // Attempt to fetch quiz
        let data = await fetchFromAI([{ role: "user", content: content }]);
        let rawText = data.choices[0].message.content;
        
        // Clean JSON
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        quizData = JSON.parse(rawText);

        if(!Array.isArray(quizData)) throw new Error("Invalid JSON array");

        // Start Quiz
        currentQuizIndex = 0;
        quizScore = 0;
        document.getElementById('quiz-setup').classList.add('hidden');
        document.getElementById('quiz-active').classList.remove('hidden');
        renderQuizQuestion();

    } catch (e) {
        console.error(e);
        // Fallback for text-only if image failed
        try {
             let data = await fetchFromAI([{ role: "user", content: content }], true);
             let rawText = data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
             quizData = JSON.parse(rawText);
             currentQuizIndex = 0; quizScore = 0;
             document.getElementById('quiz-setup').classList.add('hidden');
             document.getElementById('quiz-active').classList.remove('hidden');
             renderQuizQuestion();
        } catch(ex) {
            alert("Failed to generate valid quiz. Try fewer questions or check content.");
        }
    } finally {
        btn.innerHTML = `Generate Quiz <i data-lucide="sparkles" class="w-5 h-5"></i>`;
        btn.disabled = false;
    }
}

function renderQuizQuestion() {
    const q = quizData[currentQuizIndex];
    document.getElementById('quiz-q-num').innerText = currentQuizIndex + 1;
    document.getElementById('quiz-question-text').innerHTML = cleanMarkdown(q.q);
    
    const optionsContainer = document.getElementById('quiz-options');
    optionsContainer.innerHTML = '';

    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        const letters = ['A', 'B', 'C', 'D'];
        btn.className = "option-btn w-full p-6 md:p-8 rounded-2xl border-2 border-gray-600 dark:border-gray-600 bg-gray-800 dark:bg-gray-900 text-left text-lg md:text-xl font-medium hover:shadow-md transition duration-200 flex items-center gap-5 min-h-[100px]";
        btn.innerHTML = `<span class="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xl md:text-2xl">${letters[idx]}</span><span class="text-gray-200 leading-relaxed">${opt}</span>`;
        btn.onclick = () => handleOptionClick(idx, btn);
        optionsContainer.appendChild(btn);
    });

    document.getElementById('btn-quiz-next').classList.add('hidden');
}
// --- Dev Modal Logic ---
function toggleDevModal() {
    const modal = document.getElementById('dev-modal');
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        // Re-render icons inside modal just in case
        lucide.createIcons();
    } else {
        modal.classList.add('hidden');
    }
}
function handleOptionClick(selectedIdx, btnElem) {
    const q = quizData[currentQuizIndex];
    const allBtns = document.querySelectorAll('.option-btn');
    
    // Disable all buttons
    allBtns.forEach(btn => btn.disabled = true);

    // Highlight Correct/Incorrect
    if (selectedIdx === q.correct) {
        btnElem.classList.add('bg-green-100', 'border-green-500', 'text-green-800', 'dark:bg-green-900', 'dark:text-green-200');
        quizScore++;
    } else {
        btnElem.classList.add('bg-red-100', 'border-red-500', 'text-red-800', 'dark:bg-red-900', 'dark:text-red-200');
        // Show correct answer
        allBtns[q.correct].classList.add('bg-green-100', 'border-green-500', 'text-green-800', 'dark:bg-green-900', 'dark:text-green-200');
    }

    // Show Next Button
    const nextBtn = document.getElementById('btn-quiz-next');
    nextBtn.classList.remove('hidden');
    
    if (currentQuizIndex === quizData.length - 1) {
    nextBtn.innerHTML = `Finish Quiz <i data-lucide="trophy" class="w-4 h-4 inline ml-2"></i>`;
    nextBtn.className = 'w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition shadow-lg animate-pulse';
    nextBtn.onclick = finishQuiz;
} else {
    nextBtn.innerHTML = `Next Question <i data-lucide="arrow-right" class="w-4 h-4 inline ml-2"></i>`;
    nextBtn.className = 'w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition shadow-lg hover:shadow-purple-500/50 hover:-translate-y-1';
    nextBtn.onclick = nextQuizQuestion;
}
}

function nextQuizQuestion() {
    currentQuizIndex++;
    renderQuizQuestion();
}

function finishQuiz() {
    document.getElementById('quiz-active').classList.add('hidden');
    document.getElementById('quiz-results').classList.remove('hidden');
    document.getElementById('quiz-final-score').innerText = `${quizScore}/${quizData.length}`;

    // Update progress based on quiz performance and length
    let progressIncrease = 0;
    const totalQuestions = quizData.length;

    if (totalQuestions === 5) {
        progressIncrease = 0.5; // 0.5% increase for 5 Qs
    } else if (totalQuestions === 10) {
        progressIncrease = 1; // 1% increase for 10 Qs
    } else if (totalQuestions === 15) {
        progressIncrease = 1.5; // 1.5% increase for 15 Qs
    } else if (totalQuestions === 25) {
        progressIncrease = 2.5; // 2.5% increase for 25 Qs
    } else if (totalQuestions === 50) {
        progressIncrease = 5; // 5% increase for 50 Qs
    }

    // Only boost if score is 50% or more (to prevent boost on very low scores)
    if (quizScore / totalQuestions >= 0.5) {
         window.updateProgress(Math.min(100, progress + progressIncrease));
    }
    
}
// --- Updated Study Logic ---

// New Function: Handles "Idk that Topic" click
async function explainTopic() {
    const btn = document.getElementById('btn-explain');
    const oldTxt = btn.innerHTML;
    btn.innerHTML = `Teaching... <i data-lucide="loader" class="w-4 h-4 animate-spin"></i>`;
    btn.disabled = true;

    try {
        const prompt = `The user does not know the answer to this question: "${currentQuestion}". 
        Please provide a deep, conceptual, and easy-to-understand explanation of this topic. 
        Start with "Here is the concept:" and explain it like a teacher.`;

        const data = await fetchFromAI([{ role: "user", content: prompt }]);
        const explanation = data.choices[0].message.content;
        
        document.getElementById('fb-score').innerText = "0";
        document.getElementById('fb-text').innerHTML = cleanMarkdown(explanation);
        // ✅ REMOVED the fb-topic line
        
        document.getElementById('feedback-placeholder').classList.add('hidden');
        document.getElementById('feedback-area').classList.remove('hidden');

    } catch (e) {
        alert("Error fetching explanation: " + e.message);
    } finally {
        btn.innerHTML = oldTxt;
        btn.disabled = false;
        lucide.createIcons();
    }
}

// Updated Function: Auto-explains if score is low
async function submitAnswer() {
    const ans = document.getElementById('user-answer').value; 
    if (!ans) return alert("Write an answer!");
    
    const btn = document.getElementById('btn-submit'); 
    const oldTxt = btn.innerHTML; 
    btn.innerHTML = `Checking... <i data-lucide="loader" class="w-4 h-4 animate-spin"></i>`; 
    btn.disabled = true;

    try {
        const prompt = `Q: ${currentQuestion}\nAns: ${ans}\n
        Evaluate strictly. Format: Score: X/10 \n Feedback: ... \n
        IMPORTANT: If the score is 5/10 or less, you MUST append a section titled "👨‍🏫 Deep Explanation:" and explain the concept thoroughly for the student.`;

        const data = await fetchFromAI([{ role: "user", content: prompt }]);
        const text = data.choices[0].message.content; 
        
        let score = "5"; 
        const m = text.match(/(\d+)\/10/); 
        if (m) score = m[1];

        document.getElementById('fb-score').innerText = score; 
        document.getElementById('fb-text').innerHTML = cleanMarkdown(text); 
        // ✅ REMOVED the fb-topic line
        
        document.getElementById('feedback-placeholder').classList.add('hidden'); 
        document.getElementById('feedback-area').classList.remove('hidden');
        
        window.updateProgress(Math.min(100, progress + (parseInt(score)/10)*2));
    } catch (e) { 
        alert("Error: " + e.message); 
    } finally { 
        btn.innerHTML = oldTxt; 
        btn.disabled = false; 
        lucide.createIcons();
    }
}
// --- Study Logic ---
// script.js (Final and Complete detectFormulas for KaTeX + Theme)
async function detectFormulas() {
    if (!syllabusBase64) return;
    
    const formulaContent = document.getElementById('formula-content');
    formulaContent.innerHTML = '<div class="flex items-center text-gray-400 text-sm animate-pulse"><i data-lucide="loader" class="w-4 h-4 mr-2 animate-spin"></i><span>Analyzing topics for formulas...</span></div>';
    lucide.createIcons();

    let promptText = `From the given Syllabus Write all need fromulas to Study Sylabus (write Only needed Formuala ,don't write anything else if there is no maths then only write Header Topics )`;

    let content = [{ type: "text", text: promptText }];
    if (syllabusBase64) content.push({ type: "image_url", image_url: { url: `data:${syllabusMime};base64,${syllabusBase64}` } });

    try {
        const data = await fetchFromAI([{ role: "user", content: content }]);
        let formulaText = data.choices[0].message.content.trim();
        
        if (formulaText.toLowerCase().includes('no formula')) {
            formulaContent.innerHTML = '<div class="text-gray-400 text-sm italic">No formulas needed for this syllabus</div>';
        } else {
            const formulas = formulaText.split('\n').filter(f => f.trim().length > 0);
            let html = '<div class="space-y-3">';
           formulas.forEach(formula => {
    let cleanFormula = formula.trim();
    if (cleanFormula.length === 0) return;
    
    html += `<div class="bg-orange-50 dark:bg-orange-900/20 px-4 py-3 rounded-xl border border-orange-200 dark:border-orange-800 font-mono text-sm text-gray-800 dark:text-gray-200">${cleanMarkdown(cleanFormula)}</div>`;
});
            html += '</div>';
            formulaContent.innerHTML = html;
            // IMPORTANT: Calling KaTeX render here
            if (window.renderMathInElement) renderMathInElement(formulaContent);
        }
    } catch (e) {
        formulaContent.innerHTML = '<div class="text-red-400 text-sm">Error detecting formulas</div>';
    }
    lucide.createIcons();
}