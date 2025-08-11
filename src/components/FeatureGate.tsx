import { ReactNode } from "react";
import { useLocation, Link } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FeatureGateProps {
  children: ReactNode;
  title?: string;
}

const FeatureGate = ({ children, title = "Log in or sign up to use this feature" }: FeatureGateProps) => {
  const { currentUser, isLoading } = useUser();
  const location = useLocation();

  const gated = !isLoading && !currentUser;

  return (
    <div className="relative">
      <div aria-hidden={gated} className={gated ? "pointer-events-none select-none blur-[2px] opacity-60" : undefined}>
        {children}
      </div>

      <Dialog open={gated}>
        <DialogContent aria-describedby="feature-gate-description">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription id="feature-gate-description">
              Please authenticate to continue. You'll be brought back here after logging in.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Link to="/login" state={{ from: location }}>
              <Button variant="outline">Log in</Button>
            </Link>
            <Link to="/signup" state={{ from: location }}>
              <Button>Sign up</Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeatureGate;
