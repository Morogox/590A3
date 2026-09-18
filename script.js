
var keysdown = {};
var keysup = {};
//Event listener for when the user presses a key
window.addEventListener("keydown", function (event) {
  
  if (event.defaultPrevented) {
    return; // Do nothing if the event was already processed
  }
  
  keysdown[event.key] = true;

  // Cancel the default action to avoid it being handled twice
  event.preventDefault();
}, true);
// the last option dispatches the event to the listener first,
// then dispatches event to window

//Event listener for when the user releases a key
window.addEventListener("keyup", function (event) {
  if (event.defaultPrevented) {
    return; // Do nothing if the event was already processed
  }
  
  keysdown[event.key] = false;

  // Cancel the default action to avoid it being handled twice
  event.preventDefault();
}, true);
// the last option dispatches the event to the listener first,
// then dispatches event to window

window.onload = function() {
  //Variables representing the canvas and the canvas' context (the context is used for actually drawing on the canvas)
  var canvas = document.getElementById("canvas");
  var context = canvas.getContext("2d");


 
  var player = {x:canvas.width/2, 
              y:canvas.height/2, 
			  radius:7, 
              inner_radius: 4.5,
			  fillColor:"red",
              inner_fillColor: "rgb(255, 237, 237)",
			  strokeColor:"grey", 
			  velocity:4, 
			  base_velocity:4}; 
  
    var fixedDeltaTime = 1 / 60; 
    var accumulatedTime = 0; 
    var lastFrameTimeMs = 0;

  //draw the first frame
  requestAnimationFrame(mainLoop);
			
  //Game/simulation Loop
  function mainLoop(timestamp) {
    var delta = (timestamp - lastFrameTimeMs) / 1000; 
    lastFrameTimeMs = timestamp;

    accumulatedTime += delta;
              
    while (accumulatedTime >= fixedDeltaTime) {
        processInput();
        update(fixedDeltaTime);

        accumulatedTime -= fixedDeltaTime;
    }
	draw();
				
	requestAnimationFrame(mainLoop);
  }
  
  function processInput()
  {
    if (keysdown.Shift) {
        player.velocity = player.base_velocity / 3  ;
    } else {
        player.velocity = player.base_velocity;
    }

    if(keysdown.ArrowLeft) {
		player.x -= player.velocity;
	}
    
    if(keysdown.ArrowUp){
		player.y -= player.velocity;
	}
				
	if (keysdown.ArrowRight) {
		player.x += player.velocity;
	}
				
	if (keysdown.ArrowDown) {
		player.y += player.velocity;
	}
  }
  
  var spellCardManager = new SpellCardManager(canvas);

  function update(delta) {
 
    //clamp the player in the walls
	if (player.x > canvas.width) {
      player.x = canvas.width;
	}
				
	if (player.x < 0) {
      player.x = 0;
	}
				
	if (player.y > canvas.height) {
      player.y = canvas.height;
	}
				
	if (player.y < 0) {
      player.y = 0;
	}	
    spellCardManager.update(delta);
  }

  
  
  function draw() {			
    //clear our drawing
	context.clearRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = "rgb(3, 0, 33)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    spellCardManager.draw(context);
    draw_player()
  }
  
  function draw_player(){
    context.save();
    context.translate(player.x, player.y);
    context.beginPath();
    context.arc(0, 0, player.radius, 0, 2 * Math.PI, false);
    context.fillStyle = player.fillColor;
	context.fill();
	context.lineWidth = 1;
	context.strokeStyle = player.strokeColor;
	context.stroke();
    
    context.beginPath();
    context.arc(0, 0, player.inner_radius, 0, 2 * Math.PI, false);
    context.fillStyle = player.inner_fillColor;
    context.fill();
    
    context.restore();

     context.save();


    
  }
}

