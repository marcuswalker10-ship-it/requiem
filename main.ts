enum GameState {
    Menu,
    Arena,
    Victory,
    Defeat,
    Ending
}

const bossNames = [
    "Mourning Sentinel",
    "Ashen Warden",
    "Cracked Tyrant",
    "GODFALL"
]

const bossStats = [
    { maxHp: 90, speed: 28, damage: 9, reward: 120 },
    { maxHp: 120, speed: 34, damage: 12, reward: 180 },
    { maxHp: 150, speed: 38, damage: 15, reward: 220 },
    { maxHp: 200, speed: 45, damage: 18, reward: 400 }
]

let gameState = GameState.Menu
let currentBossIndex = 0
let player: Sprite = null
let boss: Sprite = null
let playerHp = 100
let maxPlayerHp = 100
let stamina = 100
let maxStamina = 100
let playerLevel = 1
let bossHp = 0
let bossMaxHp = 0
let combo = 0
let score = 0
let relics = 0
let attackCooldown = 0
let dodgeCooldown = 0
let bossCooldown = 0
let bossPhase = 1

function clamp(value: number, min: number, max: number): number {
    if (value < min) return min
    if (value > max) return max
    return value
}

function buildHeroImage(): Image {
    const img = image.create(16, 16)
    img.fill(0)
    img.fillRect(5, 2, 6, 5, 1)
    img.fillRect(4, 7, 8, 6, 1)
    img.fillRect(6, 13, 4, 2, 1)
    img.fillRect(2, 8, 2, 2, 1)
    img.fillRect(12, 8, 2, 2, 1)
    return img
}

function buildBossImage(accent: number): Image {
    const img = image.create(16, 16)
    img.fill(0)
    img.fillRect(3, 2, 10, 4, 2)
    img.fillRect(2, 6, 12, 6, 2)
    img.fillRect(5, 12, 6, 2, accent)
    img.fillRect(6, 14, 4, 2, accent)
    return img
}

function clearArena(): void {
    for (const sprite of sprites.allOfKind(SpriteKind.Player)) {
        sprite.destroy()
    }
    for (const sprite of sprites.allOfKind(SpriteKind.Enemy)) {
        sprite.destroy()
    }
}

function spawnPlayer(): void {
    player = sprites.create(buildHeroImage(), SpriteKind.Player)
    player.setPosition(32, 60)
    player.setStayInScreen(true)
    player.setBounceOnWall(false)
    player.z = 1
}

function spawnBoss(): void {
    const bossInfo = bossStats[currentBossIndex]
    bossMaxHp = bossInfo.maxHp
    bossHp = bossMaxHp
    bossPhase = 1
    boss = sprites.create(buildBossImage(currentBossIndex + 3), SpriteKind.Enemy)
    boss.setPosition(120, 60)
    boss.setStayInScreen(true)
    boss.setBounceOnWall(false)
    boss.z = 1
}

function resetPlayerStats(): void {
    maxPlayerHp = 100 + playerLevel * 10
    maxStamina = 100
    playerHp = maxPlayerHp
    stamina = maxStamina
    attackCooldown = 0
    dodgeCooldown = 0
    combo = 0
    info.setLife(playerHp)
    info.setScore(score)
}

function beginBattle(): void {
    clearArena()
    spawnPlayer()
    spawnBoss()
    resetPlayerStats()
    gameState = GameState.Arena
}

function showTitleScreen(): void {
    scene.setBackgroundColor(9)
    screen.fillRect(12, 10, 96, 52, 7)
    screen.fillRect(16, 14, 88, 44, 8)
    screen.drawText("GODFALL", 34, 22, 15, 1)
    screen.drawText("Boss Rush", 34, 36, 15, 1)
    screen.drawText("Press A", 42, 52, 15, 1)
}

function showVictoryScreen(): void {
    screen.fillRect(12, 20, 96, 40, 7)
    screen.drawText("VICTORY", 38, 28, 15, 1)
    screen.drawText(bossNames[currentBossIndex], 22, 40, 15, 1)
    screen.drawText("A to continue", 30, 54, 15, 1)
}

function showDefeatScreen(): void {
    screen.fillRect(12, 20, 96, 40, 7)
    screen.drawText("DEFEAT", 40, 28, 15, 1)
    screen.drawText("B to retry", 30, 54, 15, 1)
}

function showEndingScreen(): void {
    screen.fillRect(10, 16, 100, 48, 7)
    screen.drawText("THE END", 38, 24, 15, 1)
    screen.drawText("GODFALL FALLEN", 24, 38, 15, 1)
    screen.drawText("A to return", 32, 52, 15, 1)
}

function awardRewards(): void {
    const reward = bossStats[currentBossIndex].reward
    score += reward
    relics += 1
    playerLevel = clamp(playerLevel + 1, 1, 9)
    info.setScore(score)
}

function finishBattle(victory: boolean): void {
    if (victory) {
        awardRewards()
        if (currentBossIndex >= bossNames.length - 1) {
            gameState = GameState.Ending
        } else {
            currentBossIndex += 1
            gameState = GameState.Victory
        }
    } else {
        gameState = GameState.Defeat
    }
}

function doLightAttack(): void {
    if (attackCooldown > 0 || stamina < 10 || gameState != GameState.Arena) return

    attackCooldown = 350
    stamina = clamp(stamina - 12, 0, maxStamina)
    combo += 1

    const attackRange = 28
    const damage = 8 + combo + playerLevel * 2

    if (Math.abs(player.x - boss.x) < attackRange && Math.abs(player.y - boss.y) < 20) {
        bossHp -= damage
        boss.x += 4
    }
}

