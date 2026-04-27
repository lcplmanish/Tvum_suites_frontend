import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { User, Session } from '@supabase/supabase-js';
import type { AppRole } from '@/lib/permissions';

export interface BookingGuest {
  name: string;
  phone: string;
  notes: string;
  idProofUrl: string;
  idProofType: string;
}

export interface Booking {
  id: string;
  roomNumber: number;
  checkIn: Date;
  checkOut: Date;
  checkInTime: string;
  checkOutTime: string;
  guestName: string;
  phone?: string;
  notes?: string;
  bookingSource: string;
  adults: number;
  children: number;
  infants: number;
  pets: number;
  breakfastCount: number;
  lunchCount: number;
  teaCoffeeCount: number;
  guests: BookingGuest[];
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface Room {
  number: number;
  name: string;
  price: number;
  imageUrl: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'pantry' | 'cutlery';
  quantity: number;
  minStock: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  contact: string;
}

export interface LaundryRecord {
  id: string;
  date_given: string;
  date_taken?: string;
  bedsheets_given: number;
  bedsheets_taken?: number;
  pillow_covers_given: number;
  pillow_covers_taken?: number;
  towels_given: number;
  towels_taken?: number;
  blankets_given: number;
  blankets_taken?: number;
  createdAt: Date;
}

export interface FoodPricing {
  breakfastPrice: number;
  lunchPrice: number;
  teaCoffeePrice: number;
}

export interface FoodBill {
  id: string;
  bookingId: string;
  roomNumber: number;
  guestName: string;
  orderDate: string;
  breakfastCount: number;
  lunchCount: number;
  teaCoffeeCount: number;
  breakfastPrice: number;
  lunchPrice: number;
  teaCoffeePrice: number;
  breakfastTotal: number;
  lunchTotal: number;
  teaCoffeeTotal: number;
  totalAmount: number;
  generatedAt: Date;
}

export interface RoomTask {
  roomNumber: number;
  tasks: {
    roomCleaned: {
      mopping: boolean;
      vacuuming: boolean;
      dusting: boolean;
    };
    teaBagsRefilled: {
      restocked: boolean;
      checked: boolean;
    };
    coffeeRefilled: {
      restocked: boolean;
      checked: boolean;
    };
    bathroomCleaned: {
      mopping: boolean;
      wiping: boolean;
      sanitizing: boolean;
    };
  };
}

interface AppState {
  isAuthenticated: boolean;
  authLoading: boolean;
  user: User | null;
  userRole: AppRole;
  bookings: Booking[];
  rooms: Room[];
  inventory: InventoryItem[];
  staff: StaffMember[];
  roomTasks: RoomTask[];
  laundryRecords: LaundryRecord[];
  foodPricing: FoodPricing;
  foodBills: FoodBill[];
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => void;
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateBooking: (id: string, data: Partial<Booking>) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  updateRoom: (roomNumber: number, data: Partial<Omit<Room, 'number'>>) => Promise<void>;
  updateInventory: (id: string, quantity: number) => Promise<void>;
  toggleRoomTask: (roomNumber: number, task: keyof RoomTask['tasks'], subtask: string) => Promise<void>;
  setAllRoomTaskSubtasks: (roomNumber: number, task: keyof RoomTask['tasks'], shouldBeComplete: boolean) => Promise<void>;
  addStaff: (staff: Omit<StaffMember, 'id'>) => Promise<void>;
  updateStaff: (id: string, data: Partial<Omit<StaffMember, 'id'>>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  createUser: (user: { name: string; email: string; password: string; role: AppRole }) => Promise<{ error: string | null }>;
  addLaundryRecord: (record: Omit<LaundryRecord, 'id' | 'createdAt'>) => Promise<void>;
  updateLaundryRecord: (id: string, record: Partial<Omit<LaundryRecord, 'id' | 'createdAt'>>) => Promise<void>;
  updateFoodPricing: (pricing: FoodPricing) => Promise<{ error: string | null }>;
  saveFoodBill: (bill: Omit<FoodBill, 'id' | 'generatedAt'>) => Promise<{ error: string | null }>;
}

import roomDefaultImg from '@/assets/room-default.jpg';

const parseLocalDateString = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatLocalDateString = (date: Date) => {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, '0'))
    .join('-');
};

