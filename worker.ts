import { Container, getContainer } from "@cloudflare/containers";

export class WebappContainer extends Container {
  defaultPort = 8000;
  sleepAfter = "1h";
  enableInternet = true;

  async fetch(request: Request): Promise<Response> {
    return await this.containerFetch(request, this.defaultPort);
  }
}

export default {
  async fetch(
    request: Request,
    env: { WEBAPP: DurableObjectNamespace<WebappContainer> },
  ): Promise<Response> {
  return await getContainer(env.WEBAPP).fetch(request);
  },
};