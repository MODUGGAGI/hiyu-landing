import React from 'react';
import './app-nav.css';

// AppBottomNavigationBar.kt, an/dev 5d60432: three destinations.
export default function AppNav({ active }) {
  const items = [['map', '지도'], ['press', '프레스'], ['collection', '컬렉션']];
  const index = items.findIndex(([id]) => id === active);
  return <nav className="app-nav" aria-label="앱 하단 메뉴">
    <span className="app-nav-indicator" style={{ width: 'calc(33.333% - 10px)', left: `calc(${index * 100 / 3}% + 5px)` }} />
    {items.map(([id, label]) => <button key={id} aria-current={active === id ? 'page' : undefined}>
      {id === 'map' ? <svg className="nav-map" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true"><path className="nav-map-outline" d="M2.8 5.2 7.6 2.8 12.4 5.2 17.2 2.8V14.8L12.4 17.2 7.6 14.8 2.8 17.2Z" /><path d="M7.6 2.8V14.8M12.4 5.2V17.2" /></svg>
        : <img className={`app-nav-icon nav-${id}`} src={id === 'press' ? '/assets/nav_press.svg' : '/assets/app-v2/nav_collection.svg'} alt="" />}
      {label}
    </button>)}
  </nav>;
}