const mapBookingRow = (row: Database['public']['Tables']['bookings']['Row']): Booking => ({
  id: row.id,
  roomNumber: row.room_number,
  checkIn: parseLocalDateString(row.check_in),
  checkOut: parseLocalDateString(row.check_out),
  checkInTime: row.check_in_time || '14:00',
  checkOutTime: row.check_out_time || '11:00',
  guestName: row.guest_name,
  phone: row.phone || undefined,
  notes: row.notes || undefined,
  bookingSource: 'Airbnb',
  adults: row.adults,
  children: row.children,
  infants: row.infants,
  pets: row.pets,
  breakfastCount: row.breakfast_count ?? 0,
  lunchCount: row.lunch_count ?? 0,
  teaCoffeeCount: row.tea_coffee_count ?? 0,
  guests: Array.isArray(row.guests) ? (row.guests as unknown as BookingGuest[]) : [],
  status: row.status as Booking['status'],
  createdAt: new Date(row.created_at),
});

const mapRoomRow = (row: Database['public']['Tables']['rooms']['Row']): Room => ({
  number: row.number,
  name: row.name,
  price: row.price,
  imageUrl: row.image_url || roomDefaultImg,
});

const mapInventoryRow = (row: Database['public']['Tables']['inventory']['Row']): InventoryItem => ({
  id: row.id,
  name: row.name,
  category: row.category as InventoryItem['category'],
  quantity: row.quantity,
  minStock: row.min_stock,
});

const mapStaffRow = (row: Database['public']['Tables']['staff_members']['Row']): StaffMember => ({
  id: row.id,
  name: row.name,
  role: row.role,
  contact: row.contact,
});

const mapLaundryRow = (row: Database['public']['Tables']['laundry_records']['Row']): LaundryRecord => ({
  id: row.id,
  date_given: row.date_given,
  date_taken: row.date_taken,
  bedsheets_given: row.bedsheets_given,
  bedsheets_taken: row.bedsheets_taken,
  pillow_covers_given: row.pillow_covers_given,
  pillow_covers_taken: row.pillow_covers_taken,
  towels_given: row.towels_given,
  towels_taken: row.towels_taken,
  blankets_given: row.blankets_given,
  blankets_taken: row.blankets_taken,
  createdAt: new Date(row.created_at),
});

const mapFoodPricingRow = (row: Database['public']['Tables']['food_settings']['Row']): FoodPricing => ({
  breakfastPrice: row.breakfast_price,
  lunchPrice: row.lunch_price,
  teaCoffeePrice: row.tea_coffee_price ?? 50,
});

const mapFoodBillRow = (row: Database['public']['Tables']['food_bills']['Row']): FoodBill => ({
  id: row.id,
  bookingId: row.booking_id,
  roomNumber: row.room_number,
  guestName: row.guest_name,
  orderDate: row.order_date,
  breakfastCount: row.breakfast_count,
  lunchCount: row.lunch_count,
  teaCoffeeCount: row.tea_coffee_count ?? 0,
  breakfastPrice: row.breakfast_price,
  lunchPrice: row.lunch_price,
  teaCoffeePrice: row.tea_coffee_price ?? 0,
  breakfastTotal: row.breakfast_total,
  lunchTotal: row.lunch_total,
  teaCoffeeTotal: row.tea_coffee_total ?? 0,
  totalAmount: row.total_amount,
  generatedAt: new Date(row.generated_at),
});

const mapRoomTaskRow = (row: Database['public']['Tables']['room_tasks']['Row']): RoomTask => ({

  roomNumber: row.room_number,
  tasks: {
    roomCleaned: {
      mopping: row.room_cleaned ? false : false,
      vacuuming: row.room_cleaned ? false : false,
      dusting: row.room_cleaned ? false : false,
    },
    teaBagsRefilled: {
      restocked: row.tea_bags_refilled ? false : false,
      checked: row.tea_bags_refilled ? false : false,
    },
    coffeeRefilled: {
      restocked: row.coffee_refilled ? false : false,
      checked: row.coffee_refilled ? false : false,
    },
    bathroomCleaned: {
      mopping: row.bathroom_cleaned ? false : false,
      wiping: row.bathroom_cleaned ? false : false,
      sanitizing: row.bathroom_cleaned ? false : false,
    },
  },
});