class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(vector) {
        this.x + vector.x;
        this.y + vector.y;
        return this
    }

    subtract(vector) {
        this.x -= vector.x;
        this.y -= vector.y;
    }

    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        let length = this.length();

        if (length !== 0) {
            this.x /= length;
            this.y /= length;
        }
    }
}

class Entity {
    constructor(x,y){
        this.position = new Vector2(x, y);
        this.velocity = new Vector2();
        this.driftVelocity = new Vector2();
        this.speed = 0;

        this.direction = 0;
        this.rotation = 0;
        this.rotationSpeed = 0;
      
        this.outOfBoundsTime = 5;
        this.outOfBoundsTimer = this.outOfBoundsTime;

        this.alive = true;
    }

    update(delta) {
        this.velocity.x = Math.cos(this.direction) * this.speed + this.driftVelocity.x;
        this.velocity.y = Math.sin(this.direction) * this.speed +this.driftVelocity.y;

        this.position.x += this.velocity.x * delta;
        this.position.y += this.velocity.y * delta;

        //this.direction += this.rotationSpeed * delta;
        this.rotation += this.rotationSpeed * delta;
      
      if (this.position.x > canvas.width + 50 || this.position.x < -50 || this.position.y > canvas.height + 50 || this.position.y < -50){
        this.outOfBoundsTimer -= delta;
        if (this.outOfBoundsTimer <= 0){
          this.alive = false;
        }
      } else {
        this.outOfBoundsTimer = this.outOfBoundsTime;
      }
      
    }
}

class Bullet extends Entity{
    constructor(x, y){
        super(x, y)
        this.radius = 1; 
      
        this.spawnTime = 0.1;
        this.spawnTimer = this.spawnTime;
    }
}

class Butterfly extends Bullet{
    constructor(x, y){
        super(x,y)
        this.turnSpeed = 0.5;
        this.targetAngle = 0;
        this.speed = 220;
        this.targetY = 0;
        this.descend = false;
        this.clockwise = false;
      
        this.flutterTimer = 0;
        this.flutterSpd = 20 + Math.random() * 10;
    }
    seekAngle(targetAngle, delta) {
        let difference;

    if (this.clockwise) {
        difference = targetAngle - this.direction;

        if (difference < 0) {
            difference += 2 * Math.PI;
        }
    }
    else {
        difference = this.direction - targetAngle;

        if (difference < 0) {
            difference += 2 * Math.PI;
        }
    }

    let turnAmount = this.turnSpeed * delta;

    if (difference <= turnAmount) {
        this.direction = targetAngle;
    }
    else if (this.clockwise) {
        this.direction += turnAmount;
    }
    else {
        this.direction -= turnAmount;
    }
    }

    update(delta) {
        this.seekAngle(this.targetAngle, delta);

        super.update(delta);

        if (this.position.y <= this.targetY && !this.descend) {
           this.targetAngle = Math.PI - Math.random() * Math.PI;
            this.turnSpeed = 1.1;
            this.speed = (this.speed / 2.5) + ((Math.random() * 2 - 1) * 30) ;
            this.descend = true;
        };
      
      this.flutterTimer += delta * this.flutterSpd;
      if (this.flutterTimer >= Math.PI * 2) {
        this.flutterTimer -= Math.PI * 2;
      }
    }

    draw(context) {

      context.save();

      context.translate(this.position.x, this.position.y);
      context.rotate(this.direction);

      context.fillStyle = "rgb(255, 253, 157)";

      let flutter = Math.sin(this.flutterTimer);
      let squash = 1 + flutter * 0.3;

      context.scale(1, squash);
    
      // Upper-left wing
      context.beginPath();
      context.ellipse(0, -5, 8, 4, -0.5, 0, Math.PI * 2);
      context.fill();

      // Upper-right wing
      context.beginPath();
      context.ellipse(0, 5, 8, 4, 0.5, 0, Math.PI * 2);
      context.fill();

      // Lower-left wing
      context.beginPath();
      context.ellipse(-10, -3, 7, 3, 0.5, 0, Math.PI * 2);
      context.fill();

      // Lower-right wing
      context.beginPath();
      context.ellipse(-10, 3, 7, 3, -0.5, 0, Math.PI * 2);
      context.fill();

      context.restore();
    }
}

