class Ball {
    constructor(x, y, radius, color, label) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.radius = radius;
        this.color = color;
        this.label = label;
        this.mass = 1;
    }

    draw(ctx) {
        // 공 그림자
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        ctx.fill();
        ctx.restore();

        // 공 하이라이트
        const gradient = ctx.createRadialGradient(
            this.x - this.radius * 0.3,
            this.y - this.radius * 0.3,
            0,
            this.x,
            this.y,
            this.radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.3, this.color);
        gradient.addColorStop(1, this.darkenColor(this.color));

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // 공 테두리
        ctx.strokeStyle = this.darkenColor(this.color);
        ctx.lineWidth = 2;
        ctx.stroke();

        // 텍스트
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 3;
        
        // 텍스트를 여러 줄로 나누기
        const maxWidth = this.radius * 1.5;
        const words = this.label.split(' ');
        let lines = [];
        let currentLine = '';

        words.forEach(word => {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        if (currentLine) lines.push(currentLine);

        // 최대 2줄만 표시
        lines = lines.slice(0, 2);
        const lineHeight = 14;
        const startY = this.y - (lines.length - 1) * lineHeight / 2;

        lines.forEach((line, i) => {
            ctx.fillText(line, this.x, startY + i * lineHeight);
        });
    }

    darkenColor(color) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 40);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 40);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 40);
        return `rgb(${r}, ${g}, ${b})`;
    }

    update(width, height) {
        this.x += this.vx;
        this.y += this.vy;

        // 벽 충돌
        if (this.x - this.radius < 0 || this.x + this.radius > width) {
            this.vx *= -0.9;
            this.x = this.x - this.radius < 0 ? this.radius : width - this.radius;
        }

        if (this.y - this.radius < 0 || this.y + this.radius > height) {
            this.vy *= -0.9;
            this.y = this.y - this.radius < 0 ? this.radius : height - this.radius;
        }

        // 중력
        this.vy += 0.2;

        // 마찰
        this.vx *= 0.99;
        this.vy *= 0.99;
    }
}

class LotteryMachine {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.drawing = false;
        this.balls = [];
        this.animationId = null;
        this.drawCount = 0;
        
        // 기본 경품 목록
        this.prizes = [
            '1등: 아이폰',
            '2등: 에어팟',
            '3등: 스타벅스',
            '4등: 치킨',
            '5등: 아이스크림',
            '6등: 음료수',
            '꽝',
            '다시 도전'
        ];
        
