document.addEventListener('DOMContentLoaded', () => {
    console.log(">>> SISTEMA INICIADO.");

    // --- PESQUISA ---
    const searchInput = document.querySelector('.search-txt');
    const cards = document.querySelectorAll('.card');
    const noResultsMsg = document.getElementById('no-results');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchValue = e.target.value.toLowerCase();
            let hasResults = false;
            
            if(searchValue.length > 0) showScreen('home-screen');

            cards.forEach(card => {
                const name = card.getAttribute('data-name');
                if (name.includes(searchValue)) {
                    card.style.display = "flex";
                    hasResults = true;
                } else {
                    card.style.display = "none";
                }
            });
            if (noResultsMsg) noResultsMsg.style.display = hasResults ? "none" : "block";
        });
    }

    // --- MODO ESCURO ---
    const themeBtn = document.getElementById('theme-toggle');
    const body = document.body;
    
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
        themeBtn.textContent = '☀️';
    }

    themeBtn.onclick = () => {
        body.classList.toggle('dark-mode');
        if (body.classList.contains('dark-mode')) {
            themeBtn.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
        } else {
            themeBtn.textContent = '🌙';
            localStorage.setItem('theme', 'light');
        }
    }

    // --- CARROSSEL ---
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    
    function showSlide(n) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        currentSlide = (n + slides.length) % slides.length;
        
        slides[currentSlide].classList.add('active');
        if(dots[currentSlide]) dots[currentSlide].classList.add('active');
    }

    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    if(prevBtn) prevBtn.onclick = () => showSlide(currentSlide - 1);
    if(nextBtn) nextBtn.onclick = () => showSlide(currentSlide + 1);
    
    window.goToSlide = function(n) { showSlide(n); }
    setInterval(() => showSlide(currentSlide + 1), 5000); // Auto-play

    // --- MODAIS ---
    const openBtns = document.querySelectorAll('.open-modal');
    const closeBtns = document.querySelectorAll('.close-modal');
    const closeActions = document.querySelectorAll('.close-action');
    const overlays = document.querySelectorAll('.modal-overlay');

    openBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = btn.getAttribute('data-modal');
            document.getElementById(id).classList.add('active');
        });
    });

    // Função única para fechar qualquer modal aberto
    function closeAllModals() {
        overlays.forEach(m => m.classList.remove('active'));
    }

    closeBtns.forEach(btn => btn.onclick = closeAllModals);
    closeActions.forEach(btn => btn.onclick = closeAllModals);
    overlays.forEach(overlay => {
        overlay.onclick = (e) => { if(e.target === overlay) closeAllModals(); }
    });

    // --- QUIZ DATA & LOGIC ---
    const correctAudio = document.getElementById('correct-sound');
    const incorrectAudio = document.getElementById('incorrect-sound');

    // BANCO DE DADOS (Substitui o questions.js antigo)
    const database = {
        html: [
            { q: "Qual tag é usada para fazer a conexão com o arquivo CSS externo?", options: ["<style>", "<link>", "<script>"], answer: 1 },
            { q: "Qual atributo do HTML é essencial para o JavaScript selecionar um elemento específico?", options: ["class", "name", "id"], answer: 2 },
            { q: "Qual tag define o conteúdo principal visível de uma página?", options: ["<head>", "<body>", "<main>"], answer: 1 },
            { q: "Qual tag cria o maior título?", options: ["<h6>", "<h1>", "<head>"], answer: 1 },
            { q: "Qual tag cria uma quebra de linha?", options: ["<lb>", "<break>", "<br>"], answer: 2 }
        ],
        css: [
            { q: "Qual propriedade cria espaço exterior entre um elemento e seus vizinhos?", options: ["padding", "border", "margin"], answer: 2 },
            { q: "Qual valor de display coloca elementos um ao lado do outro?", options: ["block", "inline-block", "grid"], answer: 1 },
            { q: "Qual propriedade combinada com transition cria efeito de zoom?", options: ["position", "opacity", "transform"], answer: 2 },
            { q: "Qual propriedade muda a cor de fundo?", options: ["bgcolor", "background-color", "color"], answer: 1 },
            { q: "Como comentar em CSS?", options: ["// com", "/* com */", "' com"], answer: 1 }
        ],
        js: [
            { q: "Qual método cria novos elementos HTML?", options: ["getElementById()", "createElement()", "appendChild()"], answer: 1 },
            { q: "Qual a finalidade da Arrow Function () => ?", options: ["Criar Array", "Sintaxe curta de função", "Loop"], answer: 1 },
            { q: "O que o addEventListener() faz?", options: ["Muda cor", "Cria variável", "Escuta eventos"], answer: 2 },
            { q: "Qual método anexa um elemento filho a um pai?", options: ["remove()", "appendChild()", "insert()"], answer: 1 },
            { q: "Como exibir um alerta?", options: ["msg()", "alert()", "popup()"], answer: 1 }
        ]
    };

    // Navegação
    const screens = {
        'home-screen': document.getElementById('home-screen'),
        'quiz-screen': document.getElementById('quiz-screen'),
        'result-screen': document.getElementById('result-screen')
    };

    const ui = {
        badge: document.getElementById('category-badge'),
        score: document.getElementById('score-display'),
        text: document.getElementById('question-text'),
        options: document.getElementById('options-container'),
        counter: document.getElementById('question-counter'),
        next: document.getElementById('next-btn'),
        bar: document.getElementById('progress-fill'),
        finalScore: document.getElementById('final-score'),
        totalQ: document.getElementById('total-questions'),
        circle: document.querySelector('.progress-ring__circle'),
        percent: document.querySelector('.progress-value')
    };

    let currentQ = [];
    let qIndex = 0;
    let score = 0;

    function resetBg() {
        document.body.classList.remove('correct-bg', 'incorrect-bg');
    }

    window.showScreen = function(name) {
        resetBg();
        Object.values(screens).forEach(s => s.classList.remove('active'));
        if(screens[name]) screens[name].classList.add('active');
    }

    window.startGame = function(cat) {
        if(!database[cat]) return;
        currentQ = database[cat];
        qIndex = 0;
        score = 0;
        ui.badge.textContent = cat.toUpperCase();
        showScreen('quiz-screen');
        loadQuestion();
    }

    function loadQuestion() {
        resetBg();
        const q = currentQ[qIndex];
        ui.text.textContent = `${qIndex + 1}. ${q.q}`;
        ui.score.textContent = `Score: ${score}`;
        ui.counter.textContent = `${qIndex + 1} / ${currentQ.length}`;
        ui.bar.style.width = `${((qIndex) / currentQ.length) * 100}%`;
        
        ui.options.innerHTML = '';
        ui.next.disabled = true;
        ui.next.textContent = "Escolha uma opção";

        q.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'option';
            btn.textContent = opt;
            btn.onclick = () => check(btn, i);
            ui.options.appendChild(btn);
        });
    }

    function check(btn, i) {
        const correct = currentQ[qIndex].answer;
        const opts = ui.options.children;
        
        if(i === correct) {
            score++;
            btn.classList.add('correct');
            document.body.classList.add('correct-bg');
            if(correctAudio) correctAudio.play();
        } else {
            btn.classList.add('incorrect');
            opts[correct].classList.add('correct');
            document.body.classList.add('incorrect-bg');
            if(incorrectAudio) incorrectAudio.play();
        }

        for(let o of opts) { o.classList.add('disabled'); o.onclick = null; }
        ui.next.disabled = false;
        ui.next.textContent = "Próxima →";
    }

    ui.next.onclick = () => {
        if(qIndex < currentQ.length - 1) {
            qIndex++;
            loadQuestion();
        } else {
            finish();
        }
    };

    function finish() {
        resetBg();
        ui.finalScore.textContent = score;
        ui.totalQ.textContent = currentQ.length;
        ui.bar.style.width = '100%';
        
        const pct = Math.round((score / currentQ.length) * 100);
        ui.percent.textContent = `${pct}%`;
        
        const r = 70;
        const c = 2 * Math.PI * r;
        const offset = c - (pct / 100) * c;
        if(ui.circle) {
            ui.circle.style.strokeDasharray = `${c} ${c}`;
            ui.circle.style.strokeDashoffset = offset;
        }
        showScreen('result-screen');
    }

    document.getElementById('restart-btn').onclick = () => showScreen('home-screen');
    document.getElementById('home-btn').onclick = () => showScreen('home-screen');
});