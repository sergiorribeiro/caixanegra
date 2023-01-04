window.Caixanegra.API = class {
  units(unitScope) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();

      request.addEventListener("load", (event) => {
        resolve(JSON.parse(event.target.response));
      });
      request.addEventListener("error", () => {
        reject();
      });

      request.open("GET", `/caixanegra/api/designer/units${unitScope === "" ? "" : `?scope=${unitScope}`}`);
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

      request.open("GET", `/caixanegra/api/designer/flows/${id}`);
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

      request.open("PATCH", `/caixanegra/api/designer/flows/${id}`);
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

      request.open("PATCH", `/caixanegra/api/designer/flows/${id}/debug_run${unitScope === "" ? "" : `?scope=${unitScope}`}`);
      request.send(JSON.stringify(initialCarryOver));
    });
  }
}
