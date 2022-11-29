window.Caixanegra.Designer = {
  Unit: class extends Sabertooth.Object {
    #drawValues;
    title;
    class;
    type;
    exits;
    connectingExit;
    UNIT_WIDTH;
    MARGIN;

    constructor(params = {}) {
      super(params);
      this.title = params.title || "untitled";
      this.type = params.type || "unspecified";
      this.class = params.class || "unspecified";
      this.exits = params.exits || [];
      this.#drawValues = {};
      this.MARGIN = 10;
      this.UNIT_WIDTH = 300;
      this.connectingExit = null;
    }

    initialize(context) {
      const ctx = context.context2d;
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
      this.#drawValues.exitRectangles = [];

      hCursor += this.MARGIN;
      this.#drawValues.text.title = { y: hCursor };
      hCursor += 25; //title
      hCursor += this.MARGIN;
      this.#drawValues.text.class = { y: hCursor };
      hCursor += 18; //class
      hCursor += Math.round(this.MARGIN * (this.exits.length > 0 ? 1.8 : 1));

      const eH = 14;
      this.#drawValues.exits = [];
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "right";
      ctx.lineWidth = 2;
      this.exits.forEach((exit) => {
        const exitToPush ={
          reference: exit,
          x: this.#drawValues.position.x + this.size.x - this.MARGIN,
          markerY: hCursor + Math.round(eH / 2),
          y: hCursor
        };
        const exitNameWidth = ctx.measureText(exit.name).width;
        exitToPush.rectangle = new Sabertooth.Rectangle(
          Sabertooth.Vector2.subtract(
            new Sabertooth.Vector2(exitToPush.x - exitNameWidth, hCursor),
            this.#drawValues.position
          ),
          new Sabertooth.Vector2(exitNameWidth, eH)
        )
        this.#drawValues.exits.push(exitToPush);

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
          context.mouse.move.button === 1 &&
          context.mouse.down && 
          context.mouse.down.cursorAt && 
          context.mouse.down.cursorAt.object.oid === this.oid) {
            const intersection = new Sabertooth.Vector2(
              context.mouse.down.cursorAt.intersection.x,
              context.mouse.down.cursorAt.intersection.y
            );
            
            if (this.connectingExit === null) {
              for (let eidx = 0; eidx < this.#drawValues.exits.length; eidx++) {
                if (this.#drawValues.exits[eidx].rectangle.intersectionPoint(intersection)) {
                  this.connectingExit = this.#drawValues.exits[eidx];
                  break;
                }
              }
            }

            if (!this.connectingExit) {
              this.position.x = context.mouse.move.x - intersection.x;
              this.position.y = context.mouse.move.y - intersection.y;
              this.initialize(context);
            }
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
        ctx.fillText(exit.reference.name, exit.x, exit.y, this.UNIT_WIDTH - this.MARGIN * 2);
        ctx.beginPath();
        ctx.moveTo(this.#drawValues.position.x + this.size.x, exit.markerY);
        ctx.lineTo(this.#drawValues.position.x + this.size.x + 25, exit.markerY);
        
        if (this.connectingExit === exit && context.mouse.move) {
          ctx.lineTo(context.mouse.move.x, context.mouse.move.y);
        } else if (exit.reference.target) {
          const targetCenter = exit.reference.target.getCenter(context.referential);
          ctx.lineTo(targetCenter.x, targetCenter.y);
        }

        ctx.stroke();
      });
    }
  },
  Core: class {
    #loadedComponents;
    #catalog;
    #units;
    gre; //graphic rendering engine
    api;
    blocker;
    messenger;
    flowId;
    unitScope;
  
    constructor(drawingSurface) {
      this.flowId = this.#extractFlowId();
      this.unitScope = this.#extractUnitScope();
      this.#loadedComponents = {
        catalog: false,
        flow: false
      }
      this.gre = new Sabertooth.Engine(drawingSurface);
      this.api = new Caixanegra.API();
      this.blocker = document.querySelector("#blocker");
      this.messenger = document.querySelector("#action_messenger");
      document.querySelector("#save").addEventListener("click", this.saveFlow.bind(this));
      document.querySelector("#addUnit").addEventListener("click", this.toggleUnitMenu.bind(this));
      this.toggleBlocker(true, "loading your flow");
      window.addEventListener("resize", this.#windowResized.bind(drawingSurface));
      drawingSurface.addEventListener("update_start", this.#engineUpdate.bind(this));
      drawingSurface.addEventListener("drag_finished", this.#dragFinished.bind(this));
      this.#windowResized.bind(drawingSurface)({ target: window });
      this.#units = new Array();

      this.getUnits();
      this.loadFlow();
    }

    toggleUnitMenu() {
      const unitMenu = document.querySelector("#unitMenu");
      const addUnit = document.querySelector("#addUnit");

      if(unitMenu.classList.contains("-open")) {
        unitMenu.classList.remove("-open");
        addUnit.classList.remove("-open");
      } else {
        unitMenu.classList.add("-open");
        addUnit.classList.add("-open");
      }
    }

    saveFlow() {
      this.actionMessage(true, "Saving...", "working");
      this.api.saveFlow(this.flowId, this.flowSnapshot()).then((response) => {
        this.actionMessage(true, "Saved", "ok");
        setTimeout(() => {this.actionMessage(false)}, 4000);
      });
    }

    flowSnapshot() {
      console.log(this.#units)
    }

    #extractUnitScope() {
      const params = window.location.search.replace("?", "").split("&");
      for(let pidx = 0; pidx < params.length; pidx++) {
        const [key, value] = params[pidx].split("=");
        if(key === "unit_scope")
          return value;
      }

      return "";
    }

    #extractFlowId() {
      const splittedURL = window.location.pathname.split("/");
      return splittedURL[splittedURL.length - 1];
    }

    getUnits() {
      this.api.units(this.unitScope).then((response) => {
        this.#catalog = response;
        const unitMenu = document.querySelector("#unitMenu");
        unitMenu.innerHTML = "";
        this.#catalog.forEach((unitData) => {
          const item = document.createElement("div");
          const name = document.createElement("div");
          const description = document.createElement("div");
          const type = document.createElement("div");
          item.classList.add("unit");
          name.classList.add("name");
          type.classList.add("type");
          description.classList.add("description");

          name.innerHTML = unitData.title;
          type.innerHTML = unitData.type;
          description.innerHTML = unitData.description;

          item.append(name, type, description);
          item.addEventListener("click", this.createUnit.bind(this, unitData));
          unitMenu.appendChild(item);
        });
        this.#loadedComponents.catalog = true;
        this.#reveal();
      });
    }

    loadFlow() {
      this.api.getFlow(this.flowId).then((response) => {
        const flowData = response;
        this.gre.clear();
        this.#units = [];

        console.log(flowData);
        // loading goodness

        this.#loadedComponents.flow = true;
        this.#reveal();
      });
    }

    #reveal() {
      if (this.#loadedComponents.flow && this.#loadedComponents.catalog) {
        this.toggleBlocker(false);
      }
    }

    toggleBlocker(toggle, message = "") {
      if (toggle) {
        this.blocker.classList.remove("-released");
      } else {
        this.blocker.classList.add("-released");
      }

      if(toggle) {
        this.blocker.querySelector(".message").innerHTML = message;
      }
    }

    actionMessage(toggle, message = "", icon = "") {
      if (toggle) {
        this.messenger.classList.add("-visible");
      } else {
        this.messenger.classList.remove("-visible");
      }

      this.messenger.querySelectorAll(".icon").forEach((i) => { i.style.display = "none"; });
      if (icon !== "") {
        const iconElement = this.messenger.querySelector(`.icon.icon-${icon}`);

        if(iconElement)
          iconElement.style.display = "block";
      }

      this.messenger.querySelector(".message").innerHTML = message;
    }
  
    createUnit(params) {
      const newUnit = new Caixanegra.Designer.Unit({
        type: params.type,
        title: params.title,
        class: params.class,
        exits: params.exits,
      });

      newUnit.position = new Sabertooth.Vector2(20, 20);

      this.#units.push(newUnit);
      this.gre.addObject(newUnit);
    }
  
    removeUnit(oid) {
      
    }

    #dragFinished(ev) {
      const moments = ev.detail;

      const startObject = moments.start.cursorAt?.object;
      const endObject = moments.end.cursorAt?.object;

      if (startObject && endObject &&
          startObject?.connectingExit && 
          startObject.oid !== endObject.oid) {
            startObject.connectingExit.reference.target = moments.end.cursorAt.object;
            startObject.connectingExit = null;
      } else if (startObject && !endObject && startObject?.connectingExit) {
        startObject.connectingExit.reference.target = null;
        startObject.connectingExit = null;
      } else if (startObject && endObject && startObject.oid === endObject.oid) {
        startObject.connectingExit = null;
      }
    }

    #engineUpdate(ev) {
      const context = ev.detail;

      if (context.mouse.move && 
          [1, 2].includes(context.mouse.move.button) &&
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