class Flower extends Bullet{
    constructor(x,y){
        super(x,y);

        this.speed = 0;
        this.acceleration = 10;
        this.topSpeed = 80 - Math.random() * 60;

        this.waitTime = 6;
        this.waitTimer = this.waitTime;

        this.rotationSpeed = Math.random() < 0.5 ? -1 : 1;
        this.direction = 0;
        this.outOfBoundsTime = this.waitTime + 3;
    }

    update(delta){
        if (this.spawnTimer > 0) {
          this.spawnTimer -= delta;
        }
        if (this.waitTimer > 0){
            //just spins and waits
            this.waitTimer -= delta;
            this.rotation += this.rotationSpeed * delta;
            return;
        } else {
            
            this.speed += this.acceleration * delta;

            if (this.speed > this.topSpeed) {
                this.speed = this.topSpeed;
            }

            super.update(delta);
        }
         
    }

    draw(context){
    context.save();

    context.translate(this.position.x, this.position.y);
    context.rotate(this.rotation);
      
    let progress = 1 - Math.max(this.spawnTimer, 0) / this.spawnTime;

    // 0 -> 1
    let scale = progress;
    let alpha = progress;
      
    context.scale(scale, scale);
    context.globalAlpha = alpha;

    context.fillStyle = "pink";

    for (let i = 0; i < 5; i++) {
        context.save();

        context.rotate(i * (Math.PI * 2 / 5));

        context.beginPath();
        context.ellipse(0, -12, 6, 11, 0, 0, Math.PI * 2);

        context.fillStyle = "rgb(255, 227, 251)";
        context.fill();

        context.strokeStyle = "rgb(252, 129, 235)";
        context.lineWidth = 2;
        context.stroke();

        context.restore();
    }

    context.restore();
    }
}

class FlowerString extends Entity {
    constructor(x,y, flowerCount){
        super(x,y);
        this.speed = 100

        this.flowerSpacing = 50;
        this.distanceSinceLastFlower = 0;

        this.flowerCount = flowerCount;
        
        this.flowers = [];
        this.spawnedBullets = [];

        this.direction = Math.PI /2 ;
    }

    update(delta){
        for(let f of this.flowers){
            f.update(delta)
            this.spawnedBullets.push(...f.spawnedBullets);
            f.spawnedBullets.length = 0;
        }
        if (this.flowers.length >= this.flowerCount){
            if (this.flowers.every(f => !f.alive)) {
                this.alive = false;
            }
            return;
        }
        super.update(delta);
        this.distanceSinceLastFlower += this.speed * delta;
        if (this.distanceSinceLastFlower >= this.flowerSpacing) {
            let newPetalGroup = new PetalGroup (this.position.x, this.position.y);
            this.distanceSinceLastFlower = 0;
            //console.log("adding a petalGroup")
            this.flowers.push(newPetalGroup);
        }

    }

    draw(context){
        context.save();
        
        context.translate(this.position.x, this.position.y)
        context.beginPath();
        context.arc(0, 0, 5, 0, 2 * Math.PI, false);
        context.fillStyle = "rgb(255, 227, 251)";
        context.fill();
        context.lineWidth = 3;
        context.strokeStyle = "rgb(252, 129, 235)";
        context.stroke();

        context.restore();

        context.save();

        context.lineWidth = 2;
        context.strokeStyle = "yellow";
        context.beginPath();
        context.moveTo(this.position.x, 0);
        context.lineTo(this.position.x, this.position.y);
        context.stroke();

        context.restore();

        for (let f of this.flowers) {
            f.draw(context);
        }
    }
}

