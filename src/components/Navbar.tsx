import { Link } from "react-router-dom";
import SettingsSheet from "@/components/SettingsSheet";

type Props = { doctorName?: string; wsStatus?: string };
const Navbar = ({ doctorName, wsStatus }: Props) => {
  const name = doctorName || "Dr. Demo";
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-14 items-center justify-between">
        <Link to="/" className="font-semibold tracking-tight">
          Noted, Doctor
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{name}</span>
          <SettingsSheet wsStatus={wsStatus} />
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
