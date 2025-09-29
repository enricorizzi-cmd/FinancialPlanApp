import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { CalendarIcon, UsersIcon, ClockIcon, CheckCircleIcon } from './icons/Icons';

const Dashboard: React.FC = () => {
  const { kpis, currentLocation, reservations, waitlist } = useAppContext();

  const todayReservations = reservations.filter(r => 
    new Date(r.reservationTime).toDateString() === new Date().toDateString()
  );

  const upcomingReservations = todayReservations
    .filter(r => new Date(r.reservationTime) > new Date())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white bg-gradient-to-r from-primary to-primary-300 bg-clip-text text-transparent">Riepilogo Giornaliero</h1>
        <div className="text-sm text-primary-300">
          {new Date().toLocaleDateString('it-IT', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-dark-100 rounded-2xl shadow-xl p-6 border border-primary-800 hover:shadow-primary-500/25 transition-all duration-200 transform hover:scale-105">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-primary" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-primary-300 truncate">
                  Prenotazioni Oggi
                </dt>
                <dd className="text-lg font-medium text-white">
                  {kpis.totalReservations}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-dark-100 rounded-2xl shadow-xl p-6 border border-primary-800 hover:shadow-primary-500/25 transition-all duration-200 transform hover:scale-105">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-success" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-primary-300 truncate">
                  Coperti Totali
                </dt>
                <dd className="text-lg font-medium text-white">
                  {kpis.totalCovers}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-dark-100 rounded-2xl shadow-xl p-6 border border-primary-800 hover:shadow-primary-500/25 transition-all duration-200 transform hover:scale-105">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-secondary" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-primary-300 truncate">
                  Tasso Occupazione
                </dt>
                <dd className="text-lg font-medium text-white">
                  {kpis.occupancyRate.toFixed(1)}%
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-dark-100 rounded-2xl shadow-xl p-6 border border-primary-800 hover:shadow-primary-500/25 transition-all duration-200 transform hover:scale-105">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-warning" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-primary-300 truncate">
                  Lista d'Attesa
                </dt>
                <dd className="text-lg font-medium text-white">
                  {waitlist.length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Reservations */}
      <div className="bg-dark-100 shadow-xl rounded-2xl border border-primary-800">
        <div className="px-6 py-4 border-b border-primary-800">
          <h2 className="text-lg font-medium text-primary-300">Prenotazioni Imminenti</h2>
        </div>
        <div className="divide-y divide-primary-800">
          {upcomingReservations.length > 0 ? (
            upcomingReservations.map((reservation) => (
              <div key={reservation.id} className="px-6 py-4 hover:bg-dark-200 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      {reservation.guestName}
                    </p>
                    <p className="text-sm text-primary-300">
                      {reservation.partySize} {reservation.partySize === 1 ? 'persona' : 'persone'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {new Date(reservation.reservationTime).toLocaleTimeString('it-IT', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-sm text-primary-300">
                      {reservation.phone}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-primary-300">
              <CalendarIcon className="mx-auto h-12 w-12 text-primary-500" />
              <h3 className="mt-2 text-sm font-medium text-white">Nessuna prenotazione imminente</h3>
              <p className="mt-1 text-sm text-primary-300">
                Le prossime prenotazioni appariranno qui.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Location Info */}
      {currentLocation && (
        <div className="bg-dark-100 shadow-xl rounded-2xl p-6 border border-primary-800">
          <h2 className="text-lg font-medium text-primary-300 mb-4">Informazioni Sede</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-primary-400">Nome</p>
              <p className="text-sm text-white">{currentLocation.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-primary-400">Capacità</p>
              <p className="text-sm text-white">{currentLocation.capacity} coperti</p>
            </div>
            <div>
              <p className="text-sm font-medium text-primary-400">Indirizzo</p>
              <p className="text-sm text-white">{currentLocation.address}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
