import { describe, expect, it, vi } from 'vitest';
import {
  activateStillOnTab,
  ENTER_STILL_MESSAGE,
  READER_SCRIPT_PATH,
} from './still-activation';

describe('still-activation', () => {
  it('exposes the packaged reader script path', () => {
    expect(READER_SCRIPT_PATH).toBe('/reader.js');
  });

  it('sends enter message without injecting when the reader is already loaded', async () => {
    const sendMessage = vi.fn().mockResolvedValue(undefined);
    const executeScript = vi.fn();

    await activateStillOnTab(12, sendMessage, executeScript);

    expect(sendMessage).toHaveBeenCalledOnce();
    expect(sendMessage).toHaveBeenCalledWith(12, ENTER_STILL_MESSAGE);
    expect(executeScript).not.toHaveBeenCalled();
  });

  it('injects the reader script when the enter message fails', async () => {
    const sendMessage = vi
      .fn()
      .mockRejectedValueOnce(new Error('no receiver'))
      .mockResolvedValueOnce(undefined);
    const executeScript = vi.fn().mockResolvedValue([]);

    await activateStillOnTab(7, sendMessage, executeScript);

    expect(executeScript).toHaveBeenCalledOnce();
    expect(executeScript).toHaveBeenCalledWith({
      target: { tabId: 7 },
      files: [READER_SCRIPT_PATH],
    });
    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(sendMessage).toHaveBeenLastCalledWith(7, ENTER_STILL_MESSAGE);
  });

  it('runs the injection failure callback when injection cannot complete', async () => {
    const sendMessage = vi.fn().mockRejectedValue(new Error('no receiver'));
    const executeScript = vi.fn().mockRejectedValue(new Error('restricted page'));
    const onInjectionFailure = vi.fn();

    await activateStillOnTab(3, sendMessage, executeScript, onInjectionFailure);

    expect(onInjectionFailure).toHaveBeenCalledOnce();
  });
});
