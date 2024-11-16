var canW, canH, gameState = 1, PLAY = 1, END = 0, isGrounded = false, score = 0, isSwordAttacking = false;
var kate, scene, ground, invisibleGrounds = [], obstaclesGroup;
var kateIdle, kateJump, kateWalk, kateShield, kateCharge, kateSword, enemy1, enemy2, enemy3;
var startX = 150, startY = 550; // Starting position coordinates for Kate
var swordItem, shieldItem, hasSword = false, hasShield = false;

function preload() {
    scene = loadImage("Assets/Scene1.png");
    kateIdle = loadAnimation("Assets/KateSprites/KateIdle.png");
    kateWalk = loadAnimation(
        "Assets/KateSprites/KateWalk1.png",
        "Assets/KateSprites/KateWalk2.png",
        "Assets/KateSprites/KateWalk3.png",
        "Assets/KateSprites/KateWalk4.png"
    );
    kateJump = loadAnimation(
        "Assets/KateSprites/KateJump2.png", // Start of jump
        "Assets/KateSprites/KateJump3.png"  // Mid-air pose
    );
    kateJump.looping = false; // Make it stop on the last frame
    kateShield = loadAnimation("Assets/KateSprites/KateShield.png");
    kateCharge = loadAnimation(
        "Assets/KateSprites/KateCharge1.png",
        "Assets/KateSprites/KateCharge2.png",
        "Assets/KateSprites/KateCharge3.png",
        "Assets/KateSprites/KateCharge4.png"
    );
    kateCharge.looping = true; // Ensure the charge animation loops
    kateSword = loadAnimation(
        "Assets/KateSprites/KateSword1.png",
        "Assets/KateSprites/KateSword2.png",
        "Assets/KateSprites/KateSword3.png",
        "Assets/KateSprites/KateSword4.png",
        "Assets/KateSprites/KateSword5.png"
    );
    kateSword.looping = false; // Play sword animation once
    enemy1 = loadImage("Assets/Enemy1.png");
    enemy2 = loadImage("Assets/Enemy2.png");
    enemy3 = loadImage("Assets/Enemy3.png");

    // Items
    swordItemImg = loadImage("Assets/Sword.png");
    shieldItemImg = loadImage("Assets/Shield.png");
}

function setup() {
    var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    canW = isMobile ? displayWidth + 80 : windowWidth;
    canH = isMobile ? displayHeight : windowHeight;
    createCanvas(canW, canH);

    kate = createSprite(startX, startY, 20, 50);
    kate.addAnimation("idling", kateIdle);
    kate.addAnimation("jumping", kateJump);
    kate.addAnimation("walking", kateWalk);
    kate.addAnimation("shield", kateShield);
    kate.addAnimation("charge", kateCharge);
    kate.addAnimation("sword", kateSword);
    kate.scale = 0.1;

    [
        {x: 30, y: 580, w: 100, h: 340}, {x: 150, y: 650, w: 980, h: 160},
        {x: 400, y: 610, w: 160, h: 160}, {x: 800, y: 650, w: 160, h: 160},
        {x: 960, y: 690, w: 160, h: 160}, {x: 1240, y: 690, w: 240, h: 160},
        {x: 1440, y: 650, w: 160, h: 160}, {x: 1760, y: 610, w: 480, h: 160}
    ].forEach(pos => {
        let ground = createSprite(pos.x, pos.y, pos.w, pos.h);
        ground.visible = false; // Make platforms visible
        invisibleGrounds.push(ground);
    });

    obstaclesGroup = new Group();
    ground = createSprite(1280, 570, 256, 32);
    ground.addImage("scene1", scene);

    // Sword and Shield Items
    shieldItem = createSprite(400, 510, 20, 20);
    shieldItem.addImage(shieldItemImg);
    shieldItem.scale = 0.1;

    swordItem = createSprite(800, 550, 20, 20);
    swordItem.addImage(swordItemImg);
    swordItem.scale = 0.08;

    // Spawn the first enemy
    spawnEnemies();
}

