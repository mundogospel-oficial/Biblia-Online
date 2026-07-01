import { motion, AnimatePresence } from "framer-motion";
import { oneSignalService } from "@/services/oneSignalService";
import { CheckCircle } from "lucide-react";

interface OneSignalPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OneSignalPromptModal = ({ isOpen, onClose }: OneSignalPromptModalProps) => {
  const handleGotIt = async () => {
    onClose();
    // Request push permission from OneSignal
    await oneSignalService.requestPermission();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="onesignal-prompt-overlay" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            id="onesignal-prompt-card"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="bg-card border border-border rounded-2xl p-6 shadow-2xl max-w-md w-full text-center space-y-5"
          >
            {/* Celebration Icon */}
            <div id="onesignal-prompt-icon-container" className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500">
              <CheckCircle id="onesignal-prompt-icon" className="w-8 h-8" />
            </div>

            {/* Header / Title */}
            <div id="onesignal-prompt-header" className="space-y-2">
              <h2 id="onesignal-prompt-title" className="text-xl font-bold text-foreground tracking-tight">
                Your OneSignal SDK integration is complete!
              </h2>
              <p id="onesignal-prompt-message" className="text-sm text-muted-foreground leading-relaxed">
                You can now send Push Notifications & In-App Messages through OneSignal. Tap below to enable push notifications.
              </p>
            </div>

            {/* Action Button */}
            <button
              id="onesignal-prompt-btn-got-it"
              onClick={handleGotIt}
              className="w-full bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground py-3 px-4 rounded-xl font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center cursor-pointer"
            >
              Got it
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
