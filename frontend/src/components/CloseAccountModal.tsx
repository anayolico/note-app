import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface Props {
  onClose: () => void;
  onConfirm: () => void;
}

const REASONS = [
  "I no longer need it",
  "I'm switching to another app",
  "I'm concerned about my privacy",
  "The app is missing features I need",
  "Other",
];

const CloseAccountModal: React.FC<Props> = ({ onClose, onConfirm }) => {
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const canProceedStep1 = reason !== '';
  const canProceedStep2 = understood;
  const canProceedStep3 = confirmText === 'DELETE';

  const handleConfirm = () => {
    onClose();
    onConfirm();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="close-account-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <AlertTriangle size={20} className="modal-warning-icon" />
            <h2>Close Account</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="modal-steps">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`step-dot ${step >= s ? 'active' : ''} ${step > s ? 'done' : ''}`} />
          ))}
        </div>

        {/* Step 1: Reason */}
        {step === 1 && (
          <div className="modal-body">
            <h3>Why do you want to close your account?</h3>
            <p className="modal-subtext">Your feedback helps us improve.</p>
            <div className="reason-list">
              {REASONS.map((r) => (
                <label key={r} className={`reason-item ${reason === r ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Data warning */}
        {step === 2 && (
          <div className="modal-body">
            <h3>What happens to your information?</h3>
            <div className="warning-box">
              <ul className="warning-list">
                <li>All your notes will be <strong>permanently deleted</strong></li>
                <li>Your account information will be <strong>wiped out</strong></li>
                <li>You will be <strong>signed out immediately</strong></li>
                <li>This action <strong>cannot be undone</strong></li>
              </ul>
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
              />
              <span>I understand that all my data will be permanently deleted</span>
            </label>
          </div>
        )}

        {/* Step 3: Final confirmation */}
        {step === 3 && (
          <div className="modal-body">
            <h3>Final confirmation</h3>
            <p className="modal-subtext">
              Type <strong>DELETE</strong> in the box below to confirm closing your account.
            </p>
            <input
              className="confirm-input"
              type="text"
              placeholder="Type DELETE here"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-cancel-btn" onClick={step === 1 ? onClose : () => setStep(s => s - 1)}>
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 3 && (
            <button
              className="modal-next-btn"
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              onClick={() => setStep(s => s + 1)}
            >
              Next
            </button>
          )}

          {step === 3 && (
            <button
              className="modal-delete-btn"
              disabled={!canProceedStep3}
              onClick={handleConfirm}
            >
              Close My Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CloseAccountModal;
