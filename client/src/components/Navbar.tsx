import { Link } from "wouter";
import { FaParking } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="bg-white shadow-md px-4 py-4 flex items-center justify-between">
      <div className="flex items-center">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <FaParking className="text-2xl mr-2 text-primary" />
            <span className="font-bold text-xl text-primary">Park & Ride</span>
          </div>
        </Link>
      </div>
      
      <div>
        {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <span className="text-sm mr-2 hidden md:inline">{user.name}</span>
                <Avatar className="w-8 h-8 bg-primary text-white">
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/profile">
                <DropdownMenuItem>Profile</DropdownMenuItem>
              </Link>
              <Link href="/vehicles">
                <DropdownMenuItem>My Vehicles</DropdownMenuItem>
              </Link>
              <Link href="/payments">
                <DropdownMenuItem>Payment Methods</DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/login">
            <Button variant="default" size="sm" className="cursor-pointer">
              Login
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
