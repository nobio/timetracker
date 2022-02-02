const moment = require('moment');
const WebSocketServer = require('ws');

class WebSocketFacade {

  constructor(server) {
    WebSocketFacade.websockets = [];

    if (!WebSocketFacade._instance) {
      WebSocketFacade._instance = this;
    }

    return WebSocketFacade._instance;
  }

  init(server) {
    console.log('initializing web socket server on path /ws');
    const wss = new WebSocketServer.Server({ server, clientTracking: true, path: '/ws' });

    wss.on("connection", (ws, req) => {

      console.log(`new webservice client connected with url ${req.url}`);

      // handling what to do when clients disconnects from server
      ws.on("close", () => {
        console.log("webservice client has disconnected");
        this.remove(ws);
      });
      // handling client connection error
      ws.onerror = () => {
        console.log("Some Error occurred")
        this.remove(ws);
      }

      /* Test: send a Geo location every 10 seconds
      setInterval(() => ws.send(JSON.stringify({
        topic: 'GEO-LOCATION',
        message: {
          longitude: (10.87 + Math.random()) * 1,
          latitude: (49.51 + Math.random()) * 1,
          accuracy: 0,
          altitude: Math.random() * 100 + 300,
          velocity: Math.random() * 50 + 90,
          date: moment().toISOString(),
          source: 'time tracker geo location simulator'
        }
      })), 10000);
      */

      console.log(`numbers of web sockets before adding: ${WebSocketFacade.websockets.length}`);
      WebSocketFacade.websockets.push(ws);
      console.log(`numbers of web sockets after adding: ${WebSocketFacade.websockets.length}`);

    });

  }
  /**
   * used to send geo location to client via websocket
   * @param {*} geoLoc:
   *  longitude: number,
   *  latitude: number,
   *  accuracy: number,
   *  altitude: number,
   *  velocity: number,
   *  date: string,
   *  source: string
   */
  sendGeoLocation = async (geoLoc) => {
    WebSocketFacade.websockets.forEach(ws => {
      ws.send(JSON.stringify({
        topic: "GEO-LOCATION",
        message: geoLoc,
      }))
    });
  };

  /**
   * removes the websocket connection from the list
   * @param {} ws
   */
  remove(ws) {
    console.log(`numbers of web sockets before remove: ${WebSocketFacade.websockets.length}`);
    WebSocketFacade.websockets = WebSocketFacade.websockets.filter(websocket => websocket !== ws);
    console.log(`numbers of web sockets after remove: ${WebSocketFacade.websockets.length}`);
  }

}

//module.exports = WebSocketFacade;

const _instance = new WebSocketFacade();
Object.freeze(_instance);
module.exports = _instance;

/*
class UserStore {
  constructor(){
   if(! UserStore.instance){
     this._data = [];
     UserStore.instance = this;
   }

   return UserStore.instance;
  }

 //rest is the same code as preceding example

}

const instance = new UserStore();
Object.freeze(instance);

export default instance;
*/