function draw() {
    background("skyblue");

    // Levitate the shield and sword
    let levitationOffset = sin(frameCount * 0.1) * 5;
    if (shieldItem) shieldItem.y = 510 + levitationOffset;
    if (swordItem) swordItem.y = 550 + levitationOffset;

    // Enemy movement and boundary detection
    obstaclesGroup.forEach(enemy => {
        // Apply gravity to the enemy
        enemy.velocityY += 0.8;

        // Check if the enemy is on any ground
        let isOnGround = false;
        invisibleGrounds.forEach(ground => {
            if (enemy.collide(ground)) {
                enemy.velocityY = 0; // Stop falling
                isOnGround = true;
            }
        });

        // If the enemy is knocked out of bounds, allow it to fall
        if (!isOnGround && enemy.y > height) {
            console.log("Enemy fell off the platform and is removed.");
            enemy.remove(); // Remove the enemy if it falls off the screen
        }

        // If the enemy is in knockback state, temporarily ignore boundaries
        if (enemy.knockbackTimer > 0) {
            enemy.knockbackTimer -= 1; // Countdown knockback timer
        } else {
            // If not in knockback, ensure the enemy respects boundaries
            if (enemy.x < enemy.xMin) {
                enemy.velocityX = 2; // Move back into loitering area
                enemy.mirrorX(1); // Face right
            } else if (enemy.x > enemy.xMax) {
                enemy.velocityX = -2; // Move back into loitering area
                enemy.mirrorX(-1); // Face left
            }
        }

        // Reverse direction when inside the loitering area and not in knockback state
        if (isOnGround && enemy.knockbackTimer <= 0 && enemy.x >= enemy.xMin && enemy.x <= enemy.xMax) {
            if (enemy.x <= enemy.xMin || enemy.x >= enemy.xMax) {
                enemy.velocityX *= -1; // Reverse direction
                enemy.mirrorX(enemy.velocityX > 0 ? 1 : -1); // Flip sprite
            }
        }

        // Check for sword slash
        if (isSwordAttacking && kate.overlap(enemy)) {
            console.log("Enemy defeated!");
            enemy.remove(); // Remove the enemy from the game
        }
    });

    // Handle collisions with Kate
    obstaclesGroup.forEach(enemy => {
        if (kate.overlap(enemy)) {
            let isStandingOnEnemy = kate.y + kate.height / 2 < enemy.y; // Kate is above the enemy
            let isFacingWrongWay = (kate.mirrorX() === 1 && enemy.x < kate.x) || (kate.mirrorX() === -1 && enemy.x > kate.x);
    
            if (isStandingOnEnemy) {
                // Kill Kate if standing on the enemy
                console.log("Kate died from standing on the enemy!");
                respawnKate();
            } else if (kate.getAnimationLabel() === "shield" || kate.getAnimationLabel() === "charge") {
                // Determine direction and bounce the enemy for both shield and charge animations
                if (kate.mirrorX() === 1) {
                    enemy.x += 20; // Bounce enemy to the right
                    enemy.velocityX = 4; // Push enemy to the right
                    enemy.mirrorX(1); // Face enemy to the right
                } else {
                    enemy.x -= 20; // Bounce enemy to the left
                    enemy.velocityX = -4; // Push enemy to the left
                    enemy.mirrorX(-1); // Face enemy to the left
                }
                enemy.knockbackTimer = 30; // Temporarily ignore boundaries for 30 frames
            } else {
                // Kill Kate if not in shield or charge form
                console.log("Kate died from enemy!");
                respawnKate();
            }
        }
    });
    

    drawSprites();

    // Check if Kate collects the shield
    if (shieldItem && kate.isTouching(shieldItem)) {
        hasShield = true;
        shieldItem.remove(); // Remove shield item from the game
        console.log("Shield collected!");
    }

    // Check if Kate collects the sword
    if (swordItem && kate.isTouching(swordItem)) {
        hasSword = true;
        swordItem.remove(); // Remove sword item from the game
        console.log("Sword collected!");
    }

    // Handle Kate's sword animation and movement logic
    if (isSwordAttacking) {
        kate.velocityY = 0; // Disable vertical movement
        if (kate.animation.getFrame() === kate.animation.getLastFrame()) {
            isSwordAttacking = false;
            revertToPreviousAnimation();
        }
        return;
    }

    let moveSpeed = (kate.getAnimationLabel() === "shield") ? 2 : 4;

    // Shield animation handling
    if ((keyIsDown(DOWN_ARROW) || keyIsDown(83)) && hasShield) {
        if (isGrounded) {
            kate.changeAnimation("shield");
        }
        if ((keyIsDown(RIGHT_ARROW) || keyIsDown(68)) && isGrounded) {
            kate.changeAnimation("charge");
            kate.x += moveSpeed;
            kate.mirrorX(1);
        } else if ((keyIsDown(LEFT_ARROW) || keyIsDown(65)) && isGrounded) {
            kate.changeAnimation("charge");
            kate.x -= moveSpeed;
            kate.mirrorX(-1);
        }
    } else {
        if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
            kate.x += moveSpeed;
            kate.mirrorX(1);
            if (isGrounded && kate.getAnimationLabel() !== "walking") {
                kate.changeAnimation("walking");
            }
        } else if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
            kate.x -= moveSpeed;
            kate.mirrorX(-1);
            if (isGrounded && kate.getAnimationLabel() !== "walking") {
                kate.changeAnimation("walking");
            }
        } else if (isGrounded && kate.getAnimationLabel() !== "idling") {
            kate.changeAnimation("idling");
        }
    }

    // Jump only if grounded
    if ((keyIsDown(UP_ARROW) || keyIsDown(87)) && isGrounded) {
        kate.changeAnimation("jumping");
        kate.animation.rewind();
        kate.velocityY = -12;
        isGrounded = false;
    }

    kate.velocityY += 0.8;

    if (keyWentDown(81) && isGrounded && hasSword) {
        isSwordAttacking = true;
        kate.changeAnimation("sword");
        kate.animation.rewind();
        kate.velocityX = 0;
        kate.velocityY = 0;
    }

    isGrounded = false;
    invisibleGrounds.forEach(g => {
        if (kate.collide(g)) {
            kate.velocityY = 0;
            isGrounded = true;
        }
    });

    if (kate.y > height) {
        console.log("Kate died from falling!");
        respawnKate();
    }
}