        // 색상 팔레트
        this.colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
            '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
            '#F8B739', '#52B788', '#FF8FA3', '#99C1DE'
        ];
        
        this.init();
    }

    init() {
        this.resizeCanvas();
        this.loadPrizes();
        this.loadVideoUrl();
        this.createBalls();
        this.setupEventListeners();
        this.animate();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    createBalls() {
        this.balls = [];
        const ballRadius = 30;
        const padding = 50;

        this.prizes.forEach((prize, index) => {
            let x, y;
            let attempts = 0;
            do {
                x = padding + Math.random() * (this.canvas.width - padding * 2);
                y = padding + Math.random() * (this.canvas.height - padding * 2);
                attempts++;
            } while (this.checkCollision(x, y, ballRadius) && attempts < 100);

            const ball = new Ball(
                x, y, ballRadius,
                this.colors[index % this.colors.length],
                prize
            );
            this.balls.push(ball);
        });

        this.updateStats();
    }

    checkCollision(x, y, radius) {
        for (let ball of this.balls) {
            const dx = x - ball.x;
            const dy = y - ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < radius + ball.radius + 10) {
                return true;
            }
        }
        return false;
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 공들 업데이트 및 그리기
        this.balls.forEach(ball => {
            ball.update(this.canvas.width, this.canvas.height);
            ball.draw(this.ctx);
        });

        // 공들 간 충돌 감지
        for (let i = 0; i < this.balls.length; i++) {
            for (let j = i + 1; j < this.balls.length; j++) {
                this.resolveCollision(this.balls[i], this.balls[j]);
            }
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    resolveCollision(ball1, ball2) {
        const dx = ball2.x - ball1.x;
        const dy = ball2.y - ball1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < ball1.radius + ball2.radius) {
            // 충돌 각도
            const angle = Math.atan2(dy, dx);
            
            // 속도 교환 (간단한 물리)
            const sin = Math.sin(angle);
            const cos = Math.cos(angle);
            
            // 회전된 속도
            const vx1 = ball1.vx * cos + ball1.vy * sin;
            const vy1 = ball1.vy * cos - ball1.vx * sin;
            const vx2 = ball2.vx * cos + ball2.vy * sin;
            const vy2 = ball2.vy * cos - ball2.vx * sin;
            
            // 충돌 후 속도 (탄성 충돌)
            const vx1Final = vx2;
            const vx2Final = vx1;
            
            // 원래 좌표로 복원
            ball1.vx = vx1Final * cos - vy1 * sin;
            ball1.vy = vy1 * cos + vx1Final * sin;
            ball2.vx = vx2Final * cos - vy2 * sin;
            ball2.vy = vy2 * cos + vx2Final * sin;
            
            // 겹침 해결
            const overlap = ball1.radius + ball2.radius - distance;
            const moveX = (overlap / 2) * cos;
            const moveY = (overlap / 2) * sin;
            
            ball1.x -= moveX;
            ball1.y -= moveY;
            ball2.x += moveX;
            ball2.y += moveY;
        }
    }

    shakeBalls() {
        this.balls.forEach(ball => {
            ball.vx += (Math.random() - 0.5) * 15;
            ball.vy += (Math.random() - 0.5) * 15;
        });
    }

    async draw() {
        if (this.drawing || this.balls.length === 0) return;
        
        this.drawing = true;
        document.getElementById('drawBtn').disabled = true;
        document.getElementById('result').textContent = '추첨 중...';
        
        // 랜덤으로 공 미리 선택
        const selectedIndex = Math.floor(Math.random() * this.balls.length);
        const selectedBall = this.balls[selectedIndex];
        
        // 영상 재생
        await this.playVideo();
        
        // 영상 끝나고 바로 빛 효과 표시
        await this.showLightEffect();

        // 빛 끝나고 바로 선택된 공 보여주기
        const ballElement = document.getElementById('selectedBall');
        ballElement.style.backgroundColor = selectedBall.color;
        ballElement.textContent = selectedBall.label;
        ballElement.classList.add('show');

        // 결과 표시
        document.getElementById('result').textContent = `🎉 당첨: ${selectedBall.label} 🎉`;
        
        // 선택된 공 제거
        this.balls.splice(selectedIndex, 1);
        
        this.drawCount++;
        this.updateStats();
        
        setTimeout(() => {
            ballElement.classList.remove('show');
            this.drawing = false;
            if (this.balls.length > 0) {
                document.getElementById('drawBtn').disabled = false;
            } else {
                document.getElementById('result').textContent = '모든 경품이 소진되었습니다!';
            }
        }, 3000);
    }

    playVideo() {
        return new Promise((resolve) => {
            const videoOverlay = document.getElementById('videoOverlay');
            const video = document.getElementById('drawVideo');
            
            videoOverlay.classList.add('show');
            video.currentTime = 0;
            video.play();
            
            video.onended = () => {
                videoOverlay.classList.remove('show');
                resolve();
            };
            
            // 영상이 없거나 에러 발생 시 3초 후 자동 종료
            video.onerror = () => {
                setTimeout(() => {
                    videoOverlay.classList.remove('show');
                    resolve();
                }, 3000);
            };
        });
    }

    showLightEffect() {
        return new Promise((resolve) => {
            const lightEffect = document.getElementById('lightEffect');
            lightEffect.classList.add('show');
            
            setTimeout(() => {
                lightEffect.classList.remove('show');
                resolve();
            }, 1500);
        });
    }

    setupEventListeners() {
        document.getElementById('drawBtn').addEventListener('click', () => this.draw());
        document.getElementById('editBtn').addEventListener('click', () => this.openEditModal());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('videoBtn').addEventListener('click', () => this.openVideoModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeEditModal());
        document.getElementById('closeVideoModal').addEventListener('click', () => this.closeVideoModal());
        document.getElementById('addPrizeBtn').addEventListener('click', () => this.addPrize());
        document.getElementById('saveVideoBtn').addEventListener('click', () => this.saveVideo());
        
        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target.id === 'editModal') {
                this.closeEditModal();
            }
        });
        
        document.getElementById('videoModal').addEventListener('click', (e) => {
            if (e.target.id === 'videoModal') {
                this.closeVideoModal();
            }
        });
        
        document.getElementById('videoFile').addEventListener('change', (e) => {
            this.handleVideoFile(e);
        });
    }

    reset() {
        this.drawCount = 0;
        this.createBalls();
        document.getElementById('result').textContent = '추첨 버튼을 눌러주세요!';
        document.getElementById('drawBtn').disabled = false;
    }

    openEditModal() {
        document.getElementById('editModal').classList.add('active');
        this.renderPrizeList();
    }

    closeEditModal() {
        document.getElementById('editModal').classList.remove('active');
        this.savePrizes();
        this.reset();
    }

    renderPrizeList() {
        const listDiv = document.getElementById('prizeList');
        listDiv.innerHTML = '';

        this.prizes.forEach((prize, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'prize-item';
            itemDiv.innerHTML = `
                <input type="text" value="${prize}" data-index="${index}">
                <button onclick="lotteryMachine.removePrize(${index})">삭제</button>
            `;
            listDiv.appendChild(itemDiv);
        });

        listDiv.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.prizes[index] = e.target.value;
            });
        });
    }

    addPrize() {
        this.prizes.push('새로운 경품');
        this.renderPrizeList();
    }

    removePrize(index) {
        if (this.prizes.length > 2) {
            this.prizes.splice(index, 1);
            this.renderPrizeList();
        } else {
            alert('최소 2개의 경품이 필요합니다!');
        }
    }

    savePrizes() {
        localStorage.setItem('lotteryPrizes', JSON.stringify(this.prizes));
    }

    loadPrizes() {
        const saved = localStorage.getItem('lotteryPrizes');
        if (saved) {
            this.prizes = JSON.parse(saved);
        }
    }

    updateStats() {
        document.getElementById('totalBalls').textContent = this.balls.length;
        document.getElementById('drawCount').textContent = this.drawCount;
    }

    openVideoModal() {
        document.getElementById('videoModal').classList.add('active');
        const savedUrl = localStorage.getItem('lotteryVideoUrl');
        if (savedUrl) {
            document.getElementById('videoUrl').value = savedUrl;
        }
    }

    closeVideoModal() {
        document.getElementById('videoModal').classList.remove('active');
    }

    saveVideo() {
        const videoUrl = document.getElementById('videoUrl').value;
        if (videoUrl) {
            localStorage.setItem('lotteryVideoUrl', videoUrl);
            document.getElementById('drawVideo').src = videoUrl;
            alert('영상이 설정되었습니다!');
            this.closeVideoModal();
        }
    }

    handleVideoFile(event) {
        const file = event.target.files[0];
        if (file) {
            const videoUrl = URL.createObjectURL(file);
            document.getElementById('drawVideo').src = videoUrl;
            localStorage.setItem('lotteryVideoUrl', videoUrl);
            document.getElementById('videoUrl').value = '';
        }
    }

    loadVideoUrl() {
        const savedUrl = localStorage.getItem('lotteryVideoUrl');
        if (savedUrl) {
            document.getElementById('drawVideo').src = savedUrl;
        }
    }
}

// 로또 머신 인스턴스 생성
const lotteryMachine = new LotteryMachine();