class PetalGroup extends Bullet{
    constructor(x,y){
        super(x,y);

        this.petals = [];
        this.spawnedBullets = [];

        this.explodeTime = 10;
        this.explodeTimer = this.explodeTime;

        this.exploded = false;
      
        this.rotationOffset = Math.PI * 2 * Math.random()

        for (let i = 0; i < 5; i++) {
            let p = new Petal(this.position.x, this.position.y);
            p.rotation = (i * (Math.PI * 2 / 5)) + this.rotationOffset;
            p.direction = p.rotation - Math.PI/2;
            

            p.position.x += Math.cos(p.rotation - Math.PI / 2) * 12 ;
            p.position.y += Math.sin(p.rotation - Math.PI / 2)  * 12;
            this.petals.push(p);
        }
    }

    update(delta){
        if (this.spawnTimer > 0) {
          this.spawnTimer -= delta;
        }

        if (this.explodeTimer > 0){
            this.explodeTimer -= delta;
            return;
        }
        
        if (this.alive){
            for (let p of this.petals){
                p.freed = true;
                this.spawnedBullets.push(p);
            }
        
            this.alive = false;
        }
        
    }

    draw(context){
        context.save();

        context.translate(this.position.x, this.position.y);
        context.rotate(this.rotation);
        
        let progress = 1 - Math.max(this.spawnTimer, 0) / this.spawnTime;

        // 0 -> 1
        let scale = progress;
        let alpha = progress;
        
        context.scale(scale, scale);
        context.globalAlpha = alpha;
        if (this.alive){
          for (let i = 0; i < 5; i++) {
            context.save();

            context.rotate(i * (Math.PI * 2 / 5) + this.rotationOffset);

            context.beginPath();
            context.ellipse(0, -12, 6, 11, 0, 0, Math.PI * 2);

            context.fillStyle = "rgb(255, 227, 251)";
            context.fill();

            context.strokeStyle = "rgb(252, 129, 235)";
            context.lineWidth = 2;
            context.stroke();

            context.restore();
          }
        }
        

        context.restore();  
    }
}

class Petal extends Bullet{
    constructor(x,y){
        super(x,y);

        this.freed = false;

        this.speed = 0;
        this.scatterSpeed = 100;
        this.topSpeed = 200 - Math.random() * 140;
        this.scatterDeceleration = 100;

        this.acceleration = 5 + Math.random() * 10;

        
        this.state = "attached";

    }

    update(delta) {
        if (this.state == "attached"){
            if(this.freed){
                this.speed = this.scatterSpeed
                this.state = "scatter";
            }
        } else if (this.state == "scatter"){
            this.speed -= this.scatterDeceleration * delta;
                if (this.speed <= 0){
                this.speed = 0;
                this.state = "descend";
                this.rotationSpeed = Math.random() < 0.5 ? -1 : 1;
                this.direction = Math.PI/2 + ((Math.random() * 2 - 1) * (Math.PI / 6));
            }
        } else if (this.state === "descend"){
            this.speed += this.acceleration * delta;

            if (this.speed > this.topSpeed){
                this.speed = this.topSpeed;
            }
        }
        super.update(delta);
    }

    draw(context){
        context.save();
      
        context.translate(this.position.x, this.position.y);

        context.rotate(this.rotation);

        context.beginPath();
        context.ellipse(0, 0, 6, 11, 0, 0, Math.PI * 2);

        context.fillStyle = "rgb(255, 227, 251)";
        context.fill();

        context.strokeStyle = "rgb(252, 129, 235)";
        context.lineWidth = 2;
        context.stroke();

        context.restore();
    }
}

class SquareGroup extends Bullet{
    constructor(x,y){
        super(x,y);
        this.speed = 50;
        this.outOfBoundsTime = 20;
    }

    update(delta){
        super.update(delta);
    }

