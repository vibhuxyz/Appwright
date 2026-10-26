const rawBodies = new WeakMap<object, Buffer>();

export function saveIntegrationRawBody(request: object, body: Buffer): void {
  rawBodies.set(request, Buffer.from(body));
}

export function getIntegrationRawBody(request: object): Buffer | undefined {
  return rawBodies.get(request);
}
