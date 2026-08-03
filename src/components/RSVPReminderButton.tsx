import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface RSVPReminderButtonProps {
  hasDecision: boolean;
  chatbotInUse: boolean;
  chatbotCooldownUntil: number | null;
  onClick: () => void;
}

const INITIAL_DELAY_MS = 20_000;

export default function RSVPReminderButton({
  hasDecision,
  chatbotInUse,
  chatbotCooldownUntil,
  onClick,
}: RSVPReminderButtonProps) {
  const enteredAt = useRef(Date.now());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (hasDecision || chatbotInUse) {
      setIsVisible(false);
      return;
    }

    const initialRevealAt = enteredAt.current + INITIAL_DELAY_MS;
    const revealAt = Math.max(initialRevealAt, chatbotCooldownUntil ?? 0);
    const remaining = revealAt - Date.now();

    if (remaining <= 0) {
      setIsVisible(true);
      return;
    }

    setIsVisible(false);
    const timer = window.setTimeout(() => setIsVisible(true), remaining);
    return () => window.clearTimeout(timer);
  }, [chatbotCooldownUntil, chatbotInUse, hasDecision]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="rsvp-reminder-position"
          initial={{ opacity: 0, y: -14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <button
            type="button"
            className="rsvp-shimmer-button"
            onClick={onClick}
            aria-label={"Abrir confirma\u00e7\u00e3o de presen\u00e7a"}
          >
            <span className="rsvp-shimmer-button__text">{"Confirma\u00e7\u00e3o de presen\u00e7a"}</span>
            <span className="rsvp-shimmer-button__shine" aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
