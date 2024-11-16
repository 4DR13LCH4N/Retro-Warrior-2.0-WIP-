# p5.play-boilerplate
Boiler plate for p5.play
function draw() {
  background(200);
  drawSprites();

  if(gameState === PLAY) {
    //if(kate.y>=500){
    //  kate.velocityY +=0.8;
    //}else{
      //kate.velocityY = 0;
      //if(keyIsDown(UP_ARROW)){
       // kate.velocityY = -18;
      //}
   // }
  
    if (keyIsDown(RIGHT_ARROW)) {
      kate.changeAnimation("walking");
      kate.x += 4;
      //ground.x -= 4;
    }
    if (keyIsDown(LEFT_ARROW)) {
      kate.changeAnimation("walking");
      kate.x -= 4;
      //ground.x += 4;
    }
    
    if (keyIsDown(UP_ARROW) && kate.y >= 500) {
    kate.changeAnimation("jumping");
    kate.velocityY = -7.5;
    }
    //runControls();
    spawnEnemies();

    //display score
    text("Score: " + score, 500, 50);
    score = score + Math.round(frameCount/60);

   // if(obstacleGroup.isTouching(kate)){
   //   gameState = END;
   // }
   //colide with the ground
    kate.collide(invisibleGround1);
    kate.collide(invisibleGround2);
    kate.collide(invisibleGround3);
   
 // }
 // else if (gameState === END) {
    //when the gamestate ends, all sprites will stop moving
    //if player reaches treasure, the game will move to credits and leaderboard
    //if player runs out of lives, the gameover screen shows

 // }

  
}

function runControls() {
  
  


}