    draw(context){
        context.save();

        context.translate(this.position.x, this.position.y);
        context.rotate(this.direction);
        context.fillStyle = "rgba(250, 241, 110, 0.8)";
        context.fillRect(-40,-9, 80, 18)

        context.restore();
    }
}

class DiagonalPath {
    constructor(canvas, y, slope, spacing, speed, totalSpan, fireTime, colorOuter, colorInner, side, delay) {
        this.canvas = canvas;
        this.y = y;             
        this.slope = slope;
        this.spacing = spacing;
        this.speed = speed;
        this.totalSpan = totalSpan; 

        this.fireTime = fireTime;
        this.fireTimer = fireTime; 
        this.fireDelayTimer = delay;

        this.colorOuter = colorOuter;
        this.colorInner = colorInner;

        this.spawnedBullets = [];
        
        this.side = side;
        
    }

    getEndpoints() {
        const x0 = -10;
        const y0 = this.y;
        const x1 = this.canvas.width + 10;
        const y1 = this.y + this.canvas.width * this.slope;
        return { x0, y0, x1, y1 };
    }

    update(delta) {
        this.y += this.speed * delta; 
        
        let {y0, y1} = this.getEndpoints();
        if (Math.min(y0, y1) > this.canvas.height + this.spacing) {
            this.y -= this.totalSpan; // wraps back to the top, keeping even spacing with the others
        }
        this.fireDelayTimer -= delta;
        if (this.fireDelayTimer > 0){
          return;
        }
        this.fireTimer -= delta;
        if (this.fireTimer <= 0) {
            this.fireTimer += this.fireTime;
          if (this.side == -1){
            this.fire();
          } else {
            this.fireMirror();
          }
            
        }
    }

    fire() {
        let { x0, y0, x1, y1 } = this.getEndpoints(); 
        let drift = new Vector2(0, this.speed);

        let angleForward = Math.atan2(y1 - y0, x1 - x0);
        this.spawnedBullets.push({ x: x0, y: y0, angle: angleForward, drift });


    }
  
    fireMirror(){
        let { x0, y0, x1, y1 } = this.getEndpoints(); 
        let drift = new Vector2(0, this.speed);

        let angleBackward = Math.atan2(y0 - y1, x0 - x1);
        this.spawnedBullets.push({ x: x1, y: y1, angle: angleBackward, drift });
    }

    draw(context) {
        let { x0, y0, x1, y1 } = this.getEndpoints();
        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
        context.strokeStyle = this.colorOuter;
        context.lineWidth = 30;
        context.stroke();
        context.strokeStyle = this.colorInner;
        context.lineWidth = 20;
        context.stroke();
    }
}

class SpellCardManager {
    constructor (canvas){
        this.canvas = canvas;
        this.bullets = [];
        this.bulletsBack = [];
        this.clock = 1;
        this.patternTimer = 0;
        this.patternTime = 10;
        this.canvasCenter = new Vector2(this.canvas.width / 2, this.canvas.height / 2)

        //BUTTERFLIES
        this.bfBulletTimer = 0;  
        this.bfBulletTime = 0.1
        this.bfBulletCount = 40;
        this.bfBulletCounter = 0;
        this.bfFinished = false;

        //FLOWERS
        this.fBulletTimer = 0;
        this.fBulletTime = 0.01;
        this.fBulletCount = 50;
        this.fBulletCounter = 0;
        this.fCurveStep = this.canvas.height / this.fBulletCount;
        this.yStep = this.canvas.height;
        //this.fCurve = this.calcFlowerCurve();
        this.fFinished = false;

        //FLOWERSTRINGS
        this.fsBulletTimer = 0;
        this.fsBulletTime = 0.3;
        this.fsBulletCount = 4;
        this.fsBulletCounter = 0;
        this.fsFinished = false;
        this.fsInterval = this.canvas.width / 3.5;
        this.fsStringMin = 2;
        this.fsStarting = 50;

        //DIAGONAL PATHES
        this.dpBulletTimer = 0;
        this.dpBulletTime = 4;

        this.dpSlope = 0.6;
        this.dpPathSpacing = 150;
        this.dpPathOffset = -this.canvas.height - 800;
        this.dpPathSpeed = 60;
        this.dpStartY = 0
        
        this.initDiagonalPaths()
    }
  
