"use client";

import { useCallback, useRef, useState, useImperativeHandle, forwardRef } from "react";

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type ConfirmState = ConfirmOptions & {
  open: boolean;
  resolve: (value: boolean) => void;
};

let _showConfirm: ((options: ConfirmOptions) => Promise<boolean>) | null = null;

export function confirm(message: string): Promise<boolean>;
export function confirm(options: ConfirmOptions): Promise<boolean>;
export function confirm(optionsOrMessage: string | ConfirmOptions): Promise<boolean> {
  if (!_showConfirm) {
    return Promise.resolve(false);
  }
  const options =
    typeof optionsOrMessage === "string" ? { message: optionsOrMessage } : optionsOrMessage;
  return _showConfirm(options);
}

export const ConfirmProvider = forwardRef(function ConfirmProvider(_props, ref) {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    danger: false,
    resolve: () => {},
  });

  const resolveRef = useRef(state.resolve);

  useImperativeHandle(ref, () => ({
    confirm: (options: ConfirmOptions): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
        setState({
          ...options,
          open: true,
          resolve,
        });
      });
    },
  }));

  _showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({
        ...options,
        open: true,
        resolve,
      });
    });
  }, []);

  function handleClose(value: boolean) {
    setState((prev) => ({ ...prev, open: false }));
    resolveRef.current(value);
  }

  if (!state.open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-hairline bg-paper p-5 shadow-modal">
        {state.title && <h3 className="mb-2 text-sm font-semibold text-ink">{state.title}</h3>}
        <p className="text-sm text-charcoal">{state.message}</p>
        <div className="mt-5 flex gap-3 justify-end">
          <button
            onClick={() => handleClose(false)}
            className="rounded-md border border-hairline bg-canvas px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-cloud"
          >
            {state.cancelLabel}
          </button>
          <button
            onClick={() => handleClose(true)}
            className={`rounded-md px-4 py-2 text-sm font-semibold text-on-primary transition-colors ${
              state.danger ? "bg-error hover:bg-error/90" : "bg-primary hover:bg-primary-deep"
            }`}
          >
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
});
