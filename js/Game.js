class Game {
  constructor() {
    this.resetTitle = createElement("h2");
    this.resetButton = createButton("");

    this.leadeboardTitle = createElement("h2");

    this.leader1 = createElement("h2");
    this.leader2 = createElement("h2");
    this.playerMoving = false;
    
    this.leftKeyActive = false;
    this.blast = false;

  }

  getState() {
    var gameStateRef = database.ref("gameState");
    gameStateRef.on("value", function(data) {
      gameState = data.val();
    });
  }
  update(state) {
    database.ref("/").update({
      gameState: state
    });
  }

  start() {
    player = new Player();
    playerCount = player.getCount();

    form = new Form();
    form.display();

    car1 = createSprite(width / 2 - 50, height - 100);
    car1.addImage("car1", car1_img);
    car1.scale = 0.07;
    car1.addImage("blast", blastImage); //C42 //SA

    car2 = createSprite(width / 2 + 100, height - 100);
    car2.addImage("car2", car2_img);
    car2.scale = 0.07;
    car2.addImage("blast", blastImage); //C42//SA

    cars = [car1, car2];

    fuels = new Group();
    powerCoins = new Group();
    obstacle1 = new Group(); 
    obstacle2 = new Group(); 
    var obstacle1Positions = [
      { x: width / 2 - 150, y: height - 1300, image: obstacle1Image },
      { x: width / 2 + 250, y: height - 1800, image: obstacle1Image },
      { x: width / 2 - 180, y: height - 3300, image: obstacle1Image },
     
      { x: width / 2 - 150, y: height - 4300, image: obstacle1Image },
      { x: width / 2, y: height - 5300, image: obstacle1Image },
    ];

    var obstacle2Positions = [
      { x: width / 2 + 250, y: height - 800, image: obstacle2Image },
      { x: width / 2 - 180, y: height - 2300, image: obstacle2Image },
      { x: width / 2, y: height - 2800, image: obstacle2Image },
     
      { x: width / 2 + 180, y: height - 3300, image: obstacle2Image },
      { x: width / 2 + 250, y: height - 3800, image: obstacle2Image },
      { x: width / 2 + 250, y: height - 4800, image: obstacle2Image },
      { x: width / 2 - 180, y: height - 5500, image: obstacle2Image }
    ];

    // Adicione o sprite de combustível ao jogo
    this.addSprites(fuels, 4, fuelImage, 0.02);

    // Adicione o sprite de moeda ao jogo
    this.addSprites(powerCoins, 18, powerCoinImage, 0.09);

    // Adicione o sprite de obstáculo ao jogo
    this.addSprites(
      obstacle1,
      obstacle1Positions.length,
      obstacle1Image,
      0.04,
      obstacle1Positions
    );
    this.addSprites(
      obstacle2,
      obstacle2Positions.length,
      obstacle2Image,
      0.04,
      obstacle2Positions
    );
  }

  //C41 //SA
  addSprites(spriteGroup, numberOfSprites, spriteImage, scale, positions = []) {
    for (var i = 0; i < numberOfSprites; i++) {
      var x, y;

      //C41 //SA
      if (positions.length > 0) {
        x = positions[i].x;
        y = positions[i].y;
        spriteImage = positions[i].image;
      } else {
        x = random(width / 2 + 150, width / 2 - 150);
        y = random(-height * 4.5, height - 400);
      }
      var sprite = createSprite(x, y);
      sprite.addImage("sprite", spriteImage);

      sprite.scale = scale;
      spriteGroup.add(sprite);
    }
  }

  handleElements() {
    form.hide();
    form.titleImg.position(40, 50);
    form.titleImg.class("gameTitleAfterEffect");

    this.resetTitle.html("Reiniciar");
    this.resetTitle.class("resetText");
    this.resetTitle.position(width / 2 + 200, 40);

    this.resetButton.class("resetButton");
    this.resetButton.position(width / 2 + 230, 100);

    this.leadeboardTitle.html("Placar");
    this.leadeboardTitle.class("resetText");
    this.leadeboardTitle.position(width / 3 - 60, 40);

    this.leader1.class("leadersText");
    this.leader1.position(width / 3 - 50, 80);

    this.leader2.class("leadersText");
    this.leader2.position(width / 3 - 50, 130);
  }

  play() {
    this.handleElements();
    this.handleResetButton();

    Player.getPlayersInfo();
    player.getCarsAtEnd();

    if (allPlayers !== undefined) {
      image(track, 0, -height * 5, width, height * 6);

      this.showFuelBar();
      this.showLife();
      this.showLeaderboard();

      //índice da matriz
      var index = 0;
      for (var plr in allPlayers) {
        //adicione 1 ao índice para cada loop
        index = index + 1;

        //use os dados do banco de dados para exibir os carros nas direções x e y
        var x = allPlayers[plr].positionX;
        var y = height - allPlayers[plr].positionY;

        var currentlife = allPlayers[plr].life;

        if (currentlife <= 0) {
          cars[index - 1].changeImage("blast");
          cars[index - 1].scale = 0.3;
        }

        cars[index - 1].position.x = x;
        cars[index - 1].position.y = y;

        if (index === player.index) {
          stroke(10);
          fill("red");
          ellipse(x, y, 60, 60);

          this.handleFuel(index);
          this.handlePowerCoins(index);
          this.handleObstacleCollision(index); 

          if (player.life <= 0) {
            this.blast = true;
            this.playerMoving = false;
          }

          // Altere a posição da câmera na direção y
          camera.position.y = cars[index - 1].position.y;
        }
      }

      if (this.playerMoving) {
        player.positionY += 5;
        player.update();
      }

      // manipulação de eventos de teclado
      this.handlePlayerControls();

      // Linha de chegada
      const finshLine = height * 6 - 100;

      if (player.positionY > finshLine) {
        gameState = 2;
        player.rank += 1;
        Player.updateCarsAtEnd(player.rank);
        player.update();
        this.showRank();
      }

      drawSprites();
    }
  }

  handleFuel(index) {
    // Adicione o combustível
    cars[index - 1].overlap(fuels, function(collector, collected) {
      player.fuel = 185;
      //collected (coletado) é o sprite no grupo de colecionáveis que desencadeia
      //o evento
      collected.remove();
    });

    // Reduzir o combustível do carro do jogador
    if (player.fuel > 0 && this.playerMoving) {
      player.fuel -= 0.3;
    }

    if (player.fuel <= 0) {
      gameState = 2;
      this.gameOver();
    }
  }

  handlePowerCoins(index) {
    cars[index - 1].overlap(powerCoins, function(collector, collected) {
      player.score += 21;
      player.update();
      //collected (coletado) é o sprite no grupo de colecionáveis que desencadeia
      //o evento
      collected.remove();
    });
  }

  handleResetButton() {
    this.resetButton.mousePressed(() => {
      database.ref("/").set({
        carsAtEnd: 0,
        playerCount: 0,
        gameState: 0,
        palyers: {}
      });
      window.location.reload();
    });
  }

  showFuelBar() {
    push();
    image(fuelImage, width / 2 - 130, height - player.positionY + 100, 20, 20);
    fill("white");
    rect(width / 2 - 100, height - player.positionY + 100, 185, 20);
    fill("#ffc400");
    rect(width / 2 - 100, height - player.positionY + 100, player.fuel, 20);
    noStroke();
    pop();
  }

  showLife() {
    push();
    image(lifeImage, width / 2 - 130, height - player.positionY +50, 20, 20);
    fill("white");
    rect(width / 2 - 100, height - player.positionY +50, 185, 20);
    fill("#f50057");
    rect(width / 2 - 100, height - player.positionY +50, player.life, 20);
    noStroke();
    pop();
  }

  showLeaderboard() {
    var leader1, leader2;
    var players = Object.values(allPlayers);
    if (
      (players[0].rank === 0 && players[1].rank === 0) ||
      players[0].rank === 1
    ) {
      // &emsp;    Esta tag é usada para exibir quatro espaços.
      leader1 =
        players[0].rank +
        "&emsp;" +
        players[0].name +
        "&emsp;" +
        players[0].score;

      leader2 =
        players[1].rank +
        "&emsp;" +
        players[1].name +
        "&emsp;" +
        players[1].score;
    }

    if (players[1].rank === 1) {
      leader1 =
        players[1].rank +
        "&emsp;" +
        players[1].name +
        "&emsp;" +
        players[1].score;

      leader2 =
        players[0].rank +
        "&emsp;" +
        players[0].name +
        "&emsp;" +
        players[0].score;
    }

    this.leader1.html(leader1);
    this.leader2.html(leader2);
  }


  handlePlayerControls() {
    if (!this.blast) {
      
    

      if (keyIsDown(UP_ARROW)) {
        this.playerMoving = true;
        player.positionY += 10;
        player.update();
      }

      if (keyIsDown(LEFT_ARROW) && player.positionX > width / 3 - 50) {

        this.leftKeyActive = true;
        player.positionX -= 5;
        player.update();
      }

      if (keyIsDown(RIGHT_ARROW) && player.positionX < width / 2 + 300) {
        this.leftKeyActive = false;
        player.positionX += 5;
        player.update();
      }
  }
  }
  //C41 //SA
  handleObstacleCollision(index) {
    if(cars[index-1].collide(obstacle1)||cars[index-1].collide(obstacle2)){

      //C41 //TA
      if (this.leftKeyActive) {
        player.positionX += 100;
      } else {
        player.positionX -= 100;
      }

      //C41 //SA
      //Reduzindo a Vida do Jogador
      if (player.life > 0) {
        player.life -= 185 / 4;
      }

      player.update();
    }
  }

  showRank() {
    swal({
      title: `Travesseiro!${"\n"}Classificação${"\n"}${player.rank}`,
      text: "travesseiro",
      imageUrl:
        "data:image/png;base64,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",
      imageSize: "100x100",
      confirmButtonText: "Ok"
    });
  }

  gameOver() {
    swal({
      title: `se ferro kkkkkkkkkkk`,
      text: "",
      imageUrl:
        "https://pm1.aminoapps.com/7135/2c9a6ed156e1431361b6a6af29e6817785ece2e7r1-768-768v2_uhq.jpg",
      imageSize: "100x100",
      confirmButtonText: "Ok"
    });
  }

  
}
