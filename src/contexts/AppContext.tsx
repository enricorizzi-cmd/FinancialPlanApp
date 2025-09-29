import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Reservation, ReservationStatus, RestaurantLocation, KPIs, AppContextType, WaitlistEntry, AppNotification, NotificationType, MenuItem, Sale, Table, TableStatus, Customer } from '../types';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locations, setLocations] = useState<RestaurantLocation[]>([
    {
      id: '1',
      name: 'Financial Plan App',
      capacity: 100,
      openTime: '09:00',
      closeTime: '18:00',
      address: 'Via Roma 123, Milano'
    }
  ]);
  const [currentLocation, setInternalCurrentLocation] = useState<RestaurantLocation | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [kpis, setKpis] = useState<KPIs>({ totalReservations: 0, totalCovers: 0, occupancyRate: 0, noShowRate: 0, reservationsByTime: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const showNotification = useCallback((message: string, type: NotificationType) => {
    const newNotification: AppNotification = {
      id: Date.now(),
      message,
      type,
    };
    setNotifications(prev => [...prev, newNotification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  }, []);

  const calculateKPIs = useCallback((res: Reservation[], loc: RestaurantLocation | null) => {
    if (!loc) return;
    const todayReservations = res.filter(r => new Date(r.reservationTime).toDateString() === new Date().toDateString());
    
    const totalReservations = todayReservations.length;
    const totalCovers = todayReservations.reduce((sum, r) => sum + r.partySize, 0);
    const noShows = todayReservations.filter(r => r.status === ReservationStatus.NoShow).length;
    const noShowRate = totalReservations > 0 ? (noShows / totalReservations) * 100 : 0;
    
    const seatedCovers = todayReservations
      .filter(r => r.status === ReservationStatus.Seated || r.status === ReservationStatus.Completed)
      .reduce((sum, r) => sum + r.partySize, 0);
    const occupancyRate = loc.capacity > 0 ? (seatedCovers / loc.capacity) * 100 : 0;

    const reservationsByTime: { [key: string]: number } = {};
    todayReservations.forEach(r => {
        const hour = new Date(r.reservationTime).getHours().toString().padStart(2, '0') + ':00';
        reservationsByTime[hour] = (reservationsByTime[hour] || 0) + 1;
    });

    const sortedReservationsByTime = Object.entries(reservationsByTime)
        .map(([time, reservations]) => ({ time, reservations }))
        .sort((a, b) => a.time.localeCompare(b.time));

    setKpis({ totalReservations, totalCovers, occupancyRate, noShowRate, reservationsByTime: sortedReservationsByTime });
  }, []);

  const setCurrentLocation = async (locationId: string) => {
    const newLocation = locations.find(l => l.id === locationId);
    if (newLocation) {
        setInternalCurrentLocation(newLocation);
        calculateKPIs(reservations, newLocation);
    }
  };
  
  useEffect(() => {
    if (locations.length > 0 && !currentLocation) {
        const firstLocation = locations[0];
        setInternalCurrentLocation(firstLocation);
        calculateKPIs(reservations, firstLocation);
    }
  }, [locations, currentLocation, reservations, calculateKPIs]);

  const addReservation = async (reservationData: Omit<Reservation, 'id' | 'locationId'>) => {
    if (!currentLocation) return;
    const newReservation: Reservation = { 
      ...reservationData, 
      id: Date.now().toString(),
      locationId: currentLocation.id 
    };
    const updatedReservations = [...reservations, newReservation].sort((a,b) => new Date(a.reservationTime).getTime() - new Date(b.reservationTime).getTime());
    setReservations(updatedReservations);
    calculateKPIs(updatedReservations, currentLocation);
    showNotification('Prenotazione aggiunta con successo!', 'success');
  };

  const updateReservationStatus = async (id: string, status: ReservationStatus) => {
    const updatedReservations = reservations.map(r => r.id === id ? { ...r, status } : r);
    setReservations(updatedReservations);
    if (currentLocation) {
      calculateKPIs(updatedReservations, currentLocation);
    }
    showNotification('Stato prenotazione aggiornato!', 'success');
  };

  const updateLocationSettings = async (locationId: string, newSettings: RestaurantLocation) => {
    const updatedLocations = locations.map(l => l.id === locationId ? newSettings : l);
    setLocations(updatedLocations);
    if (currentLocation?.id === locationId) {
        setInternalCurrentLocation(newSettings);
    }
    showNotification('Impostazioni salvate con successo!', 'success');
  };

  const updateTableStatus = async (tableId: string, status: TableStatus) => {
    const updatedTables = tables.map(t => t.id === tableId ? { ...t, status } : t);
    setTables(updatedTables);
    showNotification(`Stato del tavolo aggiornato a ${status}.`, 'info');
  };

  const clearTable = async (tableId: string) => {
    const updatedTables = tables.map(t => t.id === tableId ? { ...t, status: TableStatus.Available, reservationId: null } : t);
    setTables(updatedTables);
    showNotification('Tavolo liberato.', 'success');
  };

  const saveTableLayout = async (layoutTables: Table[]) => {
      if (!currentLocation) return;
      setTables(layoutTables);
      showNotification('Layout della planimetria salvato con successo!', 'success');
  };

  const assignReservationToTable = async (reservationId: string, tableId: string) => {
    const updatedReservations = reservations.map(r => r.id === reservationId ? { ...r, tableId } : r);
    const updatedTables = tables.map(t => t.id === tableId ? { ...t, status: TableStatus.Occupied, reservationId } : t);
    setReservations(updatedReservations);
    setTables(updatedTables);
    showNotification('Prenotazione assegnata al tavolo.', 'success');
  };

  const seatWalkIn = async (walkinData: Omit<Reservation, 'id' | 'locationId' | 'status'>, tableId: string) => {
      if (!currentLocation) return;
      const reservation: Reservation = {
        ...walkinData,
        id: Date.now().toString(),
        locationId: currentLocation.id,
        status: ReservationStatus.Seated
      };
      const updatedReservations = [...reservations, reservation].sort((a,b) => new Date(a.reservationTime).getTime() - new Date(b.reservationTime).getTime());
      const updatedTables = tables.map(t => t.id === tableId ? { ...t, status: TableStatus.Occupied, reservationId: reservation.id } : t);
      setReservations(updatedReservations);
      setTables(updatedTables);
      showNotification(`${reservation.guestName} accomodato al tavolo.`, 'success');
      calculateKPIs(updatedReservations, currentLocation);
  };

  const addWaitlistEntry = async (entryData: Omit<WaitlistEntry, 'id' | 'createdAt' | 'locationId'>) => {
    if (!currentLocation) return;
    const newEntry: WaitlistEntry = { 
      ...entryData, 
      id: Date.now().toString(),
      locationId: currentLocation.id,
      createdAt: new Date().toISOString()
    };
    setWaitlist([...waitlist, newEntry].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    showNotification(`${newEntry.guestName} aggiunto alla lista d'attesa.`, 'success');
  };

  const removeWaitlistEntry = async (id: string) => {
      setWaitlist(waitlist.filter(e => e.id !== id));
  };

  const seatFromWaitlist = async (id: string) => {
    const entryToSeat = waitlist.find(e => e.id === id);
    if (!entryToSeat) return;

    const reservationData = {
        guestName: entryToSeat.guestName,
        partySize: entryToSeat.partySize,
        reservationTime: new Date().toISOString(),
        status: ReservationStatus.Seated,
        phone: entryToSeat.phone,
        email: '',
        notes: `Accomodato dalla lista d'attesa. Attesa stimata: ${entryToSeat.quotedWaitTime} min.`
    };
    
    await addReservation(reservationData);
    await removeWaitlistEntry(id);
    showNotification(`${entryToSeat.guestName} è stato accomodato.`, 'success');
  };

  const markWaitlistNoShow = async (id: string) => {
    const entry = waitlist.find(e => e.id === id);
    if (entry) {
        await removeWaitlistEntry(id);
        showNotification(`${entry.guestName} è stato segnato come assente.`, 'info');
    }
  };

  return (
    <AppContext.Provider value={{ locations, currentLocation, reservations, waitlist, tables, customers, kpis, menuItems, sales, loading, error, notifications, showNotification, setCurrentLocation, addReservation, updateReservationStatus, updateLocationSettings, updateTableStatus, saveTableLayout, addWaitlistEntry, removeWaitlistEntry, seatFromWaitlist, markWaitlistNoShow, assignReservationToTable, seatWalkIn, clearTable }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};