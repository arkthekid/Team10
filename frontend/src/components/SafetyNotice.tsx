import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

interface SafetyNoticeProps {
  open: boolean;
  onAccept: () => void;
}

const SafetyNotice = ({ open, onAccept }: SafetyNoticeProps) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Safety Notice
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          If a listing seems illegal or suspicious, don't engage: report and block. For
          pickups, meet only in a public, well-lit spot (ideally on campus).
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Checkbox
            id="understand"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked === true)}
          />
          <label htmlFor="understand" className="text-sm font-medium cursor-pointer">
            I understand
          </label>
        </div>
        <Button disabled={!agreed} onClick={onAccept} className="mt-2">
          Proceed
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default SafetyNotice;
