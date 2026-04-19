import { LoadingScene, MenuScene, GameScene, GameOverScene } from './scene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: { default: 'arcade' },
    scene: [LoadingScene, MenuScene, GameScene, GameOverScene]
};

new Phaser.Game(config);