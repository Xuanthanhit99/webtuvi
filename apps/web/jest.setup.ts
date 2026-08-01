import '@testing-library/jest-dom';
import { randomUUID } from 'crypto';

// jsdom's `crypto` global doesn't implement randomUUID() (used by components/ui/toast.tsx).
if (typeof crypto !== 'undefined' && typeof crypto.randomUUID !== 'function') {
  crypto.randomUUID = randomUUID;
}

// jsdom doesn't implement <dialog>'s showModal()/close() (used by components/ui/dialog.tsx).
// See https://github.com/jsdom/jsdom/issues/3294 — this is a jsdom gap, not app behavior.
if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}
