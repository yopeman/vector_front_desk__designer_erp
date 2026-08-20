import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function CalendarModal({ show, onClose }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      fetchEventsForDate(selectedDate);
    }
  }, [show, selectedDate]);

  const fetchEventsForDate = async (date) => {
    setLoading(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      
      const [
        siteVisitsRes,
        ordersRes,
        deliveriesRes,
        installationsRes,
        invoicesRes,
        paymentsRes
      ] = await Promise.all([
        supabase.from('site_visits').select('*, clients(name)').eq('preferred_date', dateStr),
        supabase.from('orders').select('*, clients(name)').eq('order_date', dateStr),
        supabase.from('deliveries').select('*').eq('scheduled_date', dateStr),
        supabase.from('installations').select('*').eq('scheduled_date', dateStr),
        supabase.from('invoices').select('*').eq('issue_date', dateStr),
        supabase.from('payments').select('*').eq('payment_date', dateStr)
      ]);

      const allEvents = [];
      
      if (siteVisitsRes.data) {
        siteVisitsRes.data.forEach(item => {
          allEvents.push({
            type: 'Site Visit',
            title: `Site Visit - ${item.clients?.name || 'Unknown'}`,
            time: item.preferred_time || 'All day',
            status: item.status,
            color: '#3b82f6'
          });
        });
      }

      if (ordersRes.data) {
        ordersRes.data.forEach(item => {
          allEvents.push({
            type: 'Order',
            title: `Order ${item.order_no} - ${item.clients?.name || 'Unknown'}`,
            time: 'All day',
            status: item.status,
            color: '#10b981'
          });
        });
      }

      if (deliveriesRes.data) {
        deliveriesRes.data.forEach(item => {
          allEvents.push({
            type: 'Delivery',
            title: `Delivery ${item.delivery_no}`,
            time: item.actual_delivery_time || 'All day',
            status: item.status,
            color: '#f59e0b'
          });
        });
      }

      if (installationsRes.data) {
        installationsRes.data.forEach(item => {
          allEvents.push({
            type: 'Installation',
            title: `Installation ${item.installation_no}`,
            time: item.completion_time || 'All day',
            status: item.status,
            color: '#8b5cf6'
          });
        });
      }

      if (invoicesRes.data) {
        invoicesRes.data.forEach(item => {
          allEvents.push({
            type: 'Invoice',
            title: `Invoice ${item.invoice_no}`,
            time: 'All day',
            status: item.status,
            color: '#ef4444'
          });
        });
      }

      if (paymentsRes.data) {
        paymentsRes.data.forEach(item => {
          allEvents.push({
            type: 'Payment',
            title: `Payment ${item.payment_no || 'Received'}`,
            time: 'All day',
            status: 'Completed',
            color: '#06b6d4'
          });
        });
      }

      setEvents(allEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateClick = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
  };

  const handleMonthChange = (delta) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} style={{ padding: '8px' }}></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate.getDate() === day && 
                        selectedDate.getMonth() === month && 
                        selectedDate.getFullYear() === year;
      const isToday = new Date().getDate() === day && 
                     new Date().getMonth() === month && 
                     new Date().getFullYear() === year;

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          style={{
            padding: '8px',
            textAlign: 'center',
            cursor: 'pointer',
            borderRadius: '8px',
            backgroundColor: isSelected ? '#2563eb' : isToday ? '#e0e7ff' : 'transparent',
            color: isSelected ? '#fff' : isToday ? '#1e40af' : '#1e293b',
            fontWeight: isToday ? '600' : '400',
            transition: 'background 0.15s'
          }}
          onMouseEnter={(e) => !isSelected && (e.currentTarget.style.backgroundColor = '#f1f5f9')}
          onMouseLeave={(e) => !isSelected && !isToday && (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {day}
        </div>
      );
    }

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <button
            onClick={() => handleMonthChange(-1)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#64748b',
              padding: '4px'}}
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
            {monthNames[month]} {year}
          </h3>
          <button
            onClick={() => handleMonthChange(1)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#64748b',
              padding: '4px'
            }}
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
          {dayNames.map(day => (
            <div key={day} style={{ 
              textAlign: 'center', 
              fontSize: '12px', 
              fontWeight: 600, 
              color: '#64748b',
              padding: '8px'
            }}>
              {day}
            </div>
          ))}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {days}
        </div>
      </div>
    );
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Calendar</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer text-lg"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Calendar Section */}
          <div style={{ flex: 1, padding: '24px', borderRight: '1px solid #e2e8f0' }}>
            {renderCalendar()}
          </div>

          {/* Events Section */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>
              Events for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
            
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid #e2e8f0',
                  borderTop: '3px solid #2563eb',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              </div>
            ) : events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <i className="fa-regular fa-calendar-xmark" style={{ fontSize: '48px', marginBottom: '12px', display: 'block' }}></i>
                <p style={{ fontSize: '14px' }}>No events for this date</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {events.map((event, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: '#f8fafc',
                      borderLeft: `4px solid ${event.color}`,
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: event.color,
                        color: '#fff',
                        fontWeight: 600
                      }}>
                        {event.type}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{event.time}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#1e293b' }}>
                      {event.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      Status: {event.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
