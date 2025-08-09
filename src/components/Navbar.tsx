import { Link } from "react-router-dom";

const Navbar = () => {
  const name = "Dr. Demo";
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-14 items-center justify-between">
        <Link to="/" className="font-semibold tracking-tight">
          I-Fill-Forms
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{name}</span>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