  initDiagonalPaths() {
    this.dpPaths = [];
    const laneCount = Math.ceil(this.canvas.height / this.dpPathSpacing) + 3;
    const totalSpan = laneCount * this.dpPathSpacing;
    
    
    //LEFT to RIGHT
    for (let i = 0; i < laneCount; i++) {
        let yA = -this.dpPathSpacing + i * this.dpPathSpacing  + 200 - 1300;
        this.dpPaths.push(new DiagonalPath(
            this.canvas, yA, -this.dpSlope, this.dpPathSpacing, this.dpPathSpeed,
            totalSpan, this.dpBulletTime, "rgba(255, 244, 87, 0.3)", "rgba(48, 0, 42, 0.6)", 1
        ));
    //RIGHT to LEFT

        let yB = -this.dpPathSpacing + i * this.dpPathSpacing - 1300;
        this.dpPaths.push(new DiagonalPath(
            this.canvas, yB, this.dpSlope, this.dpPathSpacing, this.dpPathSpeed,
            totalSpan, this.dpBulletTime, "rgba(255, 244, 87, 0.3)", "rgba(48, 0, 42, 0.6)", -1
        ));
    }
}
  
  
  
  
  handleDiagonalPathesNEW(delta) {
    for (let path of this.dpPaths) {
        path.update(delta);
        if (path.spawnedBullets.length) {
            for (let b of path.spawnedBullets) {
                this.spawnPathSquares(b.x, b.y, b.angle, b.drift);
            }
            path.spawnedBullets.length = 0;
        }
    }
}

    drawDiagonalPathesNEW(context) {
        context.save();
        for (let path of this.dpPaths) {
            path.draw(context);
        }
        context.restore();
    }
    
  

    calcFlowerCurve(leftRight){
        let P0 = new Vector2(this.canvasCenter.x - 30 * leftRight, this.canvas.height);
        let P1 = new Vector2(this.canvasCenter.x + leftRight * this.canvas.width * 0.5, this.canvas.height * 0.95);
        let P2 = new Vector2(this.canvasCenter.x + leftRight * this.canvas.width * 0.5, 0);

        return { P0 : P0, P1 : P1, P2 :P2 };
    }

    bezierPoint(curve, t){
        let mt = 1 - t;
        let x = mt*mt*curve.P0.x + 2*mt*t*curve.P1.x + t*t*curve.P2.x;
        let y = mt*mt*curve.P0.y + 2*mt*t*curve.P1.y + t*t*curve.P2.y;
        return new Vector2(x, y);
    }
  
  
    spawnButterflies(leftRight){
        let butterfly = new Butterfly(this.canvasCenter.x + (Math.random() * 2 - 1) * 50, this.canvas.height);
        let offset = (Math.PI / 3) * leftRight;
        if (leftRight == 1) {
          butterfly.clockwise = false;
        } else {
          butterfly.clockwise = true;
        }
        butterfly.direction = -Math.PI / 2 + offset;
        butterfly.targetAngle = Math.PI - butterfly.direction
        butterfly.speed = 220;
        butterfly.targetY = 80 + Math.random() * (this.canvas.height / 5);

        this.bullets.push(butterfly);
    }

