window.Caixanegra.API = class API {
  units() {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();

      request.addEventListener("load", () => {
        debugger;
        resolve();
      });
      request.addEventListener("error", () => {
        reject();
      });

      request.open("GET", "/caixanegra/api/designer/units");
      request.send();
    });
  }
}
