window.Caixanegra.Designer = {
  Unit: class extends Sabertooth.Object {
    #drawValues;
    title;
    class;
    type;
    exits;
    UNIT_WIDTH;
    MARGIN;

    constructor(params = {}) {
      super(params);
      this.title = params.title || "untitled stuff and such";
      this.type = params.type || "unspecified";
      this.class = params.class || "unspecified";
      this.exits = params.exits || [];
      this.#drawValues = {};
      this.MARGIN = 10;
      this.UNIT_WIDTH = 300;
    }

    initialize(context) {
      this.#drawValues.position = this.getPosition(context.referential);
      this.size = new Sabertooth.Vector2(0, 0);

      this.size.x = this.UNIT_WIDTH;
      let hCursor = this.#drawValues.position.y;

      switch (this.type) {
        case "starter":
          this.#drawValues.unitBgColor = "#65CCA9";
        break;
        case "terminator":
          this.#drawValues.unitBgColor = "#E44";
        break;
        case "passthrough":
          this.#drawValues.unitBgColor = "#EEE";
        break;
        case "feeder":
          this.#drawValues.unitBgColor = "#44E";
        break;
        default:
          this.#drawValues.unitBgColor = "#FFF";
      }

      this.#drawValues.text = {};

      hCursor += this.MARGIN;
      this.#drawValues.text.title = { y: hCursor };
      hCursor += 25; //title
      hCursor += this.MARGIN;
      this.#drawValues.text.class = { y: hCursor };
      hCursor += 18; //class
      hCursor += Math.round(this.MARGIN * 1.8);

      const eH = 14;
      this.#drawValues.exits = [];
      this.exits.forEach((exit) => {
        this.#drawValues.exits.push({
          name: exit.name,
          x: this.#drawValues.position.x + this.size.x - this.MARGIN,
          markerY: hCursor + Math.round(eH / 2),
          y: hCursor,
          target: exit.target
        });
        hCursor += this.MARGIN;
        hCursor += eH; //exit
      });

      this.size.y = hCursor - this.#drawValues.position.y;

      this.#drawValues.center = new Sabertooth.Vector2(
        this.#drawValues.position.x + Math.round(this.size.x / 2),
        this.#drawValues.position.y + Math.round(this.size.y / 2)
      );
    }

    update(context) {
      if (context.mouse.move && 
          context.mouse.down && 
          context.mouse.down.cursorAt && 
          context.mouse.down.cursorAt.object.oid === this.oid) {
        this.position.x = context.mouse.move.x - context.mouse.down.cursorAt.intersection.x;
        this.position.y = context.mouse.move.y - context.mouse.down.cursorAt.intersection.y;
        this.initialize(context);
      }
      this.#drawValues.position = this.getPosition(context.referential);
    }

    draw(context) {
      const ctx = context.context2d;

      ctx.beginPath();
      ctx.roundRect(this.#drawValues.position.x, this.#drawValues.position.y, this.size.x, this.size.y, 5);
      ctx.fillStyle = this.#drawValues.unitBgColor;
      ctx.fill();

      ctx.beginPath();
      ctx.roundRect(this.#drawValues.position.x, this.#drawValues.position.y, this.size.x, this.size.y, 5);
      ctx.strokeStyle = "#FFF";
      ctx.stroke();

      ctx.textBaseline = "top";
      ctx.textAlign = "center";
      ctx.fillStyle = "#000";
      ctx.font = "25px Helvetica";
      ctx.fillText(this.title, this.#drawValues.center.x, this.#drawValues.text.title.y, this.UNIT_WIDTH - this.MARGIN * 2);

      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.font = "18px Helvetica";
      ctx.fillText(this.class, this.#drawValues.center.x, this.#drawValues.text.class.y, this.UNIT_WIDTH - this.MARGIN * 2);

      ctx.strokeStyle = "#FFF";
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "right";
      ctx.lineWidth = 2;
      this.#drawValues.exits.forEach((exit) => {
        ctx.fillText(exit.name, exit.x, exit.y, this.UNIT_WIDTH - this.MARGIN * 2);
        ctx.beginPath();
        ctx.moveTo(this.#drawValues.position.x + this.size.x, exit.markerY);
        ctx.lineTo(this.#drawValues.position.x + this.size.x + 25, exit.markerY);
        // line to target
        ctx.stroke();
      });
    }
  },
  Core: class {
    #units;
    gre; //graphic rendering engine
    api;
  
    constructor(drawingSurface) {
      this.gre = new Sabertooth.Engine(drawingSurface);
      this.api = null;
      window.addEventListener("resize", this.#windowResized.bind(drawingSurface));
      drawingSurface.addEventListener("update_start", this.#engineUpdate.bind(this));
      drawingSurface.addEventListener("drag_finished", this.#dragFinished.bind(this));
      this.#windowResized.bind(drawingSurface)({ target: window });
      this.#units = new Array();

      this.createUnit(); // fast debug. remove this
    }
  
    createUnit() {
      const newUnit = new window.Caixanegra.Designer.Unit(
        {
          position: new Sabertooth.Vector2(200, 200),
          type: "starter", class: "start", title: "Start",
          exits: [{name: "some_exit"}, {name: "some_another_exit"}]
        }
      );
      this.#units.push(newUnit);
      this.gre.addObject(newUnit);
    }
  
    removeUnit(oid) {
      
    }

    #dragFinished(ev) {
      const moments = ev.detail;

      console.log(moments);
    }

    #engineUpdate(ev) {
      const context = ev.detail;

      console.log(context.mouse?.move);

      if (context.mouse.move && 
          context.mouse.down && 
          context.mouse.down.cursorAt === null) {
        this.gre.worldCenter.x = (context.mouse.move.x - context.mouse.down.x) + context.mouse.down.referential.x;
        this.gre.worldCenter.y = (context.mouse.move.y - context.mouse.down.y) + context.mouse.down.referential.y;
        
        for (let oidx = 0; oidx < context.objects.length; oidx++) {
          context.objects[oidx].initialize(this.gre.engineContext());
        }
      }
    }

    #windowResized(ev) {
      this.width = ev.target.innerWidth * Sabertooth.UPSCALE_FACTOR;
      this.height = ev.target.innerHeight * Sabertooth.UPSCALE_FACTOR;
      this.style.width = `${this.width / Sabertooth.UPSCALE_FACTOR}px`;
      this.style.height = `${this.height / Sabertooth.UPSCALE_FACTOR}px`;
    }
  }
}

window.Caixanegra.Designer.core = new Caixanegra.Designer.Core(document.querySelector("canvas"));