    spawnFlowers(leftRight, y){
        let t = 1 - (y / this.canvas.height);
        let curve = this.calcFlowerCurve(leftRight);
    
        
        let p = this.bezierPoint(curve, t);
        let nx = p.x + (Math.random() * 2 - 1) * 60
        let ny =  p.y + (Math.random() * 2 - 1) * 50
        let flower = new Flower(nx,ny);
        
        let centerDirection = Math.atan2(
          this.canvasCenter.y - ny,
          this.canvasCenter.x - nx
        );
        let spread = Math.PI / 2;

        flower.direction = centerDirection + (Math.random() * 2 - 1) * spread;
        this.bullets.push(flower);
    }

    spawnStrings(leftRight, x, amount){
        let flowerString = new FlowerString(x, 0, amount)
        this.bullets.push(flowerString);
    }

    spawnPathSquares(x, y, a, d){
        let square = new SquareGroup(x,y);
        //square.angle =  a;
        square.direction = a;
        square.driftVelocity = d
        square.outOfBoundsTime = 10;
        this.bulletsBack.push(square);

    }

    handleBfPatternCycle(delta){
        if (this.bfBulletTimer > 0) {
            this.bfBulletTimer -= delta;
            return;
        }

        if (this.bfBulletCounter < this.bfBulletCount) {
            this.spawnButterflies(this.clock);

            this.bfBulletCounter++;
            this.bfBulletTimer = this.bfBulletTime;
        }
        else {
            
            this.bfFinished = true;
            
        }  
    }

    handleFPatternCycle(delta){

        if (this.fBulletTimer > 0){
            this.fBulletTimer -= delta;
            return;
        }

        if (this.fBulletCounter < this.fBulletCount){
            this.spawnFlowers(this.clock, this.yStep);

            this.fBulletCounter++;
            this.fBulletTimer = this.fBulletTime;
            this.yStep -= this.fCurveStep;
        } else {
            
            this.yStep = this.canvas.height;
            this.fFinished = true;
        }
    }

    handleStringCycle(delta){
        if (this.fsBulletTimer > 0){
            this.fsBulletTimer -= delta;
            return;
        }

        if (this.fsBulletCounter < this.fsBulletCount){
            let x = (this.clock === -1)
                ? this.fsStarting + this.fsInterval * this.fsBulletCounter
                : this.canvas.width - this.fsStarting - this.fsInterval * this.fsBulletCounter;
            this.spawnStrings(this.clock, x, this.fsStringMin + this.fsBulletCounter);
            this.fsBulletCounter++;
            this.fsBulletTimer = this.fsBulletTime;
        } else {
            this.fsFinished = true;
        }
    }


    update(delta) {
        for (let bullet of this.bulletsBack){
            bullet.update(delta);
        }
        let newBullets = [];
        for (let bullet of this.bullets) {
            bullet.update(delta);
            if (bullet.spawnedBullets){
                newBullets.push(...bullet.spawnedBullets);
                bullet.spawnedBullets.length = 0;
            }
        }
        
        this.bullets.push(...newBullets);
      
        this.bullets = this.bullets.filter(bullet => bullet.alive);
        this.bulletsBack = this.bulletsBack.filter(bullet => bullet.alive);
        //console.log(this.bullets.length);

        this.handleDiagonalPathesNEW(delta);
        if (this.patternTimer > 0){
            this.patternTimer -= delta;
            return;
        } else {
            this.handleBfPatternCycle(delta);
            this.handleFPatternCycle(delta);
            this.handleStringCycle(delta);
            if (this.bfFinished && this.fFinished && this.fsFinished){
                this.patternTimer = this.patternTime;
                this.clock *= -1
                
                this.bfBulletCounter = 0;
                this.fBulletCounter = 0;
                this.fsBulletCounter = 0;
              
                this.bfFinished = false;
                this.fFinished = false;
                this.fsFinished = false;
            }
          //console.log(this.bulletsBack.length)
        }
        
        
    }

    draw(context){
      this.drawDiagonalPathesNEW(context);
        for (let bullet of this.bulletsBack) {
            bullet.draw(context);
        }
        for (let bullet of this.bullets) {
            bullet.draw(context);
        }
        
    }
}
