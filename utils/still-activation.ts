export const READER_SCRIPT_PATH = '/reader.js' as const;

export const ENTER_STILL_MESSAGE = { type: 'ENTER_STILL' } as const;

export type SendEnterStillMessage = (
  tabId: number,
  message: typeof ENTER_STILL_MESSAGE,
) => Promise<unknown>;

export type InjectReaderScript = (details: {
  target: { tabId: number };
  files: string[];
}) => Promise<unknown>;

export async function activateStillOnTab(
  tabId: number,
  sendMessage: SendEnterStillMessage,
  executeScript: InjectReaderScript,
  onInjectionFailure?: () => void | Promise<void>,
): Promise<void> {
  try {
    await sendMessage(tabId, ENTER_STILL_MESSAGE);
  } catch {
    try {
      await executeScript({
        target: { tabId },
        files: [READER_SCRIPT_PATH],
      });
      await sendMessage(tabId, ENTER_STILL_MESSAGE);
    } catch {
      await onInjectionFailure?.();
    }
  }
}
