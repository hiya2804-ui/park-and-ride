import { useState } from 'react';
import { MapPin, Ticket, Car, User } from 'lucide-react';

interface BottomNavigationProps {
  onNavigate: (page: string) => void;
  activePage: string;
}

const BottomNavigation = ({ onNavigate, activePage }: BottomNavigationProps) => {
  const navItems = [
    { id: 'map', label: 'Find', icon: MapPin },
    { id: 'bookings', label: 'Bookings', icon: Ticket },
    { id: 'rides', label: 'Rides', icon: Car },
    { id: 'account', label: 'Account', icon: User },
  ];

  return (
    <div className="md:hidden bg-white shadow-lg border-t border-neutral-200 py-2 px-4 fixed bottom-0 left-0 right-0 z-10">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          
          return (
            <button
              key={item.id}
              className="flex flex-col items-center"
              onClick={() => onNavigate(item.id)}
            >
              <Icon className={`${isActive ? 'text-primary' : 'text-neutral-500'} text-lg`} />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
