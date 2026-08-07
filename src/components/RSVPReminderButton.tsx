import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface RSVPReminderButtonProps {
  hasDecision: boolean;
  chatbotInUse: boolean;
  chatbotCooldownUntil: number | null;
  onClick: () => void;
  placement: "desktop" | "mobile";
}

const INITIAL_DELAY_MS = 15_000;

export default function RSVPReminderButton({
  hasDecision,
  chatbotInUse,
  chatbotCooldownUntil,
  onClick,
  placement,
}: RSVPReminderButtonProps) {
  const enteredAt = useRef(Date.now());
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = placement === "mobile";
  const startY = "calc(100vh - 9.5rem)";

  useEffect(() => {
    if (hasDecision) {
      setIsVisible(false);
      return;
    }

    if (!isMobile) {
      setIsVisible(true);
      return;
    }

    if (chatbotInUse) {
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
  }, [chatbotCooldownUntil, chatbotInUse, hasDecision, isMobile]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`rsvp-reminder-position rsvp-reminder-position--${placement}`}
          initial={isMobile ? { opacity: 1, y: startY, scale: 0.96 } : false}
          animate={isMobile
            ? {
                opacity: [1, 1, 1, 0],
                y: [startY, 0, 0, 0],
                scale: [0.96, 1, 1, 1],
              }
            : { opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={isMobile
            ? {
                duration: 18.4,
                times: [0, 0.435, 0.978, 1],
                ease: "linear",
                repeat: Infinity,
                repeatDelay: 15,
              }
            : { duration: 0 }}
        >
          <button
            type="button"
            className="rsvp-shimmer-button"
            onClick={onClick}
            aria-label={"Abrir confirma\u00e7\u00e3o de presen\u00e7a"}
          >
            <img
              className="rsvp-floral-button-image"
              src="/rsvp-button-floral-cropped.png"
              alt=""
              aria-hidden="true"
            />
            <span className="rsvp-shimmer-button__shine" aria-hidden="true" />
            <span className="sr-only">{"Confirma presen\u00e7a"}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
