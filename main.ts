enum GameState {
    Menu,
    Arena,
    Victory,
    Defeat,
    Ending
}

const bossRoster = [
    { name: "Mourning Sentinel", maxHp: 90, speed: 20, damage: 8, reward: 120, color: 2 },
    { name: "Ashen Warden", maxHp: 120, speed: 24, damage: 10, reward: 180, color: 3 },
    { name: "Cracked Tyrant", maxHp: 150, speed: 28, damage: 12, reward: 220, color: 4 },
    { name: "GODFALL", maxHp: 200, speed: 32, damage: 14, reward: 400, color: 5 }
]

let gameState = GameState.Menu
let currentBossIndex = 0
let player: Sprite = null
let boss: Sprite = null
let playerHealth = 100
let playerMaxHealth = 100
let stamina = 100
let playerLevel = 1
let currentBossHp = 0
let currentBossMaxHp = 0
let score = 0
let bossPhase = 1
let attackCooldown = 0
let dodgeCooldown = 0
let bossAttackTimer = 0

function clamp(value: number, min: number, max: number): number {
    if (value < min) return min
    if (value > max) return max
    return value
}

function buildHeroSprite(): Image {
    const image = image.create(16, 16)
    image.fill(0)
    image.fillRect(5, 2, 6, 5, 1)
    image.fillRect(4, 7, 8, 5, 1)
    image.fillRect(6, 12, 4, 2, 1)
    image.fillRect(2, 8, 2, 3, 1)
    image.fillRect(12, 8, 2, 3, 1)
    return image
}

function buildBossSprite(color: number): Image {
    const image = image.create(16, 16)
    image.fill(0)
    image.fillRect(3, 2, 10, 4, 2)
    image.fillRect(2, 6, 12, 6, 2)
    image.fillRect(5, 12, 6, 2, color)
    image.fillRect(6, 14, 4, 2, color)
    return image
}

function clearArena(): void {
    for (const sprite of sprites.allOfKind(SpriteKind.Player)) {
        sprite.destroy()
    }
    for (const sprite of sprites.allOfKind(SpriteKind.Enemy)) {
        sprite.destroy()
    }
}

function createPlayer(): void {
    player = sprites.create(buildHeroSprite(), SpriteKind.Player)
    player.setPosition(32, 62)
    player.setStayInScreen(true)
    player.setBounceOnWall(false)
    player.z = 1
}

function createBoss(): void {
    const bossData = bossRoster[currentBossIndex]
    currentBossMaxHp = bossData.maxHp
    currentBossHp = currentBossMaxHp
    bossPhase = 1

    boss = sprites.create(buildBossSprite(bossData.color), SpriteKind.Enemy)
    boss.setPosition(116, 62)
    boss.setStayInScreen(true)
    boss.setBounceOnWall(false)
    boss.z = 1
}

function resetPlayerStats(): void {
    playerMaxHealth = 100 + playerLevel * 10
    playerHealth = playerMaxHealth
    stamina = 100
    attackCooldown = 0
    dodgeCooldown = 0
    bossAttackTimer = 0
    info.setLife(playerHealth)
    info.setScore(score)
}

function beginBattle(): void {
    clearArena()
    createPlayer()
    createBoss()
    resetPlayerStats()
    gameState = GameState.Arena
}

function drawTitleScreen(): void {
    scene.setBackgroundColor(9)
    screen.fillRect(12, 10, 96, 52, 7)
    screen.fillRect(16, 14, 88, 44, 8)
    screen.drawText("GODFALL", 32, 22, 15, 1)
    screen.drawText("Boss Rush", 30, 36, 15, 1)
    screen.drawText("Press A", 40, 52, 15, 1)
}

function drawVictoryScreen(): void {
    screen.fillRect(12, 18, 96, 44, 7)
    screen.drawText("VICTORY", 36, 26, 15, 1)
    screen.drawText(bossRoster[currentBossIndex].name, 16, 38, 15, 1)
    screen.drawText("A to continue", 26, 52, 15, 1)
}

function drawDefeatScreen(): void {
    screen.fillRect(12, 18, 96, 44, 7)
    screen.drawText("DEFEAT", 38, 26, 15, 1)
    screen.drawText("B to retry", 30, 52, 15, 1)
}

function drawEndingScreen(): void {
    screen.fillRect(10, 16, 100, 48, 7)
    screen.drawText("THE END", 38, 24, 15, 1)
    screen.drawText("GODFALL FALLEN", 22, 38, 15, 1)
    screen.drawText("A to return", 33, 52, 15, 1)
}

function awardRewards(): void {
    const reward = bossRoster[currentBossIndex].reward
    score += reward
    playerLevel = clamp(playerLevel + 1, 1, 9)
    info.setScore(score)
}

function finishBattle(victory: boolean): void {
    if (victory) {
        awardRewards()
        if (currentBossIndex >= bossRoster.length - 1) {
            gameState = GameState.Ending
        } else {
            currentBossIndex += 1
            gameState = GameState.Victory
        }
    } else {
        gameState = GameState.Defeat
    }
}

function handleLightAttack(): void {
    if (attackCooldown > 0 || stamina < 12 || gameState != GameState.Arena) return

    attackCooldown = 300
    stamina = clamp(stamina - 12, 0, 100)

    const damage = 7 + playerLevel * 2
    const attackReach = 28
    if (Math.abs(player.x - boss.x) < attackReach && Math.abs(player.y - boss.y) < 24) {
        currentBossHp -= damage
        boss.x += 5
    }
}

