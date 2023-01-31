window.Sabertooth = {
  TARGET_FPS: 30,
  UPSCALE_FACTOR: 2,
  Utils: {
    generateOId: () => { return Math.floor((1 + Math.random()) * 0x100000000).toString(16).substring(1); }
  },

  Vector2: class {
    x;
    y;

    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
  
    add(vector) {
      const resultVector = Sabertooth.Vector2.add(this, vector);
      this.x = resultVector.x;
      this.y = resultVector.y;
    }

    subtract(vector) {
      const resultVector = Sabertooth.Vector2.subtract(this, vector);
      this.x = resultVector.x;
      this.y = resultVector.y;
    }

    clone() {
      return new Sabertooth.Vector2(this.x, this.y);
    }

    toAnonObject() {
      return { x: this.x, y: this.y };
    }

    static add(vectorA, vectorB) {
      return new Sabertooth.Vector2(vectorA.x + vectorB.x, vectorA.y + vectorB.y);
    }

    static subtract(vectorA, vectorB) {
      return new Sabertooth.Vector2(vectorA.x - vectorB.x, vectorA.y - vectorB.y);
    }
  },

  Rectangle: class {
    position;
    size;

    constructor(position, size) {
      this.position = position;
      this.size = size;
    }

    edges() {
      return {
        top: this.position.y,
        bottom: this.position.y + this.size.y,
        right: this.position.x + this.size.x,
        left: this.position.x
      };
    }

    intersectionPoint(point) {
      const checks = {
        horizontal: point.x >= this.position.x && point.x <= this.position.x + this.size.x,
        vertical: point.y >= this.position.y && point.y <= this.position.y + this.size.y,
      };

      if (checks.horizontal && checks.vertical) {
        return new Sabertooth.Vector2(point.x - this.position.x, point.y - this.position.y);
      }

      return false;
    }
  },

  ElapsedTime: class {
    #startDate;

    start() {
      this.#startDate = new Date();
    }

    end() {
      return new Date() - this.#startDate;
    }
  },

  Object: class {
    oid;
    position;
    size;
    zIndex = 0;

    constructor(params = {}) {
      this.oid = params.oid || Sabertooth.Utils.generateOId();
      this.position = params.position || new Sabertooth.Vector2(0, 0);
      this.size = params.size || new Sabertooth.Vector2(0, 0);
      this.zIndex = params.zIndex;
    }

    getPosition(referential) {
      return Sabertooth.Vector2.add(referential, this.position);
    }

    getRectangle() {
      return new Sabertooth.Rectangle(this.position, this.size);
    }

    getCenter(referential) {
      return Sabertooth.Vector2.add(
        this.getPosition(referential),
        new Sabertooth.Vector2(this.size.x / 2, this.size.y / 2)
      );
    }

    update() {}
    draw() {}
  },

  Engine: class {
    #objects;
    ctx;
    running;
    debugging = false;
    worldCenter;
    #lastFrame;
    #mouse;
    drawPasses;

    constructor(drawSurface) {
      this.drawPasses = ["base"];
      this.#lastFrame = { moment: new Date(), lastSecond: new Date(), frameCount: 0, fps: 0 };
      this.#objects = new Array();
      this.#mouse = {};
      this.ctx = drawSurface.getContext("2d", {alpha: false});
      this.worldCenter = new Sabertooth.Vector2(0, 0);
      drawSurface.addEventListener("mousedown", this.#mouseHandler.bind(this));
      drawSurface.addEventListener("mouseup", this.#mouseHandler.bind(this));
      drawSurface.addEventListener("mousemove", this.#mouseHandler.bind(this));
      this.enable();
    }

    clear() {
      this.#objects = [];
    }

    enable() {
      this.running = true;
      this.#requestFrame();
    }

    disable() { this.running = false; }

    addObject(object) {
      object.initialize(this.engineContext());

      this.#objects.push(object);
      
      this.#objects.sort((oA, oB) => {
        return oA.zIndex - oB.zIndex;
      });
    }

    removeObject(oid) {
      const killIndex = this.#objects.findIndex((object) => {return object.oid === oid});
      this.#objects.splice(killIndex, 1);
    }

    engineContext() {
      return {
        context2d: this.ctx,
        referential: this.worldCenter,
        objects: this.#objects,
        canvas: {
          height: this.ctx.canvas.clientHeight * Sabertooth.UPSCALE_FACTOR,
          width: this.ctx.canvas.clientWidth * Sabertooth.UPSCALE_FACTOR
        },
        mouse: this.#mouse
      };
    }

    #update() {
      const event = new CustomEvent("update_start", { detail: this.engineContext() });
      this.ctx.canvas.dispatchEvent(event);

      for (let oidx = 0; oidx < this.#objects.length; oidx++) {
        this.#objects[oidx].update(this.engineContext());
      }
    }

    #draw() {
      const eCtx = this.engineContext();
      this.ctx.clearRect(0, 0, eCtx.canvas.width, eCtx.canvas.height);
      this.ctx.fillStyle = "#333";
      this.ctx.fillRect(0, 0, eCtx.canvas.width, eCtx.canvas.height);

      this.drawPasses.forEach((pass) => {
        for (let oidx = 0; oidx < this.#objects.length; oidx++) {
          this.#objects[oidx].draw(eCtx, pass);
        }
      });
    }

    #requestFrame() {
      if (!this.running) return;

      requestAnimationFrame(this.#frame.bind(this));
      setTimeout(this.#requestFrame.bind(this), 1000 / Sabertooth.TARGET_FPS);
    }

    #frame() {
      const perfValues = {};
      const et = new Sabertooth.ElapsedTime();

      et.start();
      this.#update();
      perfValues.update = et.end();
      et.start();
      this.#draw();
      perfValues.draw = et.end();

      const endMoment = new Date();
      perfValues.frame = endMoment - this.#lastFrame.moment;
      this.#lastFrame.frameCount += 1;
      if ((endMoment - this.#lastFrame.lastSecond) > 1000) {
        this.#lastFrame.fps = this.#lastFrame.frameCount;
        this.#lastFrame.frameCount = 1;
        this.#lastFrame.lastSecond = endMoment;
      }

      if (this.debugging) {
        this.ctx.fillStyle = "#FFF";
        this.ctx.font = "20px monospace";
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "top";
        this.ctx.fillText(`U: ${perfValues.update}ms | D: ${perfValues.update}ms | F: ${perfValues.update}ms | FPS: ${this.#lastFrame.fps}`, 5, 5);
      }

      this.#lastFrame.moment = endMoment;
    }

    #mouseHandler(evt) {
      const interactionSnapshot = {
        button: evt.which,
        x: evt.x * Sabertooth.UPSCALE_FACTOR - this.worldCenter.x,
        y: evt.y * Sabertooth.UPSCALE_FACTOR - this.worldCenter.y,
        referential: this.worldCenter,
        cursorAt: null
      }

      const objectAtPointer = this.#objectAt(
        interactionSnapshot.x, interactionSnapshot.y
      );
      if (objectAtPointer) {
        interactionSnapshot.cursorAt = {
          object: objectAtPointer,
          intersection: objectAtPointer.getRectangle().intersectionPoint(
            new Sabertooth.Vector2(interactionSnapshot.x, interactionSnapshot.y)
          )
        }
      }

      switch(evt.type) {
        case "mousedown":
          this.#mouse.down = interactionSnapshot;
          break;
        case "mouseup":
          this.#mouse.up = interactionSnapshot;

          const event = new CustomEvent(
            ( this.#mouse.up.x === this.#mouse.down.x && 
              this.#mouse.up.y === this.#mouse.down.y) ? "clicked" : "drag_finished", {
            detail: {
              start: this.#mouse.down,
              end: this.#mouse.up
            }
          });
          this.ctx.canvas.dispatchEvent(event);

          delete this.#mouse.down;
          delete this.#mouse.move;
          break;
        case "mousemove":
          this.#mouse.move = interactionSnapshot;
          break;
      }
    }

    #objectAt(x, y) {
      let objectFound = null;

      for (let oidx = 0; oidx < this.#objects.length; oidx++) {
        const currentObject = this.#objects[oidx];
        if (currentObject.getRectangle().intersectionPoint(new Sabertooth.Vector2(x, y))) {
          if (objectFound === null) {
            objectFound = currentObject;
          } else if (objectFound.zIndex < currentObject.zIndex) {
            objectFound = currentObject;
          }
        }
      }

      return objectFound;
    }
  }
}