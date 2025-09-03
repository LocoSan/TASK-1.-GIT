const difficultySettings = {
    easy: {
        startScore: 100,
        clickPower: 3,
        autoInterval: 800,
        costMultiplier: 1.2
    },
    medium: {
        startScore: 50,
        clickPower: 2,
        autoInterval: 1300,
        costMultiplier: 1.5
    },
    hard: {
        startScore: 10,
        clickPower: 1,
        autoInterval: 2000,
        costMultiplier: 2.0
    }
};

// Создаём объекты Howl
const bgMusic = new Howl({
    src: ['sounds/bg-music.mp3'],
    loop: true,
    volume: 0.2,
});

const clickSound = new Howl({
    src: ['sounds/click.mp3'],
    volume: 0.4,
});

const upgradeSound = new Howl({
    src: ['sounds/upgrade.mp3'],
    volume: 0.4,
});

let lastMouseX = 0;
let lastMouseY = 0;

document.addEventListener('mousemove', (e) => {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

window.addEventListener('DOMContentLoaded', () => {
    //Окнос ложности
    const difficultyModal = document.getElementById('difficultyModal');
    let difficulty = localStorage.getItem('difficulty');

    if (!difficulty) {
        difficultyModal.style.display = 'flex';
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
            localStorage.setItem('difficulty', btn.dataset.diff);
            location.reload();
            });
        });
        return;
    }

    difficultyModal.style.display = 'none';
    const settings = difficultySettings[difficulty];

    const costMultiplier = settings.costMultiplier;
    const autoInterval = settings.autoInterval;

    let score = parseInt(localStorage.getItem('score')) || settings.startScore;
    let clickPower = parseInt(localStorage.getItem('clickPower')) || settings.clickPower;
    let autoIncome = parseInt(localStorage.getItem('autoIncome')) || 0;

    let clickUpgradeCost = parseInt(localStorage.getItem('clickUpgradeCost')) || 10;
    let autoIncomeCost = parseInt(localStorage.getItem('autoIncomeCost')) || 25;

    let clickTimes = [];
    let fastFingerUnlocked = localStorage.getItem('fastFingerUnlocked') === 'true';

    let totalPlayTime = parseInt(localStorage.getItem('totalPlayTime'));

    let lastSessionStart = Date.now();

    const clickBtn = document.getElementById('clickBtn');
    const coinImage = document.getElementById('coinImage');
    const scoreDisplay = document.getElementById('score');
    const clickUpgradeBtn = document.getElementById('clickUpgradeBtn');
    const autoIncomeBtn = document.getElementById('autoIncomeBtn');
    const clickUpgradeCostDisplay = document.getElementById('clickUpgradeCost');
    const autoIncomeCostDisplay = document.getElementById('autoIncomeCost');
    const secretBtn = document.getElementById('secretBtn');
    const playTimeDisplay = document.getElementById('playTime');
    const soundToggleBtn = document.getElementById('soundToggleBtn');

    if (localStorage.getItem('secretUsed') === 'true') secretBtn.disabled = true;
    if (isNaN(totalPlayTime)) totalPlayTime = 0;
    //Звук вкл выкл
    soundToggleBtn.textContent = isSoundEnabled() ? '🔊' : '🔇';
    soundToggleBtn.addEventListener('click', () => {
        const enabled = !isSoundEnabled();
        localStorage.setItem('soundEnabled', enabled);
        soundToggleBtn.textContent = enabled ? '🔊' : '🔇';
        if (enabled) {
            bgMusic.play();
        } 
        else {
            bgMusic.pause();
        }
    });
    //Интервал подсчета времени в игре
    setInterval(() => {
        const total = totalPlayTime + Math.floor((Date.now() - lastSessionStart) / 1000);
        const minutes = Math.floor(total / 60);
        const seconds = total % 60;
        playTimeDisplay.textContent = `Время в игре: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        checkTimeBonus();
    }, 1000);
    //Перед тем, как выгрузить
    window.addEventListener('beforeunload', () => {
        const sessionSeconds = Math.floor((Date.now() - lastSessionStart) / 1000);
        localStorage.setItem('totalPlayTime', totalPlayTime + sessionSeconds);
    });
    //Обновить счёт
    function updateScoreDisplay() {
        scoreDisplay.textContent = `Богатство: ${score}`;
    }
    //Включени ли звук
    function isSoundEnabled() {
        return JSON.parse(localStorage.getItem('soundEnabled') || 'true');
    }
    //Обновление ценника апгрейдов
    function updateUpgradeDisplays() {
        clickUpgradeCostDisplay.textContent = clickUpgradeCost;
        autoIncomeCostDisplay.textContent = autoIncomeCost;
    }
    //Сохранить прогресс
    function saveProgress() {
        localStorage.setItem('score', score);
        localStorage.setItem('clickPower', clickPower);
        localStorage.setItem('clickUpgradeCost', clickUpgradeCost);
        localStorage.setItem('autoIncome', autoIncome);
        localStorage.setItem('autoIncomeCost', autoIncomeCost);
    }
    //Показ достижения
    function showToast(title, text) {
        const toast = document.getElementById('easterEggToast');
        toast.innerHTML = `<strong>${title}</strong><br>${text}`;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 4000);
    }
    //Проверка времени нахождения в игре
    function checkTimeBonus() {
        const totalSeconds = totalPlayTime + Math.floor((Date.now() - lastSessionStart) / 1000);
        const bonusInterval = 20;

        if (totalSeconds > 0 && totalSeconds % bonusInterval === 0) {
            score += 100;
            updateScoreDisplay();
            saveProgress();
            showToast('Время в игре', 'Получено +100 очков за 20 секунд игры!');
        }
    }

    const goldBag = document.getElementById('goldBag');
    const isHidden = window.getComputedStyle(goldBag).display === 'none';
    let escapeInterval = null;
    let bagTimeout = null;
    
    //Показать мешочек с золотом
    function showGoldBag() {
        const coinImageRect = coinImage.getBoundingClientRect();

        // Рандомная позиция в пределах кучи богатств
        const offsetX = Math.random() * (coinImage.offsetWidth - 40);
        const offsetY = Math.random() * (coinImage.offsetHeight - 40);

        goldBag.style.left = `${coinImageRect.left + offsetX}px`;
        goldBag.style.top = `${coinImageRect.top + offsetY}px`;
        goldBag.style.display = 'block';

        if (escapeInterval) clearInterval(escapeInterval);

        // Начинаем "убегание"
        escapeInterval = setInterval(() => {
            const bagRect = goldBag.getBoundingClientRect();
            const bagX = bagRect.left + bagRect.width / 2;
            const bagY = bagRect.top + bagRect.height / 2;

            const dx = bagX - lastMouseX;
            const dy = bagY - lastMouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
                const angle = Math.atan2(dy, dx);
                const speed = 5;
                const newX = bagRect.left + speed * Math.cos(angle);
                const newY = bagRect.top + speed * Math.sin(angle);

                goldBag.style.left = `${Math.min(Math.max(newX, 0), window.innerWidth - bagRect.width)}px`;
                goldBag.style.top = `${Math.min(Math.max(newY, 0), window.innerHeight - bagRect.height)}px`;
            }
        }, 30);


        // Запуск "убегания", если игрок не схватил мешочек за 3 секунды
        bagTimeout = setTimeout(() => {
            goldBag.style.display = 'none';
            score = Math.max(0, score - 500); // потеря 100 очков
            clearInterval(escapeInterval);
            updateScoreDisplay();
            showToast('Ой!', 'Ты не поймал мешочек, плакали твои 500 монет!');
        }, 3000);
    }

    // Запуск появления мешочка каждые 10–20 секунд
    setInterval(() => {
        if (isHidden) {
            showGoldBag();
        }
    }, 10000 + Math.random() * 10000);

    let isDragging = false;
    let offsetX, offsetY;

    goldBag.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
        clearTimeout(bagTimeout);
        const rect = goldBag.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        goldBag.style.left = `${e.clientX - offsetX}px`;
        goldBag.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;

        const bagRect = goldBag.getBoundingClientRect();
        const targetRect = coinImage.getBoundingClientRect();

        const isInsideTarget =
            bagRect.left < targetRect.right &&
            bagRect.right > targetRect.left &&
            bagRect.top < targetRect.bottom &&
            bagRect.bottom > targetRect.top;

        goldBag.style.display = 'none';

        if (isInsideTarget) {
            score += 500;
            updateScoreDisplay();
            saveProgress();
            showToast('Ловко!', 'Ты затащил мешочек! Получено +500 💰');
        } else {
            score = Math.max(0, score - 500);
            clearInterval(escapeInterval);
            updateScoreDisplay();
            saveProgress();
            showToast('Ой!', 'Мешочек убежал. Минус 500 монет!');
        }
    });



    document.getElementById('resetBtn').addEventListener('click', () => {
        localStorage.clear();
        totalPlayTime = 0;
        lastSessionStart = Date.now();
        location.reload();
    });

    document.body.addEventListener('click', () => {
        if (isSoundEnabled() && !bgMusic.playing()) {
            bgMusic.play();
        }
    }, { once: true });

    clickBtn.addEventListener('click', (e) => {
        score += clickPower;
        updateScoreDisplay();
        saveProgress();

        const coin = document.createElement('div');
        coin.classList.add('coin-anim');
        coin.textContent = '💰';

        const rect = clickBtn.getBoundingClientRect();
        if(e.clientX !== 0 && e.clientY !== 0){
            coin.style.left = `${e.clientX - rect.left}px`;
            coin.style.top = `${e.clientY - rect.top}px`;
        }
        if (isSoundEnabled()) {
            clickSound.play();
        }
        clickBtn.appendChild(coin);
        setTimeout(() => coin.remove(), 800);

        scoreDisplay.classList.add('pop');
        setTimeout(() => scoreDisplay.classList.remove('pop'), 300);

        const now = Date.now();
        clickTimes.push(now);
        clickTimes = clickTimes.filter(t => now - t <= 3000);

        if (!fastFingerUnlocked && clickTimes.length >= 25) {
            fastFingerUnlocked = true;
            localStorage.setItem('fastFingerUnlocked', 'true');
            score += 3000;
            updateScoreDisplay();
            saveProgress();
            showToast('Yippee-ki-yay!', 'Самый быстрый палец на диком западе. Держи монету, ковбой! +500');
        }
    });

    clickUpgradeBtn.addEventListener('click', () => {
        if (score >= clickUpgradeCost) {
            score -= clickUpgradeCost;
            clickPower += 10;
            clickUpgradeCost = Math.floor(clickUpgradeCost * costMultiplier);
            if (isSoundEnabled()) {
                upgradeSound.play();
            }
            updateScoreDisplay();
            updateUpgradeDisplays();
            saveProgress();
        }
    });

    autoIncomeBtn.addEventListener('click', () => {
        if (score >= autoIncomeCost) {
            score -= autoIncomeCost;
            autoIncome += 30;
            autoIncomeCost = Math.floor(autoIncomeCost * costMultiplier);
            if (isSoundEnabled()) {
                upgradeSound.play();
            }
            updateScoreDisplay();
            updateUpgradeDisplays();
            saveProgress();
        }
    });

    secretBtn.addEventListener('click', () => {
        if (localStorage.getItem('secretUsed') === 'true') return;
        alert('Ты нашёл секрет! +1000 💰');
        score += 1000;
        localStorage.setItem('secretUsed', 'true');
        secretBtn.disabled = true;
        updateScoreDisplay();
        saveProgress();
    });

    setInterval(() => {
        if (autoIncome > 0) {
            score += autoIncome;
            updateScoreDisplay();
            saveProgress();
        }
    }, autoInterval);

    updateScoreDisplay();
    updateUpgradeDisplays();
});

window.addEventListener('keyup', (event) => {
    if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault();
        const clickBtn = document.getElementById('clickBtn');
        clickBtn.click();
    }
});