function handleHeavyAttack(): void {
    if (attackCooldown > 0 || stamina < 25 || gameState != GameState.Arena) return

    attackCooldown = 650
    stamina = clamp(stamina - 25, 0, 100)

    const damage = 18 + playerLevel * 3
    const attackReach = 38
    if (Math.abs(player.x - boss.x) < attackReach && Math.abs(player.y - boss.y) < 28) {
        currentBossHp -= damage
        boss.x += 8
    }
}

function handleDodge(): void {
    if (dodgeCooldown > 0 || gameState != GameState.Arena) return

    dodgeCooldown = 800
    stamina = clamp(stamina + 20, 0, 100)
    player.x = clamp(player.x + 18, 12, 148)
}

function updatePlayerMovement(): void {
    if (gameState != GameState.Arena) return

    let dx = 0
    let dy = 0
    if (controller.left.isPressed()) dx = -1
    if (controller.right.isPressed()) dx = 1
    if (controller.up.isPressed()) dy = -1
    if (controller.down.isPressed()) dy = 1

    player.x += dx * 2.2
    player.y += dy * 2.2
    player.x = clamp(player.x, 10, 150)
    player.y = clamp(player.y, 12, 110)
}

function dealBossDamageToPlayer(amount: number): void {
    playerHealth -= amount
    playerHealth = clamp(playerHealth, 0, playerMaxHealth)
    info.setLife(playerHealth)

    if (playerHealth <= 0) {
        finishBattle(false)
    }
}

function bossStrikePattern(): void {
    const bossData = bossRoster[currentBossIndex]
    if (Math.abs(player.x - boss.x) < 22 && Math.abs(player.y - boss.y) < 20) {
        dealBossDamageToPlayer(bossData.damage + bossPhase)
    }
}

function bossRushPattern(): void {
    const bossData = bossRoster[currentBossIndex]
    const dx = player.x - boss.x
    const dy = player.y - boss.y

    if (dx < 0) boss.x -= 1
    else if (dx > 0) boss.x += 1
    if (dy < 0) boss.y -= 1
    else if (dy > 0) boss.y += 1

    if (Math.abs(player.x - boss.x) < 26 && Math.abs(player.y - boss.y) < 26) {
        dealBossDamageToPlayer(bossData.damage + 2)
    }
}

function updateBossAI(): void {
    if (gameState != GameState.Arena || boss == null) return

    const bossData = bossRoster[currentBossIndex]
    bossAttackTimer -= 1

    if (bossAttackTimer <= 0) {
        bossAttackTimer = 700 + Math.randomRange(0, 400)
        if (Math.randomRange(0, 1) == 0) {
            bossStrikePattern()
        } else {
            bossRushPattern()
        }
    }

    const dx = player.x - boss.x
    const dy = player.y - boss.y
    if (dx < 0) boss.x -= bossData.speed * 0.15
    else if (dx > 0) boss.x += bossData.speed * 0.15
    if (dy < 0) boss.y -= bossData.speed * 0.15
    else if (dy > 0) boss.y += bossData.speed * 0.15

    boss.x = clamp(boss.x, 86, 150)
    boss.y = clamp(boss.y, 18, 102)

    if (currentBossHp <= currentBossMaxHp * 0.5 && bossPhase == 1) {
        bossPhase = 2
        boss.setImage(buildBossSprite(bossData.color + 1))
    }
}

function renderHud(): void {
    if (gameState != GameState.Arena) return

    screen.fillRect(8, 6, 100, 6, 0)
    screen.fillRect(8, 6, (playerHealth / playerMaxHealth) * 100, 6, 9)

    screen.fillRect(8, 16, 100, 6, 0)
    screen.fillRect(8, 16, (stamina / 100) * 100, 6, 10)

    screen.fillRect(8, 104, 100, 6, 0)
    screen.fillRect(8, 104, (currentBossHp / currentBossMaxHp) * 100, 6, 2)

    screen.drawText("HP", 2, 5, 15, 1)
    screen.drawText("EN", 2, 15, 15, 1)
    screen.drawText(bossRoster[currentBossIndex].name, 8, 96, 15, 1)

    if (attackCooldown > 0) attackCooldown -= 1
    if (dodgeCooldown > 0) dodgeCooldown -= 1
    stamina = clamp(stamina + 0.25, 0, 100)

    if (currentBossHp <= 0) {
        finishBattle(true)
    }
}

game.onUpdate(function () {
    if (gameState == GameState.Menu) {
        drawTitleScreen()
        if (controller.A.justPressed()) {
            beginBattle()
        }
        return
    }

    if (gameState == GameState.Victory) {
        drawVictoryScreen()
        if (controller.A.justPressed()) {
            beginBattle()
        }
        return
    }

    if (gameState == GameState.Defeat) {
        drawDefeatScreen()
        if (controller.B.justPressed()) {
            beginBattle()
        }
        return
    }

    if (gameState == GameState.Ending) {
        drawEndingScreen()
        if (controller.A.justPressed()) {
            currentBossIndex = 0
            score = 0
            playerLevel = 1
            gameState = GameState.Menu
        }
        return
    }

    if (gameState == GameState.Arena) {
        updatePlayerMovement()
        updateBossAI()
        renderHud()

        if (controller.A.justPressed()) {
            handleLightAttack()
        }
        if (controller.B.justPressed()) {
            handleHeavyAttack()
        }
        if (controller.left.justPressed() || controller.right.justPressed() || controller.up.justPressed() || controller.down.justPressed()) {
            handleDodge()
        }
    }
})

drawTitleScreen()
