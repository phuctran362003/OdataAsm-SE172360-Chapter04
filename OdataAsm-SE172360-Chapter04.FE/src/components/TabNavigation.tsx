import React from 'react';
import type { CovidDataType } from '../types/covid';
import './TabNavigation.css';

interface TabNavigationProps {
  activeTab: CovidDataType;
  onTabChange: (tab: CovidDataType) => void;
}

const tabs: CovidDataType[] = ['Confirmed', 'Active', 'Recovered', 'Deaths', 'Daily Increase'];

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="tab-navigation">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`tab-button ${activeTab === tab ? 'active' : ''}`}
          onClick={() => onTabChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};