// ===== LOADING =====
export class LoadingScene extends Phaser.Scene {
    constructor() {
        super("LoadingScene");
    }

    create() {
        this.add.rectangle(400, 300, 800, 600, 0x000000);

        this.add.text(260, 180, "ARENA: ADAPT", {
            fontSize: '40px',
            fill: '#00ffcc'
        });

        let percentText = this.add.text(380, 300, "0%", {
            fontSize: '20px',
            fill: '#00ffcc'
        });

        let bar = this.add.rectangle(190, 350, 0, 30, 0x00ffcc)
            .setOrigin(0, 0.5);

        let progress = { value: 0 };

        this.tweens.add({
            targets: progress,
            value: 100,
            duration: 2000,
            onUpdate: () => {
                let val = Math.floor(progress.value);
                bar.width = 4.2 * val;
                percentText.setText(val + "%");
            },
            onComplete: () => {
                this.scene.start("MenuScene");
            }
        });
    }
}

// ===== MENU =====
export class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
        this.playerChoice = 'player';
    }

    preload() {
        this.load.image('player', 'assets/player.png');
        this.load.image('enemy', 'assets/enemy.png');
        this.load.image('bg', 'assets/bg.png');
    }

    create() {
        this.add.rectangle(400, 300, 800, 600, 0x111111);

        this.add.text(220, 120, "ARENA: ADAPT", {
            fontSize: '48px',
            fill: '#00ffcc'
        });

        let start = this.add.text(320, 260, "▶ START GAME", {
            fontSize: '26px',
            fill: '#ffffff'
        }).setInteractive();

        start.on('pointerover', () => start.setStyle({ fill: '#00ff00' }));
        start.on('pointerout', () => start.setStyle({ fill: '#ffffff' }));

        start.on('pointerdown', () => {
            this.scene.start('GameScene', {
                character: this.playerChoice,
                level: 1
            });
        });

        let char = this.add.text(300, 340, "Change Character", {
            fontSize: '20px',
            fill: '#aaaaaa'
        }).setInteractive();

        char.on('pointerdown', () => {
            this.playerChoice =
                this.playerChoice === 'player' ? 'enemy' : 'player';
        });
    }
}

// ===== GAME =====
export class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }

    init(data) {
        this.character = data.character;
        this.level = data.level || 1;
        this.score = 0;
        this.health = 100;
        this.enemies = [];
        this.lastHitTime = 0;
    }

    create() {
        this.add.image(400, 300, 'bg').setDisplaySize(800, 600);

        this.player = this.physics.add.sprite(400, 300, this.character);
        this.player.setDisplaySize(80, 80);
        this.player.setCollideWorldBounds(true);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.attackKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );

        this.scoreText = this.add.text(10, 10, "Score: 0", { fill: '#fff' });
        this.healthText = this.add.text(10, 40, "Health: 100", { fill: '#fff' });

        for (let i = 0; i < this.level + 2; i++) {
            this.spawnEnemy();
        }
    }

    spawnEnemy() {
        let enemy = this.physics.add.sprite(
            Phaser.Math.Between(50, 750),
            Phaser.Math.Between(50, 550),
            'enemy'
        );

        enemy.setDisplaySize(70, 70);
        enemy.health = 2 + this.level;

        this.enemies.push(enemy);
    }

    update() {
        const speed = 200;
        this.player.setVelocity(0);

        if (this.cursors.left.isDown) this.player.setVelocityX(-speed);
        if (this.cursors.right.isDown) this.player.setVelocityX(speed);
        if (this.cursors.up.isDown) this.player.setVelocityY(-speed);
        if (this.cursors.down.isDown) this.player.setVelocityY(speed);

        this.enemies.forEach((enemy, i) => {

            this.physics.moveTo(enemy, this.player.x, this.player.y, 120);

            let dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                enemy.x, enemy.y
            );

            let now = this.time.now;

            if (dist < 60 && now - this.lastHitTime > 700) {
                this.health -= 10;
                this.lastHitTime = now;

                this.player.setTint(0xff0000);
                this.time.delayedCall(100, () => this.player.clearTint());

                this.healthText.setText("Health: " + this.health);
            }
        });

        // ATTACK
        if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {

            let circle = this.add.circle(this.player.x, this.player.y, 70, 0xff0000, 0.3);
            this.time.delayedCall(100, () => circle.destroy());

            this.enemies.forEach((enemy, i) => {
                let dist = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y,
                    enemy.x, enemy.y
                );

                if (dist < 100) {
                    enemy.health--;

                    if (enemy.health <= 0) {
                        enemy.destroy();
                        this.enemies.splice(i, 1);

                        this.score += 10;
                        this.scoreText.setText("Score: " + this.score);

                        this.spawnEnemy();
                    }
                }
            });
        }

        if (this.health <= 0) {
            this.scene.start("GameOverScene", { score: this.score });
        }
    }
}

// ===== GAME OVER =====
export class GameOverScene extends Phaser.Scene {
    constructor() {
        super("GameOverScene");
    }

    init(data) {
        this.score = data.score;
        let high = localStorage.getItem("highscore") || 0;

        if (this.score > high) {
            localStorage.setItem("highscore", this.score);
            high = this.score;
        }

        this.highscore = high;
    }

    create() {
        this.add.text(280, 200, "GAME OVER", { fontSize: '32px', fill: '#f00' });
        this.add.text(300, 260, "Score: " + this.score, { fill: '#fff' });
        this.add.text(260, 300, "High Score: " + this.highscore, { fill: '#0f0' });

        let restart = this.add.text(300, 360, "RESTART", { fill: '#fff' }).setInteractive();

        restart.on('pointerdown', () => {
            this.scene.start("MenuScene");
        });
    }
}