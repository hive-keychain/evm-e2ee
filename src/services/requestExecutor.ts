export interface RequestExecutionHandlers<Req, Res> {
  onRequestStart(request: Req): void;
  onRequestSuccess(response: Res): void;
  onRequestError(error: unknown): void;
}

export async function executeKeychainRequest<Req, Res>(
  request: Req,
  action: () => Promise<Res>,
  handlers: RequestExecutionHandlers<Req, Res>,
): Promise<Res> {
  handlers.onRequestStart(request);

  try {
    const response = await action();
    handlers.onRequestSuccess(response);
    return response;
  } catch (error) {
    handlers.onRequestError(error);
    throw error;
  }
}