const AppContext = createContext<AppState | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState<AppRole>('staff');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [roomTasks, setRoomTasks] = useState<RoomTask[]>([]);
  const [laundryRecords, setLaundryRecords] = useState<LaundryRecord[]>([]);
  const [foodPricing, setFoodPricing] = useState<FoodPricing>({ breakfastPrice: 150, lunchPrice: 250, teaCoffeePrice: 50 });
  const [foodBills, setFoodBills] = useState<FoodBill[]>([]);

  const isAuthenticated = !!session;

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Failed to fetch user role from profiles', error);
      const metadataRole = session?.user?.user_metadata?.role as AppRole | undefined;
      if (metadataRole) {
        setUserRole(metadataRole);
      }
      return;
    }

    if (data?.role) {
      setUserRole(data.role as AppRole);
      return;
    }

    const metadataRole = session?.user?.user_metadata?.role as AppRole | undefined;
    if (metadataRole) {
      setUserRole(metadataRole);
    }
  };

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('check_in', { ascending: false });
    if (error) {
      console.error('Failed to fetch bookings', error);
      setBookings([]);
      return;
    }
    setBookings(data.map(mapBookingRow));
  };

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('number', { ascending: true });
    if (error) {
      console.error('Failed to fetch rooms', error);
      setRooms([]);
      return;
    }
    setRooms(data.map(mapRoomRow));
  };

  const fetchInventory = async () => {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('name', { ascending: true });
    if (error) {
      console.error('Failed to fetch inventory', error);
      setInventory([]);
      return;
    }
    setInventory(data.map(mapInventoryRow));
  };

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from('staff_members')
      .select('*')
      .order('name', { ascending: true });
    if (error) {
      console.error('Failed to fetch staff', error);
      setStaff([]);
      return;
    }
    setStaff(data.map(mapStaffRow));
  };

  const fetchRoomTasks = async () => {
    const { data, error } = await supabase
      .from('room_tasks')
      .select('*')
      .order('room_number', { ascending: true });
    if (error) {
      console.error('Failed to fetch room tasks', error);
      setRoomTasks([]);
      return;
    }
    setRoomTasks(data.map(mapRoomTaskRow));
  };

  const fetchLaundryRecords = async () => {
    const { data, error } = await supabase
      .from('laundry_records')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to fetch laundry records', error);
      setLaundryRecords([]);
      return;
    }
    setLaundryRecords(data.map(mapLaundryRow));
  };

  const fetchFoodPricing = async () => {
    const { data, error } = await supabase
      .from('food_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Failed to fetch food pricing', error);
      setFoodPricing({ breakfastPrice: 150, lunchPrice: 250 });
      return;
    }

    setFoodPricing(mapFoodPricingRow(data));
  };

  const fetchFoodBills = async () => {
    const { data, error } = await supabase
      .from('food_bills')
      .select('*')
      .order('generated_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch food bills', error);
      setFoodBills([]);
      return;
    }

    setFoodBills(data.map(mapFoodBillRow));
  };

  const addLaundryRecord = async (record: Omit<LaundryRecord, 'id' | 'createdAt'>) => {
    const payload: Database['public']['Tables']['laundry_records']['Insert'] = {
      date_given: record.date_given,
      date_taken: record.date_taken,
      bedsheets_given: record.bedsheets_given,
      bedsheets_taken: record.bedsheets_taken,
      pillow_covers_given: record.pillow_covers_given,
      pillow_covers_taken: record.pillow_covers_taken,
      towels_given: record.towels_given,
      towels_taken: record.towels_taken,
      blankets_given: record.blankets_given,
      blankets_taken: record.blankets_taken,
    };

    const { data, error } = await supabase
      .from('laundry_records')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Failed to add laundry record', error);
      return;
    }

    if (data) {
      setLaundryRecords(prev => [mapLaundryRow(data), ...prev]);
    }
  };

  const updateLaundryRecord = async (id: string, record: Partial<Omit<LaundryRecord, 'id' | 'createdAt'>>) => {
    const payload: Database['public']['Tables']['laundry_records']['Update'] = {
      date_taken: record.date_taken,
      bedsheets_taken: record.bedsheets_taken,
      pillow_covers_taken: record.pillow_covers_taken,
      towels_taken: record.towels_taken,
      blankets_taken: record.blankets_taken,
    };

    const { data, error } = await supabase
      .from('laundry_records')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update laundry record', error);
      return;
    }

    if (data) {
      setLaundryRecords(prev => prev.map(r => r.id === id ? mapLaundryRow(data) : r));
    }
  };

  const updateFoodPricing = async (pricing: FoodPricing): Promise<{ error: string | null }> => {
    const payload: Database['public']['Tables']['food_settings']['Insert'] = {
      id: 1,
      breakfast_price: pricing.breakfastPrice,
      lunch_price: pricing.lunchPrice,
    };

    const { data, error } = await supabase
      .from('food_settings')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Failed to update food pricing', error);
      return { error: error.message };
    }

    if (data) {
      setFoodPricing(mapFoodPricingRow(data));
    }

    return { error: null };
  };

  const saveFoodBill = async (bill: Omit<FoodBill, 'id' | 'generatedAt'>): Promise<{ error: string | null }> => {
    const payload: Database['public']['Tables']['food_bills']['Insert'] = {
      booking_id: bill.bookingId,
      room_number: bill.roomNumber,
      guest_name: bill.guestName,
      order_date: bill.orderDate,
      breakfast_count: bill.breakfastCount,
      lunch_count: bill.lunchCount,
      tea_coffee_count: bill.teaCoffeeCount,
      breakfast_price: bill.breakfastPrice,
      lunch_price: bill.lunchPrice,
      tea_coffee_price: bill.teaCoffeePrice,
      breakfast_total: bill.breakfastTotal,
      lunch_total: bill.lunchTotal,
      tea_coffee_total: bill.teaCoffeeTotal,
      total_amount: bill.totalAmount,
    };

    const { data, error } = await supabase
      .from('food_bills')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Failed to save food bill', error);
      return { error: error.message };
    }

    if (data) {
      setFoodBills(prev => {
        return [mapFoodBillRow(data), ...prev];
      });
    }

    return { error: null };
  };

  const fetchAllData = async () => {
    await Promise.all([fetchRooms(), fetchBookings(), fetchInventory(), fetchStaff(), fetchRoomTasks(), fetchLaundryRecords(), fetchFoodPricing(), fetchFoodBills()]);
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          setTimeout(() => fetchUserRole(newSession.user.id), 0);
        } else {
          setUserRole('staff');
        }
        setAuthLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        fetchUserRole(existingSession.user.id);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setBookings([]);
      setRooms([]);
      setInventory([]);
      setStaff([]);
      setRoomTasks([]);
      setFoodPricing({ breakfastPrice: 150, lunchPrice: 250 });
      setFoodBills([]);
      return;
    }

    fetchAllData();
  }, [session]);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setUserRole('staff');
  };

  const addBooking = async (booking: Omit<Booking, 'id' | 'createdAt' | 'status'>) => {
    const status = new Date(booking.checkIn) <= new Date() ? 'active' : 'upcoming';
    const payload: Database['public']['Tables']['bookings']['Insert'] = {
      room_number: booking.roomNumber,
      check_in: formatLocalDateString(booking.checkIn),
      check_out: formatLocalDateString(booking.checkOut),
      check_in_time: booking.checkInTime,
      check_out_time: booking.checkOutTime,
      guest_name: booking.guestName,
      phone: booking.phone ?? null,
      notes: booking.notes ?? null,
      adults: booking.adults,
      children: booking.children,
      infants: booking.infants,
      pets: booking.pets,
      breakfast_count: booking.breakfastCount,
      lunch_count: booking.lunchCount,
      guests: booking.guests as unknown as Database['public']['Tables']['bookings']['Insert']['guests'],
      status,
      created_by: session?.user?.id ?? null,
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert(payload)
      .select()
      .single();
    if (error) {
      console.error('Failed to add booking', error);
      return;
    }
    if (data) {
      setBookings(prev => [...prev, mapBookingRow(data)]);
    }
  };

  const updateBooking = async (id: string, data: Partial<Booking>) => {
    const updates: any = {};
    if (data.roomNumber !== undefined) updates.room_number = data.roomNumber;
    if (data.checkIn) updates.check_in = formatLocalDateString(data.checkIn);
    if (data.checkOut) updates.check_out = formatLocalDateString(data.checkOut);
    if (data.guestName !== undefined) updates.guest_name = data.guestName;
    if (data.phone !== undefined) updates.phone = data.phone ?? null;
    if (data.notes !== undefined) updates.notes = data.notes ?? null;
    if (data.checkInTime !== undefined) updates.check_in_time = data.checkInTime;
    if (data.checkOutTime !== undefined) updates.check_out_time = data.checkOutTime;
    if (data.adults !== undefined) updates.adults = data.adults;
    if (data.children !== undefined) updates.children = data.children;
    if (data.infants !== undefined) updates.infants = data.infants;
    if (data.pets !== undefined) updates.pets = data.pets;
    if (data.breakfastCount !== undefined) updates.breakfast_count = data.breakfastCount;
    if (data.lunchCount !== undefined) updates.lunch_count = data.lunchCount;
    if (data.guests !== undefined) updates.guests = data.guests;
    if (data.status !== undefined) updates.status = data.status;

    const { data: updated, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Failed to update booking', error);
      return;
    }
    if (updated) {
      setBookings(prev => prev.map(b => b.id === id ? mapBookingRow(updated) : b));
    }
  };

  const deleteBooking = async (id: string) => {
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete booking', error);
      return;
    }
    setBookings(prev => prev.filter(b => b.id !== id));
  };

  const addStaff = async (member: Omit<StaffMember, 'id'>) => {
    const { data, error } = await supabase
      .from('staff_members')
      .insert({ name: member.name, role: member.role, contact: member.contact })
      .select()
      .single();
    if (error) {
      console.error('Failed to add staff member', error);
      return;
    }
    if (data) {
      setStaff(prev => [...prev, mapStaffRow(data)]);
    }
  };

  const updateStaff = async (id: string, data: Partial<Omit<StaffMember, 'id'>>) => {
    const { data: updated, error } = await supabase
      .from('staff_members')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Failed to update staff member', error);
      return;
    }
    if (updated) {
      setStaff(prev => prev.map(s => s.id === id ? mapStaffRow(updated) : s));
    }
  };

  const deleteStaff = async (id: string) => {
    const { error } = await supabase.from('staff_members').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete staff member', error);
      return;
    }
    setStaff(prev => prev.filter(s => s.id !== id));
  };

  const createUser = async (user: { name: string; email: string; password: string; role: AppRole }) => {
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: { name: user.name, role: user.role },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error || !data.user) {
      return { error: error?.message ?? 'Failed to create user' };
    }

    // Auto-confirm user email so they can log in immediately
    // (Only admin/owner can create users through the form, so this is safe)
    const { error: confirmError } = await supabase.auth.admin.updateUserById(
      data.user.id,
      { email_confirm: true }
    );

    if (confirmError) {
      console.warn('User created but auto-confirmation failed:', confirmError);
      // Don't fail the whole operation if confirmation fails
      // User can still log in later once email is confirmed
    }

    return { error: null };
  };

  const updateRoom = async (roomNumber: number, data: Partial<Omit<Room, 'number'>>) => {
    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.price !== undefined) updates.price = data.price;
    if (data.imageUrl !== undefined) updates.image_url = data.imageUrl;
    const { data: updated, error } = await supabase
      .from('rooms')
      .update(updates)
      .eq('number', roomNumber)
      .select()
      .single();
    if (error) {
      console.error('Failed to update room', error);
      return;
    }
    if (updated) {
      setRooms(prev => prev.map(r => r.number === roomNumber ? mapRoomRow(updated) : r));
    }
  };

  const updateInventory = async (id: string, quantity: number) => {
    const { data: updated, error } = await supabase
      .from('inventory')
      .update({ quantity })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Failed to update inventory', error);
      return;
    }
    if (updated) {
      setInventory(prev => prev.map(item => item.id === id ? mapInventoryRow(updated) : item));
    }
  };

  const toggleRoomTask = async (roomNumber: number, task: keyof RoomTask['tasks'], subtask: string) => {
    const currentTask = roomTasks.find(rt => rt.roomNumber === roomNumber);
    if (!currentTask) {
      console.error('Room task row not found for room', roomNumber);
      return;
    }
    
    const mainTasks = currentTask.tasks[task] as Record<string, boolean>;
    const newValue = !mainTasks[subtask];
    
    // Update local state immediately for UI responsiveness
    setRoomTasks(prev => prev.map(rt =>
      rt.roomNumber === roomNumber
        ? {
            ...rt,
            tasks: {
              ...rt.tasks,
              [task]: { ...mainTasks, [subtask]: newValue }
            }
          }
        : rt
    ));

    // For now, we'll mark the main task as complete if all subtasks are done
    // This is temporary until we update the database schema to store subtasks
    const updatedSubtasks = { ...mainTasks, [subtask]: newValue };
    const allDone = Object.values(updatedSubtasks).every(Boolean);
    
    const columnName = task === 'roomCleaned' ? 'room_cleaned'
      : task === 'teaBagsRefilled' ? 'tea_bags_refilled'
      : task === 'coffeeRefilled' ? 'coffee_refilled'
      : 'bathroom_cleaned';

    const payload = { [columnName]: allDone } as Partial<Database['public']['Tables']['room_tasks']['Update']>;
    const { error } = await supabase
      .from('room_tasks')
      .update(payload)
      .eq('room_number', roomNumber);
    if (error) {
      console.error('Failed to toggle room task', error);
    }
  };

  const setAllRoomTaskSubtasks = async (roomNumber: number, task: keyof RoomTask['tasks'], shouldBeComplete: boolean) => {
    const currentTask = roomTasks.find(rt => rt.roomNumber === roomNumber);
    if (!currentTask) {
      console.error('Room task row not found for room', roomNumber);
      return;
    }
    
    // Update all subtasks to the desired state
    const updatedSubtasks = Object.keys(currentTask.tasks[task]).reduce((acc, subtask) => {
      acc[subtask] = shouldBeComplete;
      return acc;
    }, {} as Record<string, boolean>);

    // Update local state immediately
    setRoomTasks(prev => prev.map(rt =>
      rt.roomNumber === roomNumber
        ? {
            ...rt,
            tasks: {
              ...rt.tasks,
              [task]: updatedSubtasks
            }
          }
        : rt
    ));

    // Update main task status based on whether all subtasks are complete
    const columnName = task === 'roomCleaned' ? 'room_cleaned'
      : task === 'teaBagsRefilled' ? 'tea_bags_refilled'
      : task === 'coffeeRefilled' ? 'coffee_refilled'
      : 'bathroom_cleaned';

    const payload = { [columnName]: shouldBeComplete } as Partial<Database['public']['Tables']['room_tasks']['Update']>;
    const { error } = await supabase
      .from('room_tasks')
      .update(payload)
      .eq('room_number', roomNumber);
    if (error) {
      console.error('Failed to set all room task subtasks', error);
    }
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated,
      authLoading,
      user,
      userRole,
      bookings,
      rooms,
      inventory,
      staff,
      roomTasks,
      laundryRecords,
      foodPricing,
      foodBills,
      login,
      logout,
      addBooking,
      updateBooking,
      deleteBooking,
      updateRoom,
      updateInventory,
      toggleRoomTask,
      setAllRoomTaskSubtasks,
      addStaff,
      updateStaff,
      deleteStaff,
      createUser,
      addLaundryRecord,
      updateLaundryRecord,
      updateFoodPricing,
      saveFoodBill,
    }}>
      {children}
    </AppContext.Provider>
  );
};
