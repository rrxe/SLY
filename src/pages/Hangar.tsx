import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Shield, Zap, Target } from 'lucide-react';
import { PhantomShipSVG } from '../components/PhantomShipSVG';
import '../styles/hangar.css';

const SHIPS_DATA = [
  {
    id: 'ship-1',
    name: 'MK-I PHANTOM',
    class: 'LIGHT FIGHTER • TIER 1',
    speed: 80,
    power: 65,
    shield: 50,
  },
  {
    id: 'ship-2',
    name: 'MK-II VOID',
    class: 'HEAVY FIGHTER • TIER 2',
    speed: 60,
    power: 90,
    shield: 85,
  },
];

export const Hangar: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [equippedShipId, setEquippedShipId] = useState('ship-1');

  const currentShip = SHIPS_DATA[currentIndex];
  const isEquipped = currentShip.id === equippedShipId;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % SHIPS_DATA.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + SHIPS_DATA.length) % SHIPS_DATA.length);
  };

  const handleEquip = () => {
    setEquippedShipId(currentShip.id);
  };

  return (
    <div className="hangar-page">
      <div className="ship-carousel">
        <button className="nav-arrow" onClick={handlePrev}>
          <ChevronLeft size={24} />
        </button>

        <div className="ship-display-area">
          <div className="floating-wrapper">
            <PhantomShipSVG />
          </div>
        </div>

        <button className="nav-arrow" onClick={handleNext}>
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="ship-info-card">
        <h2 className="ship-title">{currentShip.name}</h2>
        <span className="ship-subtitle">{currentShip.class}</span>

        <button
          className={`equip-button ${isEquipped ? 'equipped' : 'equip'}`}
          onClick={handleEquip}
          disabled={isEquipped}
        >
          {isEquipped ? (
            <>
              <Check size={18} />
              <span>EQUIPPED</span>
            </>
          ) : (
            <span>EQUIP SHIP</span>
          )}
        </button>
      </div>
    </div>
  );
};
