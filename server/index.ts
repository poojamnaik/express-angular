import * as express from 'express';
import * as path from 'path';
import { Application } from 'express';
import { NextFunction, Response, RequestHandler } from 'express';
import { readFileSync } from 'fs';
import * as http from 'http';

const appId = 'express-ang';

// Singleton server method
export class Server {
  public app: Application;
  public httpServer: http.Server;
  public port: string;

  public static bootstrap(): Server {
    return new Server();
  }

  constructor() {
    this.bootstrapApp();
    this.bootstrapHttpServer();
  }

  private bootstrapApp(): void {
    this.app = express();
    this.config();
    this.routes();
    this.errors();
  }

  public config(): void {
    this.app.get('*.*', express.static(path.join(__dirname, '../', appId)));

  }

  public routes(): void {
    this.app.get('/healthz', (req, res) => {
      res.status(200).send('OK');
    });

    /**
     * Front-end routes
     */
    this.app.all('*',  this.serveApp());
  }

  public serveApp(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const html = readFileSync(`${process.cwd()}/dist/${appId}/index.html`, { encoding: 'utf-8' });
        // this line can be clearer later, maybe make a state object on the req object
        res.send(html);
      } catch (error) {
        next(error);
      }
    };
  }

  public errors(): void {
    process.on('uncaughtException', (err) => {
      console.error(err);
    });

    process.on('unhandledRejection', (err) => {
      console.error(err);
    });
  }

  /** Http Server configuration */
  private bootstrapHttpServer(): void {
    this.httpServer = http.createServer(this.app);
    this.setPort();
    this.httpServer.listen(this.port);
    this.httpServer.on('error', this.onError);
    this.httpServer.on('listening', this.onListening);
  }

  /**
   * Event listener for HTTP server 'listening' event.
   */
  private onListening = () => {
    const addr = this.httpServer.address();
    const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    console.log('Listening on ' + bind);
  }

  /**
   * Event listener for HTTP server 'error' event.
   */
  private onError = (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof this.port === 'string' ? 'Pipe ' + this.port : 'Port ' + this.port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUsSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
        }
  }

  /**
   * Normalize a port into a number, string, or false.
   */
    private setPort(): void {
        this.port  = process.env.PORT || '5000';

        const parsedPort = parseInt(this.port , 10);
        if (isNaN(parsedPort) && parsedPort >= 0) {
            this.app.set('port', parsedPort);
        }
    }

}
