import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle } from "lucide-react";

interface SafetyNoticeProps {
  open: boolean;
  onClose: () => void;
  onProceed: () => void;
}

const SafetyNotice = ({ open, onClose, onProceed }: SafetyNoticeProps) => {
  const [agreed, setAgreed] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setAgreed(false);
      onClose();
    }
  };

  const handleProceed = () => {
    if (!agreed) return;
    setAgreed(false);
    onProceed();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <AlertTriangle className="w-7 h-7 text-destructive" />
            Safety Notice
          </DialogTitle>
        </DialogHeader>

        <p className="text-base text-muted-foreground leading-relaxed">
          If a listing seems illegal or suspicious, don't engage: report and
          block. For pickups, meet only in a public, well-lit spot, ideally on
          campus.
        </p>

        <div className="flex items-center gap-3 mt-3">
          <Checkbox
            id="understand"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked === true)}
          />

          <label
            htmlFor="understand"
            className="text-base font-medium cursor-pointer"
          >
            I understand
          </label>
        </div>

        <Button
          disabled={!agreed}
          onClick={handleProceed}
          className="mt-4 w-full h-12 text-base"
        >
          Proceed
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default SafetyNotice;