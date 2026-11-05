"use client";

import { useRef, useState, type RefObject } from "react";
import { saveAssessment } from "@/lib/history";
import type { SampleKey } from "@/lib/samples";

const PROVIDERS = ["Google", "GitHub"];

export function SaveDialog({ ref, sampleKey }: { ref: RefObject<HTMLDialogElement | null>; sampleKey: SampleKey }) {
  const [failed, setFailed] = useState(false);
  const pressedInside = useRef(false);

  const close = () => {
    setFailed(false);
    ref.current?.close();
  };

  const save = () => {
    if (saveAssessment(sampleKey)) close();
    else setFailed(true);
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby="save-title"
      className="p-dialog"
      onMouseDown={(e) => {
        pressedInside.current = e.target !== ref.current;
      }}
      onClick={(e) => {
        if (e.target === ref.current && !pressedInside.current) close();
      }}
    >
      <div className="flex flex-col gap-2.5">
        <h2 id="save-title" className="text-2xl leading-[30px] font-semibold tracking-[-0.3px] md:text-[26px] md:leading-8">
          Save this assessment
        </h2>
        <p className="mb-1.5 text-[15px] leading-[22px] text-muted md:text-base md:leading-[23px]">
          It stays in this browser for now. Accounts are not connected yet, so no account is created.
        </p>
        {PROVIDERS.map((provider) => (
          <button key={provider} type="button" className="p-btn2" onClick={save}>
            Continue with {provider}
          </button>
        ))}
        <button type="button" className="p-btn" onClick={save}>
          Continue with email
        </button>
        {failed && (
          <p role="alert" className="text-[15px] leading-[22px] font-medium text-alert">
            This browser blocked saving. Check that site storage is allowed, then try again.
          </p>
        )}
        <button type="button" className="flex min-h-11 cursor-pointer items-center justify-center text-[15px] font-medium text-signal" onClick={close}>
          Not now
        </button>
      </div>
    </dialog>
  );
}