function doHeavyAttack(): void {
    if (attackCooldown > 0 || stamina < 25 || gameState != GameState.Arena) return

    attackCooldown = 700
    stamina = clamp(stamina - 26, 0, maxStamina)
    combo += 2

    const damage = 18 + playerLevel * 3
    if (Math.abs(player.x - boss.x) < 34 && Math.abs(player.y - boss.y) < 20) {
        bossHp -= damage
        boss.x += 6
    }
}

function doDodge(): void {
    if (dodgeCooldown > 0 || gameState != GameState.Arena) return

    dodgeCooldown = 800
    stamina = clamp(stamina + 20, 0, maxStamina)
    player.x = clamp(player.x + 18, 12, 148)
}

function handlePlayerMovement(): void {
    if (gameState != GameState.Arena) return

    let horizontal = 0
    let vertical = 0
    if (controller.left.isPressed()) horizontal = -1
    if (controller.right.isPressed()) horizontal = 1
    if (controller.up.isPressed()) vertical = -1
    if (controller.down.isPressed()) vertical = 1

    player.x += horizontal * 2.2
    player.y += vertical * 2.2
    player.x = clamp(player.x, 10, 150)
    player.y = clamp(player.y, 14, 110)
}

function bossPatternStrike(): void {
    const bossInfo = bossStats[currentBossIndex]
    if (Math.abs(player.x - boss.x) < 22 && Math.abs(player.y - boss.y) < 16) {
        playerHp -= bossInfo.damage + bossPhase
        info.setLife(playerHp)
    }

    if (playerHp <= 0) {
        finishBattle(false)
    }
}

function bossPatternRush(): void {
    const bossInfo = bossStats[currentBossIndex]
    boss.vx = (player.x - boss.x) * 0.08
    boss.vy = (player.y - boss.y) * 0.08
    if (Math.abs(player.x - boss.x) < 32 && Math.abs(player.y - boss.y) < 22) {
        playerHp -= bossInfo.damage + 2
        info.setLife(playerHp)
    }
    if (playerHp <= 0) {
        finishBattle(false)
    }
}

function updateBossAI(): void {
    if (gameState != GameState.Arena) return

    const bossInfo = bossStats[currentBossIndex]
    bossCooldown -= 1
    if (bossCooldown <= 0) {
        bossCooldown = 700 + Math.randomRange(0, 500)
        if (Math.randomRange(0, 1) == 0) {
            bossPatternStrike()
        } else {
            bossPatternRush()
        }
    }

    const targetX = player.x - boss.x
    const targetY = player.y - boss.y
    boss.x += Math.sign(targetX) * bossInfo.speed * 0.02
    boss.y += Math.sign(targetY) * bossInfo.speed * 0.02
    boss.x = clamp(boss.x, 100, 150)
    boss.y = clamp(boss.y, 18, 100)

    if (bossHp <= bossMaxHp * 0.5 && bossPhase == 1) {
        bossPhase = 2
        boss.setImage(buildBossImage(currentBossIndex + 2))
    }
}

function updateHud(): void {
    if (gameState != GameState.Arena) return

    screen.fillRect(8, 6, 100, 6, 0)
    screen.fillRect(8, 6, playerHp / maxPlayerHp * 100, 6, 9)
    screen.fillRect(8, 16, 100, 6, 0)
    screen.fillRect(8, 16, stamina / maxStamina * 100, 6, 10)
    screen.fillRect(8, 104, 100, 6, 0)
    screen.fillRect(8, 104, bossHp / bossMaxHp * 100, 6, 2)

    screen.drawText("HP", 2, 5, 15, 1)
    screen.drawText("EN", 2, 15, 15, 1)
    screen.drawText(bossNames[currentBossIndex], 8, 96, 15, 1)

    if (attackCooldown > 0) attackCooldown -= 1
    if (dodgeCooldown > 0) dodgeCooldown -= 1
    stamina = clamp(stamina + 0.25, 0, maxStamina)

    if (bossHp <= 0) {
        finishBattle(true)
    }
}

controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    if (gameState == GameState.Menu) {
        beginBattle()
    }
    if (gameState == GameState.Victory) {
        beginBattle()
    }
    if (gameState == GameState.Ending) {
        currentBossIndex = 0
        score = 0
        relics = 0
        playerLevel = 1
        gameState = GameState.Menu
    }
})

controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    if (gameState == GameState.Defeat) {
        beginBattle()
    }
})

game.onUpdate(function () {
    if (gameState == GameState.Menu) {
        showTitleScreen()
        return
    }

    if (gameState == GameState.Victory) {
        showVictoryScreen()
        return
    }

    if (gameState == GameState.Defeat) {
        showDefeatScreen()
        return
    }

    if (gameState == GameState.Ending) {
        showEndingScreen()
        return
    }

    if (gameState == GameState.Arena) {
        handlePlayerMovement()
        updateBossAI()
        updateHud()

        if (controller.A.justPressed()) {
            doLightAttack()
        }
        if (controller.B.justPressed()) {
            doHeavyAttack()
        }
        if (controller.left.justPressed() || controller.right.justPressed() || controller.up.justPressed() || controller.down.justPressed()) {
            doDodge()
        }
    }
})

showTitleScreen()
