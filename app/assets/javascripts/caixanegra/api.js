window.Caixanegra.API = class {
  mountedPath() {
    return document.querySelector("consts mounted_path").getAttribute("value");
  }

  units(unitScope) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();

      request.addEventListener("load", (event) => {
        resolve(JSON.parse(event.target.response));
      });
      request.addEventListener("error", () => {
        reject();
      });

      request.open("GET", `${this.mountedPath()}/api/designer/units${unitScope === "" ? "" : `?scope=${unitScope}`}`);
      request.send();
    });
  }

  getFlow(id) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();

      request.addEventListener("load", (event) => {
        resolve(JSON.parse(event.target.response));
      });
      request.addEventListener("error", () => {
        reject();
      });

      request.open("GET", `${this.mountedPath()}/api/designer/flows/${id}`);
      request.send();
    });
  }

  saveFlow(id, flow) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();

      request.addEventListener("load", (event) => {
        resolve();
      });
      request.addEventListener("error", () => {
        reject();
      });

      request.open("PATCH", `${this.mountedPath()}/api/designer/flows/${id}`);
      request.send(JSON.stringify(flow));
    });
  }

  debugRun(id, unitScope, initialCarryOver) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();

      request.addEventListener("load", (event) => {
        resolve(JSON.parse(event.target.response));
      });
      request.addEventListener("error", () => {
        reject();
      });

      request.open("PATCH", `${this.mountedPath()}/api/designer/flows/${id}/debug_run${unitScope === "" ? "" : `?scope=${unitScope}`}`);
      request.send(JSON.stringify(initialCarryOver));
    });
  }

  evaluateRegex(expression, sample) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();

      request.addEventListener("load", (event) => {
        resolve(JSON.parse(event.target.response));
      });
      request.addEventListener("error", () => {
        reject();
      });

      request.open("GET", `${this.mountedPath()}/api/designer/inputs/evaluate_regex?expression=${encodeURIComponent(expression)}&sample=${encodeURIComponent(sample)}`);
      request.send();
    });
  }
}