function revertToPreviousAnimation() {
    if ((keyIsDown(DOWN_ARROW) || keyIsDown(83)) && hasShield) {
        kate.changeAnimation("shield");
    } else if (keyIsDown(RIGHT_ARROW) || keyIsDown(68) || keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
        kate.changeAnimation("walking");
    } else {
        kate.changeAnimation("idling");
    }
}

function respawnKate() {
    console.log("Respawning Kate at the starting position.");
    kate.x = startX;
    kate.y = -50; // Start above the visible area
    kate.velocityY = 5; // Set a small positive velocity to make her fall
    kate.changeAnimation("jumping"); // Set to jumping to show falling motion
}

function spawnEnemies() {
    if (obstaclesGroup.length < 2) { // Ensure only two enemies are spawned

        // Enemy 1
        if (!obstaclesGroup.some(enemy => enemy.image === enemy1)) {
            let enemy = createSprite(550, 550); // Spawn slightly above the ground
            enemy.addImage(enemy1); // Add the enemy1 image
            enemy.scale = 0.1; // Adjust size of the enemy
            enemy.velocityX = 2; // Move to the right initially
            enemy.lifetime = 10000; // Prevent memory leaks

            // Add custom properties for boundaries and knockback handling
            enemy.xMin = 500; // Minimum X position
            enemy.xMax = 620; // Maximum X position
            enemy.knockbackTimer = 0; // Timer to track knockback state

            obstaclesGroup.add(enemy); // Add to the group
        }

        // Enemy 2
        if (!obstaclesGroup.some(enemy => enemy.image === enemy2)) {
            let enemy = createSprite(1000, 580); // Spawn slightly closer to the sword
            enemy.addImage(enemy2); // Add the enemy2 image
            enemy.scale = 0.1; // Adjust size of the enemy
            enemy.velocityX = 2; // Move to the left initially
            enemy.lifetime = 10000; // Prevent memory leaks

            // Add custom properties for boundaries and knockback handling
            enemy.xMin = 900; // Minimum X position
            enemy.xMax = 1030; // Maximum X position
            enemy.knockbackTimer = 0; // Timer to track knockback state

            obstaclesGroup.add(enemy); // Add to the group
        }
    }
}
