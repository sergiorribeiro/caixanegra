window.Caixanegra.Designer = {
  Unit: class extends Sabertooth.Object {
    #drawValues;
    title;
    class;
    color;
    type;
    exits;
    mappings;
    connectingExit;
    UNIT_WIDTH;
    SNAP;
    MARGIN;
    debugHits;
    #beingDragged;

    constructor(params = {}) {
      super(params);
      this.title = params.title || "untitled";
      this.type = params.type || "unspecified";
      this.class = params.class || "unspecified";
      this.exits = params.exits || [];
      this.mappings = params.mappings || {};
      this.color = params.color;
      this.#drawValues = {};
      this.MARGIN = 10;
      this.SNAP = 10;
      this.UNIT_WIDTH = 300;
      this.connectingExit = null;
      this.debugHits = [];
      this.#beingDragged = false;
    }

    initialize(context) {
      const ctx = context.context2d;
      this.#drawValues.position = this.getPosition(context.referential);
      this.size = new Sabertooth.Vector2(0, 0);

      this.size.x = this.UNIT_WIDTH;
      let hCursor = this.#drawValues.position.y;
      const typeColor = Caixanegra.Designer.typeColor(this);
      this.#drawValues.unitBgColor = typeColor.background;
      this.#drawValues.unitFgColor = typeColor.foreground;
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
      if (context.mouse.down &&
          context.mouse.down.button === 1 &&
          context.mouse.down.cursorAt &&
          context.mouse.down.cursorAt.object.oid === this.oid) {
            this.#beingDragged = true;
      } else {
        this.#beingDragged = false;
      }

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
              this.position.x = Math.round(this.position.x / this.SNAP) * this.SNAP;
              this.position.y = Math.round(this.position.y / this.SNAP) * this.SNAP;
              this.initialize(context);
            }
      }
      this.#drawValues.position = this.getPosition(context.referential);
    }

    draw(context, pass) {
      const ctx = context.context2d;

      switch(pass) {
        case "base":
          const selected = window.Caixanegra.Designer.core.selectedUnit?.oid === this.oid;
          if (this.#beingDragged || selected) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(0, this.#drawValues.center.y);
            ctx.lineTo(context.canvas.width, this.#drawValues.center.y);
            ctx.moveTo(this.#drawValues.center.x, 0);
            ctx.lineTo(this.#drawValues.center.x, context.canvas.height);
            ctx.stroke();

            ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
            ctx.beginPath();
            ctx.moveTo(0, this.#drawValues.position.y);
            ctx.lineTo(context.canvas.width, this.#drawValues.position.y);
            ctx.moveTo(0, this.#drawValues.position.y + this.size.y);
            ctx.lineTo(context.canvas.width, this.#drawValues.position.y + this.size.y);

            ctx.moveTo(this.#drawValues.position.x, 0);
            ctx.lineTo(this.#drawValues.position.x, context.canvas.height);
            ctx.moveTo(this.#drawValues.position.x + this.size.x, 0);
            ctx.lineTo(this.#drawValues.position.x + this.size.x, context.canvas.height);

            ctx.stroke();
          }

          this.#drawValues.exits.forEach((exit) => {
            const hitsForExit = this.debugHits.filter(hit => hit?.out?.result?.exit_through === exit.reference.name);
            if (hitsForExit.length > 0) {
              ctx.strokeStyle = "#0F0";
              ctx.lineWidth = 3;
            } else {
              ctx.strokeStyle = "#FFF";
              ctx.lineWidth = 2;
            }
            ctx.beginPath();
            ctx.moveTo(this.#drawValues.position.x + this.size.x, exit.markerY);
            ctx.lineTo(this.#drawValues.position.x + this.size.x + 25, exit.markerY);

            if (this.connectingExit === exit && context.mouse.move) {
              ctx.lineTo(context.mouse.move.x + context.referential.x, context.mouse.move.y + context.referential.y);
            } else if (exit.reference.target) {
              const targetCenter = exit.reference.target.getCenter(context.referential);
              ctx.lineTo(targetCenter.x, targetCenter.y);
            }

            ctx.stroke();
          });
          break;
        case "extra":
          ctx.beginPath();
          ctx.roundRect(this.#drawValues.position.x, this.#drawValues.position.y, this.size.x, this.size.y, 5);
          ctx.fillStyle = `rgb(${this.#drawValues.unitBgColor.r}, ${this.#drawValues.unitBgColor.g}, ${this.#drawValues.unitBgColor.b})`;
          ctx.fill();

          ctx.beginPath();
          ctx.roundRect(this.#drawValues.position.x, this.#drawValues.position.y, this.size.x, this.size.y, 5);
          ctx.strokeStyle = "#FFF";
          ctx.stroke();

          let gco = ctx.globalCompositeOperation;
          ctx.globalCompositeOperation = "difference";
          ctx.textBaseline = "bottom";
          ctx.textAlign = "left";
          ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
          ctx.font = "15px Helvetica";
          ctx.fillText(
            this.oid,
            this.#drawValues.position.x,
            this.#drawValues.position.y - ((this.debugHits.length > 0) ? 15 : 5),
            this.UNIT_WIDTH
          );
          ctx.globalCompositeOperation = gco;

          const rgbString = `${this.#drawValues.unitFgColor.r}, ${this.#drawValues.unitFgColor.g}, ${this.#drawValues.unitFgColor.b}`;

          ctx.textBaseline = "top";
          ctx.textAlign = "center";
          ctx.fillStyle = `rgb(${rgbString})`;
          ctx.font = "25px Helvetica";
          ctx.fillText(this.title, this.#drawValues.center.x, this.#drawValues.text.title.y, this.UNIT_WIDTH - this.MARGIN * 2);

          ctx.fillStyle = `rgba(${rgbString},0.5)`;
          ctx.font = "18px Helvetica";
          ctx.fillText(this.class, this.#drawValues.center.x, this.#drawValues.text.class.y, this.UNIT_WIDTH - this.MARGIN * 2);

          ctx.strokeStyle = "#FFF";
          ctx.fillStyle = `rgba(${rgbString},0.8)`;
          ctx.font = "bold 14px monospace";
          ctx.textAlign = "right";
          ctx.lineWidth = 2;
          this.#drawValues.exits.forEach((exit) => {
            ctx.fillText(exit.reference.name, exit.x, exit.y, this.UNIT_WIDTH - this.MARGIN * 2);
          });
          break;
        case "debug":
          if (this.debugHits.length > 0) {
            const lastDebugHit = this.debugHits[this.debugHits.length - 1];
            ctx.beginPath();
            ctx.lineWidth = 2;
            if ("exception" in lastDebugHit) {
              ctx.strokeStyle = "#F00";
            } else {
              ctx.strokeStyle = "#0F0";
            }
            ctx.roundRect(
              this.#drawValues.position.x - 10,
              this.#drawValues.position.y - 10,
              this.size.x + 20,
              this.size.y + 20,
              5
            );
            ctx.stroke();

            ctx.fillStyle = "#FFF";
            ctx.font = "bold 14px monospace";
            ctx.textAlign = "right";
            ctx.lineWidth = 2;
            ctx.fillText(
              this.debugHits.length,
              this.#drawValues.position.x + this.size.x + 10,
              this.#drawValues.position.y - 30,
              this.size.x
            );
          }
          break;
      }
    }
  },
  Core: class {
    #loadedComponents;
    #catalog;
    #units;
    #sequence;
    gre; //graphic rendering engine
    api;
    blocker;
    messenger;
    unitDetailPane;
    unitDebugHitsPane;
    selectedUnit;
    flowId;
    unitScope;

    constructor(drawingSurface) {
      this.flowId = this.#extractFlowId();
      this.unitScope = this.#extractUnitScope();
      this.#sequence = 0;
      this.#loadedComponents = {
        catalog: false,
        flow: false
      }
      this.gre = new Sabertooth.Engine(drawingSurface);
      this.gre.drawPasses.push("extra");
      this.gre.drawPasses.push("debug");
      this.api = new Caixanegra.API();
      this.blocker = document.querySelector("#blocker");
      this.messenger = document.querySelector("#action_messenger");
      this.unitDetailPane = document.querySelector("#unitDetail");
      this.unitDebugHitsPane = document.querySelector("#unitDebugHits");
      document.querySelector("#save").addEventListener("click", this.saveFlow.bind(this));
      document.querySelector("#addUnit").addEventListener("click", this.toggleUnitMenu.bind(this));
      document.querySelector("#unitDetailTitle").addEventListener("keyup", this.updateSelectedUnit.bind(this));
      document.querySelector("#toggler").addEventListener("click", this.toggleDeleteConfirmation.bind(this));
      document.querySelector("#cancelDelete").addEventListener("click", this.toggleDeleteConfirmation.bind(this));
      document.querySelector("#confirmDelete").addEventListener("click", this.deleteUnit.bind(this));
      document.querySelector("#play").addEventListener("click", this.#executeFlow.bind(this));
      document.querySelector("#configure").addEventListener("click", this.toggleExecutionConfiguration.bind(this));
      document.querySelector("#console").addEventListener("click", this.toggleExecutionConsole.bind(this));
      document.querySelector("#clearCarryOverObject").addEventListener("click", this.clearCarryOverObject.bind(this));
      document.querySelector("#reset").addEventListener("click", this.resetExecution.bind(this));
      document.querySelector("#duplicate").addEventListener("click", this.duplicateUnit.bind(this));
      document.querySelector("#importFlow").addEventListener("click", this.#importFlow.bind(this));
      document.querySelector("#exportFlow").addEventListener("click", this.#exportFlow.bind(this));
      document.querySelector("#importFlowFile").addEventListener("change", this.#importFlowFileChanged.bind(this));
      document.querySelector("#regexInput").addEventListener("keyup", this.#updateRegexInput.bind(this));
      document.querySelector("#regexSample").addEventListener("keyup", this.#startRegexEvaluation.bind(this));
      document.querySelector("#addRegexVariables").addEventListener("click", this.#addRegexVariablesRow.bind(this))
      document.querySelector("#regexEditorToggleVars").addEventListener("click", this.#toggleRegexVariables.bind(this));
      document.querySelector("#dismissRegexEditor").addEventListener("click", this.#dismissRegexEditor.bind(this));
      this.toggleBlocker(true, "loading your flow");
      window.addEventListener("resize", this.#windowResized.bind(drawingSurface));
      drawingSurface.addEventListener("update_start", this.#engineUpdate.bind(this));
      drawingSurface.addEventListener("drag_finished", this.#dragFinished.bind(this));
      drawingSurface.addEventListener("clicked", this.#clicked.bind(this));
      this.#windowResized.bind(drawingSurface)({ target: window });
      this.#units = new Array();

      this.coeAssignType(document.querySelector("#carryOverObject"), "object");

      this.gre.disable();
      this.getUnits();
      this.gre.enable();
    }

    clearCarryOverObject() {
      document.querySelector("#carryOverObject").innerHTML = "";
      this.coeAssignType(document.querySelector("#carryOverObject"), "object");
    }

    coeAssignType(container, type) {
      container.innerHTML = "";
      container.dataset.type = type

      switch (type) {
        case "object":
        case "array":
          container.parentElement.classList.add("-indent");
          const rows = document.createElement("div");
          rows.classList.add("rows");
          const addRow = document.createElement("button");

          addRow.innerHTML = "+";
          addRow.addEventListener("click", this.coeAddRow.bind(this, rows));

          container.append(rows, addRow);
          break;
        case "string":
        case "number":
          container.parentElement.classList.add("-inline");
          const input = document.createElement("input");
          input.placeholder = `${type} value`;
          container.append(input);
          break;
      }
    }

    coeTypeSelectors(container) {
      const symbols = {object: "{}", array: "[]", string: "ab", number: "12"};
      ["object", "array", "string", "number"].forEach((type) => {
        const button = document.createElement("button");
        button.innerHTML = symbols[type];
        button.addEventListener("click", this.coeAssignType.bind(this, container, type));
        container.append(button);
      });
    }

    coeAddRow(container) {
      const type = container.parentElement.dataset.type || "object";
      const wrapper = document.createElement("div");
      wrapper.classList.add("row");

      switch (type) {
        case "object":
          const keySide = document.createElement("div");
          const valueSide = document.createElement("div");
          const key = document.createElement("input");
          key.placeholder = "object key";
          this.coeTypeSelectors(valueSide);
          keySide.classList.add("key-side");
          keySide.append(key);
          wrapper.append(keySide, valueSide);
          break;
        case "array":
          const arrayItem = document.createElement("div");
          this.coeTypeSelectors(arrayItem);
          wrapper.append(arrayItem);
          break;
      }

      container.append(wrapper);

      return wrapper;
    }

    deleteUnit() {
      this.unitDetailPane.classList.remove("-open");
      this.unitDebugHitsPane.classList.remove("-open");
      this.removeUnit(this.selectedUnit.oid);
      this.toggleDeleteConfirmation();
    }

    duplicateUnit() {
      this.unitDetailPane.classList.remove("-open");
      this.unitDebugHitsPane.classList.remove("-open");
      this.cloneUnit(this.selectedUnit.oid);
    }

    flushToConsole(entries) {
      const container = document.querySelector("#executionConsole");
      container.innerHTML = "";

      entries.forEach((entry) => {
        const entryWrapper = document.createElement("div");
        const timestamp = document.createElement("div");
        const message = document.createElement("div");
        entryWrapper.classList.add("console-entry");
        timestamp.classList.add("timestamp");
        message.classList.add("message");
        const date = new Date(entry.timestamp * 1000);
        timestamp.innerHTML = date.toLocaleString();
        message.innerHTML = entry.message;
        entryWrapper.append(timestamp, message);

        container.append(entryWrapper);
      });
    }

    toggleExecutionConfiguration() {
      const pane = document.querySelector("#executionConfiguration");
      if (pane.classList.contains("-open")) {
        pane.classList.remove("-open");
      } else {
        document.querySelector("#executionConsole").classList.remove("-open");
        pane.classList.add("-open");
      }
    }

    toggleExecutionConsole() {
      const pane = document.querySelector("#executionConsole");
      if (pane.classList.contains("-open")) {
        pane.classList.remove("-open");
      } else {
        document.querySelector("#executionConfiguration").classList.remove("-open");
        pane.classList.add("-open");
      }
    }

    toggleDeleteConfirmation() {
      const deleteToggle = document.querySelector(".delete");

      if (deleteToggle.classList.contains("-confirming")) {
        deleteToggle.classList.remove("-confirming");
      } else {
        deleteToggle.classList.add("-confirming");
      }
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
      const snapshot = {
        entrypoint: this.#units.find((unit) => {return unit.type === "starter"})?.oid,
        units: [],
        initialCarryover: this.digInitialCarryOver(document.querySelector("#carryOverObject"))
      };

      this.#units.forEach((unit) => {
        if (unit.type === "starter" && snapshot.entrypoint !== null) {
          snapshot.entrypoint = unit.oid;
        }

        const unitToPush = {
          oid: unit.oid,
          class: unit.class,
          type: unit.type,
          title: unit.title,
          position: unit.position.toAnonObject(),
          exits: [],
          mappings: {}
        };

        unit.exits.forEach((exit) => {
          unitToPush.exits.push({
            name: exit.name,
            target: exit?.target?.oid,
            mappings: exit.mappings || []
          });
        });

        Object.keys(unit?.mappings || {}).forEach((key) => {
          unitToPush.mappings[key] = {
            type: unit.mappings[key].type,
            value: unit.mappings[key].value
          }
        });

        snapshot.units.push(unitToPush);
      });

      return snapshot;
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

        const scopes = [];

        this.#catalog.forEach(unit => {
          if (unit.hasOwnProperty("scope") && Array.isArray(unit.scope)) {
            scopes.push(...unit.scope);
          } else {
            scopes.push("_unscoped");
          }
        });

        [...new Set(scopes)].sort().forEach(scope => {
          const scopeWrapper = document.createElement("div");
          const scopeTitle = document.createElement("div");
          const scopeUnits = document.createElement("div");

          scopeWrapper.classList.add("unit-wrapper");
          scopeTitle.classList.add("title");

          scopeTitle.innerHTML = scope === "_unscoped" ? "unscoped" : scope.replace(/_/g, " ");
          scopeWrapper.appendChild(scopeTitle);
          scopeWrapper.appendChild(scopeUnits);

          const filteredUnits = this.#catalog.filter(unit => {
            return (unit.scope === null && scope === "_unscoped") || (unit.scope || []).includes(scope)
          });

          filteredUnits.forEach((unitData) => {
            const item = document.createElement("div");
            const content = document.createElement("div");
            const colorCode = document.createElement("div");
            const header = document.createElement("div");
            const name = document.createElement("span");
            const type = document.createElement("span");
            const description = document.createElement("div");
            description.classList.add("description");
            item.classList.add("unit");
            header.classList.add("header");
            content.classList.add("content");
            colorCode.classList.add("color-code");
            name.classList.add("name");
            type.classList.add("type");

            name.innerHTML = unitData.title;
            type.innerHTML = unitData.type;
            description.innerHTML = unitData.description;
            const typeColor = Caixanegra.Designer.typeColor(unitData).background;
            colorCode.style.backgroundColor = `rgb(${typeColor.r}, ${typeColor.g}, ${typeColor.b})`;

            header.append(name, type);
            content.append(header, description);
            item.append(colorCode, content);
            item.addEventListener("click", this.createUnit.bind(this, unitData));
            scopeUnits.appendChild(item);
          });
          unitMenu.appendChild(scopeWrapper);
        });

        this.#loadedComponents.catalog = true;
        this.loadFlow();
      });
    }

    loadFlow() {
      this.api.getFlow(this.flowId).then((response) => {
        const flowData = response;

        this.#loadFlowFromJSON(flowData);

        this.#loadedComponents.flow = true;
        this.reveal();
      });
    }

    #loadFlowFromJSON(flowData) {
      this.gre.clear();
      this.#units = [];

      (flowData?.units || []).forEach((unit) => {
        const catalogUnit = this.#catalog.find((cUnit) => cUnit.class === unit.class);
        if (catalogUnit) {
          unit.color = catalogUnit.color;
        }
        this.createUnit(unit);
      });

      this.#units.forEach((unit) => {
        (unit?.exits || []).forEach((exit) => {
          const object = this.#units.find((targetUnit) => targetUnit.oid === exit.target);
          if (object) { exit.target = object; }
        });
      });

      this.buildInitialCarryover(flowData.initialCarryover);
    }

    digBuildInitialCarryover(container, key, objectPointer) {
      const lastChild = container.childNodes[container.childNodes.length -1];

      if (key !== null) {
        container.childNodes[0].querySelector("input").value = key;
      }

      if (Array.isArray(objectPointer)) {
        this.coeAssignType(lastChild, "array");

        for (let idx = 0; idx < objectPointer.length; idx++) {
          this.digBuildInitialCarryover(
            this.coeAddRow(container.querySelector(".rows")),
            null,
            objectPointer[idx]
          );
        }
      } else if (typeof objectPointer === "object") {
        this.coeAssignType(lastChild, "object");

        for (const key in objectPointer) {
          this.digBuildInitialCarryover(this.coeAddRow(container.querySelector(".rows")), key, objectPointer[key]);
        }
      } else if (typeof objectPointer === "number") {
        this.coeAssignType(lastChild, "number");
        lastChild.querySelector("input").value = objectPointer;
      } else {
        this.coeAssignType(lastChild, "string");
        lastChild.querySelector("input").value = objectPointer;
      }
    }

    buildInitialCarryover(initialCarryover) {
      this.clearCarryOverObject();
      const base = document.querySelector("#carryOverObject > .rows");

      for (const key in initialCarryover) {
        this.digBuildInitialCarryover(this.coeAddRow(base), key, initialCarryover[key]);
      }
    }

    reveal() {
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
      this.#sequence++;
      const newUnit = new Caixanegra.Designer.Unit({
        position: new Sabertooth.Vector2(
          -this.gre.worldCenter.x + 20,
          -this.gre.worldCenter.y + 20
        ),
        type: params.type,
        title: params.title,
        class: params.class,
        color: params.color,
        zIndex: this.#sequence
      });

      if (params.oid) {
        newUnit.oid = params.oid;
        newUnit.position = new Sabertooth.Vector2(params.position.x, params.position.y);
        newUnit.title = params.title;
      }

      if (params.exits && params.exits.length > 0) {
        newUnit.exits = params.exits.map((exit) => {
          const newExit = { name: exit.name };
          if (exit.target) {
            newExit.target = exit.target;
          }
          if (exit.mappings) {
            newExit.mappings = exit.mappings;
          }
          return newExit;
        });
      }

      const mappingKeys = Object.keys(params?.mappings || {});
      if (params.mappings && mappingKeys.length > 0) {
        mappingKeys.forEach((key) => {
          newUnit.mappings[key] = {};
          if (params.mappings[key].type) {
            newUnit.mappings[key].type = params.mappings[key].type;
          }
          if (params.mappings[key].value) {
            newUnit.mappings[key].value = params.mappings[key].value;
          }
        });
      }

      this.#units.push(newUnit);
      this.gre.addObject(newUnit);
    }

    removeUnit(oid) {
      const killIndex = this.#units.findIndex((unit) => {return unit.oid === oid});
      this.#units.splice(killIndex, 1);
      this.gre.removeObject(oid);

      this.#units.forEach((unit) => {
        unit.exits.forEach((exit) => {
          if (exit.target.oid === oid) {
            exit.target = null;
          }
        });
      });
    }

    cloneUnit(oid) {
      const unit = this.#units.find((unit) => unit.oid === oid);
      const dup = this.#dupObject(unit);
      
      dup.oid = Sabertooth.Utils.generateOId();
      dup.position = { x: unit.position.x + 25, y: unit.position.y + 25 };
      dup.title = `${dup.title} (copy)`;
      
      dup.exits.forEach(exit => {
        delete exit.target;
      });

      this.createUnit(dup);
    }

    showError(message) {
      this.actionMessage(true, message, "error");
      setTimeout(() => {this.actionMessage(false)}, 5000);
    }

    digInitialCarryOver(base) {
      const baseType = base.dataset.type;
      let baseReturn = null;

      switch(baseType) {
        case "object":
          baseReturn = {};
          break;
        case "array":
          baseReturn = [];
          break;
        case "number":
          return base.querySelector("input").value * 1;
        case "string":
          return base.querySelector("input").value;
      }

      base.querySelector(".rows").childNodes.forEach((row) => {
        switch(baseType) {
          case "object":
            const key = row.querySelector(".key-side input").value;
            baseReturn[key] = this.digInitialCarryOver(row.querySelector("[data-type]"));
            break;
          case "array":
            baseReturn.push(this.digInitialCarryOver(row.querySelector("[data-type]")));
            break;
        }
      });

      return baseReturn;
    }

    resetExecution() {
      for(let idx = 0; idx < this.#units.length; idx++) {
        this.#units[idx].debugHits = [];
      }
      document.querySelector("#console").style.display = "none";
      document.querySelector("#reset").style.display = "none";
      document.querySelector("#play").style.display = "block";
      document.querySelector("#configure").style.display = "block";
      this.unitDetailPane.classList.remove("-open");
      this.unitDebugHitsPane.classList.remove("-open");
    }

    #dupObject(obj) {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }
    
      const clonedObject = Array.isArray(obj) ? [] : {};
      
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObject[key] = this.#dupObject(obj[key]);
        }
      }
    
      return clonedObject;
    }

    #importFlow() {
       document.querySelector("#importFlowFile").click();
    }

    #importFlowFileChanged() {
      const fileInput = document.querySelector("#importFlowFile");

      if (fileInput.files.length === 0) {
        return;
      }

      const selectedFile = fileInput.files[0];
      const reader = new FileReader();
    
      reader.onload = (event) => {
        this.toggleBlocker(true, "importing your flow");
        this.gre.disable();
        const flowBackup = this.flowSnapshot();

        try {
          this.#loadFlowFromJSON(JSON.parse(event.target.result));

          this.actionMessage(true, "Flow imported", "ok");
          setTimeout(() => {this.actionMessage(false)}, 4000);
        } catch (error) {
          this.#loadFlowFromJSON(flowBackup);

          this.actionMessage(true, "Failed to import flow. Rolled back", "error");
          setTimeout(() => {this.actionMessage(false)}, 4000);
        }
        
        this.gre.enable();
        this.reveal();
      };
    
      reader.readAsText(selectedFile);
    }

    #exportFlow() {
      const blob = new Blob([JSON.stringify(this.flowSnapshot())], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = "flow_definition.cxn";
      link.click();
      URL.revokeObjectURL(url);

      this.actionMessage(true, "Flow exported", "ok");
      setTimeout(() => {this.actionMessage(false)}, 4000);
    }

    #executeFlow() {
      this.toggleBlocker(true, "saving your flow");

      this.api.saveFlow(this.flowId, this.flowSnapshot()).then(() => {
        this.toggleBlocker(true, "running your flow");
        let initialCarryOver = {};
        try {
          initialCarryOver = this.digInitialCarryOver(document.querySelector("#carryOverObject"));
        } catch (error) {
          initialCarryOver = null;
        }

        if (initialCarryOver === null) {
          this.showError("Invalid initial carry-over");
          this.toggleBlocker(false);
          return;
        }
        this.api.debugRun(this.flowId, this.unitScope, initialCarryOver).then((response) => {
          const executionData = response;
          executionData.debug.steps.forEach((step) => {
            const unit = this.#units.find((unit) => unit.oid === step.oid);
            if (unit) {
              unit.debugHits.push(step);
            }
          });

          this.flushToConsole(executionData.debug.history);
          document.querySelector("#console").style.display = "block";
          document.querySelector("#reset").style.display = "block";
          document.querySelector("#play").style.display = "none";
          document.querySelector("#configure").style.display = "none";
          document.querySelector("#executionConfiguration").classList.remove("-open");

          this.toggleBlocker(false);
        });
      });
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

    #clicked(ev) {
      const moments = ev.detail;
      const endObject = moments.end.cursorAt?.object;

      if (endObject) {
        this.#fillDetailPane(endObject);
      } else {
        const unitMenu = document.querySelector("#unitMenu");
        const addUnit = document.querySelector("#addUnit");

        this.unitDetailPane.classList.remove("-open");
        this.unitDebugHitsPane.classList.remove("-open");
        unitMenu.classList.remove("-open");
        addUnit.classList.remove("-open");

        this.selectedUnit = null;
      }
    }

    #buildStepHitFold(flow, data) {
      if (data === undefined) {
        return null
      }

      const wrapper = document.createElement("div");
      const header = document.createElement("div");
      const content = document.createElement("div");
      wrapper.classList.add("hit-fold");
      header.classList.add("header");
      content.classList.add("content", "-open");
      header.innerHTML = flow;

      header.addEventListener("click", (e) => {
        const content = e.target.parentElement.querySelector(".content");
        if (content.classList.contains("-open")) {
          content.classList.remove("-open");
        } else {
          content.classList.add("-open");
        }
      });

      switch(flow) {
        case "in":
        case "out":
          const carryOver = document.createElement("div");
          carryOver.classList.add("carry-over");
          let jsonString = JSON.stringify(
            (flow === "in" ? {carryover: data.carry_over || {}, storage: data.storage || {}} : data.result) || {},
            null, "\t"
          );

          jsonString = jsonString.replace(/\t/g, "<span class='json-indent'></span>");
          jsonString = jsonString.replace(/\n/g, "<br />");

          carryOver.innerHTML = jsonString;

          content.append(carryOver);
          break;
        case "exception":
          const message = data.message;
          const backtrace = data.backtrace;

          const messageElement = document.createElement("div");
          const backtraceElement = document.createElement("div");

          messageElement.innerHTML = message;
          backtraceElement.innerHTML = backtrace[0];

          content.append(messageElement, backtraceElement);
          break;
      }

      wrapper.append(header, content);

      return wrapper;
    }

    #fillDebugStepPane(container, hits) {
      container.innerHTML = "";

      for(let idx = 0; idx < hits.length; idx++) {
        const hit = hits[idx];

        const hitWrapper = document.createElement("div");
        hitWrapper.classList.add("step-hit");
        if(hit.exception) {
          hitWrapper.classList.add("-nok");
        } else {
          hitWrapper.classList.add("-ok");
        }
        const header = document.createElement("div");
        header.classList.add("hit-header");
        header.innerHTML = `hit #${idx + 1}`;
        hitWrapper.append(header);

        let section = this.#buildStepHitFold("in", hit.in);
        if (section !== null) { hitWrapper.append(section); }

        section = this.#buildStepHitFold("out", hit.out);
        if (section !== null) { hitWrapper.append(section); }

        section = this.#buildStepHitFold("exception", hit.exception);
        if (section !== null) { hitWrapper.append(section); }

        container.append(hitWrapper);
      }
    }

    #fillDetailPane(object) {
      this.selectedUnit = object;
      const matrix = this.#catalog.find((unit) => unit.class === object.class);
      const pane = this.unitDetailPane;
      const debugPane = this.unitDebugHitsPane;
      const dynamicContent = pane.querySelector("#dynamicContent");
      const typeColor = Caixanegra.Designer.typeColor(object).background;
      pane.querySelector(".color-code").style.backgroundColor = `rgb(${typeColor.r}, ${typeColor.g}, ${typeColor.b})`;
      pane.classList.add("-open");

      if (object.debugHits.length > 0) {
        debugPane.classList.add("-open");
        this.#fillDebugStepPane(debugPane.querySelector("#debugData"), object.debugHits);
      } else {
        debugPane.querySelector("#debugData").innerHTML = "";
        debugPane.classList.remove("-open");
      }

      pane.querySelector("#unitDetailTitle").value = object.title;
      pane.querySelector("#unitDetailClass .name").innerHTML = matrix.class;
      pane.querySelector("#unitDetailDescription").innerHTML = matrix.description;
      pane.querySelector(".delete").classList.remove("-confirming");

      dynamicContent.innerHTML = "";

      if (Object.keys((matrix?.inputs || {})).length > 0) {
        const inputsHeader = document.createElement("div");
        inputsHeader.classList.add("unit-detail-headers");
        inputsHeader.innerHTML = "input mapping"
        dynamicContent.appendChild(inputsHeader);

        Object.keys(matrix?.inputs).forEach((key) => {
          dynamicContent.append(this.#buildInputConfigHandler(key, matrix.inputs[key]));
        })
      }

      const unitAssignmentsDatalist = document.createElement("datalist");
      unitAssignmentsDatalist.id = `${object.oid}-assignments`;

      (matrix.assignments || []).forEach((assignment) => {
        const option = document.createElement("option");
        option.setAttribute("value", assignment);
        unitAssignmentsDatalist.append(option);
      });
      dynamicContent.appendChild(unitAssignmentsDatalist);

      if ((matrix?.exits || []).length > 0) {
        const exitsHeader = document.createElement("div");
        exitsHeader.classList.add("unit-detail-headers");
        exitsHeader.innerHTML = "exit mapping"
        dynamicContent.appendChild(exitsHeader);

        object.exits.forEach((exit) => {
          dynamicContent.append(this.#buildExitConfigHandler(exit));
        });
      }
    }

    #buildExitConfigHandler(exit) {
      const unit = this.selectedUnit;
      const wrapper = document.createElement("div");
      wrapper.classList.add("unit-exit");
      wrapper.dataset.exit = exit.name;
      const name = document.createElement("div");
      name.classList.add("field-name");
      name.innerHTML = exit.name;
      wrapper.append(name);

      const mappingsWrapper = document.createElement("div");
      mappingsWrapper.classList.add("mappings");

      const targetUnitInputDatalist = document.createElement("datalist");
      targetUnitInputDatalist.id = `${unit.oid}-${exit.name}-target-inputs`;

      const target = this.#catalog.find((cUnit) => cUnit.class === exit?.target?.class);
      if (target) {
        Object.keys(target.inputs || []).forEach((input) => {
          const option = document.createElement("option");
          option.setAttribute("value", input);
          targetUnitInputDatalist.append(option);
        });
      }

      dynamicContent.append(targetUnitInputDatalist);
      let datalists = {
        unitAssignments: `${unit.oid}-assignments`,
        targetUnitInputs: targetUnitInputDatalist.id,
      };

      (exit.mappings || []).forEach((mapping) => {
        mappingsWrapper.append(this.#buildExitMappingHandler(datalists, mapping));
      });

      wrapper.append(mappingsWrapper);

      const addButton = document.createElement("button");
      addButton.type = "button";
      addButton.innerHTML = "new mapping";
      addButton.dataset.exitName = exit.name;
      addButton.addEventListener("click", this.#addUnitExitMapping.bind(this));
      wrapper.append(addButton);

      return wrapper;
    }

    #buildExitMappingHandler(datalists, mapping) {
      const mappingWrapper = document.createElement("div");
      const valueWrapper = document.createElement("div");
      valueWrapper.classList.add("mapping-values");
      const usePair = document.createElement("div");
      const asPair = document.createElement("div");
      usePair.classList.add("label-pair");
      asPair.classList.add("label-pair");
      const useLabel = document.createElement("div");
      const asLabel = document.createElement("div");
      useLabel.classList.add("label");
      asLabel.classList.add("label");
      useLabel.innerHTML = "Use";
      asLabel.innerHTML = "As";
      mappingWrapper.classList.add("exit-mapping");
      const use = document.createElement("input");
      use.classList.add("use");
      use.value = mapping.use;
      const as = document.createElement("input");
      as.classList.add("as");
      as.value = mapping.as;

      usePair.append(useLabel, use);
      asPair.append(asLabel, as);

      use.addEventListener("change", this.#unitExitMappingsChanged.bind(this));
      as.addEventListener("change", this.#unitExitMappingsChanged.bind(this));

      use.setAttribute("list", datalists["unitAssignments"]);
      as.setAttribute("list", datalists["targetUnitInputs"]);

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.innerHTML = "&times;";
      deleteButton.addEventListener("click", this.#deleteExitMapping.bind(this));

      valueWrapper.append(usePair, asPair);
      mappingWrapper.append(valueWrapper, deleteButton);
      return mappingWrapper;
    }

    #deleteExitMapping(ev) {
      let mappingWrapper = ev.target;
      while (!mappingWrapper.classList.contains("exit-mapping")) {
        mappingWrapper = mappingWrapper.parentElement;
        if (mappingWrapper === null) { return null; }
      }

      mappingWrapper.remove();

      this.#unitExitMappingsChanged();
    }

    #buildInputConfigHandler(input, matrix) {
      const unit = this.selectedUnit;
      const wrapper = document.createElement("div");
      const valueWrapper = document.createElement("div");
      wrapper.classList.add("unit-input", "field");
      valueWrapper.classList.add("unit-input-value");
      wrapper.dataset.input = input;

      if(matrix.editable) {
        const typeSelectorHeader = document.createElement("div");
        const fieldDescription = document.createElement("div");
        fieldDescription.classList.add("field-description");
        typeSelectorHeader.classList.add("field-header");
        const name = document.createElement("div");
        name.classList.add("name");
        const displayName = document.createElement("div");
        const internalName = document.createElement("div");
        displayName.innerHTML = matrix.display;
        internalName.innerHTML = input;
        displayName.classList.add("display");
        internalName.classList.add("internal");
        name.append(displayName, internalName);
        fieldDescription.innerHTML = matrix.description;
        const typeSelector = document.createElement("select");
        [
          {value: "carryover", display: "Carry-over"},
          {value: "user", display: "User"},
          {value: "storage", display: "Global storage"},
        ].forEach((option) => {
          const optionElement = document.createElement("option");
          optionElement.innerHTML = option.display;
          optionElement.setAttribute("value", option.value);
          if(unit.mappings[input]?.type === option.value) {
            optionElement.setAttribute("selected", "selected");
          }
          typeSelector.append(optionElement);
        });
        typeSelector.addEventListener("change", this.#unitInputTypeChanged.bind(this));
        typeSelectorHeader.append(name, typeSelector);

        wrapper.appendChild(typeSelectorHeader);
        wrapper.appendChild(fieldDescription);

        let valueInput = null;
        switch (matrix.type) {
          case "string":
          case "number":
          case "regex":
            {
              valueInput = document.createElement("input");
              if(matrix.type === "regex") { valueInput.classList.add("-regex")}
              valueInput.value = unit.mappings[input]?.value || matrix.default || "";
              valueInput.addEventListener("change", this.#unitInputValueChanged.bind(this));
              valueInput.addEventListener("click", this.#regexEditor.bind(this));
            }
            break;
          case "dataset":
            {
              const selectedValue = unit.mappings[input]?.value || matrix.default || "";
              valueInput = document.createElement("select");
              matrix.set.forEach((setOption => {
                const option = document.createElement("option");
                option.value = setOption.value;
                option.innerHTML = setOption.display;
                if (setOption.value === selectedValue) {
                  option.setAttribute("selected", "selected");
                }
                valueInput.appendChild(option);
              }));
              valueInput.addEventListener("change", this.#unitInputValueChanged.bind(this));
            }
            break;
          case "boolean":
            {
              const trueInput = document.createElement("input");
              const falseInput = document.createElement("input");
              const trueInputLabel = document.createElement("label");
              const falseInputLabel = document.createElement("label");
              const trueRadioGroup = document.createElement("div");
              const falseRadioGroup = document.createElement("div");
              trueRadioGroup.classList.add("radio-group");
              falseRadioGroup.classList.add("radio-group");
              trueInput.setAttribute("type", "radio");
              falseInput.setAttribute("type", "radio");
              trueInput.setAttribute("value", 1);
              trueInputLabel.innerHTML = "True";
              falseInput.setAttribute("value", 0);
              falseInputLabel.innerHTML = "False";
              trueInput.setAttribute("name", `b${input}`);
              falseInput.setAttribute("name", `b${input}`);
              const value = unit.mappings[input]?.value || matrix.default || "0"
              if (value === "1") { trueInput.setAttribute("checked", true); }
              if (value === "0") { falseInput.setAttribute("checked", true); }
              trueInput.addEventListener("change", this.#unitInputValueChanged.bind(this));
              falseInput.addEventListener("change", this.#unitInputValueChanged.bind(this));

              trueRadioGroup.appendChild(trueInput);
              trueRadioGroup.appendChild(trueInputLabel);
              falseRadioGroup.appendChild(falseInput);
              falseRadioGroup.appendChild(falseInputLabel);

              valueWrapper.appendChild(trueRadioGroup);
              valueWrapper.appendChild(falseRadioGroup);
            }
            break;
        }

        if (unit.mappings[input]?.type !== "user") {
          valueWrapper.classList.add("-disabled");
        }

        if(valueInput !== null) {
          valueWrapper.appendChild(valueInput);
        }

        wrapper.append(valueWrapper);
      } else {
        const fieldHeader = document.createElement("div");
        fieldHeader.classList.add("field-header");
        const fieldDescription = document.createElement("div");
        fieldDescription.classList.add("field-description");
        fieldDescription.innerHTML = matrix.description;
        const name = document.createElement("div");
        const displayName = document.createElement("div");
        const internalName = document.createElement("div");
        displayName.innerHTML = matrix.display;
        internalName.innerHTML = input;
        displayName.classList.add("display");
        internalName.classList.add("internal");
        const type = document.createElement("div");
        name.classList.add("name");
        type.classList.add("type");
        type.innerHTML = "Carry-over";
        name.append(displayName, internalName);
        fieldHeader.append(name, type);
        wrapper.append(fieldHeader, fieldDescription);
      }

      return wrapper;
    }

    #unitInputValueChanged(ev) {
      let valueWrapper = ev.target;
      while (!valueWrapper.classList.contains("unit-input")) {
        valueWrapper = valueWrapper.parentElement;
        if (valueWrapper === null) { return null; }
      }

      const input = valueWrapper.dataset.input;
      this.selectedUnit.mappings[input] = this.selectedUnit.mappings[input] || {};
      this.selectedUnit.mappings[input].value = ev.target.value;
    }

    #toggleRegexVariables() {
      const target = document.querySelector("#blocker .regexEditor > div:last-child");
      if(target.classList.contains("-visible")) {
        target.classList.remove("-visible");
      } else {
        target.classList.add("-visible");
      }
    }

    #updateRegexInput() {
      this.blocker.editorListener.value = this.blocker.querySelector("#regexInput").value;

      this.#startRegexEvaluation();
    }

    #startRegexEvaluation() {
      window.clearTimeout(this.blocker.evalTimeout);
      this.blocker.querySelector("#regexResults").innerHTML = "wating input end...";
      this.blocker.evalTimeout = window.setTimeout(this.#evaluateRegex.bind(this), 1500);
    }

    #evaluateRegex() {
      this.blocker.querySelector("#regexResults").innerHTML = "evaluating...";
      let expression = this.blocker.querySelector("#regexInput").value;
      const sample = this.blocker.querySelector("#regexSample").value;
      document.querySelectorAll("#regexVariablesList .regex-variable-entry").forEach((pair) => {
        const placeholder = pair.querySelector("input.placeholder").value;
        const value = pair.querySelector("input.value").value;
        expression = expression.replace(new RegExp(placeholder, "g"), value);
      });

      this.api.evaluateRegex(expression, sample).then((response) => {
        const tableEntries = Object.keys(response).length - 2 > 0;

        this.blocker.querySelector("#regexResults").innerHTML = "";
        const expression = document.createElement("div");
        const full_match = document.createElement("div");
        expression.innerHTML = `<strong>Expression: </strong><code>${response["_expression"] || "unable to get expression"}</code>`;
        full_match.innerHTML = `<strong>Full Match: </strong><code>${response["_full"] || "unable to get full match"}</code>`;
        
        this.blocker.querySelector("#regexResults").append(expression, full_match);

        if (tableEntries) {
          const table = document.createElement("table");
          let tr = document.createElement("tr");
          let th = document.createElement("th");
          th.innerHTML = "capture";
          tr.append(th);
          th = document.createElement("th");
          th.innerHTML = "match";
          tr.append(th);
          table.append(tr);

          for (const key of Object.keys(response)) {
            if (key.startsWith("_")) { continue; }

            tr = document.createElement("tr");
            let td = document.createElement("td");
            td.innerHTML = key;
            tr.append(td);
            td = document.createElement("td");
            td.innerHTML = response[key];
            tr.append(td);

            table.append(tr);
          }

          this.blocker.querySelector("#regexResults").append(table);
        }
      }).catch((error) => {
        this.blocker.querySelector("#regexResults").innerHTML = "unable to evaluate";
      });
    }

    #regexEditor(ev) {
      this.blocker.classList.add("-in-regex-editor");
      this.blocker.classList.remove("-released");
      this.blocker.editorListener = ev.target;
      this.blocker.querySelector("#regexInput").value = ev.target.value;

      this.#startRegexEvaluation();
    }

    #dismissRegexEditor() {
      this.blocker.classList.remove("-in-regex-editor");
      this.blocker.classList.add("-released");
    }

    #removeRegexVariable() {
      this.parentElement.remove();
    }

    #addRegexVariablesRow() {
      const list = document.querySelector("#regexVariablesList");

      const wrapper = document.createElement("div");
      const name = document.createElement("input");
      const value = document.createElement("input");
      const remove = document.createElement("button");

      name.placeholder = "placeholder";
      name.classList.add("placeholder");
      value.classList.add("value");
      name.autocomplete=false;
      value.autocomplete=false;
      value.placeholder = "value";
      remove.innerHTML = "-";

      remove.addEventListener("click", this.#removeRegexVariable.bind(remove));

      name.addEventListener("keyup", this.#startRegexEvaluation.bind(this));
      value.addEventListener("keyup", this.#startRegexEvaluation.bind(this));

      wrapper.classList.add("regex-variable-entry");

      wrapper.append(name, value, remove);
      list.append(wrapper);
    }

    #addUnitExitMapping(ev) {
      const unit = this.selectedUnit;
      const mapping = { use: "", as: "" };
      const exitName = ev.target.dataset.exitName;

      let datalists = {
        targetUnitInputs: `${unit.oid}-${exitName}-target-inputs`,
        unitAssignments: `${unit.oid}-assignments`
      };

      ev.target.parentElement.querySelector(".mappings").append(
        this.#buildExitMappingHandler(datalists, mapping)
      );

      this.#unitExitMappingsChanged();
    }

    #unitExitMappingsChanged() {
      const unit = this.selectedUnit;
      const exits = this.unitDetailPane.querySelectorAll(".unit-exit");
      const exitMappings = {};

      Array.from(exits).forEach((exit) => {
        exitMappings[exit.dataset.exit] =
          Array.from(exit.querySelectorAll(".exit-mapping")).map((mapping) => {
            const useValue = mapping.querySelector("input.use").value;
            const asValue = mapping.querySelector("input.as").value;
            return { use: useValue, as: asValue };
          });
      });

      for(let idx = 0; idx < unit.exits.length; idx++) {
        const newMappings = exitMappings[unit.exits[idx].name];

        if (newMappings) {
          unit.exits[idx].mappings = newMappings;
        }
      }
    }

    #unitInputTypeChanged(ev) {
      let valueWrapper = ev.target;

      while (!valueWrapper.classList.contains("unit-input")) {
        valueWrapper = valueWrapper.parentElement;
        if (valueWrapper === null) { return null; }
      }

      const input = valueWrapper.dataset.input;
      valueWrapper = valueWrapper.querySelector(".unit-input-value");

      switch (ev.target.value) {
        case "carryover":
        case "storage":
          valueWrapper.classList.add("-disabled");
          break;
        case "user":
          valueWrapper.classList.remove("-disabled");
          break;
      }

      this.selectedUnit.mappings[input] = this.selectedUnit.mappings[input] || {};
      this.selectedUnit.mappings[input].type = ev.target.value;
    }

    updateSelectedUnit() {
      const title = document.querySelector("#unitDetailTitle").value;
      this.selectedUnit.title = title === "" ? "untitled" : title;
    }

    #engineUpdate(ev) {
      const context = ev.detail;

      if (context.mouse.move &&
          [1, 2].includes(context.mouse.move.button) &&
          context.mouse.down &&
          context.mouse.down.cursorAt === null) {
        const offset = {
          x: context.mouse.move.internal_x - context.mouse.down.internal_x,
          y: context.mouse.move.internal_y - context.mouse.down.internal_y
        }

        this.gre.worldCenter.x = context.mouse.down.referential.x + offset.x;
        this.gre.worldCenter.y = context.mouse.down.referential.y + offset.y;

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
  },

  typeColor: (unit) => {
    let baseColor = unit.color || undefined;

    if (baseColor === undefined) {
      switch (unit.type) {
        case "starter":
          baseColor = "#65CCA9";
          break;
        case "terminator":
          baseColor = "#E44";
          break;
        case "blackbox":
          baseColor = "#EEE";
          break;
        case "passthrough":
          baseColor = "#C4C66A";
          break;
        case "fork":
          baseColor = "#FFCC5C"
          break;
        case "feeder":
          baseColor = "#5A92D8";
          break;
        default:
          baseColor = "#F00";
          break;
      }
    }

    hex = baseColor.replace("#", "");

    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

    return {
      background: { r, g, b },
      foreground: luminance > 0.5 ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 }
    };
  }
}

window.Caixanegra.Designer.core = new Caixanegra.Designer.Core(document.querySelector("canvas"));
